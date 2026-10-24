export interface Incident {
  incident_id: string;
  reporter_id?: string;
  incident_type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  latitude: number;
  longitude: number;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  locality?: string;
  landmark?: string;
  location_name: string;
  occurred_at: string;
  reported_at: string;
  status: 'RECEIVED' | 'VERIFIED' | 'REPORTED' | 'ACTIVE' | 'CONTAINED' | 'RESOLVED' | 'REJECTED' | 'CANCELLED';
  estimated_patient_count: number;
  created_at: string;
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
