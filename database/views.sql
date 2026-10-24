-- =============================================================================
-- TERA: Database Views
-- Purpose: Encapsulate complex joins, status classifications, and utilization metrics
-- =============================================================================

-- Drop existing views
DROP VIEW IF EXISTS current_available_ambulances CASCADE;
DROP VIEW IF EXISTS current_hospital_capacity CASCADE;
DROP VIEW IF EXISTS critical_resource_alerts CASCADE;
DROP VIEW IF EXISTS active_incidents CASCADE;
DROP VIEW IF EXISTS hospital_utilization CASCADE;
DROP VIEW IF EXISTS blocked_road_segments CASCADE;

-- 1. View: Current Available Ambulances with latest GPS coordinates
CREATE OR REPLACE VIEW current_available_ambulances AS
WITH latest_loc AS (
    SELECT DISTINCT ON (ambulance_id)
        ambulance_id,
        latitude,
        longitude,
        speed,
        timestamp AS last_ping_at
    FROM ambulance_location_history
    ORDER BY ambulance_id, timestamp DESC
)
SELECT 
    a.ambulance_id,
    a.registration_number,
    a.ambulance_type,
    a.capacity,
    a.home_hospital_id,
    h.name AS home_hospital_name,
    a.current_status,
    COALESCE(loc.latitude, h.latitude, 13.6288) AS current_latitude,
    COALESCE(loc.longitude, h.longitude, 79.4192) AS current_longitude,
    COALESCE(loc.speed, 0.0) AS speed_kmh,
    loc.last_ping_at
FROM ambulance a
LEFT JOIN hospital h ON a.home_hospital_id = h.hospital_id
LEFT JOIN latest_loc loc ON a.ambulance_id = loc.ambulance_id
WHERE a.current_status = 'AVAILABLE';

-- 2. View: Current Hospital Capacity with latest historical snapshot & utilization
CREATE OR REPLACE VIEW current_hospital_capacity AS
WITH latest_cap AS (
    SELECT DISTINCT ON (hospital_id)
        hospital_id,
        timestamp AS recorded_at,
        icu_total,
        icu_available,
        emergency_beds_total,
        emergency_beds_available,
        general_beds_total,
        general_beds_available
    FROM hospital_capacity_history
    ORDER BY hospital_id, timestamp DESC
)
SELECT 
    h.hospital_id,
    h.name AS hospital_name,
    h.hospital_type,
    h.emergency_level,
    h.latitude,
    h.longitude,
    h.status AS facility_status,
    COALESCE(c.icu_total, 0) AS icu_total,
    COALESCE(c.icu_available, 0) AS icu_available,
    COALESCE(c.emergency_beds_total, 0) AS emergency_beds_total,
    COALESCE(c.emergency_beds_available, 0) AS emergency_beds_available,
    COALESCE(c.general_beds_total, 0) AS general_beds_total,
    COALESCE(c.general_beds_available, 0) AS general_beds_available,
    ROUND(
        CASE 
            WHEN COALESCE(c.icu_total, 0) > 0 
            THEN ((c.icu_total - c.icu_available)::NUMERIC / c.icu_total::NUMERIC) * 100 
            ELSE 0 
        END, 2
    ) AS icu_occupancy_percent,
    ROUND(
        CASE 
            WHEN COALESCE(c.emergency_beds_total, 0) > 0 
            THEN ((c.emergency_beds_total - c.emergency_beds_available)::NUMERIC / c.emergency_beds_total::NUMERIC) * 100 
            ELSE 0 
        END, 2
    ) AS emergency_occupancy_percent,
    c.recorded_at
FROM hospital h
LEFT JOIN latest_cap c ON h.hospital_id = c.hospital_id;

-- 3. View: Critical Resource Alerts (Supplies below critical threshold or ICU exhaustion)
CREATE OR REPLACE VIEW critical_resource_alerts AS
SELECT 
    r.resource_id AS alert_id,
    h.hospital_id,
    h.name AS hospital_name,
    'RESOURCE_SHORTAGE' AS alert_type,
    r.resource_type,
    CASE 
        WHEN r.available_quantity = 0 THEN 'CRITICAL'
        WHEN r.available_quantity <= r.critical_threshold THEN 'WARNING'
        ELSE 'INFO'
    END AS severity,
    CONCAT(
        'Hospital ', h.name, ' ', r.resource_type, ' stock is at ', 
        r.available_quantity, ' (Threshold: ', r.critical_threshold, ')'
    ) AS message,
    r.available_quantity,
    r.critical_threshold,
    CURRENT_TIMESTAMP AS generated_at
FROM resource r
JOIN hospital h ON r.hospital_id = h.hospital_id
WHERE r.available_quantity <= r.critical_threshold

UNION ALL

SELECT 
    CONCAT('ALERT_ICU_', h.hospital_id) AS alert_id,
    h.hospital_id,
    h.hospital_name,
    'ICU_CAPACITY_EXHAUSTED' AS alert_type,
    'ICU_BED' AS resource_type,
    'CRITICAL' AS severity,
    CONCAT('Hospital ', h.hospital_name, ' ICU capacity critical: only ', h.icu_available, ' of ', h.icu_total, ' available') AS message,
    h.icu_available AS available_quantity,
    1 AS critical_threshold,
    CURRENT_TIMESTAMP AS generated_at
FROM current_hospital_capacity h
WHERE h.icu_available <= 2 AND h.icu_total > 0;

-- 4. View: Active Incidents with live patient breakdown
CREATE OR REPLACE VIEW active_incidents AS
SELECT 
    i.incident_id,
    i.incident_type,
    i.description,
    i.severity,
    i.latitude,
    i.longitude,
    i.location_name,
    i.occurred_at,
    i.reported_at,
    i.status,
    i.estimated_patient_count,
    COUNT(p.patient_id) AS recorded_patients,
    COUNT(p.patient_id) FILTER (WHERE p.severity = 'CRITICAL') AS critical_patient_count,
    COUNT(p.patient_id) FILTER (WHERE p.severity = 'SERIOUS') AS serious_patient_count,
    COUNT(p.patient_id) FILTER (WHERE p.severity IN ('MODERATE', 'MINOR')) AS non_critical_patient_count,
    COUNT(p.patient_id) FILTER (WHERE p.transport_status = 'AWAITING_TRIAGE') AS patients_awaiting_transport,
    COUNT(p.patient_id) FILTER (WHERE p.transport_status = 'ARRIVED_AT_HOSPITAL') AS patients_admitted
FROM incident i
LEFT JOIN patient p ON i.incident_id = p.incident_id
WHERE i.status IN ('REPORTED', 'ACTIVE')
GROUP BY i.incident_id;

-- 5. View: Hospital Utilization with aggregate resource metrics
CREATE OR REPLACE VIEW hospital_utilization AS
SELECT 
    h.hospital_id,
    h.hospital_name,
    h.hospital_type,
    h.emergency_level,
    h.icu_total,
    h.icu_available,
    (h.icu_total - h.icu_available) AS icu_occupied,
    h.icu_occupancy_percent,
    h.emergency_beds_total,
    h.emergency_beds_available,
    (h.emergency_beds_total - h.emergency_beds_available) AS emergency_beds_occupied,
    h.emergency_occupancy_percent,
    COUNT(DISTINCT a.ambulance_id) AS stationed_ambulances,
    COUNT(DISTINCT t.team_id) AS stationed_emergency_teams,
    CASE 
        WHEN h.icu_occupancy_percent >= 90 OR h.emergency_occupancy_percent >= 90 THEN 'SATURATED'
        WHEN h.icu_occupancy_percent >= 70 OR h.emergency_occupancy_percent >= 70 THEN 'HIGH_LOAD'
        WHEN h.icu_occupancy_percent >= 40 OR h.emergency_occupancy_percent >= 40 THEN 'MODERATE'
        ELSE 'AVAILABLE'
    END AS operational_load_band
FROM current_hospital_capacity h
LEFT JOIN ambulance a ON h.hospital_id = a.home_hospital_id AND a.current_status = 'AVAILABLE'
LEFT JOIN emergency_team t ON h.hospital_id = t.home_hospital_id AND t.status = 'AVAILABLE'
GROUP BY 
    h.hospital_id, h.hospital_name, h.hospital_type, h.emergency_level,
    h.icu_total, h.icu_available, h.icu_occupancy_percent,
    h.emergency_beds_total, h.emergency_beds_available, h.emergency_occupancy_percent;

-- 6. View: Blocked Road Segments for dispatch routing
CREATE OR REPLACE VIEW blocked_road_segments AS
WITH latest_road AS (
    SELECT DISTINCT ON (road_id)
        road_id,
        timestamp,
        traffic_level,
        average_speed,
        blocked
    FROM road_status_history
    ORDER BY road_id, timestamp DESC
)
SELECT 
    r.road_id,
    r.road_name,
    r.source_location,
    r.destination_location,
    r.distance_km,
    r.road_type,
    r.start_lat,
    r.start_lng,
    r.end_lat,
    r.end_lng,
    rs.traffic_level,
    rs.average_speed,
    rs.blocked,
    rs.timestamp AS status_updated_at
FROM road r
JOIN latest_road rs ON r.road_id = rs.road_id
WHERE rs.blocked = TRUE OR rs.traffic_level = 'SEVERE';
