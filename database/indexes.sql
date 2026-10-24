-- =============================================================================
-- TERA: Database Indexing Strategy
-- Purpose: Accelerate Temporal Range Lookups, Spatial Proximity, and Status Scans
-- =============================================================================

-- 1. Temporal Lookup Indexes (Ambulance trajectories and status intervals)
-- Justification: Time-travel queries require filtering GPS and state for 500+ ambulances at point-in-time T.
CREATE INDEX IF NOT EXISTS idx_amb_loc_id_time 
ON ambulance_location_history (ambulance_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_amb_stat_id_timerange 
ON ambulance_status_history (ambulance_id, start_time, end_time);

-- 2. Hospital Capacity Temporal Index
-- Justification: Reconstructing hospital ICU/emergency bed capacity at any historical timestamp.
CREATE INDEX IF NOT EXISTS idx_hosp_cap_id_time 
ON hospital_capacity_history (hospital_id, timestamp DESC);

-- 3. Resource & Resource History Audit Indexes
-- Justification: Instant queries on hospital blood/ventilator stock and temporal consumption audits.
CREATE INDEX IF NOT EXISTS idx_resource_hosp_type 
ON resource (hospital_id, resource_type);

CREATE INDEX IF NOT EXISTS idx_resource_hist_id_time 
ON resource_history (resource_id, timestamp DESC);

-- 4. Incident Query & Triage Indexes
-- Justification: Rapid filtering of active incidents by severity and timestamp for dashboard and EOC map.
CREATE INDEX IF NOT EXISTS idx_incident_time_sev 
ON incident (occurred_at DESC, severity);

CREATE INDEX IF NOT EXISTS idx_incident_status 
ON incident (status);

-- 5. Patient Triage and Incident Linking
-- Justification: Grouping patients by incident, severity, and assigned hospital in allocation workflows.
CREATE INDEX IF NOT EXISTS idx_patient_inc_sev 
ON patient (incident_id, severity);

CREATE INDEX IF NOT EXISTS idx_patient_assigned_hosp 
ON patient (assigned_hospital_id);

-- 6. Road Corridor and Traffic Temporal Indexes
-- Justification: Rapid retrieval of blocked roads and average speeds for route recalculation at timestamp T.
CREATE INDEX IF NOT EXISTS idx_road_status_id_time 
ON road_status_history (road_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_road_status_blocked 
ON road_status_history (blocked, timestamp DESC);

-- 7. Emergency Team Deployment History
-- Justification: Checking which teams were active, standby, or resting at a chosen historical time.
CREATE INDEX IF NOT EXISTS idx_team_status_id_time 
ON team_status_history (team_id, timestamp DESC);

-- 8. Allocations and Assignments Linking Indexes
-- Justification: Rapid lookup of active allocations for rollbacks, release events, and incident audit trails.
CREATE INDEX IF NOT EXISTS idx_res_alloc_inc 
ON resource_allocation (incident_id, status);

CREATE INDEX IF NOT EXISTS idx_hosp_assign_inc 
ON hospital_assignment (incident_id, status);
