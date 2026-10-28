import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Numeric, Boolean, 
    DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base

class Organization(Base):
    __tablename__ = "organization"
    
    organization_id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    org_type = Column(String(32), nullable=False)  # HOSPITAL, AMBULANCE_PROVIDER, DISPATCH_CENTER, POLICE, FIRE_RESCUE
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    
    members = relationship("UserAccount", back_populates="organization")

class UserAccount(Base):
    __tablename__ = "user_account"
    
    user_id = Column(String(64), primary_key=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    # Supported roles: ADMINISTRATOR, CONTROL_OPERATOR, HOSPITAL_COORDINATOR, FIELD_RESPONDER, ANALYST, REPORTER
    role = Column(String(32), nullable=False, default="CONTROL_OPERATOR")
    organization_id = Column(String(64), ForeignKey("organization.organization_id", ondelete="SET NULL"), nullable=True, index=True)
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(32), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    
    # Firebase Identity & Provisioning Lifecycle
    firebase_uid = Column(String(128), unique=True, nullable=True, index=True)
    approval_status = Column(String(32), default="APPROVED", nullable=False, index=True)  # PENDING_APPROVAL, APPROVED, SUSPENDED, REJECTED
    approval_notes = Column(Text, nullable=True)
    approved_by_user_id = Column(String(64), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    organization = relationship("Organization", back_populates="members")
    reported_incidents = relationship("Incident", back_populates="reporter", foreign_keys="Incident.reporter_id")
    assigned_responses = relationship("ResponderAssignment", back_populates="responder")

class AuditLog(Base):
    __tablename__ = "audit_log"
    
    log_id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=True, index=True)
    username = Column(String(100), nullable=True)
    user_role = Column(String(32), nullable=True)
    action = Column(String(32), nullable=False, index=True)  # CREATE, UPDATE, DELETE, DISPATCH, ALLOCATE, REPORT, VERIFY, REJECT, ASSIGN, ACKNOWLEDGE, ARRIVE
    entity_name = Column(String(64), nullable=False, index=True)  # HOSPITAL, INCIDENT, AMBULANCE, USER, ORGANIZATION, etc.
    entity_id = Column(String(64), nullable=False, index=True)
    details = Column(Text, nullable=True)
    old_value_json = Column(JSON, nullable=True)
    new_value_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False, index=True)

class Incident(Base):
    __tablename__ = "incident"
    
    incident_id = Column(String(64), primary_key=True)
    tracking_code = Column(String(32), unique=True, nullable=True, index=True)
    tracking_token = Column(String(64), nullable=True)  # Secret guest credential
    reporter_id = Column(String(64), ForeignKey("user_account.user_id", ondelete="SET NULL"), nullable=True, index=True)
    reporter_name = Column(String(150), nullable=True)
    reporter_phone = Column(String(32), nullable=True)
    reporter_consent = Column(Boolean, default=True, nullable=False)
    
    incident_type = Column(String(64), nullable=False)  # ROAD_ACCIDENT, COLLAPSE, UNCONSCIOUS, BREATHING_DISTRESS, TRAUMA_INJURY, CARDIAC, FIRE_HAZARD, OTHER
    description = Column(Text, nullable=False)
    severity = Column(String(16), nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    latitude = Column(Float, nullable=True, default=0.0)
    longitude = Column(Float, nullable=True, default=0.0)
    location_accuracy_meters = Column(Float, nullable=True)
    is_location_verified = Column(Boolean, default=False, nullable=False)
    
    # Structured Geographic Model
    country = Column(String(64), default="India", nullable=False)
    state = Column(String(64), default="Andhra Pradesh", nullable=False)
    district = Column(String(64), default="Tirupati", nullable=False)
    city = Column(String(64), default="Tirupati", nullable=False)
    locality = Column(String(100), nullable=True)
    landmark = Column(String(150), nullable=True)
    location_name = Column(String(255), nullable=False)
    
    occurred_at = Column(DateTime(timezone=True), nullable=False, index=True)
    reported_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    # Valid Lifecycle: DRAFT, SUBMITTED, RECEIVED, UNDER_REVIEW, VERIFIED, RESPONSE_REQUESTED, RESOURCE_ACKNOWLEDGED, ASSIGNED, EN_ROUTE, ARRIVED, RESOLVED, CANCELLED, UNABLE_TO_COORDINATE
    status = Column(String(32), default="RECEIVED", nullable=False, index=True)
    estimated_patient_count = Column(Integer, default=1, nullable=False)
    
    # Evidence & Voice Recording
    voice_transcript = Column(Text, nullable=True)
    detected_language = Column(String(32), nullable=True)
    structured_extraction_json = Column(JSON, nullable=True)
    evidence_urls_json = Column(JSON, nullable=True)  # [{url, type, name, uploaded_at}]
    timeline_events_json = Column(JSON, nullable=True)  # Fast cache of timeline events
    linked_duplicate_id = Column(String(64), nullable=True, index=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Operational Readiness & Idempotency
    idempotency_key = Column(String(128), unique=True, nullable=True, index=True)
    readiness_score = Column(Float, nullable=True)
    readiness_details_json = Column(JSON, nullable=True)
    hazards_reported = Column(Text, nullable=True)
    injuries_reported = Column(Text, nullable=True)
    operator_notes = Column(Text, nullable=True)
    
    # Incident PDF Document Lifecycle
    pdf_status = Column(String(32), default="PENDING", nullable=False)  # PENDING, GENERATING, READY, FAILED_RETRYABLE
    pdf_path = Column(String(255), nullable=True)
    pdf_version = Column(Integer, default=1, nullable=False)
    pdf_generated_at = Column(DateTime(timezone=True), nullable=True)
    pdf_hash = Column(String(64), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    
    reporter = relationship("UserAccount", back_populates="reported_incidents", foreign_keys=[reporter_id])
    patients = relationship("Patient", back_populates="incident", cascade="all, delete-orphan")
    allocations = relationship("ResourceAllocation", back_populates="incident", cascade="all, delete-orphan")
    assignments = relationship("HospitalAssignment", back_populates="incident", cascade="all, delete-orphan")
    timeline_records = relationship("IncidentTimelineEvent", back_populates="incident", cascade="all, delete-orphan")
    responder_assignments = relationship("ResponderAssignment", back_populates="incident", cascade="all, delete-orphan")

class IncidentTimelineEvent(Base):
    __tablename__ = "incident_timeline_event"
    
    event_id = Column(String(64), primary_key=True)
    incident_id = Column(String(64), ForeignKey("incident.incident_id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(32), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    actor_name = Column(String(100), nullable=True)
    actor_role = Column(String(32), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False, index=True)
    
    incident = relationship("Incident", back_populates="timeline_records")

class ResponderAssignment(Base):
    __tablename__ = "responder_assignment"
    
    assignment_id = Column(String(64), primary_key=True)
    incident_id = Column(String(64), ForeignKey("incident.incident_id", ondelete="CASCADE"), nullable=False, index=True)
    responder_user_id = Column(String(64), ForeignKey("user_account.user_id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(String(64), nullable=True)  # Ambulance ID or Team ID
    status = Column(String(32), default="REQUESTED", nullable=False)  # REQUESTED, ACKNOWLEDGED, DECLINED, EN_ROUTE, ARRIVED, COMPLETED
    decline_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    assigned_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    en_route_at = Column(DateTime(timezone=True), nullable=True)
    arrived_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    incident = relationship("Incident", back_populates="responder_assignments")
    responder = relationship("UserAccount", back_populates="assigned_responses")

class Hospital(Base):
    __tablename__ = "hospital"
    
    hospital_id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    hospital_type = Column(String(64), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    emergency_level = Column(String(16), nullable=False)  # LEVEL_1, LEVEL_2, LEVEL_3, COMMUNITY
    contact_placeholder = Column(String(100), nullable=False)
    status = Column(String(32), default="ACTIVE", nullable=False)  # ACTIVE, OVERWHELMED, EVACUATING, INACTIVE
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    
    capacities = relationship("HospitalCapacityHistory", back_populates="hospital", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="hospital", cascade="all, delete-orphan")
    stationed_ambulances = relationship("Ambulance", back_populates="home_hospital")
    emergency_teams = relationship("EmergencyTeam", back_populates="home_hospital")

class Patient(Base):
    __tablename__ = "patient"
    
    patient_id = Column(String(64), primary_key=True)
    incident_id = Column(String(64), ForeignKey("incident.incident_id", ondelete="CASCADE"), nullable=False, index=True)
    severity = Column(String(16), nullable=False)  # CRITICAL, SERIOUS, MODERATE, MINOR
    age = Column(Integer, nullable=True)
    required_resource = Column(String(64), nullable=False)  # ICU_BED, EMERGENCY_BED, VENTILATOR, etc.
    assigned_hospital_id = Column(String(64), ForeignKey("hospital.hospital_id", ondelete="SET NULL"), nullable=True, index=True)
    transport_status = Column(String(32), default="AWAITING_TRIAGE", nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    
    incident = relationship("Incident", back_populates="patients")
    assigned_hospital = relationship("Hospital")

class Ambulance(Base):
    __tablename__ = "ambulance"
    
    ambulance_id = Column(String(64), primary_key=True)
    registration_number = Column(String(32), unique=True, nullable=False)
    ambulance_type = Column(String(32), nullable=False)  # ALS, BLS, NEONATAL, HAZMAT_PARAMEDIC
    capacity = Column(Integer, default=1, nullable=False)
    home_hospital_id = Column(String(64), ForeignKey("hospital.hospital_id", ondelete="SET NULL"), nullable=True)
    current_status = Column(String(32), default="AVAILABLE", nullable=False, index=True)  # AVAILABLE, DISPATCHED, TRANSPORTING, MAINTENANCE, OFFLINE
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    
    home_hospital = relationship("Hospital", back_populates="stationed_ambulances")
    locations = relationship("AmbulanceLocationHistory", back_populates="ambulance", cascade="all, delete-orphan")
    statuses = relationship("AmbulanceStatusHistory", back_populates="ambulance", cascade="all, delete-orphan")

class AmbulanceLocationHistory(Base):
    __tablename__ = "ambulance_location_history"
    
    location_id = Column(String(64), primary_key=True)
    ambulance_id = Column(String(64), ForeignKey("ambulance.ambulance_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, default=0.0, nullable=False)
    status = Column(String(32), nullable=False)
    
    ambulance = relationship("Ambulance", back_populates="locations")

class AmbulanceStatusHistory(Base):
    __tablename__ = "ambulance_status_history"
    
    status_history_id = Column(String(64), primary_key=True)
    ambulance_id = Column(String(64), ForeignKey("ambulance.ambulance_id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(32), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    reason = Column(Text, nullable=True)
    
    ambulance = relationship("Ambulance", back_populates="statuses")

class HospitalCapacityHistory(Base):
    __tablename__ = "hospital_capacity_history"
    
    capacity_history_id = Column(String(64), primary_key=True)
    hospital_id = Column(String(64), ForeignKey("hospital.hospital_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    icu_total = Column(Integer, nullable=False)
    icu_available = Column(Integer, nullable=False)
    emergency_beds_total = Column(Integer, nullable=False)
    emergency_beds_available = Column(Integer, nullable=False)
    general_beds_total = Column(Integer, nullable=False)
    general_beds_available = Column(Integer, nullable=False)
    
    hospital = relationship("Hospital", back_populates="capacities")

class Resource(Base):
    __tablename__ = "resource"
    
    resource_id = Column(String(64), primary_key=True)
    hospital_id = Column(String(64), ForeignKey("hospital.hospital_id", ondelete="CASCADE"), nullable=False, index=True)
    resource_type = Column(String(64), nullable=False)  # BLOOD_O_NEG, VENTILATOR, OXYGEN_CYLINDERS, etc.
    total_quantity = Column(Integer, nullable=False)
    available_quantity = Column(Integer, nullable=False)
    critical_threshold = Column(Integer, nullable=False)
    status = Column(String(32), default="ADEQUATE", nullable=False)  # ADEQUATE, LOW, CRITICAL, DEPLETED
    
    hospital = relationship("Hospital", back_populates="resources")
    history = relationship("ResourceHistory", back_populates="resource", cascade="all, delete-orphan")

class ResourceHistory(Base):
    __tablename__ = "resource_history"
    
    resource_history_id = Column(String(64), primary_key=True)
    resource_id = Column(String(64), ForeignKey("resource.resource_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    quantity_available = Column(Integer, nullable=False)
    change_amount = Column(Integer, nullable=False)
    change_reason = Column(Text, nullable=False)
    
    resource = relationship("Resource", back_populates="history")

class Road(Base):
    __tablename__ = "road"
    
    road_id = Column(String(64), primary_key=True)
    road_name = Column(String(255), nullable=False)
    source_location = Column(String(255), nullable=False)
    destination_location = Column(String(255), nullable=False)
    distance_km = Column(Float, nullable=False)
    road_type = Column(String(32), nullable=False)  # EXPRESSWAY, ARTERIAL_HIGHWAY, etc.
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lng = Column(Float, nullable=False)
    
    statuses = relationship("RoadStatusHistory", back_populates="road", cascade="all, delete-orphan")

class RoadStatusHistory(Base):
    __tablename__ = "road_status_history"
    
    road_status_id = Column(String(64), primary_key=True)
    road_id = Column(String(64), ForeignKey("road.road_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    traffic_level = Column(String(16), nullable=False)  # LOW, MEDIUM, HIGH, SEVERE
    average_speed = Column(Float, nullable=False)
    blocked = Column(Boolean, default=False, nullable=False, index=True)
    
    road = relationship("Road", back_populates="statuses")

class EmergencyTeam(Base):
    __tablename__ = "emergency_team"
    
    team_id = Column(String(64), primary_key=True)
    team_name = Column(String(255), nullable=False)
    specialization = Column(String(64), nullable=False)  # TRAUMA_SURGICAL, HAZMAT_DECONTAMINATION, etc.
    capacity = Column(Integer, default=5, nullable=False)
    home_hospital_id = Column(String(64), ForeignKey("hospital.hospital_id", ondelete="SET NULL"), nullable=True)
    status = Column(String(32), default="AVAILABLE", nullable=False)  # AVAILABLE, DEPLOYED, STANDBY, RESTING
    
    home_hospital = relationship("Hospital", back_populates="emergency_teams")
    statuses = relationship("TeamStatusHistory", back_populates="team", cascade="all, delete-orphan")

class TeamStatusHistory(Base):
    __tablename__ = "team_status_history"
    
    team_status_id = Column(String(64), primary_key=True)
    team_id = Column(String(64), ForeignKey("emergency_team.team_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(String(32), nullable=False)
    
    team = relationship("EmergencyTeam", back_populates="statuses")

class ResourceAllocation(Base):
    __tablename__ = "resource_allocation"
    
    allocation_id = Column(String(64), primary_key=True)
    incident_id = Column(String(64), ForeignKey("incident.incident_id", ondelete="CASCADE"), nullable=False, index=True)
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(64), nullable=False)
    allocated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    released_at = Column(DateTime(timezone=True), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    status = Column(String(32), default="ACTIVE", nullable=False)  # REQUESTED, ACTIVE, COMPLETED, CANCELLED, RELEASED
    
    incident = relationship("Incident", back_populates="allocations")

class HospitalAssignment(Base):
    __tablename__ = "hospital_assignment"
    
    assignment_id = Column(String(64), primary_key=True)
    incident_id = Column(String(64), ForeignKey("incident.incident_id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(String(64), ForeignKey("patient.patient_id", ondelete="CASCADE"), nullable=True)
    hospital_id = Column(String(64), ForeignKey("hospital.hospital_id", ondelete="RESTRICT"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    arrival_time = Column(DateTime(timezone=True), nullable=True)
    # Referral lifecycle: PROPOSED, SENT, ACCEPTED, REJECTED, EXPIRED, CONFIRMED, DISPATCHED, ADMITTED, ARRIVED, HANDOVER, COMPLETED
    status = Column(String(32), default="DISPATCHED", nullable=False)
    requested_by_user_id = Column(String(64), nullable=True)
    responded_by_user_id = Column(String(64), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    incident = relationship("Incident", back_populates="assignments")
    patient = relationship("Patient")
    hospital = relationship("Hospital")

class SimulationScenario(Base):
    __tablename__ = "simulation_scenario"
    
    scenario_id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    incident_type = Column(String(64), nullable=False)
    patient_count = Column(Integer, nullable=False)
    severity = Column(String(16), nullable=False)
    disabled_hospital_ids = Column(Text, default="", nullable=False)
    blocked_road_ids = Column(Text, default="", nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

class SimulationResult(Base):
    __tablename__ = "simulation_result"
    
    result_id = Column(String(64), primary_key=True)
    scenario_id = Column(String(64), ForeignKey("simulation_scenario.scenario_id", ondelete="CASCADE"), nullable=False)
    total_patients = Column(Integer, nullable=False)
    allocated_patients = Column(Integer, nullable=False)
    unallocated_patients = Column(Integer, nullable=False)
    icu_allocated = Column(Integer, nullable=False)
    emergency_beds_allocated = Column(Integer, nullable=False)
    average_eta_minutes = Column(Float, nullable=False)
    allocation_plan_json = Column(JSON, nullable=False)
    execution_time_ms = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

class TranscriptionJob(Base):
    __tablename__ = "transcription_job"
    
    job_id = Column(String(64), primary_key=True)
    audio_path = Column(String(255), nullable=False)
    audio_file_url = Column(String(255), nullable=True)
    status = Column(String(32), default="PENDING", nullable=False, index=True)  # PENDING, TRANSCRIBING, COMPLETED, FAILED_RETRYABLE, FAILED_FINAL
    provider = Column(String(64), default="GOOGLE_SPEECH", nullable=False)
    transcript = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    detected_language = Column(String(32), default="en-US", nullable=True)
    structured_extraction_json = Column(JSON, nullable=True)
    incident_id = Column(String(64), ForeignKey("incident.incident_id", ondelete="SET NULL"), nullable=True, index=True)
    retry_count = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)


# ------------------------------------------------------------------------------
# TERA Explore 2.0 & Road Safety Learning Models
# ------------------------------------------------------------------------------
class UserLearningProgress(Base):
    __tablename__ = "user_learning_progress"
    
    id = Column(String(64), primary_key=True)
    user_key = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("user_account.user_id", ondelete="SET NULL"), nullable=True, index=True)
    session_id = Column(String(100), nullable=True, index=True)
    username = Column(String(150), default="Safety Explorer (Citizen)", nullable=False)
    total_xp = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    level_title = Column(String(64), default="Defensive Scout", nullable=False)
    quizzes_completed = Column(Integer, default=0, nullable=False)
    quiz_accuracy_pct = Column(Float, default=0.0, nullable=False)
    games_completed = Column(Integer, default=0, nullable=False)
    lessons_read = Column(Integer, default=0, nullable=False)
    case_studies_completed = Column(Integer, default=0, nullable=False)
    streak_days = Column(Integer, default=1, nullable=False)
    pledge_signed = Column(Boolean, default=False, nullable=False)
    pledge_name = Column(String(150), nullable=True)
    last_activity_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)


class ActivityCompletion(Base):
    __tablename__ = "activity_completion"
    
    completion_id = Column(String(64), primary_key=True)
    user_key = Column(String(100), nullable=False, index=True)
    activity_type = Column(String(32), nullable=False, index=True)  # "LESSON", "QUIZ", "HAZARD_GAME", "SCENARIO", "CASE_STUDY", "FAMILY_CHALLENGE", "DAILY_CHALLENGE", "MEMORY_GAME", "JOURNEY_GAME", "PLEDGE"
    activity_id = Column(String(100), nullable=False, index=True)
    score = Column(Float, default=100.0, nullable=False)
    passed = Column(Boolean, default=True, nullable=False)
    xp_awarded = Column(Integer, default=0, nullable=False)
    idempotency_key = Column(String(128), unique=True, index=True, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    completed_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)


class UserBadge(Base):
    __tablename__ = "user_badge"
    
    badge_award_id = Column(String(64), primary_key=True)
    user_key = Column(String(100), nullable=False, index=True)
    badge_id = Column(String(64), nullable=False, index=True)
    badge_title = Column(String(150), nullable=False)
    badge_category = Column(String(64), nullable=False)
    xp_reward = Column(Integer, default=50, nullable=False)
    reason = Column(String(255), nullable=True)
    earned_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    idempotency_key = Column(String(128), unique=True, index=True, nullable=False)

