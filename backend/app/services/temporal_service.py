import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.models import (
    Incident, Hospital, Ambulance, Road, Patient,
    HospitalCapacityHistory, AmbulanceStatusHistory,
    AmbulanceLocationHistory, RoadStatusHistory
)

def reconstruct_temporal_state(db: Session, target_timestamp: datetime.datetime) -> Dict[str, Any]:
    """
    Core Temporal DBMS capability: Reconstructs the exact system state at target_timestamp
    using interval and snapshot logs across incidents, hospital capacities, ambulances, and roads.
    """
    # 1. Incidents valid/active at target_timestamp
    # Query incidents that occurred at or before T and were not closed prior to T
    incidents = db.query(Incident).filter(
        Incident.occurred_at <= target_timestamp
    ).all()
    
    incidents_list = []
    active_count = 0
    critical_pat_count = 0
    
    for inc in incidents:
        is_active = (inc.status in ['ACTIVE', 'REPORTED']) or (inc.updated_at >= target_timestamp)
        if is_active:
            active_count += 1
            # Count patients created up to target_timestamp
            pats = db.query(Patient).filter(
                Patient.incident_id == inc.incident_id,
                Patient.created_at <= target_timestamp
            ).all()
            crit_pats = sum(1 for p in pats if p.severity == 'CRITICAL')
            critical_pat_count += crit_pats
            
            incidents_list.append({
                "incident_id": inc.incident_id,
                "incident_type": inc.incident_type,
                "description": inc.description,
                "severity": inc.severity,
                "latitude": inc.latitude,
                "longitude": inc.longitude,
                "location_name": inc.location_name,
                "occurred_at": inc.occurred_at.isoformat(),
                "patient_count": len(pats),
                "critical_patient_count": crit_pats,
                "status": inc.status
            })

    # 2. Hospital Capacities at target_timestamp
    # Find latest capacity history per hospital where timestamp <= target_timestamp
    hospitals = db.query(Hospital).all()
    hospitals_list = []
    total_avail_icu = 0
    total_avail_em = 0
    
    for h in hospitals:
        latest_cap = db.query(HospitalCapacityHistory).filter(
            HospitalCapacityHistory.hospital_id == h.hospital_id,
            HospitalCapacityHistory.timestamp <= target_timestamp
        ).order_by(HospitalCapacityHistory.timestamp.desc()).first()
        
        icu_avail = latest_cap.icu_available if latest_cap else 0
        icu_tot = latest_cap.icu_total if latest_cap else 10
        em_avail = latest_cap.emergency_beds_available if latest_cap else 0
        em_tot = latest_cap.emergency_beds_total if latest_cap else 25
        
        total_avail_icu += icu_avail
        total_avail_em += em_avail
        
        # Keep top facilities or non-empty for UI response performance
        if len(hospitals_list) < 25 or h.emergency_level in ['LEVEL_1', 'LEVEL_2']:
            hospitals_list.append({
                "hospital_id": h.hospital_id,
                "name": h.name,
                "hospital_type": h.hospital_type,
                "emergency_level": h.emergency_level,
                "latitude": h.latitude,
                "longitude": h.longitude,
                "icu_total": icu_tot,
                "icu_available": icu_avail,
                "emergency_beds_total": em_tot,
                "emergency_beds_available": em_avail,
                "icu_occupancy_percent": round(((icu_tot - icu_avail) / icu_tot * 100), 1) if icu_tot > 0 else 0
            })

    # 3. Available Ambulances at target_timestamp
    # Status from latest status interval where start_time <= target_timestamp
    ambulances = db.query(Ambulance).all()
    ambulances_list = []
    available_amb_count = 0
    
    for a in ambulances:
        stat = db.query(AmbulanceStatusHistory).filter(
            AmbulanceStatusHistory.ambulance_id == a.ambulance_id,
            AmbulanceStatusHistory.start_time <= target_timestamp
        ).order_by(AmbulanceStatusHistory.start_time.desc()).first()
        
        curr_stat = stat.status if stat else a.current_status
        if curr_stat == "AVAILABLE":
            available_amb_count += 1
            
        loc = db.query(AmbulanceLocationHistory).filter(
            AmbulanceLocationHistory.ambulance_id == a.ambulance_id,
            AmbulanceLocationHistory.timestamp <= target_timestamp
        ).order_by(AmbulanceLocationHistory.timestamp.desc()).first()
        
        if len(ambulances_list) < 40 or curr_stat == "AVAILABLE":
            ambulances_list.append({
                "ambulance_id": a.ambulance_id,
                "registration_number": a.registration_number,
                "ambulance_type": a.ambulance_type,
                "status": curr_stat,
                "latitude": loc.latitude if loc else 13.6288,
                "longitude": loc.longitude if loc else 79.4192,
                "speed": loc.speed if loc else 0.0
            })

    # 4. Roads and Traffic at target_timestamp
    roads = db.query(Road).all()
    roads_list = []
    blocked_count = 0
    
    for r in roads:
        r_stat = db.query(RoadStatusHistory).filter(
            RoadStatusHistory.road_id == r.road_id,
            RoadStatusHistory.timestamp <= target_timestamp
        ).order_by(RoadStatusHistory.timestamp.desc()).first()
        
        is_blocked = r_stat.blocked if r_stat else False
        traf = r_stat.traffic_level if r_stat else "LOW"
        spd = r_stat.average_speed if r_stat else 50.0
        
        if is_blocked or traf == "SEVERE":
            blocked_count += 1
            
        if len(roads_list) < 30 or is_blocked:
            roads_list.append({
                "road_id": r.road_id,
                "road_name": r.road_name,
                "source": r.source_location,
                "destination": r.destination_location,
                "distance_km": r.distance_km,
                "traffic_level": traf,
                "average_speed": spd,
                "blocked": is_blocked,
                "start_lat": r.start_lat,
                "start_lng": r.start_lng,
                "end_lat": r.end_lat,
                "end_lng": r.end_lng
            })

    return {
        "target_timestamp": target_timestamp.isoformat(),
        "active_incidents_count": active_count,
        "critical_patients_count": critical_pat_count,
        "available_ambulances_count": available_amb_count,
        "available_icu_beds_count": total_avail_icu,
        "available_emergency_beds_count": total_avail_em,
        "blocked_roads_count": blocked_count,
        "incidents_snapshot": incidents_list,
        "hospitals_snapshot": hospitals_list,
        "ambulances_snapshot": ambulances_list,
        "roads_snapshot": roads_list
    }
