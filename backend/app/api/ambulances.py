import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Ambulance, AmbulanceLocationHistory, AmbulanceStatusHistory, Hospital, UserAccount
from app.schemas.schemas import AmbulanceResponse, AmbulanceCreate
from app.api.auth import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/ambulances", tags=["Ambulances"])

@router.get("", response_model=List[AmbulanceResponse])
def list_ambulances(
    status: Optional[str] = None,
    ambulance_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Ambulance)
    if status:
        query = query.filter(Ambulance.current_status == status)
    if ambulance_type:
        query = query.filter(Ambulance.ambulance_type == ambulance_type)
        
    ambs = query.limit(limit).all()
    results = []
    
    for a in ambs:
        loc = db.query(AmbulanceLocationHistory).filter(
            AmbulanceLocationHistory.ambulance_id == a.ambulance_id
        ).order_by(AmbulanceLocationHistory.timestamp.desc()).first()
        
        home_h = db.query(Hospital).filter(Hospital.hospital_id == a.home_hospital_id).first() if a.home_hospital_id else None
        
        results.append({
            "ambulance_id": a.ambulance_id,
            "registration_number": a.registration_number,
            "ambulance_type": a.ambulance_type,
            "capacity": a.capacity,
            "home_hospital_id": a.home_hospital_id,
            "home_hospital_name": home_h.name if home_h else None,
            "current_status": a.current_status,
            "latitude": loc.latitude if loc else 13.6288,
            "longitude": loc.longitude if loc else 79.4192,
            "speed": loc.speed if loc else 0.0,
            "created_at": a.created_at
        })
    return results

@router.post("", response_model=AmbulanceResponse)
def create_ambulance(
    data: AmbulanceCreate,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    amb_id = f"AMB_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    new_amb = Ambulance(
        ambulance_id=amb_id,
        registration_number=data.registration_number,
        ambulance_type=data.ambulance_type,
        capacity=data.capacity,
        home_hospital_id=data.home_hospital_id,
        current_status=data.current_status,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_amb)
    
    # Location history
    loc = AmbulanceLocationHistory(
        location_history_id=f"ALH_{amb_id}_INIT",
        ambulance_id=amb_id,
        timestamp=datetime.datetime.utcnow(),
        latitude=data.latitude,
        longitude=data.longitude,
        speed=0.0
    )
    db.add(loc)
    
    # Status history
    stat = AmbulanceStatusHistory(
        status_history_id=f"ASH_{amb_id}_INIT",
        ambulance_id=amb_id,
        status=data.current_status,
        start_time=datetime.datetime.utcnow(),
        reason="Commissioned into fleet"
    )
    db.add(stat)
    
    log_audit_event(
        db,
        action="CREATE",
        entity_name="ambulance",
        entity_id=amb_id,
        user=current_user,
        details=f"Added ambulance {data.registration_number} ({data.ambulance_type})",
        new_val={"reg": data.registration_number, "type": data.ambulance_type}
    )
    
    db.commit()
    db.refresh(new_amb)
    
    home_h = db.query(Hospital).filter(Hospital.hospital_id == new_amb.home_hospital_id).first() if new_amb.home_hospital_id else None
    
    return {
        "ambulance_id": new_amb.ambulance_id,
        "registration_number": new_amb.registration_number,
        "ambulance_type": new_amb.ambulance_type,
        "capacity": new_amb.capacity,
        "home_hospital_id": new_amb.home_hospital_id,
        "home_hospital_name": home_h.name if home_h else None,
        "current_status": new_amb.current_status,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "speed": 0.0,
        "created_at": new_amb.created_at
    }

@router.patch("/{ambulance_id}/status")
def update_ambulance_status(
    ambulance_id: str,
    status: str = Query(...),
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    amb = db.query(Ambulance).filter(Ambulance.ambulance_id == ambulance_id).first()
    if not amb:
        raise HTTPException(status_code=404, detail="Ambulance not found")
        
    old_status = amb.current_status
    amb.current_status = status
    
    # Append to status history
    db.add(AmbulanceStatusHistory(
        status_history_id=f"ASH_{ambulance_id}_{datetime.datetime.utcnow().strftime('%H%M%S')}",
        ambulance_id=ambulance_id,
        status=status,
        start_time=datetime.datetime.utcnow(),
        reason=reason or f"Status changed by {current_user.username}"
    )
    )
    
    log_audit_event(
        db,
        action="UPDATE",
        entity_name="ambulance",
        entity_id=ambulance_id,
        user=current_user,
        details=f"Ambulance {amb.registration_number} status changed: {old_status} -> {status}",
        old_val={"status": old_status},
        new_val={"status": status}
    )
    
    db.commit()
    return {"status": "success", "ambulance_id": ambulance_id, "new_status": status}

@router.delete("/{ambulance_id}")
def delete_ambulance(
    ambulance_id: str,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR"))
):
    amb = db.query(Ambulance).filter(Ambulance.ambulance_id == ambulance_id).first()
    if not amb:
        raise HTTPException(status_code=404, detail="Ambulance not found")
        
    reg = amb.registration_number
    db.query(AmbulanceLocationHistory).filter(AmbulanceLocationHistory.ambulance_id == ambulance_id).delete()
    db.query(AmbulanceStatusHistory).filter(AmbulanceStatusHistory.ambulance_id == ambulance_id).delete()
    db.delete(amb)
    
    log_audit_event(
        db,
        action="DELETE",
        entity_name="ambulance",
        entity_id=ambulance_id,
        user=current_user,
        details=f"Decommissioned ambulance {reg}"
    )
    db.commit()
    return {"status": "success", "deleted_ambulance_id": ambulance_id}
