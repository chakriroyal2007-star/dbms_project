import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Resource, ResourceHistory, Hospital, UserAccount
from app.schemas.schemas import ResourceItemResponse, ResourceCreate
from app.api.auth import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.get("", response_model=List[ResourceItemResponse])
def list_resources(
    resource_type: Optional[str] = None,
    status: Optional[str] = None,
    hospital_id: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Resource)
    if resource_type:
        query = query.filter(Resource.resource_type == resource_type)
    if status:
        query = query.filter(Resource.status == status)
    if hospital_id:
        query = query.filter(Resource.hospital_id == hospital_id)
        
    items = query.limit(limit).all()
    results = []
    for r in items:
        h = db.query(Hospital).filter(Hospital.hospital_id == r.hospital_id).first()
        results.append({
            "resource_id": r.resource_id,
            "hospital_id": r.hospital_id,
            "hospital_name": h.name if h else None,
            "resource_type": r.resource_type,
            "total_quantity": r.total_quantity,
            "available_quantity": r.available_quantity,
            "critical_threshold": r.critical_threshold,
            "status": r.status
        })
    return results

@router.post("", response_model=ResourceItemResponse)
def create_resource(
    data: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    res_id = f"RES_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    calc_status = "CRITICAL" if data.available_quantity <= (data.critical_threshold // 2) else ("LOW" if data.available_quantity <= data.critical_threshold else "ADEQUATE")
    
    new_res = Resource(
        resource_id=res_id,
        hospital_id=data.hospital_id,
        resource_type=data.resource_type,
        total_quantity=data.total_quantity,
        available_quantity=data.available_quantity,
        critical_threshold=data.critical_threshold,
        status=calc_status
    )
    db.add(new_res)
    
    db.add(ResourceHistory(
        resource_history_id=f"RH_{res_id}_INIT",
        resource_id=res_id,
        timestamp=datetime.datetime.utcnow(),
        quantity_available=data.available_quantity,
        change_amount=data.available_quantity,
        change_reason="Initial stock provisioning"
    ))
    
    log_audit_event(
        db,
        action="CREATE",
        entity_name="resource",
        entity_id=res_id,
        user=current_user,
        details=f"Stocked {data.resource_type} ({data.available_quantity}/{data.total_quantity}) at hospital {data.hospital_id}",
        new_val={"type": data.resource_type, "total": data.total_quantity, "avail": data.available_quantity}
    )
    
    db.commit()
    db.refresh(new_res)
    
    h = db.query(Hospital).filter(Hospital.hospital_id == new_res.hospital_id).first()
    return {
        "resource_id": new_res.resource_id,
        "hospital_id": new_res.hospital_id,
        "hospital_name": h.name if h else None,
        "resource_type": new_res.resource_type,
        "total_quantity": new_res.total_quantity,
        "available_quantity": new_res.available_quantity,
        "critical_threshold": new_res.critical_threshold,
        "status": new_res.status
    }

@router.patch("/{resource_id}/adjust")
def adjust_resource_quantity(
    resource_id: str,
    delta: int = Query(...),
    reason: str = Query("Manual EOC stock adjustment"),
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    res = db.query(Resource).filter(Resource.resource_id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    old_avail = res.available_quantity
    new_avail = max(0, min(res.total_quantity, res.available_quantity + delta))
    res.available_quantity = new_avail
    res.status = "CRITICAL" if new_avail <= (res.critical_threshold // 2) else ("LOW" if new_avail <= res.critical_threshold else "ADEQUATE")
    
    db.add(ResourceHistory(
        resource_history_id=f"RH_{resource_id}_{datetime.datetime.utcnow().strftime('%H%M%S')}",
        resource_id=resource_id,
        timestamp=datetime.datetime.utcnow(),
        quantity_available=new_avail,
        change_amount=delta,
        change_reason=reason
    ))
    
    log_audit_event(
        db,
        action="UPDATE",
        entity_name="resource",
        entity_id=resource_id,
        user=current_user,
        details=f"Adjusted {res.resource_type} quantity by {delta} ({reason})",
        old_val={"available": old_avail},
        new_val={"available": new_avail}
    )
    
    db.commit()
    return {"status": "success", "resource_id": resource_id, "new_available_quantity": new_avail}

@router.delete("/{resource_id}")
def delete_resource(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR"))
):
    res = db.query(Resource).filter(Resource.resource_id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    db.query(ResourceHistory).filter(ResourceHistory.resource_id == resource_id).delete()
    db.delete(res)
    
    log_audit_event(
        db,
        action="DELETE",
        entity_name="resource",
        entity_id=resource_id,
        user=current_user,
        details=f"Deleted resource record {resource_id}"
    )
    db.commit()
    return {"status": "success", "deleted_resource_id": resource_id}
