-- =============================================================================
-- TERA: Advanced SQL Queries Showcase
-- Purpose: Demonstrates Advanced Relational Database Capabilities
-- Features: CTEs, Window Functions, Multi-table JOINs, Aggregations, Temporal Filtering
-- =============================================================================

-- -----------------------------------------------------------------------------
-- QUERY 1: CTE + WINDOW FUNCTION - Nearest Hospital Candidate Ranking
-- Ranks hospitals by emergency level, available ICU beds, and geographical distance
-- -----------------------------------------------------------------------------
WITH incident_target AS (
    SELECT latitude AS inc_lat, longitude AS inc_lng
    FROM incident
    WHERE incident_id = 'INC_DISASTER_001'
),
hospital_distances AS (
    SELECT 
        h.hospital_id,
        h.name,
        h.hospital_type,
        h.emergency_level,
        c.icu_available,
        c.emergency_beds_available,
        -- Haversine approximate Euclidean distance calculation in KM
        ROUND(
            (6371 * ACOS(
                LEAST(1.0, GREATEST(-1.0,
                    COS(RADIANS(it.inc_lat)) * COS(RADIANS(h.latitude)) * 
                    COS(RADIANS(h.longitude) - RADIANS(it.inc_lng)) + 
                    SIN(RADIANS(it.inc_lat)) * SIN(RADIANS(h.latitude))
                ))
            ))::NUMERIC, 2
        ) AS distance_km
    FROM hospital h
    CROSS JOIN incident_target it
    JOIN (
        SELECT DISTINCT ON (hospital_id) hospital_id, icu_available, emergency_beds_available
        FROM hospital_capacity_history
        ORDER BY hospital_id, timestamp DESC
    ) c ON h.hospital_id = c.hospital_id
    WHERE h.status = 'ACTIVE' AND c.icu_available > 0
),
ranked_candidates AS (
    SELECT 
        hospital_id,
        name,
        hospital_type,
        emergency_level,
        icu_available,
        emergency_beds_available,
        distance_km,
        ROW_NUMBER() OVER (
            ORDER BY 
                CASE emergency_level 
                    WHEN 'LEVEL_1' THEN 1 
                    WHEN 'LEVEL_2' THEN 2 
                    ELSE 3 
                END ASC,
                distance_km ASC,
                icu_available DESC
        ) AS suitability_rank
    FROM hospital_distances
)
SELECT * FROM ranked_candidates WHERE suitability_rank <= 5;

-- -----------------------------------------------------------------------------
-- QUERY 2: LEFT JOIN + SUBQUERY - Identify Hospitals with Severe Resource Gaps
-- Identifies active hospitals lacking critical trauma resources (Blood O-Neg or Ventilators)
-- -----------------------------------------------------------------------------
SELECT 
    h.hospital_id,
    h.name AS hospital_name,
    h.emergency_level,
    COALESCE(r_blood.available_quantity, 0) AS blood_o_neg_units,
    COALESCE(r_vent.available_quantity, 0) AS ventilators_count,
    CASE 
        WHEN COALESCE(r_blood.available_quantity, 0) < 5 AND COALESCE(r_vent.available_quantity, 0) < 2 
            THEN 'CRITICAL_DEFICIT'
        WHEN COALESCE(r_blood.available_quantity, 0) < 5 
            THEN 'BLOOD_SHORTAGE'
        WHEN COALESCE(r_vent.available_quantity, 0) < 2 
            THEN 'VENTILATOR_SHORTAGE'
        ELSE 'OPERATIONAL'
    END AS readiness_status
FROM hospital h
LEFT JOIN resource r_blood ON h.hospital_id = r_blood.hospital_id AND r_blood.resource_type = 'BLOOD_O_NEG'
LEFT JOIN resource r_vent ON h.hospital_id = r_vent.hospital_id AND r_vent.resource_type = 'VENTILATOR'
WHERE h.status = 'ACTIVE'
  AND (COALESCE(r_blood.available_quantity, 0) < 5 OR COALESCE(r_vent.available_quantity, 0) < 2)
ORDER BY readiness_status ASC;

-- -----------------------------------------------------------------------------
-- QUERY 3: WINDOW FUNCTIONS - Rolling 6-Hour ICU Bed Occupancy Trend
-- Calculates moving averages and percentage shifts in ICU availability
-- -----------------------------------------------------------------------------
SELECT 
    hch.hospital_id,
    h.name AS hospital_name,
    hch.timestamp,
    hch.icu_available,
    hch.icu_total,
    ROUND(
        AVG(hch.icu_available) OVER (
            PARTITION BY hch.hospital_id 
            ORDER BY hch.timestamp 
            ROWS BETWEEN 5 PRECEDING AND CURRENT ROW
        ), 2
    ) AS rolling_avg_icu_available,
    LAG(hch.icu_available, 1) OVER (
        PARTITION BY hch.hospital_id 
        ORDER BY hch.timestamp
    ) AS prev_icu_available
FROM hospital_capacity_history hch
JOIN hospital h ON hch.hospital_id = h.hospital_id
ORDER BY hch.hospital_id, hch.timestamp DESC;

-- -----------------------------------------------------------------------------
-- QUERY 4: GROUP BY + HAVING - Hourly Incident Casualty Clustering
-- Detects high-casualty surge intervals across historical records
-- -----------------------------------------------------------------------------
SELECT 
    DATE_TRUNC('hour', occurred_at) AS incident_hour,
    COUNT(incident_id) AS total_incidents,
    SUM(estimated_patient_count) AS total_estimated_patients,
    COUNT(incident_id) FILTER (WHERE severity = 'CRITICAL') AS critical_incidents,
    ROUND(AVG(estimated_patient_count), 1) AS avg_patients_per_incident
FROM incident
GROUP BY DATE_TRUNC('hour', occurred_at)
HAVING SUM(estimated_patient_count) >= 10
ORDER BY incident_hour DESC;

-- -----------------------------------------------------------------------------
-- QUERY 5: TEMPORAL RECONSTRUCTION QUERY
-- Reconstructs exact resource state at 12 Sept 2026 19:30:00+05:30
-- -----------------------------------------------------------------------------
SELECT 
    '12 September 2026 19:30:00' AS snapshot_time,
    (SELECT COUNT(*) FROM incident WHERE occurred_at <= '2026-09-12 19:30:00+05:30' AND (status = 'ACTIVE' OR updated_at >= '2026-09-12 19:30:00+05:30')) AS active_incidents,
    (SELECT COUNT(*) FROM patient p JOIN incident i ON p.incident_id = i.incident_id WHERE i.occurred_at <= '2026-09-12 19:30:00+05:30' AND p.severity = 'CRITICAL') AS critical_patients,
    (SELECT COUNT(*) FROM (SELECT DISTINCT ON (ambulance_id) status FROM ambulance_status_history WHERE start_time <= '2026-09-12 19:30:00+05:30' ORDER BY ambulance_id, start_time DESC) s WHERE s.status = 'AVAILABLE') AS available_ambulances,
    (SELECT SUM(icu_available) FROM (SELECT DISTINCT ON (hospital_id) icu_available FROM hospital_capacity_history WHERE timestamp <= '2026-09-12 19:30:00+05:30' ORDER BY hospital_id, timestamp DESC) c) AS available_icu_beds,
    (SELECT SUM(emergency_beds_available) FROM (SELECT DISTINCT ON (hospital_id) emergency_beds_available FROM hospital_capacity_history WHERE timestamp <= '2026-09-12 19:30:00+05:30' ORDER BY hospital_id, timestamp DESC) c) AS available_emergency_beds,
    (SELECT COUNT(*) FROM (SELECT DISTINCT ON (road_id) blocked, traffic_level FROM road_status_history WHERE timestamp <= '2026-09-12 19:30:00+05:30' ORDER BY road_id, timestamp DESC) r WHERE r.blocked = TRUE OR r.traffic_level = 'SEVERE') AS blocked_roads;
