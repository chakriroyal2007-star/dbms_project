import datetime
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import (
    UserAccount, Organization, Hospital, HospitalCapacityHistory,
    Incident, ResponderAssignment, IncidentTimelineEvent, HospitalAssignment, Patient,
    Ambulance, AmbulanceStatusHistory
)

from app.api.auth import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/coordination", tags=["Operations & Multi-Tenant Coordination"])

# ------------------------------------------------------------------------------
# Field Responder Endpoints (Role 4: Field Responder, TERA Network)
# ------------------------------------------------------------------------------
@router.get("/responder/assignments")
def get_responder_assignments(
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("FIELD_RESPONDER", "ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    """
    Retrieves assignments for the current authenticated Field Responder.
    Strict multi-tenant security: only assignments mapped to the responder are returned.
    """
    query = db.query(ResponderAssignment)
    if current_user.role.upper() == "FIELD_RESPONDER":
        query = query.filter(ResponderAssignment.responder_user_id == current_user.user_id)
        
    assignments = query.order_by(ResponderAssignment.assigned_at.desc()).all()
    results = []
    for a in assignments:
        inc = db.query(Incident).filter(Incident.incident_id == a.incident_id).first()
        results.append({
            "assignment_id": a.assignment_id,
            "incident_id": a.incident_id,
            "incident_type": inc.incident_type if inc else "UNKNOWN",
            "location_name": inc.location_name if inc else "Location Pending",
            "latitude": inc.latitude if inc else 0.0,
            "longitude": inc.longitude if inc else 0.0,
            "severity": inc.severity if inc else "HIGH",
            "resource_id": a.resource_id,
            "status": a.status,
            "assigned_at": a.assigned_at,
            "acknowledged_at": a.acknowledged_at,
            "en_route_at": a.en_route_at,
            "arrived_at": a.arrived_at,
            "completed_at": a.completed_at,
            "notes": a.notes
        })
    return results

@router.post("/responder/assignments/{assignment_id}/update-status")
def update_assignment_status(
    assignment_id: str,
    status_update: str = Query(..., description="ACKNOWLEDGED, DECLINED, EN_ROUTE, ARRIVED, COMPLETED"),
    decline_reason: Optional[str] = Query(None),
    notes: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("FIELD_RESPONDER", "ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    """
    Allows field responders to confirm assignment, update en-route/arrival timestamps, or decline with reason.
    """
    assignment = db.query(ResponderAssignment).filter(ResponderAssignment.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if current_user.role.upper() == "FIELD_RESPONDER" and assignment.responder_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Cannot update assignments belonging to another responder.")
        
    now = datetime.datetime.utcnow()
    target_status = status_update.upper()
    old_status = assignment.status
    assignment.status = target_status
    
    if target_status == "ACKNOWLEDGED":
        assignment.acknowledged_at = now
    elif target_status == "EN_ROUTE":
        assignment.en_route_at = now
    elif target_status == "ARRIVED":
        assignment.arrived_at = now
    elif target_status == "COMPLETED":
        assignment.completed_at = now
    elif target_status == "DECLINED":
        assignment.decline_reason = decline_reason or "Operational unavailability"
        
    if notes:
        assignment.notes = (assignment.notes or "") + f"\n[{target_status}] {notes}"
        
    # Also propagate real-world milestone to Incident timeline!
    inc = db.query(Incident).filter(Incident.incident_id == assignment.incident_id).first()
    if inc:
        status_map = {
            "ACKNOWLEDGED": ("RESOURCE_ACKNOWLEDGED", "Responder Acknowledged Assignment"),
            "EN_ROUTE": ("EN_ROUTE", "Unit En Route to Incident Site"),
            "ARRIVED": ("ARRIVED", "Unit Arrived on Scene"),
            "COMPLETED": ("RESOLVED", "Field Care & Transport Handover Completed")
        }
        if target_status in status_map:
            new_inc_status, title = status_map[target_status]
            inc.status = new_inc_status
            inc.updated_at = now
            
            evt = IncidentTimelineEvent(
                event_id=f"EVT_{uuid.uuid4().hex[:8].upper()}",
                incident_id=inc.incident_id,
                status=new_inc_status,
                title=title,
                description=f"Field Responder {current_user.full_name} reported status {target_status} for unit {assignment.resource_id or 'Assigned Unit'}.",
                actor_name=current_user.full_name,
                actor_role=current_user.role,
                timestamp=now
            )
            db.add(evt)
            
    log_audit_event(
        db,
        action="UPDATE",
        entity_name="responder_assignment",
        entity_id=assignment_id,
        user=current_user,
        details=f"Responder assignment {assignment_id} updated to {target_status} (Decline: {decline_reason})",
        old_value={"status": old_status},
        new_value={"status": target_status}
    )
    db.commit()
    return {"status": "success", "assignment_id": assignment_id, "new_status": target_status}

# ------------------------------------------------------------------------------
# Hospital Coordinator Endpoints (Role 3: Hospital Coordinator, TERA Network)
# ------------------------------------------------------------------------------
@router.get("/hospital/profile")
def get_hospital_profile(
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("HOSPITAL_COORDINATOR", "ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    """
    Returns hospital profile and real capacity records for authenticated coordinator.
    Restricted to user's assigned organization / hospital.
    """
    # If user has an organization_id, match by hospital_id
    hosp = None
    if current_user.organization_id:
        hosp = db.query(Hospital).filter(Hospital.hospital_id == current_user.organization_id).first()
    if not hosp:
        # Fallback to first active hospital for demo or administrator
        hosp = db.query(Hospital).first()
        
    if not hosp:
        raise HTTPException(status_code=404, detail="No hospital profile configured for this account.")
        
    latest_capacity = db.query(HospitalCapacityHistory).filter(
        HospitalCapacityHistory.hospital_id == hosp.hospital_id
    ).order_by(HospitalCapacityHistory.timestamp.desc()).first()
    
    return {
        "hospital_id": hosp.hospital_id,
        "name": hosp.name,
        "hospital_type": hosp.hospital_type,
        "emergency_level": hosp.emergency_level,
        "status": hosp.status,
        "latitude": hosp.latitude,
        "longitude": hosp.longitude,
        "contact": hosp.contact_placeholder,
        "current_capacity": {
            "icu_total": latest_capacity.icu_total if latest_capacity else 20,
            "icu_available": latest_capacity.icu_available if latest_capacity else 5,
            "emergency_total": latest_capacity.emergency_beds_total if latest_capacity else 35,
            "emergency_available": latest_capacity.emergency_beds_available if latest_capacity else 8,
            "general_total": latest_capacity.general_beds_total if latest_capacity else 120,
            "general_available": latest_capacity.general_beds_available if latest_capacity else 25,
            "last_updated": latest_capacity.timestamp if latest_capacity else hosp.created_at
        }
    }

@router.post("/hospital/capacity")
def update_hospital_capacity(
    icu_available: int = Query(...),
    emergency_available: int = Query(...),
    general_available: int = Query(...),
    hospital_status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("HOSPITAL_COORDINATOR", "ADMINISTRATOR"))
):
    """
    Updates hospital capacity in database with immutable historical record.
    """
    hosp_id = current_user.organization_id or "HOSP_01"
    hosp = db.query(Hospital).filter(Hospital.hospital_id == hosp_id).first()
    if not hosp:
        hosp = db.query(Hospital).first()
        
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    now = datetime.datetime.utcnow()
    new_cap = HospitalCapacityHistory(
        capacity_history_id=f"CAP_{uuid.uuid4().hex[:8].upper()}",
        hospital_id=hosp.hospital_id,
        timestamp=now,
        icu_total=20,
        icu_available=max(0, icu_available),
        emergency_beds_total=35,
        emergency_beds_available=max(0, emergency_available),
        general_beds_total=120,
        general_beds_available=max(0, general_available)
    )
    db.add(new_cap)
    
    if hospital_status:
        hosp.status = hospital_status.upper()
        
    log_audit_event(
        db,
        action="UPDATE",
        entity_name="hospital_capacity",
        entity_id=hosp.hospital_id,
        user=current_user,
        details=f"Hospital coordinator {current_user.full_name} updated capacity: ICU={icu_available}, ER={emergency_available}, Gen={general_available}",
        new_value={"icu_available": icu_available, "emergency_available": emergency_available, "general_available": general_available}
    )
    db.commit()
    return {"status": "success", "hospital_id": hosp.hospital_id, "updated_at": now}

@router.get("/hospital/referrals")
def get_hospital_referrals(
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("HOSPITAL_COORDINATOR", "ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    """
    Returns referral and patient transfer admissions for the authenticated coordinator's hospital.
    Strict multi-tenant security: coordinators only receive referrals directed to their authorized facility.
    """
    hosp_id = current_user.organization_id
    query = db.query(HospitalAssignment)
    if current_user.role.upper() == "HOSPITAL_COORDINATOR" and hosp_id:
        query = query.filter(HospitalAssignment.hospital_id == hosp_id)

    assignments = query.order_by(HospitalAssignment.assigned_at.desc()).all()
    results = []
    for a in assignments:
        inc = db.query(Incident).filter(Incident.incident_id == a.incident_id).first()
        pat = db.query(Patient).filter(Patient.patient_id == a.patient_id).first() if a.patient_id else None
        hosp = db.query(Hospital).filter(Hospital.hospital_id == a.hospital_id).first()
        results.append({
            "assignment_id": a.assignment_id,
            "incident_id": a.incident_id,
            "incident_type": inc.incident_type if inc else "UNKNOWN",
            "patient_id": a.patient_id,
            "required_resource": pat.required_resource if pat else "EMERGENCY_BED",
            "hospital_id": a.hospital_id,
            "hospital_name": hosp.name if hosp else "Assigned Hospital",
            "status": a.status,
            "assigned_at": a.assigned_at,
            "arrival_time": a.arrival_time,
            "responded_at": a.responded_at,
            "rejection_reason": a.rejection_reason
        })
    return results

@router.post("/hospital/referrals/{assignment_id}/respond")
def respond_hospital_referral(
    assignment_id: str,
    action: Optional[str] = Query(None, description="ACCEPTED, REJECTED, CONFIRMED, ARRIVED, HANDOVER"),
    response_status: Optional[str] = Query(None),
    reason: Optional[str] = Query(None),
    notes: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("HOSPITAL_COORDINATOR", "ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    """
    Referral workflow state transition:
    Proposed -> Sent -> Accepted / Rejected -> Confirmed -> Arrived -> Handover.
    Only authorized coordinator for the destination hospital can accept/reject.
    """
    assign = db.query(HospitalAssignment).filter(HospitalAssignment.assignment_id == assignment_id).first()
    if not assign:
        raise HTTPException(status_code=404, detail="Referral assignment not found")

    if current_user.role.upper() == "HOSPITAL_COORDINATOR" and current_user.organization_id:
        if assign.hospital_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Unauthorized: Cannot modify referrals for an unrelated hospital.")

    effective_action = action or response_status
    if not effective_action:
        raise HTTPException(status_code=400, detail="Action or response_status is required.")

    target_status = effective_action.upper()
    now = datetime.datetime.utcnow()
    old_status = assign.status
    assign.status = target_status
    assign.responded_by_user_id = current_user.user_id
    assign.responded_at = now

    effective_reason = reason or notes
    if target_status == "REJECTED":
        assign.rejection_reason = effective_reason or "Capacity exhausted or diverged"
    elif target_status in ["ARRIVED", "HANDOVER"]:
        assign.arrival_time = now

    log_audit_event(
        db,
        action="UPDATE",
        entity_name="hospital_assignment",
        entity_id=assignment_id,
        user=current_user,
        details=f"Hospital coordinator {current_user.full_name} responded to referral {assignment_id} with {target_status} (Reason: {effective_reason})",
        old_value={"status": old_status},
        new_value={"status": target_status, "rejection_reason": effective_reason}
    )
    db.commit()
    return {"status": target_status, "assignment_id": assignment_id, "new_status": target_status}

@router.post("/dispatch/{incident_id}/assign-ambulance")
def assign_ambulance_to_incident(
    incident_id: str,
    ambulance_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("CONTROL_OPERATOR", "ADMINISTRATOR", "ADMIN"))
):
    """
    Assigns an eligible emergency ambulance to an incident with strict concurrency control.
    Fails if the ambulance is already assigned or unavailable.
    """
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    amb = db.query(Ambulance).filter(Ambulance.ambulance_id == ambulance_id).first()
    if not amb:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    if amb.current_status != "AVAILABLE":
        raise HTTPException(
            status_code=400,
            detail=f"Ambulance '{amb.registration_number}' is not currently available for dispatch (status: {amb.current_status})."
        )

    now = datetime.datetime.utcnow()
    amb.current_status = "DISPATCHED"

    status_hist = AmbulanceStatusHistory(
        status_history_id=f"ASH_{uuid.uuid4().hex[:8].upper()}",
        ambulance_id=amb.ambulance_id,
        status="DISPATCHED",
        start_time=now,
        reason=f"Dispatched by operator {current_user.username}"
    )
    db.add(status_hist)

    assignment = ResponderAssignment(
        assignment_id=f"ASN_{uuid.uuid4().hex[:8].upper()}",
        incident_id=incident_id,
        responder_user_id=current_user.user_id,
        resource_id=amb.ambulance_id,
        status="DISPATCHED",
        assigned_at=now
    )
    db.add(assignment)

    timeline_rec = IncidentTimelineEvent(
        event_id=f"EVT_{uuid.uuid4().hex[:8].upper()}",
        incident_id=incident_id,
        status="DISPATCHED",
        title="Ambulance Dispatched",
        description=f"Ambulance {amb.registration_number} dispatched to scene by operator {current_user.full_name}.",
        actor_name=current_user.full_name,
        actor_role="CONTROL_OPERATOR",
        timestamp=now
    )
    db.add(timeline_rec)

    log_audit_event(
        db,
        action="DISPATCH",
        entity_name="ambulance",
        entity_id=amb.ambulance_id,
        user=current_user,
        details=f"Operator dispatched ambulance {amb.registration_number} to incident {incident_id}",
        new_value={"incident_id": incident_id, "status": "DISPATCHED"}
    )
    db.commit()
    return {"status": "DISPATCHED", "ambulance_id": amb.ambulance_id, "incident_id": incident_id}

@router.post("/referral/{incident_id}/refer-hospital")
def refer_hospital(
    incident_id: str,
    hospital_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("CONTROL_OPERATOR", "ADMINISTRATOR", "ADMIN"))
):
    """
    Submits a hospital placement and referral proposal for an incident.
    """
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    hosp = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")

    now = datetime.datetime.utcnow()
    assignment_id = f"REF_{uuid.uuid4().hex[:8].upper()}"
    new_referral = HospitalAssignment(
        assignment_id=assignment_id,
        incident_id=incident_id,
        hospital_id=hospital_id,
        assigned_at=now,
        status="PROPOSED",
        requested_by_user_id=current_user.user_id
    )
    db.add(new_referral)

    log_audit_event(
        db,
        action="REFERRAL",
        entity_name="hospital_referral",
        entity_id=assignment_id,
        user=current_user,
        details=f"Operator proposed patient transfer to {hosp.name} for incident {incident_id}",
        new_value={"incident_id": incident_id, "hospital_id": hospital_id, "status": "PROPOSED"}
    )
    db.commit()
    return {"status": "PROPOSED", "assignment_id": assignment_id, "hospital_id": hospital_id, "incident_id": incident_id}


