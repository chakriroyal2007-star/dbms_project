-- =============================================================================
-- TERA: Stored Procedures and Database Functions
-- Purpose: Encapsulate Temporal State Reconstruction and Multi-Resource Dispatch
-- =============================================================================

-- 1. Function: Reconstruct System-Wide Emergency State at Timestamp T
CREATE OR REPLACE FUNCTION get_historical_emergency_state(p_timestamp TIMESTAMPTZ)
RETURNS TABLE (
    metric_name VARCHAR,
    metric_value NUMERIC,
    metric_unit VARCHAR,
    metric_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- 1. Active Incidents at p_timestamp
    SELECT 
        'active_incidents'::VARCHAR AS metric_name,
        COUNT(*)::NUMERIC AS metric_value,
        'incidents'::VARCHAR AS metric_unit,
        'Number of incidents active or reported at the target timestamp'::TEXT AS metric_description
    FROM incident
    WHERE occurred_at <= p_timestamp 
      AND (status IN ('ACTIVE', 'REPORTED') OR updated_at >= p_timestamp)

    UNION ALL

    -- 2. Critical Patients at p_timestamp
    SELECT 
        'critical_patients'::VARCHAR,
        COUNT(*)::NUMERIC,
        'patients'::VARCHAR,
        'Total critical patients awaiting or undergoing emergency triage'::TEXT
    FROM patient p
    JOIN incident i ON p.incident_id = i.incident_id
    WHERE i.occurred_at <= p_timestamp 
      AND p.severity = 'CRITICAL'
      AND p.created_at <= p_timestamp

    UNION ALL

    -- 3. Available Ambulances at p_timestamp
    SELECT 
        'available_ambulances'::VARCHAR,
        COUNT(*)::NUMERIC,
        'units'::VARCHAR,
        'Number of ambulances in AVAILABLE state at target timestamp'::TEXT
    FROM (
        SELECT DISTINCT ON (ambulance_id)
            ambulance_id, status
        FROM ambulance_status_history
        WHERE start_time <= p_timestamp
        ORDER BY ambulance_id, start_time DESC
    ) latest_amb
    WHERE latest_amb.status = 'AVAILABLE'

    UNION ALL

    -- 4. Available ICU Beds at p_timestamp
    SELECT 
        'available_icu_beds'::VARCHAR,
        COALESCE(SUM(latest_cap.icu_available), 0)::NUMERIC,
        'beds'::VARCHAR,
        'Sum of available ICU beds across all hospitals at target timestamp'::TEXT
    FROM (
        SELECT DISTINCT ON (hospital_id)
            hospital_id, icu_available
        FROM hospital_capacity_history
        WHERE timestamp <= p_timestamp
        ORDER BY hospital_id, timestamp DESC
    ) latest_cap

    UNION ALL

    -- 5. Available Emergency Beds at p_timestamp
    SELECT 
        'available_emergency_beds'::VARCHAR,
        COALESCE(SUM(latest_cap.emergency_beds_available), 0)::NUMERIC,
        'beds'::VARCHAR,
        'Sum of available emergency beds across all hospitals at target timestamp'::TEXT
    FROM (
        SELECT DISTINCT ON (hospital_id)
            hospital_id, emergency_beds_available
        FROM hospital_capacity_history
        WHERE timestamp <= p_timestamp
        ORDER BY hospital_id, timestamp DESC
    ) latest_cap

    UNION ALL

    -- 6. Blocked Roads at p_timestamp
    SELECT 
        'blocked_roads'::VARCHAR,
        COUNT(*)::NUMERIC,
        'segments'::VARCHAR,
        'Number of road corridors with active blockages or severe congestion'::TEXT
    FROM (
        SELECT DISTINCT ON (road_id)
            road_id, blocked, traffic_level
        FROM road_status_history
        WHERE timestamp <= p_timestamp
        ORDER BY road_id, timestamp DESC
    ) latest_road
    WHERE latest_road.blocked = TRUE OR latest_road.traffic_level = 'SEVERE';
END;
$$ LANGUAGE plpgsql;

-- 2. Function: Find Available Ambulances at Timestamp T with spatial coordinates
CREATE OR REPLACE FUNCTION find_available_ambulances(p_timestamp TIMESTAMPTZ)
RETURNS TABLE (
    ambulance_id VARCHAR,
    registration_number VARCHAR,
    ambulance_type VARCHAR,
    capacity INT,
    home_hospital_id VARCHAR,
    latitude NUMERIC,
    longitude NUMERIC,
    speed NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_status AS (
        SELECT DISTINCT ON (ash.ambulance_id)
            ash.ambulance_id,
            ash.status
        FROM ambulance_status_history ash
        WHERE ash.start_time <= p_timestamp
        ORDER BY ash.ambulance_id, ash.start_time DESC
    ),
    ranked_loc AS (
        SELECT DISTINCT ON (alh.ambulance_id)
            alh.ambulance_id,
            alh.latitude,
            alh.longitude,
            alh.speed
        FROM ambulance_location_history alh
        WHERE alh.timestamp <= p_timestamp
        ORDER BY alh.ambulance_id, alh.timestamp DESC
    )
    SELECT 
        a.ambulance_id,
        a.registration_number,
        a.ambulance_type,
        a.capacity,
        a.home_hospital_id,
        COALESCE(loc.latitude, h.latitude, 13.6288) AS latitude,
        COALESCE(loc.longitude, h.longitude, 79.4192) AS longitude,
        COALESCE(loc.speed, 0.0) AS speed
    FROM ambulance a
    JOIN ranked_status rs ON a.ambulance_id = rs.ambulance_id AND rs.status = 'AVAILABLE'
    LEFT JOIN ranked_loc loc ON a.ambulance_id = loc.ambulance_id
    LEFT JOIN hospital h ON a.home_hospital_id = h.hospital_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Function: Find Available Hospitals at Timestamp T meeting minimum ICU threshold
CREATE OR REPLACE FUNCTION find_available_hospitals(
    p_timestamp TIMESTAMPTZ,
    p_required_icu INT DEFAULT 1
)
RETURNS TABLE (
    hospital_id VARCHAR,
    name VARCHAR,
    hospital_type VARCHAR,
    emergency_level VARCHAR,
    latitude NUMERIC,
    longitude NUMERIC,
    icu_available INT,
    emergency_beds_available INT
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_cap AS (
        SELECT DISTINCT ON (hch.hospital_id)
            hch.hospital_id,
            hch.icu_available,
            hch.emergency_beds_available
        FROM hospital_capacity_history hch
        WHERE hch.timestamp <= p_timestamp
        ORDER BY hch.hospital_id, hch.timestamp DESC
    )
    SELECT 
        h.hospital_id,
        h.name,
        h.hospital_type,
        h.emergency_level,
        h.latitude,
        h.longitude,
        rc.icu_available,
        rc.emergency_beds_available
    FROM hospital h
    JOIN ranked_cap rc ON h.hospital_id = rc.hospital_id
    WHERE h.status = 'ACTIVE'
      AND rc.icu_available >= p_required_icu
    ORDER BY rc.icu_available DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Function: Calculate Resource Shortage for an Incident
CREATE OR REPLACE FUNCTION calculate_resource_shortage(p_incident_id VARCHAR)
RETURNS TABLE (
    resource_type VARCHAR,
    required_quantity BIGINT,
    assigned_quantity BIGINT,
    shortage_quantity BIGINT,
    shortage_status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH req AS (
        SELECT 
            p.required_resource AS req_type,
            COUNT(*) AS req_count
        FROM patient p
        WHERE p.incident_id = p_incident_id
        GROUP BY p.required_resource
    ),
    alloc AS (
        SELECT 
            ra.resource_type AS alloc_type,
            SUM(ra.quantity) AS alloc_count
        FROM resource_allocation ra
        WHERE ra.incident_id = p_incident_id AND ra.status = 'ACTIVE'
        GROUP BY ra.resource_type
    )
    SELECT 
        req.req_type::VARCHAR AS resource_type,
        req.req_count::BIGINT AS required_quantity,
        COALESCE(alloc.alloc_count, 0)::BIGINT AS assigned_quantity,
        GREATEST(0, req.req_count - COALESCE(alloc.alloc_count, 0))::BIGINT AS shortage_quantity,
        CASE 
            WHEN COALESCE(alloc.alloc_count, 0) >= req.req_count THEN 'FULFILLED'
            WHEN COALESCE(alloc.alloc_count, 0) = 0 THEN 'UNSERVED'
            ELSE 'PARTIAL_SHORTAGE'
        END::VARCHAR AS shortage_status
    FROM req
    LEFT JOIN alloc ON req.req_type = alloc.alloc_type;
END;
$$ LANGUAGE plpgsql;
