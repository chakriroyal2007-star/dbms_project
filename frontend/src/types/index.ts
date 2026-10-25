export type RoleType = 
  | 'REPORTER' 
  | 'CONTROL_OPERATOR' 
  | 'HOSPITAL_COORDINATOR' 
  | 'FIELD_RESPONDER' 
  | 'ANALYST' 
  | 'ADMINISTRATOR' 
  | 'ADMIN';

export interface Incident {
  incident_id: string;
  tracking_code?: string;
  tracking_token?: string;
  reporter_id?: string;
  reporter_name?: string;
  reporter_phone?: string;
  incident_type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  latitude: number;
  longitude: number;
  location_accuracy_meters?: number;
  is_location_verified?: boolean;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  locality?: string;
  landmark?: string;
  location_name: string;
  occurred_at: string;
  reported_at: string;
  status: 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'UNDER_REVIEW' | 'VERIFIED' | 'RESPONSE_REQUESTED' | 'RESOURCE_ACKNOWLEDGED' | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'ACTIVE' | 'CONTAINED' | 'RESOLVED' | 'REJECTED' | 'CANCELLED';
  estimated_patient_count: number;
  voice_transcript?: string;
  detected_language?: string;
  structured_extraction?: StructuredEmergencyExtraction;
  structured_extraction_json?: StructuredEmergencyExtraction;
  evidence_urls?: Array<{ url: string; category?: string; media_category?: string; filename?: string; size_bytes?: number }>;
  evidence_urls_json?: Array<{ url: string; media_category?: string; filename?: string; size_bytes?: number }>;
  timeline_events_json?: Array<{ status: string; title: string; description: string; actor_role?: string; timestamp: string }>;
  linked_duplicate_id?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface StructuredEmergencyExtraction {
  original_transcript: string;
  confirmed_transcript?: string;
  incident_summary: string;
  incident_type: string;
  reported_location: string;
  people_affected: string;
  reported_injuries: string[];
  reported_hazards: string[];
  assistance_requested: string[];
  unknown_fields: string[];
  extraction_status: string;
  confirmation_status: string;
  summary?: string;
  incident_category?: string;
  affected_people_count?: string;
  estimated_casualties?: number;
  observed_severity?: string;
  unknown_details?: string[];
  provenance?: string;
  verification_status?: string;
}


export interface PublicTrackedIncident {
  tracking_code: string;
  incident_id: string;
  incident_type: string;
  location_name: string;
  city: string;
  severity: string;
  status: string;
  reported_at: string;
  updated_at: string;
  estimated_patient_count: number;
  timeline: Array<{
    status: string;
    title: string;
    description: string;
    actor_role?: string;
    timestamp: string;
  }>;
  first_aid_guidance: string[];
  voice_transcript?: string;
  structured_extraction_json?: StructuredEmergencyExtraction;
}

export interface ResponderAssignment {
  assignment_id: string;
  incident_id: string;
  incident_type: string;
  location_name: string;
  latitude: number;
  longitude: number;
  severity: string;
  resource_id?: string;
  status: 'REQUESTED' | 'ACKNOWLEDGED' | 'DECLINED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED';
  assigned_at: string;
  acknowledged_at?: string;
  en_route_at?: string;
  arrived_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface Ambulance {
  ambulance_id: string;
  registration_number: string;
  ambulance_type: string;
  capacity: number;
  home_hospital_id?: string;
  home_hospital_name?: string;
  current_status: 'AVAILABLE' | 'DISPATCHED' | 'TRANSPORTING' | 'MAINTENANCE' | 'OFFLINE';
  latitude: number;
  longitude: number;
  speed: number;
  created_at: string;
}

export interface Hospital {
  hospital_id: string;
  name: string;
  hospital_type: string;
  latitude: number;
  longitude: number;
  emergency_level: string;
  status: string;
  icu_total: number;
  icu_available: number;
  emergency_beds_total: number;
  emergency_beds_available: number;
  general_beds_total: number;
  general_beds_available: number;
  icu_occupancy_percent: number;
  emergency_occupancy_percent: number;
}

export interface ResourceItem {
  resource_id: string;
  hospital_id: string;
  hospital_name?: string;
  resource_type: string;
  total_quantity: number;
  available_quantity: number;
  critical_threshold: number;
  status: string;
}

export interface RoadSegment {
  road_id: string;
  road_name: string;
  source_location: string;
  destination_location: string;
  distance_km: number;
  road_type: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  traffic_level: string;
  average_speed: number;
  blocked: boolean;
}

export interface EmergencyTeam {
  team_id: string;
  team_name: string;
  specialization: string;
  capacity: number;
  home_hospital_id?: string;
  home_hospital_name?: string;
  status: string;
}

export interface EOCMetrics {
  active_incidents: number;
  critical_patients: number;
  available_ambulances: number;
  total_ambulances: number;
  available_icu_beds: number;
  total_icu_beds: number;
  available_emergency_beds: number;
  total_emergency_beds: number;
  active_emergency_teams: number;
  total_emergency_teams: number;
  resource_utilization_percent: number;
  blocked_roads_count: number;
}

export interface ResourceAlert {
  alert_id: string;
  hospital_id: string;
  hospital_name: string;
  alert_type: string;
  resource_type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  available_quantity: number;
  critical_threshold: number;
  generated_at: string;
}

export interface TemporalState {
  target_timestamp: string;
  active_incidents_count: number;
  critical_patients_count: number;
  available_ambulances_count: number;
  available_icu_beds_count: number;
  available_emergency_beds_count: number;
  blocked_roads_count: number;
  incidents_snapshot: any[];
  hospitals_snapshot: any[];
  ambulances_snapshot: any[];
  roads_snapshot: any[];
}

export interface HospitalAllocationDetail {
  hospital_id: string;
  hospital_name: string;
  distance_km: number;
  assigned_patients: number;
  assigned_icu_beds: number;
  assigned_emergency_beds: number;
  eta_minutes: number;
  assigned_ambulances: string[];
}

export interface AllocationPlan {
  incident_id: string;
  incident_type: string;
  location_name: string;
  total_patients: number;
  allocated_patients: number;
  unallocated_patients: number;
  assigned_hospitals: HospitalAllocationDetail[];
  dispatched_ambulances: string[];
  dispatched_teams: string[];
  feasibility_notes: string[];
  is_fully_feasible: boolean;
}

export interface User {
  username: string;
  role: string;
  full_name: string;
  access_token: string;
}
