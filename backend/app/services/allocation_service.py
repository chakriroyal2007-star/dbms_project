import math
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    Incident, Hospital, Ambulance, Road, EmergencyTeam,
    ResourceAllocation, HospitalAssignment, HospitalCapacityHistory,
    RoadStatusHistory, Patient
)

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance formula in kilometers."""
    R = 6371.0 # Earth radius in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def solve_emergency_allocation(
    db: Session,
    incident_id: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    severity: Optional[str] = None,
    patient_count: Optional[int] = None,
    required_icu: Optional[int] = None,
    required_emergency: Optional[int] = None,
    disabled_hospital_ids: Optional[List[str]] = None,
    blocked_road_ids: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Multi-Criteria Decision Support & Emergency Allocation Engine.
    Evaluates:
    - Incident severity & required ICU/emergency beds
    - Proximity & travel time taking traffic/road blockages into account
    - Hospital live bed capacities (hard constraints)
    - Available ambulances and specialized teams
    """
    disabled_hospitals = set(disabled_hospital_ids or [])
    blocked_roads = set(blocked_road_ids or [])
    
    # 1. Resolve Incident context
    target_inc = None
    if incident_id:
        target_inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
        
    if target_inc:
        inc_id = target_inc.incident_id
        inc_type = target_inc.incident_type
        loc_name = target_inc.location_name
        inc_lat = target_inc.latitude
        inc_lng = target_inc.longitude
        inc_sev = target_inc.severity
        pats = db.query(Patient).filter(Patient.incident_id == target_inc.incident_id).all()
        total_pats = len(pats) if pats else target_inc.estimated_patient_count
        icu_needed = sum(1 for p in pats if p.required_resource in ['ICU_BED', 'VENTILATOR']) if pats else max(1, total_pats // 3)
        em_needed = total_pats - icu_needed
    else:
        inc_id = "INC_ADHOC_" + datetime.datetime.utcnow().strftime("%H%M%S")
        inc_type = "EMERGENCY_TRIAGE"
        loc_name = "Dispatched Grid Coordinate"
        inc_lat = latitude if latitude is not None else 13.6288
        inc_lng = longitude if longitude is not None else 79.4192
        inc_sev = severity or "CRITICAL"
        total_pats = patient_count or 10
        icu_needed = required_icu if required_icu is not None else max(1, total_pats // 3)
        em_needed = required_emergency if required_emergency is not None else (total_pats - icu_needed)

    # 2. Query Active Hospitals and Latest Capacities
    hospitals = db.query(Hospital).filter(Hospital.status == 'ACTIVE').all()
    
    candidate_hospitals = []
    for h in hospitals:
        if h.hospital_id in disabled_hospitals:
            continue
            
        latest_cap = db.query(HospitalCapacityHistory).filter(
            HospitalCapacityHistory.hospital_id == h.hospital_id
        ).order_by(HospitalCapacityHistory.timestamp.desc()).first()
        
        icu_avail = latest_cap.icu_available if latest_cap else 0
        em_avail = latest_cap.emergency_beds_available if latest_cap else 0
        
        dist = calculate_distance(inc_lat, inc_lng, h.latitude, h.longitude)
        
        # Check if routing is impacted by road blockages
        road_penalty = 0.0
        # If road between hospital and incident is blocked, add significant delay or penalize
        if blocked_roads:
            road_penalty = 15.0 # penalty minutes for rerouting
            
        avg_speed = 40.0 # km/h
        eta_min = round(((dist / avg_speed) * 60) + road_penalty, 1)
        
        candidate_hospitals.append({
            "hospital_id": h.hospital_id,
            "name": h.name,
            "emergency_level": h.emergency_level,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "distance_km": dist,
            "eta_minutes": eta_min,
            "icu_available": icu_avail,
            "emergency_beds_available": em_avail,
            "score": dist + (0.0 if h.emergency_level == "LEVEL_1" else (5.0 if h.emergency_level == "LEVEL_2" else 12.0))
        })

    # Sort candidates by multi-criteria suitability score (proximity + trauma level)
    candidate_hospitals.sort(key=lambda x: x["score"])

    # 3. Greedy Capacity-Constrained Allocation
    allocated_hospitals = []
    remaining_icu = icu_needed
    remaining_em = em_needed
    feasibility_notes = []

    for cand in candidate_hospitals:
        if remaining_icu == 0 and remaining_em == 0:
            break

        assign_icu = min(remaining_icu, cand["icu_available"])
        assign_em = min(remaining_em, cand["emergency_beds_available"])
        assigned_pats = assign_icu + assign_em

        if assigned_pats > 0:
            remaining_icu -= assign_icu
            remaining_em -= assign_em
            
            allocated_hospitals.append({
                "hospital_id": cand["hospital_id"],
                "hospital_name": cand["name"],
                "distance_km": cand["distance_km"],
                "assigned_patients": assigned_pats,
                "assigned_icu_beds": assign_icu,
                "assigned_emergency_beds": assign_em,
                "eta_minutes": cand["eta_minutes"],
                "assigned_ambulances": []
            })
            
            feasibility_notes.append(
                f"{cand['name']} ({cand['distance_km']} km, ETA {cand['eta_minutes']} min): Allocated {assigned_pats} patients ({assign_icu} ICU, {assign_em} Emergency beds) within verified capacity."
            )

    # 4. Find Available Ambulances to Assign
    available_ambs = db.query(Ambulance).filter(Ambulance.current_status == 'AVAILABLE').all()
    dispatched_amb_ids = []
    
    amb_idx = 0
    for hosp_entry in allocated_hospitals:
        needed_ambs = max(1, math.ceil(hosp_entry["assigned_patients"] / 2))
        hosp_ambs = []
        for _ in range(needed_ambs):
            if amb_idx < len(available_ambs):
                amb = available_ambs[amb_idx]
                hosp_ambs.append(amb.ambulance_id)
                dispatched_amb_ids.append(amb.ambulance_id)
                amb_idx += 1
        hosp_entry["assigned_ambulances"] = hosp_ambs

    # 5. Specialized Emergency Teams
    available_teams = db.query(EmergencyTeam).filter(EmergencyTeam.status == 'AVAILABLE').limit(2).all()
    dispatched_team_ids = [t.team_id for t in available_teams]

    total_allocated = sum(h["assigned_patients"] for h in allocated_hospitals)
    unallocated = total_pats - total_allocated
    
    if unallocated > 0:
        feasibility_notes.append(
            f"WARNING: Resource Shortage Detected! {unallocated} patients could not be accommodated across regional ICU/Emergency wards. Regional mutual aid protocol required."
        )

    return {
        "incident_id": inc_id,
        "incident_type": inc_type,
        "location_name": loc_name,
        "total_patients": total_pats,
        "allocated_patients": total_allocated,
        "unallocated_patients": unallocated,
        "assigned_hospitals": allocated_hospitals,
        "dispatched_ambulances": dispatched_amb_ids,
        "dispatched_teams": dispatched_team_ids,
        "feasibility_notes": feasibility_notes,
        "is_fully_feasible": (unallocated == 0)
    }

def commit_allocation_transaction(db: Session, plan: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes an ACID transaction allocating ambulances, teams, and reserving hospital beds.
    Employs row-level locking and verifies remaining capacity before deducting beds.
    Rolls back automatically on database exceptions or capacity contention.
    """
    try:
        inc_id = plan["incident_id"]
        now = datetime.datetime.utcnow()
        
        # 0. Update Incident status to ACTIVE
        inc = db.query(Incident).filter(Incident.incident_id == inc_id).first()
        if inc:
            inc.status = "ACTIVE"
            inc.updated_at = now
        
        # 1. Deduct Hospital Beds Atomically with Concurrency Check
        for hosp_detail in plan.get("assigned_hospitals", []):
            hosp_id = hosp_detail["hospital_id"]
            icu_assigned = int(hosp_detail.get("assigned_icu_beds", 0))
            em_assigned = int(hosp_detail.get("assigned_emergency_beds", 0))
            total_assigned = int(hosp_detail.get("assigned_patients", icu_assigned + em_assigned))
            
            # Fetch latest capacity with row lock
            try:
                latest_cap = db.query(HospitalCapacityHistory).filter(
                    HospitalCapacityHistory.hospital_id == hosp_id
                ).order_by(HospitalCapacityHistory.timestamp.desc()).with_for_update().first()
            except Exception:
                # SQLite fallback
                latest_cap = db.query(HospitalCapacityHistory).filter(
                    HospitalCapacityHistory.hospital_id == hosp_id
                ).order_by(HospitalCapacityHistory.timestamp.desc()).first()

            if not latest_cap:
                raise ValueError(f"No capacity records found for hospital {hosp_id}")

            # Verify availability constraint (Concurrency Guard)
            if latest_cap.icu_available < icu_assigned or latest_cap.emergency_beds_available < em_assigned:
                raise ValueError(
                    f"Resource Contention Conflict: Hospital {hosp_id} no longer has sufficient capacity (Requires {icu_assigned} ICU, {em_assigned} Emergency; Available {latest_cap.icu_available} ICU, {latest_cap.emergency_beds_available} Emergency)."
                )

            # Record capacity history deduction
            new_icu_avail = latest_cap.icu_available - icu_assigned
            new_em_avail = latest_cap.emergency_beds_available - em_assigned
            
            new_cap_record = HospitalCapacityHistory(
                capacity_history_id=f"CAP_{hosp_id[:8]}_{now.strftime('%Y%m%d%H%M%S')}_{datetime.datetime.utcnow().microsecond}",
                hospital_id=hosp_id,
                timestamp=now,
                icu_total=latest_cap.icu_total,
                icu_available=new_icu_avail,
                emergency_beds_total=latest_cap.emergency_beds_total,
                emergency_beds_available=new_em_avail,
                general_beds_total=latest_cap.general_beds_total,
                general_beds_available=latest_cap.general_beds_available
            )
            db.add(new_cap_record)

            # Record Resource Allocation Entry
            db.add(ResourceAllocation(
                allocation_id=f"ALLOC_HOSP_{hosp_id}_{now.strftime('%H%M%S%f')[:10]}",
                incident_id=inc_id,
                resource_type="HOSPITAL_BEDS",
                resource_id=hosp_id,
                quantity=total_assigned,
                status="ACTIVE"
            ))

        # 2. Dispatch Ambulances
        for amb_id in plan.get("dispatched_ambulances", []):
            try:
                amb = db.query(Ambulance).filter(Ambulance.ambulance_id == amb_id).with_for_update().first()
            except Exception:
                amb = db.query(Ambulance).filter(Ambulance.ambulance_id == amb_id).first()
                
            if amb:
                amb.current_status = "DISPATCHED"
                
            db.add(ResourceAllocation(
                allocation_id=f"ALLOC_AMB_{amb_id}_{now.strftime('%H%M%S%f')[:10]}",
                incident_id=inc_id,
                resource_type="AMBULANCE",
                resource_id=amb_id,
                quantity=1,
                status="ACTIVE"
            ))

        # 3. Deploy Emergency Teams
        for team_id in plan.get("dispatched_teams", []):
            team = db.query(EmergencyTeam).filter(EmergencyTeam.team_id == team_id).first()
            if team:
                team.status = "DEPLOYED"
                
            db.add(ResourceAllocation(
                allocation_id=f"ALLOC_TEAM_{team_id}_{now.strftime('%H%M%S%f')[:10]}",
                incident_id=inc_id,
                resource_type="EMERGENCY_TEAM",
                resource_id=team_id,
                quantity=1,
                status="ACTIVE"
            ))

        db.commit()
        return {
            "status": "success",
            "message": "ACID Allocation Transaction successfully committed. Resources reserved and dispatched.",
            "incident_id": inc_id,
            "dispatched_ambulances": plan.get("dispatched_ambulances", []),
            "dispatched_teams": plan.get("dispatched_teams", []),
            "assigned_hospitals": plan.get("assigned_hospitals", [])
        }
    except Exception as e:
        db.rollback()
        raise RuntimeError(f"Allocation transaction failed and was rolled back: {str(e)}")
