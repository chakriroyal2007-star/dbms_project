import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.models import (
    Incident, Patient, Hospital, Ambulance,
    HospitalCapacityHistory, RoadStatusHistory, Resource
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    # 1. Incidents by Severity
    sev_counts = db.query(
        Incident.severity, func.count(Incident.incident_id)
    ).group_by(Incident.severity).all()
    
    incidents_by_severity = [
        {"severity": sev, "count": count} for sev, count in sev_counts
    ]
    
    # 2. Incidents by Type
    type_counts = db.query(
        Incident.incident_type, func.count(Incident.incident_id)
    ).group_by(Incident.incident_type).all()
    
    incidents_by_type = [
        {"type": t.replace('_', ' ').title(), "count": count} for t, count in type_counts
    ]

    # 3. Hospital Capacity & ICU Availability distribution
    hospitals = db.query(Hospital).limit(10).all()
    hosp_capacity_data = []
    for h in hospitals:
        latest_cap = db.query(HospitalCapacityHistory).filter(
            HospitalCapacityHistory.hospital_id == h.hospital_id
        ).order_by(HospitalCapacityHistory.timestamp.desc()).first()
        if latest_cap:
            hosp_capacity_data.append({
                "hospital": h.name.split()[0] + (" " + h.name.split()[1] if len(h.name.split()) > 1 else ""),
                "icu_available": latest_cap.icu_available,
                "icu_occupied": latest_cap.icu_total - latest_cap.icu_available,
                "emergency_available": latest_cap.emergency_beds_available,
                "emergency_occupied": latest_cap.emergency_beds_total - latest_cap.emergency_beds_available,
            })

    # 4. ICU Availability over Time (from actual persistent HospitalCapacityHistory)
    recent_caps = db.query(HospitalCapacityHistory).order_by(
        HospitalCapacityHistory.timestamp.desc()
    ).limit(15).all()
    
    timeline_series = []
    for cap in reversed(recent_caps):
        t_str = cap.timestamp.strftime("%H:%M") if cap.timestamp else "N/A"
        timeline_series.append({
            "time": t_str,
            "icu_available": cap.icu_available,
            "emergency_available": cap.emergency_beds_available,
            "hospital_id": cap.hospital_id
        })

    # 5. Ambulance Fleet Utilization breakdown
    amb_counts = db.query(
        Ambulance.current_status, func.count(Ambulance.ambulance_id)
    ).group_by(Ambulance.current_status).all()
    
    ambulance_utilization = [
        {"status": stat, "count": count} for stat, count in amb_counts
    ]

    # 6. Critical Supplies stock level
    res_stock = db.query(
        Resource.resource_type,
        func.sum(Resource.available_quantity).label("available"),
        func.sum(Resource.total_quantity).label("total")
    ).group_by(Resource.resource_type).all()
    
    resource_consumption = [
        {
            "resource": r.replace('_', ' ').title(),
            "available": int(avail),
            "consumed": int(tot - avail)
        }
        for r, avail, tot in res_stock
    ]

    # 7. Road Traffic Congestion breakdown
    road_statuses = db.query(
        RoadStatusHistory.traffic_level, func.count(RoadStatusHistory.road_status_id)
    ).group_by(RoadStatusHistory.traffic_level).all()
    
    road_congestion = [
        {"level": lvl, "count": count} for lvl, count in road_statuses
    ]

    # 8. Genuine Response Time / SLA Metrics from actual responder missions
    from app.models.models import ResponderAssignment
    completed_missions = db.query(ResponderAssignment).filter(
        ResponderAssignment.assigned_at.isnot(None),
        ResponderAssignment.arrived_at.isnot(None)
    ).all()

    avg_response_time = None
    if completed_missions:
        total_mins = sum(
            max(0.0, (m.arrived_at - m.assigned_at).total_seconds() / 60.0)
            for m in completed_missions
        )
        avg_response_time = round(total_mins / len(completed_missions), 1)

    return {
        "incidents_by_severity": incidents_by_severity,
        "incidents_by_type": incidents_by_type,
        "hospital_capacity_data": hosp_capacity_data,
        "icu_timeline": timeline_series,
        "ambulance_utilization": ambulance_utilization,
        "resource_consumption": resource_consumption,
        "road_congestion": road_congestion,
        "avg_response_time_minutes": avg_response_time,
        "completed_missions_sample_size": len(completed_missions)
    }

