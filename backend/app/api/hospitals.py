import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Hospital, HospitalCapacityHistory, UserAccount
from app.schemas.schemas import HospitalCapacityResponse, HospitalCreate, HospitalUpdate
from app.api.auth import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

@router.get("", response_model=List[HospitalCapacityResponse])
def list_hospitals(
    status: Optional[str] = None,
    emergency_level: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Hospital)
    if status:
        query = query.filter(Hospital.status == status)
    if emergency_level:
        query = query.filter(Hospital.emergency_level == emergency_level)
        
    hospitals = query.limit(limit).all()
    results = []
    
    for h in hospitals:
        latest_cap = db.query(HospitalCapacityHistory).filter(
            HospitalCapacityHistory.hospital_id == h.hospital_id
        ).order_by(HospitalCapacityHistory.timestamp.desc()).first()
        
        icu_tot = latest_cap.icu_total if latest_cap else 10
        icu_avail = latest_cap.icu_available if latest_cap else 0
        em_tot = latest_cap.emergency_beds_total if latest_cap else 25
        em_avail = latest_cap.emergency_beds_available if latest_cap else 0
        gen_tot = latest_cap.general_beds_total if latest_cap else 80
        gen_avail = latest_cap.general_beds_available if latest_cap else 0
        
        results.append({
            "hospital_id": h.hospital_id,
            "name": h.name,
            "hospital_type": h.hospital_type,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "emergency_level": h.emergency_level,
            "status": h.status,
            "icu_total": icu_tot,
            "icu_available": icu_avail,
            "emergency_beds_total": em_tot,
            "emergency_beds_available": em_avail,
            "general_beds_total": gen_tot,
            "general_beds_available": gen_avail,
            "icu_occupancy_percent": round(((icu_tot - icu_avail) / icu_tot * 100), 1) if icu_tot > 0 else 0,
            "emergency_occupancy_percent": round(((em_tot - em_avail) / em_tot * 100), 1) if em_tot > 0 else 0
        })
    return results

@router.get("/{hospital_id}", response_model=HospitalCapacityResponse)
def get_hospital(hospital_id: str, db: Session = Depends(get_db)):
    h = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    latest_cap = db.query(HospitalCapacityHistory).filter(
        HospitalCapacityHistory.hospital_id == h.hospital_id
    ).order_by(HospitalCapacityHistory.timestamp.desc()).first()
    
    icu_tot = latest_cap.icu_total if latest_cap else 10
    icu_avail = latest_cap.icu_available if latest_cap else 0
    em_tot = latest_cap.emergency_beds_total if latest_cap else 25
    em_avail = latest_cap.emergency_beds_available if latest_cap else 0
    gen_tot = latest_cap.general_beds_total if latest_cap else 80
    gen_avail = latest_cap.general_beds_available if latest_cap else 0
    
    return {
        "hospital_id": h.hospital_id,
        "name": h.name,
        "hospital_type": h.hospital_type,
        "latitude": h.latitude,
        "longitude": h.longitude,
        "emergency_level": h.emergency_level,
        "status": h.status,
        "icu_total": icu_tot,
        "icu_available": icu_avail,
        "emergency_beds_total": em_tot,
        "emergency_beds_available": em_avail,
        "general_beds_total": gen_tot,
        "general_beds_available": gen_avail,
        "icu_occupancy_percent": round(((icu_tot - icu_avail) / icu_tot * 100), 1) if icu_tot > 0 else 0,
        "emergency_occupancy_percent": round(((em_tot - em_avail) / em_tot * 100), 1) if em_tot > 0 else 0
    }

@router.post("", response_model=HospitalCapacityResponse)
def create_hospital(
    data: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    import uuid
    hosp_id = f"HOSP_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:4].upper()}"
    new_hosp = Hospital(
        hospital_id=hosp_id,
        name=data.name,
        hospital_type=data.hospital_type,
        latitude=data.latitude,
        longitude=data.longitude,
        emergency_level=data.emergency_level,
        contact_placeholder=data.contact_placeholder,
        status=data.status,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_hosp)
    
    # Add initial capacity record
    cap = HospitalCapacityHistory(
        capacity_history_id=f"HCH_{hosp_id}_INIT",
        hospital_id=hosp_id,
        timestamp=datetime.datetime.utcnow(),
        icu_total=data.icu_total,
        icu_available=data.icu_available,
        emergency_beds_total=data.emergency_beds_total,
        emergency_beds_available=data.emergency_beds_available,
        general_beds_total=data.general_beds_total,
        general_beds_available=data.general_beds_available
    )
    db.add(cap)
    
    log_audit_event(
        db,
        action="CREATE",
        entity_name="hospital",
        entity_id=hosp_id,
        user=current_user,
        details=f"Created hospital {data.name} ({data.emergency_level})",
        new_val={"name": data.name, "level": data.emergency_level, "icu_total": data.icu_total}
    )
    db.commit()
    db.refresh(new_hosp)
    
    return {
        "hospital_id": new_hosp.hospital_id,
        "name": new_hosp.name,
        "hospital_type": new_hosp.hospital_type,
        "latitude": new_hosp.latitude,
        "longitude": new_hosp.longitude,
        "emergency_level": new_hosp.emergency_level,
        "status": new_hosp.status,
        "icu_total": data.icu_total,
        "icu_available": data.icu_available,
        "emergency_beds_total": data.emergency_beds_total,
        "emergency_beds_available": data.emergency_beds_available,
        "general_beds_total": data.general_beds_total,
        "general_beds_available": data.general_beds_available,
        "icu_occupancy_percent": round(((data.icu_total - data.icu_available) / data.icu_total * 100), 1) if data.icu_total > 0 else 0,
        "emergency_occupancy_percent": round(((data.emergency_beds_total - data.emergency_beds_available) / data.emergency_beds_total * 100), 1) if data.emergency_beds_total > 0 else 0
    }

@router.patch("/{hospital_id}")
def update_hospital(
    hospital_id: str,
    data: HospitalUpdate,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    hosp = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    old_data = {"name": hosp.name, "status": hosp.status, "level": hosp.emergency_level}
    
    if data.name is not None:
        hosp.name = data.name
    if data.hospital_type is not None:
        hosp.hospital_type = data.hospital_type
    if data.latitude is not None:
        hosp.latitude = data.latitude
    if data.longitude is not None:
        hosp.longitude = data.longitude
    if data.emergency_level is not None:
        hosp.emergency_level = data.emergency_level
    if data.contact_placeholder is not None:
        hosp.contact_placeholder = data.contact_placeholder
    if data.status is not None:
        hosp.status = data.status
        
    # Check if capacity fields provided
    latest_cap = db.query(HospitalCapacityHistory).filter(
        HospitalCapacityHistory.hospital_id == hospital_id
    ).order_by(HospitalCapacityHistory.timestamp.desc()).first()
    
    icu_tot = data.icu_total if data.icu_total is not None else (latest_cap.icu_total if latest_cap else 10)
    icu_avail = data.icu_available if data.icu_available is not None else (latest_cap.icu_available if latest_cap else 5)
    em_tot = data.emergency_beds_total if data.emergency_beds_total is not None else (latest_cap.emergency_beds_total if latest_cap else 25)
    em_avail = data.emergency_beds_available if data.emergency_beds_available is not None else (latest_cap.emergency_beds_available if latest_cap else 15)
    gen_tot = data.general_beds_total if data.general_beds_total is not None else (latest_cap.general_beds_total if latest_cap else 80)
    gen_avail = data.general_beds_available if data.general_beds_available is not None else (latest_cap.general_beds_available if latest_cap else 50)
    
    new_cap = HospitalCapacityHistory(
        capacity_history_id=f"HCH_{hospital_id}_{uuid.uuid4().hex[:12].upper()}",
        hospital_id=hospital_id,
        timestamp=datetime.datetime.utcnow(),
        icu_total=icu_tot,
        icu_available=icu_avail,
        emergency_beds_total=em_tot,
        emergency_beds_available=em_avail,
        general_beds_total=gen_tot,
        general_beds_available=gen_avail
    )
    db.add(new_cap)
    
    log_audit_event(
        db,
        action="UPDATE",
        entity_name="hospital",
        entity_id=hospital_id,
        user=current_user,
        details=f"Updated hospital {hosp.name}",
        old_val=old_data,
        new_val={"name": hosp.name, "status": hosp.status, "level": hosp.emergency_level}
    )
    
    db.commit()
    return {"status": "success", "hospital_id": hospital_id}

@router.delete("/{hospital_id}")
def delete_hospital(
    hospital_id: str,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR"))
):
    hosp = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    # Check if hospital has active references
    h_name = hosp.name
    
    # Remove capacity histories first
    db.query(HospitalCapacityHistory).filter(HospitalCapacityHistory.hospital_id == hospital_id).delete()
    db.delete(hosp)
    
    log_audit_event(
        db,
        action="DELETE",
        entity_name="hospital",
        entity_id=hospital_id,
        user=current_user,
        details=f"Deleted hospital {h_name}"
    )
    db.commit()
    return {"status": "success", "deleted_hospital_id": hospital_id}
