import os
import datetime
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database.session import get_db
from app.models.models import (
    Incident, Patient, UserAccount, IncidentTimelineEvent, ResponderAssignment, ResourceAllocation
)
from app.schemas.schemas import (
    IncidentCreate, IncidentUpdate, IncidentResponse, 
    PatientCreate, PatientResponse, EmergencyReportRequest, EmergencyReportReceipt,
    PublicTrackIncidentResponse, TimelineEventCreate,
    ResponderAssignmentCreate, ResponderAssignmentUpdate
)
from app.api.auth import get_current_user, require_role
from app.services.audit_service import log_audit_event
from app.services.readiness_service import calculate_operational_readiness_score
from app.services.pdf_service import generate_incident_pdf

router = APIRouter(prefix="/incidents", tags=["Incidents & Reporting"])

def build_incident_pdf_payload(inc: Incident, db: Session) -> Dict[str, Any]:
    allocs = db.query(ResourceAllocation).filter(ResourceAllocation.incident_id == inc.incident_id).all()
    alloc_list = [
        {
            "allocation_id": a.allocation_id,
            "resource_type": a.resource_type,
            "resource_id": a.resource_id,
            "status": a.status,
            "quantity": a.quantity
        }
        for a in allocs
    ]
    return {
        "incident_id": inc.incident_id,
        "tracking_code": inc.tracking_code,
        "status": inc.status,
        "severity": inc.severity,
        "incident_type": inc.incident_type,
        "reported_at": inc.reported_at,
        "occurred_at": inc.occurred_at,
        "latitude": inc.latitude,
        "longitude": inc.longitude,
        "location_accuracy_meters": inc.location_accuracy_meters,
        "is_location_verified": inc.is_location_verified,
        "location_name": inc.location_name,
        "landmark": inc.landmark,
        "locality": inc.locality,
        "city": inc.city,
        "district": inc.district,
        "state": inc.state,
        "country": inc.country,
        "description": inc.description,
        "injuries_reported": inc.injuries_reported,
        "hazards_reported": inc.hazards_reported,
        "estimated_patient_count": inc.estimated_patient_count,
        "voice_transcript": inc.voice_transcript,
        "detected_language": inc.detected_language,
        "structured_extraction_json": inc.structured_extraction_json,
        "evidence_urls_json": inc.evidence_urls_json,
        "reporter_name": inc.reporter_name,
        "reporter_phone": inc.reporter_phone,
        "reporter_id": inc.reporter_id,
        "reporter_consent": inc.reporter_consent,
        "readiness_score": inc.readiness_score,
        "readiness_details_json": inc.readiness_details_json,
        "allocations": alloc_list,
        "timeline_events_json": inc.timeline_events_json,
        "pdf_version": getattr(inc, "pdf_version", 1) or 1
    }

def try_generate_pdf_for_incident(inc: Incident, db: Session) -> None:
    try:
        os.makedirs(settings.PDF_STORAGE_DIR, exist_ok=True)
        pdf_filename = f"TERA_Report_{inc.incident_id}_v{inc.pdf_version or 1}.pdf"
        target_path = os.path.join(settings.PDF_STORAGE_DIR, pdf_filename)
        data = build_incident_pdf_payload(inc, db)
        pdf_res = generate_incident_pdf(data, target_path)
        inc.pdf_status = "READY"
        inc.pdf_path = target_path
        inc.pdf_hash = pdf_res.get("pdf_hash")
        inc.pdf_generated_at = datetime.datetime.utcnow()
        db.commit()
    except Exception as e:
        inc.pdf_status = "FAILED_RETRYABLE"
        db.commit()


VALID_TRANSITIONS = {
    "DRAFT": ["SUBMITTED", "CANCELLED"],
    "SUBMITTED": ["RECEIVED", "CANCELLED"],
    "RECEIVED": ["UNDER_REVIEW", "VERIFIED", "REJECTED", "CANCELLED"],
    "UNDER_REVIEW": ["VERIFIED", "REJECTED", "CANCELLED"],
    "VERIFIED": ["RESPONSE_REQUESTED", "ASSIGNED", "ACTIVE", "CANCELLED", "REJECTED"],
    "RESPONSE_REQUESTED": ["RESOURCE_ACKNOWLEDGED", "ASSIGNED", "ACTIVE", "CANCELLED"],
    "RESOURCE_ACKNOWLEDGED": ["ASSIGNED", "EN_ROUTE", "ACTIVE", "CANCELLED"],
    "ASSIGNED": ["EN_ROUTE", "ARRIVED", "ACTIVE", "CANCELLED"],
    "EN_ROUTE": ["ARRIVED", "ACTIVE", "CANCELLED"],
    "ARRIVED": ["RESOLVED", "ACTIVE", "CANCELLED"],
    "ACTIVE": ["CONTAINED", "RESOLVED", "CANCELLED"],
    "CONTAINED": ["RESOLVED", "ACTIVE"],
    "RESOLVED": ["ACTIVE"],
    "REJECTED": ["RECEIVED", "UNDER_REVIEW"],
    "CANCELLED": ["RECEIVED"]
}

FIRST_AID_GUIDES: Dict[str, List[str]] = {
    "ROAD_ACCIDENT": [
        "1. Ensure Scene Safety: Turn on vehicle hazard lights; do not step into oncoming traffic.",
        "2. Do Not Move Casualties: Keep the injured person still unless there is an imminent threat of fire or explosion.",
        "3. Check for Breathing: Look for chest rise. If unresponsive and not breathing, begin continuous chest compressions immediately.",
        "4. Control Severe Bleeding: Apply firm, uninterrupted direct pressure to wounds using a clean cloth.",
        "5. Keep Warm & Calm: Cover the casualty with a jacket or blanket to prevent shock while response teams are dispatched."
    ],
    "COLLAPSE": [
        "1. Check Responsiveness: Gently tap shoulders and speak loudly: 'Are you okay?'.",
        "2. Call Out for Help: Ask any bystander to locate an Automated External Defibrillator (AED).",
        "3. Check Breathing: Look, listen, and feel for normal breathing for no more than 10 seconds.",
        "4. Begin Hands-Only CPR: If unresponsive and not breathing, push hard and fast in the center of the chest (100-120 bpm).",
        "5. Recovery Position: If breathing normally, roll them gently onto their side to keep the airway clear."
    ],
    "UNCONSCIOUS": [
        "1. Airway Check: Tilt the head back gently and lift the chin to open the airway.",
        "2. Monitor Breathing: Keep checking for continuous regular breaths.",
        "3. No Oral Fluids: Never attempt to give water, food, or medication to an unconscious individual.",
        "4. Prepare for CPR: If breathing stops or turns to gasping, begin chest compressions immediately."
    ],
    "BREATHING_DISTRESS": [
        "1. Position Upright: Help the person sit upright leaning slightly forward; avoid lying them down.",
        "2. Loosen Tight Clothing: Undo tight collars, neckties, or restrictive belts.",
        "3. Assist with Medication: If the person has a prescribed rescue inhaler, assist them in taking it.",
        "4. Keep Calm: Speak in a steady, reassuring tone and ensure adequate ventilation."
    ],
    "TRAUMA_INJURY": [
        "1. Direct Pressure: Apply steady, continuous pressure to any bleeding area with clean cloth or gauze.",
        "2. Do Not Remove Embedded Objects: Stabilize large impaled objects with rolled bandages around them.",
        "3. Immobilize Fractures: Do not attempt to realign deformed bones or joints."
    ],
    "FIRE_HAZARD": [
        "1. Evacuate Immediately: Move upwind from smoke and flames; stay low to avoid smoke inhalation.",
        "2. Stop, Drop & Roll: If clothing catches fire, drop to the floor and roll back and forth.",
        "3. Cool Burns: Hold minor thermal burns under cool running water for 10-15 minutes. Never apply ice directly."
    ]
}

def get_default_first_aid(incident_type: str) -> List[str]:
    return FIRST_AID_GUIDES.get(incident_type.upper(), [
        "1. Stay Safe: Ensure your own immediate safety before attempting to assist others.",
        "2. Keep the Line Open: An emergency control operator will review your report shortly.",
        "3. Monitor Vital Signs: Observe if the affected person is conscious and breathing normally.",
        "4. Guide Responders: Send someone to the street entrance to wave down incoming emergency vehicles."
    ])

@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    reporter_id: Optional[str] = None,
    tracking_codes: Optional[str] = None,
    my_reports: bool = False,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Optional[UserAccount] = Depends(get_current_user)
):
    """
    Lists incidents from database.
    - If user has role 'REPORTER' or 'my_reports=True', enforces: WHERE reporter_id = current_user.user_id
    - If guest passes 'my_reports=True' with tracking_codes, filters by those tracking codes.
    - If guest passes 'my_reports=True' without tracking codes, returns an empty list [].
    - Operators, Administrators, and Analysts can view all incidents or filter.
    """
    query = db.query(Incident)
    
    if current_user and current_user.role.upper() == "REPORTER":
        query = query.filter(Incident.reporter_id == current_user.user_id)
    elif my_reports:
        if current_user:
            query = query.filter(Incident.reporter_id == current_user.user_id)
        elif tracking_codes:
            codes = [c.strip() for c in tracking_codes.split(",") if c.strip()]
            if codes:
                query = query.filter(Incident.tracking_code.in_(codes))
            else:
                return []
        else:
            return []
    elif reporter_id:
        query = query.filter(Incident.reporter_id == reporter_id)

    if status:
        query = query.filter(Incident.status == status.upper())
    if severity:
        query = query.filter(Incident.severity == severity.upper())
        
    return query.order_by(Incident.occurred_at.desc()).limit(limit).all()

@router.get("/track/{tracking_code}", response_model=PublicTrackIncidentResponse)
def track_incident_public(tracking_code: str, db: Session = Depends(get_db)):
    """
    Public guest tracking endpoint. Does not require login.
    Returns real persisted status, event timeline, and medically reviewed first-aid guidance.
    """
    inc = db.query(Incident).filter(Incident.tracking_code == tracking_code.strip()).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracking code not found. Please verify the 8-character reference code on your report receipt."
        )
        
    # Build timeline from persisted records or JSON cache
    timeline = []
    if inc.timeline_records:
        for r in sorted(inc.timeline_records, key=lambda x: x.timestamp):
            timeline.append({
                "status": r.status,
                "title": r.title,
                "description": r.description,
                "actor_role": r.actor_role or "SYSTEM",
                "timestamp": r.timestamp.isoformat()
            })
    elif inc.timeline_events_json:
        timeline = inc.timeline_events_json
    else:
        timeline = [{
            "status": inc.status,
            "title": "Incident Logged",
            "description": "Report received and registered in emergency coordination system.",
            "actor_role": "SYSTEM",
            "timestamp": inc.reported_at.isoformat()
        }]
        
    guidance = get_default_first_aid(inc.incident_type)
    
    return {
        "tracking_code": inc.tracking_code,
        "incident_id": inc.incident_id,
        "incident_type": inc.incident_type,
        "location_name": inc.location_name,
        "city": inc.city,
        "severity": inc.severity,
        "status": inc.status,
        "reported_at": inc.reported_at,
        "updated_at": inc.updated_at,
        "estimated_patient_count": inc.estimated_patient_count,
        "timeline": timeline,
        "first_aid_guidance": guidance,
        "voice_transcript": inc.voice_transcript,
        "structured_extraction_json": inc.structured_extraction_json
    }

@router.post("/report", response_model=EmergencyReportReceipt)
def report_emergency_incident(
    data: EmergencyReportRequest,
    db: Session = Depends(get_db),
    current_user: Optional[UserAccount] = Depends(get_current_user)
):
    """
    Public Bystander / Citizen Emergency Reporting Endpoint.
    - Idempotency Protected: Retries with same key return existing persisted report.
    - Transparent Operational Readiness Scoring: Evaluates data completeness version 2.0.
    - Asynchronous / Non-blocking PDF Generation: Creates official incident report document.
    - Durable Persistence before returning success response.
    """
    # 1. Idempotency Check
    if data.idempotency_key and data.idempotency_key.strip():
        existing_inc = db.query(Incident).filter(Incident.idempotency_key == data.idempotency_key.strip()).first()
        if existing_inc:
            return {
                "incident_id": existing_inc.incident_id,
                "incident_type": existing_inc.incident_type,
                "location_name": existing_inc.location_name,
                "country": existing_inc.country,
                "state": existing_inc.state,
                "district": existing_inc.district,
                "city": existing_inc.city,
                "locality": existing_inc.locality,
                "landmark": existing_inc.landmark,
                "latitude": existing_inc.latitude,
                "longitude": existing_inc.longitude,
                "severity": existing_inc.severity,
                "estimated_patient_count": existing_inc.estimated_patient_count,
                "reported_at": existing_inc.reported_at,
                "status": existing_inc.status,
                "reporter_id": existing_inc.reporter_id,
                "tracking_code": existing_inc.tracking_code,
                "tracking_token": existing_inc.tracking_token or "",
                "message": "Emergency report previously registered in TERA (Idempotent replay).",
                "timeline_events": existing_inc.timeline_events_json or [],
                "voice_transcript": existing_inc.voice_transcript,
                "structured_extraction": existing_inc.structured_extraction_json,
                "readiness_score": existing_inc.readiness_score,
                "readiness_details": existing_inc.readiness_details_json,
                "pdf_status": existing_inc.pdf_status
            }

    # 2. Compute Operational Readiness Score
    has_audio = bool(data.voice_transcript and len(data.voice_transcript.strip()) > 5)
    has_photo = bool(data.evidence_urls and len(data.evidence_urls) > 0)
    readiness_assessment = calculate_operational_readiness_score(
        latitude=data.latitude,
        longitude=data.longitude,
        location_accuracy_meters=data.location_accuracy_meters,
        location_name=data.location_name or data.address or "Reported Location",
        landmark=data.landmark,
        description=data.description,
        incident_type=data.incident_type,
        estimated_patient_count=data.casualties if data.casualties is not None else data.estimated_patient_count,
        injuries_reported=data.injuries_reported,
        hazards_reported=data.hazards_reported,
        reporter_contact=data.reporter_contact or data.caller_phone,
        has_audio_transcript=has_audio,
        has_photo_evidence=has_photo
    )

    inc_id = f"INC_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:4].upper()}"
    occ_time = datetime.datetime.utcnow()
    tracking_code = f"TRK-{occ_time.strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    tracking_token = uuid.uuid4().hex
    rep_id = current_user.user_id if current_user else None

    initial_event = {
        "status": "RECEIVED",
        "title": "Report Submitted & Received",
        "description": "Emergency report successfully captured and placed in the EOC Control Operator triage queue.",
        "actor_role": "PUBLIC_REPORTER",
        "timestamp": occ_time.isoformat()
    }

    new_inc = Incident(
        incident_id=inc_id,
        tracking_code=tracking_code,
        tracking_token=tracking_token,
        reporter_id=rep_id,
        reporter_name=data.reporter_name or data.caller_name or (current_user.full_name if current_user else "Bystander Informant"),
        reporter_phone=data.reporter_contact or data.caller_phone,
        reporter_consent=data.reporter_consent,
        incident_type=data.incident_type.upper(),
        description=data.description,
        severity=data.severity.upper(),
        latitude=data.latitude,
        longitude=data.longitude,
        location_accuracy_meters=data.location_accuracy_meters,
        is_location_verified=data.is_location_verified,
        country=data.country or "India",
        state=data.state or "Andhra Pradesh",
        district=data.district or "Tirupati",
        city=data.city or "Tirupati",
        locality=data.locality,
        landmark=data.landmark,
        location_name=data.location_name or data.address or "Reported Location",
        occurred_at=occ_time,
        reported_at=occ_time,
        status="RECEIVED",
        estimated_patient_count=max(0, data.casualties if data.casualties is not None else data.estimated_patient_count),
        voice_transcript=data.voice_transcript,
        detected_language=data.detected_language or "en",
        structured_extraction_json=data.structured_extraction,
        evidence_urls_json=data.evidence_urls or [],
        timeline_events_json=[initial_event],
        idempotency_key=data.idempotency_key.strip() if data.idempotency_key else None,
        readiness_score=readiness_assessment["total_score"],
        readiness_details_json=readiness_assessment,
        hazards_reported=data.hazards_reported,
        injuries_reported=data.injuries_reported,
        pdf_status="PENDING",
        pdf_version=1,
        created_at=occ_time,
        updated_at=occ_time
    )
    db.add(new_inc)

    # Add initial persistent timeline record
    timeline_rec = IncidentTimelineEvent(
        event_id=f"EVT_{uuid.uuid4().hex[:8].upper()}",
        incident_id=inc_id,
        status="RECEIVED",
        title="Report Submitted & Received",
        description="Emergency report received and placed in EOC verification queue.",
        actor_name=new_inc.reporter_name,
        actor_role="PUBLIC_REPORTER",
        timestamp=occ_time
    )
    db.add(timeline_rec)

    log_audit_event(
        db,
        action="REPORT",
        entity_name="incident",
        entity_id=inc_id,
        user=current_user,
        details=f"Field emergency reported: {data.incident_type} at {data.location_name} (Tracking: {tracking_code}, Readiness: {readiness_assessment['total_score']}/100)",
        new_value={
            "type": data.incident_type, 
            "severity": data.severity, 
            "patients": data.estimated_patient_count, 
            "tracking_code": tracking_code,
            "readiness_score": readiness_assessment["total_score"]
        }
    )

    # Durably commit incident first!
    db.commit()
    db.refresh(new_inc)

    # 3. Non-blocking PDF Generation
    try_generate_pdf_for_incident(new_inc, db)

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
        "tracking_token": tracking_token,
        "message": "Emergency report successfully registered in TERA. Keep this tracking code to monitor real-time response status.",
        "timeline_events": [initial_event],
        "voice_transcript": new_inc.voice_transcript,
        "structured_extraction": new_inc.structured_extraction_json,
        "readiness_score": new_inc.readiness_score,
        "readiness_details": new_inc.readiness_details_json,
        "pdf_status": new_inc.pdf_status
    }


@router.post("", response_model=IncidentResponse)
def create_incident(
    data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR", "REPORTER"))
):
    inc_id = f"INC_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:4].upper()}"
    occ_time = data.occurred_at or datetime.datetime.utcnow()
    tracking_code = f"TRK-{occ_time.strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    tracking_token = uuid.uuid4().hex
    
    initial_event = {
        "status": "ACTIVE" if current_user.role in ["ADMINISTRATOR", "CONTROL_OPERATOR"] else "RECEIVED",
        "title": "Incident Initialized",
        "description": f"Incident logged by {current_user.full_name} ({current_user.role}).",
        "actor_role": current_user.role,
        "timestamp": occ_time.isoformat()
    }

    new_inc = Incident(
        incident_id=inc_id,
        tracking_code=tracking_code,
        tracking_token=tracking_token,
        reporter_id=current_user.user_id,
        reporter_name=current_user.full_name,
        reporter_consent=True,
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
        timeline_events_json=[initial_event],
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(new_inc)
    
    log_audit_event(
        db,
        action="CREATE",
        entity_name="incident",
        entity_id=inc_id,
        user=current_user,
        details=f"Created incident {data.incident_type} at {data.location_name} with {data.estimated_patient_count} estimated casualties",
        new_value={"type": data.incident_type, "severity": data.severity, "patients": data.estimated_patient_count}
    )
    
    db.commit()
    db.refresh(new_inc)
    return new_inc

@router.patch("/{incident_id}/status")
def transition_incident_status(
    incident_id: str,
    new_status: str = Query(...),
    notes: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    """
    EOC Control Operator lifecycle transition with auditable timeline event generation.
    """
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    old_status = inc.status
    target_status = new_status.upper()
    
    allowed_transitions = VALID_TRANSITIONS.get(old_status, [])
    if target_status not in allowed_transitions and old_status != target_status:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition: Cannot change from '{old_status}' to '{target_status}'. Allowed: {allowed_transitions}"
        )
        
    now = datetime.datetime.utcnow()
    inc.status = target_status
    inc.updated_at = now
    if notes:
        inc.resolution_notes = (inc.resolution_notes or "") + f"\n[{target_status}] {notes}"
        
    # Append timeline event
    title_map = {
        "UNDER_REVIEW": "Under Operator Review",
        "VERIFIED": "Incident Confirmed by EOC",
        "RESPONSE_REQUESTED": "Coordination Request Sent",
        "RESOURCE_ACKNOWLEDGED": "Resource Provider Acknowledged",
        "ASSIGNED": "Field Units Assigned",
        "EN_ROUTE": "Emergency Responders En Route",
        "ARRIVED": "First Responders on Scene",
        "RESOLVED": "Incident Resolved & Closed",
        "REJECTED": "Report Rejected",
        "CANCELLED": "Report Cancelled"
    }
    event_title = title_map.get(target_status, f"Status: {target_status}")
    event_desc = notes or f"Incident transitioned from {old_status} to {target_status} by EOC Operator {current_user.full_name}."
    
    evt = IncidentTimelineEvent(
        event_id=f"EVT_{uuid.uuid4().hex[:8].upper()}",
        incident_id=incident_id,
        status=target_status,
        title=event_title,
        description=event_desc,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        timestamp=now
    )
    db.add(evt)
    
    # Update cached timeline
    cached = inc.timeline_events_json or []
    cached.append({
        "status": target_status,
        "title": event_title,
        "description": event_desc,
        "actor_role": current_user.role,
        "timestamp": now.isoformat()
    })
    inc.timeline_events_json = cached
    
    log_audit_event(
        db,
        action="VERIFY" if target_status == "VERIFIED" else "STATUS_CHANGE",
        entity_name="incident",
        entity_id=incident_id,
        user=current_user,
        details=f"Incident {incident_id} changed from {old_status} to {target_status}: {event_desc}",
        old_value={"status": old_status},
        new_value={"status": target_status, "notes": notes}
    )
    
    db.commit()
    inc.pdf_version = (inc.pdf_version or 1) + 1
    try_generate_pdf_for_incident(inc, db)

    return {

        "status": "success",
        "incident_id": incident_id,
        "previous_status": old_status,
        "current_status": target_status,
        "message": f"Incident successfully transitioned to {target_status}."
    }

@router.post("/{incident_id}/link-duplicate")
def link_duplicate_incident(
    incident_id: str,
    master_incident_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    """
    Links a duplicate report to a primary/master incident while preserving both records.
    """
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    master = db.query(Incident).filter(Incident.incident_id == master_incident_id).first()
    
    if not inc or not master:
        raise HTTPException(status_code=404, detail="Incident or master incident not found")
        
    inc.linked_duplicate_id = master_incident_id
    inc.status = "CANCELLED"
    inc.resolution_notes = f"Linked as duplicate of master incident {master_incident_id}."
    inc.updated_at = datetime.datetime.utcnow()
    
    log_audit_event(
        db,
        action="UPDATE",
        entity_name="incident",
        entity_id=incident_id,
        user=current_user,
        details=f"Linked incident {incident_id} as duplicate of {master_incident_id}",
        new_value={"linked_duplicate_id": master_incident_id}
    )
    db.commit()
    return {"status": "success", "incident_id": incident_id, "linked_to": master_incident_id}

@router.delete("/{incident_id}")
def delete_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(require_role("ADMINISTRATOR", "CONTROL_OPERATOR"))
):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
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

@router.get("/{incident_id}/pdf")
def get_incident_pdf_document(
    incident_id: str,
    tracking_token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[UserAccount] = Depends(get_current_user)
):
    """
    Secure Incident PDF Document retrieval endpoint.
    - RBAC Protection: Control Operators, Hospital Coordinators, Responders, Analysts, Admins.
    - Public Guests: Accessible with matching secret tracking token from their report receipt.
    - Regenerates or updates report on the fly if document is missing or stale.
    - Sets safe content headers and file naming.
    """
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    is_authorized = False
    if current_user:
        if current_user.role.upper() in ["ADMINISTRATOR", "ADMIN", "CONTROL_OPERATOR", "ANALYST", "HOSPITAL_COORDINATOR", "FIELD_RESPONDER"]:
            is_authorized = True
        elif current_user.user_id == inc.reporter_id:
            is_authorized = True

    if not is_authorized and tracking_token and inc.tracking_token and inc.tracking_token == tracking_token.strip():
        is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Valid authenticated operator credentials or guest tracking token required to view official incident report."
        )

    # Check if PDF exists on disk; if not, generate now
    pdf_path = inc.pdf_path
    if not pdf_path or not os.path.exists(pdf_path):
        try_generate_pdf_for_incident(inc, db)
        pdf_path = inc.pdf_path

    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Incident PDF document could not be rendered at this time. Please retry shortly."
        )

    safe_filename = f"TERA_Incident_Report_{inc.incident_id}.pdf"
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=safe_filename,
        headers={
            "Content-Disposition": f"inline; filename=\"{safe_filename}\"",
            "Cache-Control": "private, no-cache, no-store, must-revalidate"
        }
    )

