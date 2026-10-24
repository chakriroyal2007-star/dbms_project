import datetime
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import (
    Incident, Patient, Ambulance, Hospital, EmergencyTeam,
    Resource, HospitalCapacityHistory, RoadStatusHistory
)
from app.schemas.schemas import EOCMetrics, ResourceAlert

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics", response_model=EOCMetrics)
def get_eoc_metrics(db: Session = Depends(get_db)):
    # 1. Active & Received incidents
    active_incidents = db.query(Incident).filter(
        Incident.status.in_(['RECEIVED', 'VERIFIED', 'ACTIVE', 'REPORTED', 'CONTAINED'])
    ).count()
    
    # 2. Critical patients
    critical_patients = db.query(Patient).join(Incident).filter(
        Incident.status.in_(['RECEIVED', 'VERIFIED', 'ACTIVE', 'REPORTED', 'CONTAINED']),
        Patient.severity == 'CRITICAL'
    ).count()
    
    # 3. Ambulances
    total_ambulances = db.query(Ambulance).count()
    available_ambulances = db.query(Ambulance).filter(Ambulance.current_status == 'AVAILABLE').count()
    
    # 4. Hospital capacities (latest per hospital)
    hospitals = db.query(Hospital).filter(Hospital.status == 'ACTIVE').all()
    total_icu = 0
    avail_icu = 0
    total_em = 0
    avail_em = 0
    
    for h in hospitals:
        latest_cap = db.query(HospitalCapacityHistory).filter(
            HospitalCapacityHistory.hospital_id == h.hospital_id
        ).order_by(HospitalCapacityHistory.timestamp.desc()).first()
        if latest_cap:
            total_icu += latest_cap.icu_total
            avail_icu += latest_cap.icu_available
            total_em += latest_cap.emergency_beds_total
            avail_em += latest_cap.emergency_beds_available

    # 5. Emergency Teams
    total_teams = db.query(EmergencyTeam).count()
    active_teams = db.query(EmergencyTeam).filter(EmergencyTeam.status == 'AVAILABLE').count()
    
    # 6. Blocked Roads
    roads = db.query(RoadStatusHistory).order_by(RoadStatusHistory.timestamp.desc()).limit(150).all()
    blocked_count = sum(1 for r in roads if r.blocked or r.traffic_level == 'SEVERE')
    
    # Resource utilization percent
    tot_beds = total_icu + total_em
    occ_beds = (total_icu - avail_icu) + (total_em - avail_em)
    util_percent = round((occ_beds / tot_beds * 100), 1) if tot_beds > 0 else 0.0

    return {
        "active_incidents": active_incidents,
        "critical_patients": critical_patients,
        "available_ambulances": available_ambulances,
        "total_ambulances": total_ambulances,
        "available_icu_beds": avail_icu,
        "total_icu_beds": total_icu,
        "available_emergency_beds": avail_em,
        "total_emergency_beds": total_em,
        "active_emergency_teams": active_teams,
        "total_emergency_teams": total_teams,
        "resource_utilization_percent": util_percent,
        "blocked_roads_count": blocked_count
    }

@router.get("/alerts", response_model=List[ResourceAlert])
def get_resource_alerts(db: Session = Depends(get_db)):
    alerts = []
    
    # Check resources below threshold
    res_list = db.query(Resource).join(Hospital).filter(
        Resource.available_quantity <= Resource.critical_threshold
    ).limit(10).all()
    
    for r in res_list:
        sev = "CRITICAL" if r.available_quantity == 0 else "WARNING"
        alerts.append({
            "alert_id": f"ALT_RES_{r.resource_id}",
            "hospital_id": r.hospital_id,
            "hospital_name": r.hospital.name,
            "alert_type": "RESOURCE_SHORTAGE",
            "resource_type": r.resource_type,
            "severity": sev,
            "message": f"{r.hospital.name}: {r.resource_type.replace('_', ' ')} inventory is at {r.available_quantity} units (Threshold: {r.critical_threshold})",
            "available_quantity": r.available_quantity,
            "critical_threshold": r.critical_threshold,
            "generated_at": datetime.datetime.utcnow()
        })
        
    # Check hospitals with ICU <= 2
    hospitals = db.query(Hospital).filter(Hospital.status == 'ACTIVE').limit(15).all()
    for h in hospitals:
        latest_cap = db.query(HospitalCapacityHistory).filter(
            HospitalCapacityHistory.hospital_id == h.hospital_id
        ).order_by(HospitalCapacityHistory.timestamp.desc()).first()
        if latest_cap and latest_cap.icu_available <= 2 and latest_cap.icu_total > 0:
            alerts.append({
                "alert_id": f"ALT_ICU_{h.hospital_id}",
                "hospital_id": h.hospital_id,
                "hospital_name": h.name,
                "alert_type": "ICU_EXHAUSTION",
                "resource_type": "ICU_BED",
                "severity": "CRITICAL",
                "message": f"Critical ICU Load: {h.name} has only {latest_cap.icu_available} / {latest_cap.icu_total} ICU beds available",
                "available_quantity": latest_cap.icu_available,
                "critical_threshold": 2,
                "generated_at": datetime.datetime.utcnow()
            })
            
    return alerts
