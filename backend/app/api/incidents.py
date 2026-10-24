import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Incident, Patient, UserAccount
from app.schemas.schemas import (
    IncidentCreate, IncidentUpdate, IncidentResponse, 
    PatientCreate, PatientResponse, EmergencyReportRequest, EmergencyReportReceipt
)
from app.api.auth import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/incidents", tags=["Incidents & Reporting"])

VALID_TRANSITIONS = {
    "RECEIVED": ["VERIFIED", "REJECTED", "CANCELLED", "ACTIVE"],
    "VERIFIED": ["ACTIVE", "CANCELLED", "CONTAINED", "REJECTED"],
    "ACTIVE": ["CONTAINED", "RESOLVED", "CANCELLED"],
    "CONTAINED": ["RESOLVED", "ACTIVE"],
    "RESOLVED": ["ACTIVE"],
    "REJECTED": ["RECEIVED", "VERIFIED"],
    "CANCELLED": ["RECEIVED"]
}

@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    reporter_id: Optional[str] = None,
    my_reports: bool = False,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Optional[UserAccount] = Depends(get_current_user)
):
    """
    Lists incidents from PostgreSQL.
    - If authenticated user has role 'REPORTER' or 'my_reports=True', SQL enforces: WHERE reporter_id = current_user.user_id
    - Operators, Administrators, and Analysts can view all incidents or filter by status/severity.
    """
    query = db.query(Incident)
    
    # Enforce Reporter Role Data Isolation
    if current_user and current_user.role.upper() == "REPORTER":
        query = query.filter(Incident.reporter_id == current_user.user_id)
    elif my_reports and current_user:
        query = query.filter(Incident.reporter_id == current_user.user_id)
    elif reporter_id:
        query = query.filter(Incident.reporter_id == reporter_id)

    if status:
        query = query.filter(Incident.status == status.upper())
    if severity:
        query = query.filter(Incident.severity == severity.upper())
        
    return query.order_by(Incident.occurred_at.desc()).limit(limit).all()

@router.get("/my-reports", response_model=List[IncidentResponse])
def list_my_reports(
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("REPORTER", "ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    """Explicit endpoint for retrieving only the logged-in user's submitted incident reports."""
    return db.query(Incident).filter(
        Incident.reporter_id == current_user.user_id
    ).order_by(Incident.occurred_at.desc()).all()

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[UserAccount] = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
        
    # Security check: If reporter role, ensure ownership
    if current_user and current_user.role.upper() == "REPORTER":
        if inc.reporter_id and inc.reporter_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Access denied. You can only view your own incident reports.")
            
    return inc

@router.post("/report", response_model=EmergencyReportReceipt)
def report_emergency_incident(
    data: EmergencyReportRequest,
    db: Session = Depends(get_db),
    current_user: Optional[UserAccount] = Depends(get_current_user)
):
    """
    Dedicated Citizen / Field Reporter endpoint.
    Creates ONE single source-of-truth incident in PostgreSQL with 'RECEIVED' state for EOC Control Operator verification.
    """
    inc_id = f"INC_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:4].upper()}"
    occ_time = datetime.datetime.utcnow()
    tracking_code = f"TRK-{uuid.uuid4().hex[:8].upper()}"
    
    rep_id = current_user.user_id if current_user else "USR_REPORTER_01"
    
    desc = data.description
    if data.reporter_name or data.reporter_contact:
        desc += f" [Reported by: {data.reporter_name or (current_user.full_name if current_user else 'Citizen')} ({data.reporter_contact or 'N/A'})]"

    new_inc = Incident(
        incident_id=inc_id,
        reporter_id=rep_id,
        incident_type=data.incident_type,
        description=desc,
        severity=data.severity,
        latitude=data.latitude,
        longitude=data.longitude,
        country=data.country or "India",
        state=data.state or "Andhra Pradesh",
        district=data.district or "Tirupati",
        city=data.city or "Tirupati",
        locality=data.locality,
        landmark=data.landmark,
        location_name=data.location_name,
        occurred_at=occ_time,
        reported_at=occ_time,
        status="RECEIVED",
        estimated_patient_count=data.estimated_patient_count,
        created_at=occ_time,
        updated_at=occ_time
    )
    db.add(new_inc)
    
    # Auto-generate triage patient placeholders
    for i in range(data.estimated_patient_count):
        p_sev = "CRITICAL" if i < max(1, data.estimated_patient_count // 3) else "SERIOUS"
        req = "ICU_BED" if p_sev == "CRITICAL" else "EMERGENCY_BED"
        db.add(Patient(
            patient_id=f"PAT_{inc_id}_{i+1:02d}",
            incident_id=inc_id,
            severity=p_sev,
            age=35,
            required_resource=req,
            transport_status="AWAITING_TRIAGE",
            created_at=occ_time
        ))
        
    log_audit_event(
        db,
        action="REPORT",
        entity_name="incident",
        entity_id=inc_id,
        user=current_user,
        details=f"Field emergency reported: {data.incident_type} at {data.location_name} (Status: RECEIVED)",
        new_value={"type": data.incident_type, "severity": data.severity, "patients": data.estimated_patient_count, "status": "RECEIVED", "reporter_id": rep_id}
    )
    
    db.commit()
    db.refresh(new_inc)
    
    return {
        "incident_id": new_inc.incident_id,
        "incident_type": new_inc.incident_type,
        "location_name": new_inc.location_name,
        "country": new_inc.country,
        "state": new_inc.state,
        "district": new_inc.district,
        "city": new_inc.city,
        "locality": new_inc.locality,
        "landmark": new_inc.landmark,
        "latitude": new_inc.latitude,
        "longitude": new_inc.longitude,
        "severity": new_inc.severity,
        "estimated_patient_count": new_inc.estimated_patient_count,
        "reported_at": new_inc.reported_at,
        "status": new_inc.status,
        "reporter_id": new_inc.reporter_id,
        "tracking_code": tracking_code,
        "message": "Emergency incident successfully recorded in PostgreSQL and dispatched to EOC triage queue."
    }

@router.post("", response_model=IncidentResponse)
def create_incident(
    data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR", "REPORTER"))
):
    inc_id = f"INC_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:4].upper()}"
    occ_time = data.occurred_at or datetime.datetime.utcnow()
    
    new_inc = Incident(
        incident_id=inc_id,
        reporter_id=current_user.user_id,
        incident_type=data.incident_type,
        description=data.description,
        severity=data.severity,
        latitude=data.latitude,
        longitude=data.longitude,
        country=data.country or "India",
        state=data.state or "Andhra Pradesh",
        district=data.district or "Tirupati",
        city=data.city or "Tirupati",
        locality=data.locality,
        landmark=data.landmark,
        location_name=data.location_name,
        occurred_at=occ_time,
        reported_at=datetime.datetime.utcnow(),
        status="ACTIVE" if current_user.role in ["ADMINISTRATOR", "CONTROL_OPERATOR"] else "RECEIVED",
        estimated_patient_count=data.estimated_patient_count,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(new_inc)
    
    # Auto-generate triage patient placeholders
    for i in range(data.estimated_patient_count):
        p_sev = "CRITICAL" if i < max(1, data.estimated_patient_count // 3) else "SERIOUS"
        req = "ICU_BED" if p_sev == "CRITICAL" else "EMERGENCY_BED"
        db.add(Patient(
            patient_id=f"PAT_{inc_id}_{i+1:02d}",
            incident_id=inc_id,
            severity=p_sev,
            age=35,
            required_resource=req,
            transport_status="AWAITING_TRIAGE",
            created_at=datetime.datetime.utcnow()
        ))
        
    log_audit_event(
        db,
        action="CREATE",
        entity_name="incident",
        entity_id=inc_id,
        user=current_user,
        details=f"Created incident {data.incident_type} at {data.location_name} with {data.estimated_patient_count} patients",
        new_value={"type": data.incident_type, "severity": data.severity, "patients": data.estimated_patient_count}
    )
    
    db.commit()
    db.refresh(new_inc)
    return new_inc

@router.patch("/{incident_id}/status")
def transition_incident_status(
    incident_id: str,
    new_status: str = Query(...),
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    """
    EOC Operator / Admin action to transition incident lifecycle states.
    For example: RECEIVED -> VERIFIED, VERIFIED -> ACTIVE, ACTIVE -> RESOLVED.
    """
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    old_status = inc.status
    target_status = new_status.upper()
    
    # State machine transition validation
    allowed_transitions = VALID_TRANSITIONS.get(old_status, [])
    if target_status not in allowed_transitions and old_status != target_status:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition: Cannot change from '{old_status}' to '{target_status}'. Allowed next states: {allowed_transitions}"
        )
        
    inc.status = target_status
    inc.updated_at = datetime.datetime.utcnow()
    
    action_type = "VERIFY" if (old_status == "RECEIVED" and target_status == "VERIFIED") else "UPDATE"
    
    log_audit_event(
        db,
        action=action_type,
        entity_name="incident",
        entity_id=incident_id,
        user=current_user,
        details=f"Incident status changed from {old_status} to {target_status} by {current_user.full_name} ({current_user.role})",
        old_value={"status": old_status},
        new_value={"status": target_status}
    )
    
    db.commit()
    return {
        "status": "success", 
        "incident_id": incident_id, 
        "previous_status": old_status, 
        "current_status": target_status,
        "message": f"Incident {incident_id} successfully updated to {target_status}."
    }

@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: str,
    data: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    old_val = {"severity": inc.severity, "status": inc.status, "desc": inc.description}
    
    if data.incident_type is not None:
        inc.incident_type = data.incident_type
    if data.description is not None:
        inc.description = data.description
    if data.severity is not None:
        inc.severity = data.severity
    if data.status is not None:
        inc.status = data.status
    if data.country is not None:
        inc.country = data.country
    if data.state is not None:
        inc.state = data.state
    if data.district is not None:
        inc.district = data.district
    if data.city is not None:
        inc.city = data.city
    if data.locality is not None:
        inc.locality = data.locality
    if data.landmark is not None:
        inc.landmark = data.landmark
    if data.location_name is not None:
        inc.location_name = data.location_name
    if data.estimated_patient_count is not None:
        inc.estimated_patient_count = data.estimated_patient_count
        
    inc.updated_at = datetime.datetime.utcnow()
    
    log_audit_event(
        db,
        action="UPDATE",
        entity_name="incident",
        entity_id=incident_id,
        user=current_user,
        details=f"Updated incident {incident_id} to status {inc.status}, severity {inc.severity}",
        old_value=old_val,
        new_value={"severity": inc.severity, "status": inc.status, "desc": inc.description}
    )
    
    db.commit()
    db.refresh(inc)
    return inc

@router.delete("/{incident_id}")
def delete_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    # Delete child patients first
    db.query(Patient).filter(Patient.incident_id == incident_id).delete()
    db.delete(inc)
    
    log_audit_event(
        db,
        action="DELETE",
        entity_name="incident",
        entity_id=incident_id,
        user=current_user,
        details=f"Deleted incident {incident_id} ({inc.location_name})"
    )
    db.commit()
    return {"status": "success", "deleted_incident_id": incident_id}
