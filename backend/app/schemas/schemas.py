import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ------------------------------------------------------------------------------
# Auth & User Management Schemas
# ------------------------------------------------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    full_name: str
    email: Optional[str] = None
    user_id: Optional[str] = None
    organization_id: Optional[str] = None
    is_active: Optional[bool] = True
    approval_status: Optional[str] = "APPROVED"
    firebase_uid: Optional[str] = None

class FirebaseLoginRequest(BaseModel):
    firebase_token: Optional[str] = None
    id_token: Optional[str] = None
    requested_role: Optional[str] = None
    role: Optional[str] = None
    phone_number: Optional[str] = None
    invitation_code: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None

    def get_token(self) -> str:
        return self.firebase_token or self.id_token or ""

    def get_role(self) -> Optional[str]:
        return self.requested_role or self.role

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "REPORTER"
    full_name: str
    invitation_code: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str
    role: str
    full_name: str
    is_active: bool
    created_at: datetime.datetime
    last_login_at: Optional[datetime.datetime] = None
    organization_id: Optional[str] = None
    phone_number: Optional[str] = None
    approval_status: Optional[str] = "APPROVED"
    firebase_uid: Optional[str] = None

    model_config = {"from_attributes": True}

class AuditLogResponse(BaseModel):
    log_id: str
    user_id: Optional[str] = None
    username: Optional[str] = None
    user_role: Optional[str] = None
    action: str
    entity_name: str
    entity_id: str
    details: Optional[str] = None
    old_value_json: Optional[Dict[str, Any]] = None
    new_value_json: Optional[Dict[str, Any]] = None
    timestamp: datetime.datetime

    model_config = {"from_attributes": True}

# ------------------------------------------------------------------------------
# Dashboard & Metrics Schemas
# ------------------------------------------------------------------------------
class EOCMetrics(BaseModel):
    active_incidents: int
    critical_patients: int
    available_ambulances: int
    total_ambulances: int
    available_icu_beds: int
    total_icu_beds: int
    available_emergency_beds: int
    total_emergency_beds: int
    active_emergency_teams: int
    total_emergency_teams: int
    resource_utilization_percent: float
    blocked_roads_count: int

class ResourceAlert(BaseModel):
    alert_id: str
    hospital_id: str
    hospital_name: str
    alert_type: str
    resource_type: str
    severity: str  # CRITICAL, WARNING, INFO
    message: str
    available_quantity: int
    critical_threshold: int
    generated_at: datetime.datetime

# ------------------------------------------------------------------------------
# Hospital Schemas
# ------------------------------------------------------------------------------
class HospitalCreate(BaseModel):
    name: str
    hospital_type: str
    latitude: float
    longitude: float
    emergency_level: str  # LEVEL_1, LEVEL_2, LEVEL_3, COMMUNITY
    contact_placeholder: str = "+91-877-2200000"
    status: str = "ACTIVE"
    icu_total: int = 15
    icu_available: int = 5
    emergency_beds_total: int = 40
    emergency_beds_available: int = 15
    general_beds_total: int = 100
    general_beds_available: int = 50

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    hospital_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    emergency_level: Optional[str] = None
    contact_placeholder: Optional[str] = None
    status: Optional[str] = None
    icu_total: Optional[int] = None
    icu_available: Optional[int] = None
    emergency_beds_total: Optional[int] = None
    emergency_beds_available: Optional[int] = None
    general_beds_total: Optional[int] = None
    general_beds_available: Optional[int] = None

class HospitalCapacityResponse(BaseModel):
    hospital_id: str
    name: str
    hospital_type: str
    latitude: float
    longitude: float
    emergency_level: str
    status: str
    icu_total: int
    icu_available: int
    emergency_beds_total: int
    emergency_beds_available: int
    general_beds_total: int
    general_beds_available: int
    icu_occupancy_percent: float
    emergency_occupancy_percent: float

    model_config = {"from_attributes": True}

# ------------------------------------------------------------------------------
# Incident & Patient Schemas
# ------------------------------------------------------------------------------
class PatientBase(BaseModel):
    severity: str
    age: Optional[int] = None
    required_resource: str
    transport_status: str = "AWAITING_TRIAGE"

class PatientCreate(PatientBase):
    incident_id: str

class PatientResponse(PatientBase):
    patient_id: str
    incident_id: str
    assigned_hospital_id: Optional[str] = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}

class IncidentCreate(BaseModel):
    incident_type: str
    description: str
    severity: str
    latitude: float
    longitude: float
    country: Optional[str] = "India"
    state: Optional[str] = "Andhra Pradesh"
    district: Optional[str] = "Tirupati"
    city: Optional[str] = "Tirupati"
    locality: Optional[str] = None
    landmark: Optional[str] = None
    location_name: str
    estimated_patient_count: int = 1
    occurred_at: Optional[datetime.datetime] = None

class EmergencyReportRequest(BaseModel):
    incident_type: str
    description: str
    severity: str = "CRITICAL"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = "India"
    state: Optional[str] = "Andhra Pradesh"
    district: Optional[str] = "Tirupati"
    city: Optional[str] = "Tirupati"
    locality: Optional[str] = None
    landmark: Optional[str] = None
    location_name: Optional[str] = "Reported Location"
    address: Optional[str] = None
    estimated_patient_count: int = 1
    casualties: Optional[int] = None
    reporter_name: Optional[str] = None
    caller_name: Optional[str] = None
    reporter_contact: Optional[str] = None
    caller_phone: Optional[str] = None
    reporter_consent: bool = True
    voice_transcript: Optional[str] = None
    detected_language: Optional[str] = "en"
    structured_extraction: Optional[Dict[str, Any]] = None
    location_accuracy_meters: Optional[float] = None
    is_location_verified: bool = False
    evidence_urls: Optional[List[Dict[str, Any]]] = None
    idempotency_key: Optional[str] = None
    injuries_reported: Optional[str] = None
    hazards_reported: Optional[str] = None


class EmergencyReportReceipt(BaseModel):
    incident_id: str
    incident_type: str
    location_name: str
    country: str = "India"
    state: str = "Andhra Pradesh"
    district: str = "Tirupati"
    city: str = "Tirupati"
    locality: Optional[str] = None
    landmark: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: str
    estimated_patient_count: int
    reported_at: datetime.datetime
    status: str = "RECEIVED"
    reporter_id: Optional[str] = None
    tracking_code: str
    tracking_token: str
    message: str
    timeline_events: List[Dict[str, Any]] = []
    voice_transcript: Optional[str] = None
    structured_extraction: Optional[Dict[str, Any]] = None
    readiness_score: Optional[float] = None
    readiness_details: Optional[Dict[str, Any]] = None
    pdf_status: Optional[str] = "PENDING"

class IncidentUpdate(BaseModel):
    incident_type: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    landmark: Optional[str] = None
    location_name: Optional[str] = None
    estimated_patient_count: Optional[int] = None
    linked_duplicate_id: Optional[str] = None
    resolution_notes: Optional[str] = None

class IncidentResponse(BaseModel):
    incident_id: str
    tracking_code: Optional[str] = None
    reporter_id: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None
    incident_type: str
    description: str
    severity: str
    latitude: float
    longitude: float
    location_accuracy_meters: Optional[float] = None
    is_location_verified: bool = False
    country: str = "India"
    state: str = "Andhra Pradesh"
    district: str = "Tirupati"
    city: str = "Tirupati"
    locality: Optional[str] = None
    landmark: Optional[str] = None
    location_name: str
    occurred_at: datetime.datetime
    reported_at: datetime.datetime
    status: str
    estimated_patient_count: int
    voice_transcript: Optional[str] = None
    detected_language: Optional[str] = None
    structured_extraction_json: Optional[Dict[str, Any]] = None
    evidence_urls_json: Optional[List[Dict[str, Any]]] = None
    timeline_events_json: Optional[List[Dict[str, Any]]] = None
    linked_duplicate_id: Optional[str] = None
    resolution_notes: Optional[str] = None
    idempotency_key: Optional[str] = None
    readiness_score: Optional[float] = None
    readiness_details_json: Optional[Dict[str, Any]] = None
    hazards_reported: Optional[str] = None
    injuries_reported: Optional[str] = None
    operator_notes: Optional[str] = None
    pdf_status: Optional[str] = "PENDING"
    pdf_path: Optional[str] = None
    pdf_version: Optional[int] = 1
    pdf_hash: Optional[str] = None
    patients: List[PatientResponse] = []
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}

class PublicTrackIncidentResponse(BaseModel):
    tracking_code: str
    incident_id: str
    incident_type: str
    location_name: str
    city: str
    severity: str
    status: str
    reported_at: datetime.datetime
    updated_at: datetime.datetime
    estimated_patient_count: int
    timeline: List[Dict[str, Any]] = []
    first_aid_guidance: List[str] = []
    voice_transcript: Optional[str] = None
    structured_extraction_json: Optional[Dict[str, Any]] = None

class TimelineEventCreate(BaseModel):
    status: str
    title: str
    description: str
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None

class ResponderAssignmentCreate(BaseModel):
    incident_id: str
    responder_user_id: str
    resource_id: Optional[str] = None
    notes: Optional[str] = None

class ResponderAssignmentUpdate(BaseModel):
    status: str  # ACKNOWLEDGED, DECLINED, EN_ROUTE, ARRIVED, COMPLETED
    decline_reason: Optional[str] = None
    notes: Optional[str] = None

# ------------------------------------------------------------------------------
# Ambulance Schemas
# ------------------------------------------------------------------------------
class AmbulanceCreate(BaseModel):
    registration_number: str
    ambulance_type: str = "ALS"  # ALS, BLS, NEONATAL, HAZMAT_PARAMEDIC
    capacity: int = 1
    home_hospital_id: Optional[str] = None
    current_status: str = "AVAILABLE"
    latitude: float = 13.6288
    longitude: float = 79.4192

class AmbulanceResponse(BaseModel):
    ambulance_id: str
    registration_number: str
    ambulance_type: str
    capacity: int
    home_hospital_id: Optional[str] = None
    home_hospital_name: Optional[str] = None
    current_status: str
    latitude: float
    longitude: float
    speed: float = 0.0
    created_at: datetime.datetime

    model_config = {"from_attributes": True}

# ------------------------------------------------------------------------------
# Resource, Road, Team Schemas
# ------------------------------------------------------------------------------
class ResourceCreate(BaseModel):
    hospital_id: str
    resource_type: str
    total_quantity: int
    available_quantity: int
    critical_threshold: int = 5

class ResourceItemResponse(BaseModel):
    resource_id: str
    hospital_id: str
    hospital_name: Optional[str] = None
    resource_type: str
    total_quantity: int
    available_quantity: int
    critical_threshold: int
    status: str

    model_config = {"from_attributes": True}

class RoadCreate(BaseModel):
    road_name: str
    source_location: str
    destination_location: str
    distance_km: float
    road_type: str = "PRIMARY_URBAN"
    start_lat: float = 13.6288
    start_lng: float = 79.4192
    end_lat: float = 13.6350
    end_lng: float = 79.4250

class RoadSegmentResponse(BaseModel):
    road_id: str
    road_name: str
    source_location: str
    destination_location: str
    distance_km: float
    road_type: str
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    traffic_level: str
    average_speed: float
    blocked: bool

    model_config = {"from_attributes": True}

class EmergencyTeamCreate(BaseModel):
    team_name: str
    specialization: str = "TRAUMA_SURGICAL"
    capacity: int = 5
    home_hospital_id: Optional[str] = None
    status: str = "AVAILABLE"

class EmergencyTeamResponse(BaseModel):
    team_id: str
    team_name: str
    specialization: str
    capacity: int
    home_hospital_id: Optional[str] = None
    home_hospital_name: Optional[str] = None
    status: str

    model_config = {"from_attributes": True}

# ------------------------------------------------------------------------------
# SQL Playground Schemas
# ------------------------------------------------------------------------------
class SqlExecuteRequest(BaseModel):
    sql_query: str

class SqlExecuteResponse(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int
    execution_time_ms: float
    query_type: str
    status: str

# ------------------------------------------------------------------------------
# Temporal & Allocation Schemas
# ------------------------------------------------------------------------------
class TemporalStateRequest(BaseModel):
    target_timestamp: datetime.datetime

class TemporalStateResponse(BaseModel):
    target_timestamp: datetime.datetime
    active_incidents_count: int
    critical_patients_count: int
    available_ambulances_count: int
    available_icu_beds_count: int
    available_emergency_beds_count: int
    blocked_roads_count: int
    incidents_snapshot: List[Dict[str, Any]]
    hospitals_snapshot: List[Dict[str, Any]]
    ambulances_snapshot: List[Dict[str, Any]]
    roads_snapshot: List[Dict[str, Any]]

class AllocationSolveRequest(BaseModel):
    incident_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: Optional[str] = None
    patient_count: Optional[int] = None
    required_icu: Optional[int] = None
    required_emergency: Optional[int] = None

class HospitalAllocationDetail(BaseModel):
    hospital_id: str
    hospital_name: str
    distance_km: float
    assigned_patients: int
    assigned_icu_beds: int
    assigned_emergency_beds: int
    eta_minutes: float
    assigned_ambulances: List[str]

class AllocationPlan(BaseModel):
    incident_id: str
    incident_type: str
    location_name: str
    total_patients: int
    allocated_patients: int
    unallocated_patients: int
    assigned_hospitals: List[HospitalAllocationDetail]
    dispatched_ambulances: List[str]
    dispatched_teams: List[str]
    feasibility_notes: List[str]
    is_fully_feasible: bool

class SimulationRunRequest(BaseModel):
    scenario_name: str = "Custom Emergency What-If"
    incident_type: str = "BUILDING_FIRE"
    patient_count: int = 20
    severity: str = "CRITICAL"
    latitude: float = 13.6288
    longitude: float = 79.4192
    disabled_hospital_ids: List[str] = []
    blocked_road_ids: List[str] = []

class SimulationRunResponse(BaseModel):
    scenario_id: str
    scenario_name: str
    status: str
    baseline_plan: Dict[str, Any]
    simulated_plan: Dict[str, Any]
    impact_summary: Dict[str, Any]
    execution_time_ms: float
