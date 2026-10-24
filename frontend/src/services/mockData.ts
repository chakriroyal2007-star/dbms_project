import { 
  Incident, Ambulance, Hospital, ResourceItem, 
  RoadSegment, EmergencyTeam, EOCMetrics, ResourceAlert, TemporalState 
} from '../types';

export const INITIAL_HOSPITALS: Hospital[] = [
  {
    hospital_id: "HOSP_001",
    name: "SVRR Government Trauma Center",
    hospital_type: "TRAUMA_CENTER_LEVEL_1",
    emergency_level: "LEVEL_1",
    latitude: 13.6350,
    longitude: 79.4150,
    status: "ACTIVE",
    icu_total: 24,
    icu_available: 4,
    emergency_beds_total: 60,
    emergency_beds_available: 10,
    general_beds_total: 200,
    general_beds_available: 120,
    icu_occupancy_percent: 83.3,
    emergency_occupancy_percent: 83.3
  },
  {
    hospital_id: "HOSP_002",
    name: "Sri Venkateswara Institute of Medical Sciences (SVIMS)",
    hospital_type: "TRAUMA_CENTER_LEVEL_1",
    emergency_level: "LEVEL_1",
    latitude: 13.6390,
    longitude: 79.4070,
    status: "ACTIVE",
    icu_total: 30,
    icu_available: 4,
    emergency_beds_total: 75,
    emergency_beds_available: 12,
    general_beds_total: 250,
    general_beds_available: 140,
    icu_occupancy_percent: 86.7,
    emergency_occupancy_percent: 84.0
  },
  {
    hospital_id: "HOSP_003",
    name: "Apollo Emergency Medical Center",
    hospital_type: "PRIVATE_MULTI_SPECIALTY",
    emergency_level: "LEVEL_1",
    latitude: 13.6210,
    longitude: 79.4280,
    status: "ACTIVE",
    icu_total: 16,
    icu_available: 3,
    emergency_beds_total: 45,
    emergency_beds_available: 8,
    general_beds_total: 120,
    general_beds_available: 70,
    icu_occupancy_percent: 81.3,
    emergency_occupancy_percent: 82.2
  },
  {
    hospital_id: "HOSP_004",
    name: "District Headquarters Hospital",
    hospital_type: "DISTRICT_HOSPITAL",
    emergency_level: "LEVEL_2",
    latitude: 13.6180,
    longitude: 79.4350,
    status: "ACTIVE",
    icu_total: 12,
    icu_available: 2,
    emergency_beds_total: 40,
    emergency_beds_available: 5,
    general_beds_total: 100,
    general_beds_available: 60,
    icu_occupancy_percent: 83.3,
    emergency_occupancy_percent: 87.5
  },
  {
    hospital_id: "HOSP_005",
    name: "Amara Trauma & Multi-Specialty",
    hospital_type: "SPECIALTY_SURGICAL",
    emergency_level: "LEVEL_2",
    latitude: 13.6450,
    longitude: 79.4300,
    status: "ACTIVE",
    icu_total: 10,
    icu_available: 1,
    emergency_beds_total: 30,
    emergency_beds_available: 2,
    general_beds_total: 80,
    general_beds_available: 45,
    icu_occupancy_percent: 90.0,
    emergency_occupancy_percent: 93.3
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    incident_id: "INC_DISASTER_001",
    incident_type: "ROAD_ACCIDENT",
    description: "Multi-vehicle pileup on NH-71 Expressway involving intercity bus and chemical tanker",
    severity: "CRITICAL",
    latitude: 13.6420,
    longitude: 79.4850,
    location_name: "NH-71 Expressway Km 14 Near Airport Junction",
    occurred_at: "2026-09-12T19:15:00Z",
    reported_at: "2026-09-12T19:17:00Z",
    status: "ACTIVE",
    estimated_patient_count: 8,
    created_at: "2026-09-12T19:15:00Z"
  },
  {
    incident_id: "INC_DISASTER_002",
    incident_type: "BUILDING_FIRE",
    description: "Commercial shopping complex 4-story structural fire with toxic smoke entrapment",
    severity: "HIGH",
    latitude: 13.6260,
    longitude: 79.4210,
    location_name: "Town Center Plaza, Gandhi Road",
    occurred_at: "2026-09-12T18:30:00Z",
    reported_at: "2026-09-12T18:32:00Z",
    status: "ACTIVE",
    estimated_patient_count: 15,
    created_at: "2026-09-12T18:30:00Z"
  },
  {
    incident_id: "INC_DISASTER_003",
    incident_type: "FLOOD",
    description: "Flash flood causing low-lying residential inundation and roof collapse",
    severity: "HIGH",
    latitude: 13.6120,
    longitude: 79.4350,
    location_name: "Swarnamukhi River Basin Sector 4",
    occurred_at: "2026-09-12T18:45:00Z",
    reported_at: "2026-09-12T18:47:00Z",
    status: "ACTIVE",
    estimated_patient_count: 20,
    created_at: "2026-09-12T18:45:00Z"
  },
  {
    incident_id: "INC_DISASTER_004",
    incident_type: "INDUSTRIAL_ACCIDENT",
    description: "Chemical reactor leak and boiler explosion in manufacturing park",
    severity: "CRITICAL",
    latitude: 13.6050,
    longitude: 79.4680,
    location_name: "Renigunta Industrial Estate Block C",
    occurred_at: "2026-09-12T19:00:00Z",
    reported_at: "2026-09-12T19:02:00Z",
    status: "ACTIVE",
    estimated_patient_count: 6,
    created_at: "2026-09-12T19:00:00Z"
  }
];

export const INITIAL_AMBULANCES: Ambulance[] = Array.from({ length: 17 }, (_, i) => ({
  ambulance_id: `AMB_${i + 1 < 10 ? '00' : '0'}${i + 1}`,
  registration_number: `AP-03-EM-${1001 + i}`,
  ambulance_type: i % 3 === 0 ? "ALS" : (i % 3 === 1 ? "BLS" : "HAZMAT_PARAMEDIC"),
  capacity: i % 3 === 0 ? 2 : 1,
  home_hospital_id: `HOSP_00${(i % 5) + 1}`,
  home_hospital_name: INITIAL_HOSPITALS[i % INITIAL_HOSPITALS.length].name,
  current_status: "AVAILABLE",
  latitude: 13.6288 + (Math.random() - 0.5) * 0.04,
  longitude: 79.4192 + (Math.random() - 0.5) * 0.04,
  speed: 0.0,
  created_at: "2026-09-12T18:00:00Z"
}));

export const INITIAL_ROADS: RoadSegment[] = [
  {
    road_id: "ROAD_001",
    road_name: "NH-71 Expressway - Airport Bypass",
    source_location: "Renigunta Junction",
    destination_location: "Central Bus Terminal",
    distance_km: 14.5,
    road_type: "EXPRESSWAY",
    start_lat: 13.645,
    start_lng: 79.520,
    end_lat: 13.628,
    end_lng: 79.420,
    traffic_level: "SEVERE",
    average_speed: 5.0,
    blocked: true
  },
  {
    road_id: "ROAD_002",
    road_name: "Alipiri Bypass Corridor (R17)",
    source_location: "Alipiri Gate",
    destination_location: "SVIMS Trauma Circle",
    distance_km: 6.2,
    road_type: "ARTERIAL_HIGHWAY",
    start_lat: 13.655,
    start_lng: 79.395,
    end_lat: 13.639,
    end_lng: 79.407,
    traffic_level: "SEVERE",
    average_speed: 0.0,
    blocked: true
  },
  {
    road_id: "ROAD_003",
    road_name: "Industrial Zone Link Road 4",
    source_location: "Settipalli Industrial Area",
    destination_location: "SVRR Hospital Road",
    distance_km: 8.8,
    road_type: "PRIMARY_URBAN",
    start_lat: 13.610,
    start_lng: 79.460,
    end_lat: 13.635,
    end_lng: 79.415,
    traffic_level: "SEVERE",
    average_speed: 4.0,
    blocked: true
  }
];

export const INITIAL_METRICS: EOCMetrics = {
  active_incidents: 4,
  critical_patients: 17,
  available_ambulances: 17,
  total_ambulances: 500,
  available_icu_beds: 14,
  total_icu_beds: 92,
  available_emergency_beds: 37,
  total_emergency_beds: 245,
  active_emergency_teams: 14,
  total_emergency_teams: 60,
  resource_utilization_percent: 84.8,
  blocked_roads_count: 3
};
