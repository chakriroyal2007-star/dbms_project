import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

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
    delta: Optional[int] = Query(None, description="Relative adjustment amount (+/- units)"),
    target_quantity: Optional[int] = Query(None, description="Explicit absolute quantity to set"),
    reason: str = Query("Manual EOC stock adjustment"),
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR", "HOSPITAL_COORDINATOR"))
):
    """
    Safely adjusts hospital resource stock with atomic concurrency locking,
    strict bounds validation (0 <= available <= total), unique audit trail generation,
    and ACID transaction rollback.
    Policy:
    - If delta is supplied: increases or decreases stock by delta (new = old + delta).
    - If target_quantity is supplied: sets available stock to explicit absolute value.
    - If both supplied: target_quantity takes precedence.
    """
    if delta is None and target_quantity is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'delta' (+/- adjustment) or 'target_quantity' (absolute value) must be provided."
        )

    # Acquire row-level lock for concurrency safety where supported (PostgreSQL)
    if db.bind and db.bind.dialect.name == "postgresql":
        res = db.query(Resource).filter(Resource.resource_id == resource_id).with_for_update().first()
    else:
        res = db.query(Resource).filter(Resource.resource_id == resource_id).first()

    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Resource '{resource_id}' not found.")

    # Multi-tenant scoping: Hospital coordinator can only adjust resources for their own facility
    if current_user.role.upper() == "HOSPITAL_COORDINATOR" and current_user.organization_id:
        if res.hospital_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Hospital coordinator can only modify inventory for their assigned facility ({current_user.organization_id})."
            )

    old_avail = res.available_quantity

    if target_quantity is not None:
        new_avail = target_quantity
        effective_delta = new_avail - old_avail
    else:
        new_avail = old_avail + delta
        effective_delta = delta

    # Strict constraint enforcement
    if new_avail < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reduce stock below zero. Current available: {old_avail}, requested adjustment: {effective_delta} (result would be {new_avail})."
        )

    if new_avail > res.total_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Available stock ({new_avail}) cannot exceed total registered capacity ({res.total_quantity}). Increase total quantity first."
        )

    try:
        res.available_quantity = new_avail
        res.status = "CRITICAL" if new_avail <= (res.critical_threshold // 2) else ("LOW" if new_avail <= res.critical_threshold else "ADEQUATE")

        now = datetime.datetime.utcnow()
        unique_history_id = f"RH_{resource_id[:16]}_{uuid.uuid4().hex[:12].upper()}"

        db.add(ResourceHistory(
            resource_history_id=unique_history_id,
            resource_id=resource_id,
            timestamp=now,
            quantity_available=new_avail,
            change_amount=effective_delta,
            change_reason=reason
        ))

        log_audit_event(
            db,
            action="UPDATE",
            entity_name="resource",
            entity_id=resource_id,
            user=current_user,
            details=f"Stock of {res.resource_type} adjusted from {old_avail} to {new_avail} (change: {effective_delta:+d}, reason: {reason})",
            old_val={"available_quantity": old_avail, "status": res.status},
            new_val={"available_quantity": new_avail, "status": res.status}
        )

        db.commit()
        db.refresh(res)

        return {
            "status": "success",
            "resource_id": resource_id,
            "resource_type": res.resource_type,
            "hospital_id": res.hospital_id,
            "previous_available_quantity": old_avail,
            "new_available_quantity": new_avail,
            "total_quantity": res.total_quantity,
            "critical_threshold": res.critical_threshold,
            "resource_status": res.status
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction error during quantity adjustment: {str(e)}"
        )


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
