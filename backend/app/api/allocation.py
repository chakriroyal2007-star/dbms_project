from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import UserAccount
from app.schemas.schemas import AllocationSolveRequest, AllocationPlan
from app.services.allocation_service import solve_emergency_allocation, commit_allocation_transaction
from app.api.auth import require_role, get_current_user

router = APIRouter(prefix="/allocation", tags=["Resource Allocation"])

@router.post("/solve", response_model=AllocationPlan)
def solve_allocation(
    request: AllocationSolveRequest, 
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role(["CONTROL_OPERATOR", "ADMIN", "ADMINISTRATOR", "ANALYST"]))
):
    """
    Calculates multi-criteria feasible resource distribution for an incident,
    enforcing capacity limits across regional ICU & Emergency bed wards.
    """
    plan = solve_emergency_allocation(
        db=db,
        incident_id=request.incident_id,
        latitude=request.latitude,
        longitude=request.longitude,
        severity=request.severity,
        patient_count=request.patient_count,
        required_icu=request.required_icu,
        required_emergency=request.required_emergency
    )
    return plan

@router.post("/commit")
def commit_allocation(
    plan_data: dict = Body(...), 
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role(["CONTROL_OPERATOR", "ADMIN", "ADMINISTRATOR"]))
):
    """
    Executes ACID transaction committing allocated units and updating hospital/ambulance statuses.
    Requires CONTROL_OPERATOR or ADMINISTRATOR role.
    """
    try:
        res = commit_allocation_transaction(db=db, plan=plan_data, user_id=current_user.user_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
