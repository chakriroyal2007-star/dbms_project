-- =============================================================================
-- TERA: Temporal Emergency Resource Allocation & Coordination System
-- Database Schema DDL (PostgreSQL Compatible)
-- Target Normal Form: 3NF / BCNF
-- =============================================================================

-- Drop tables if existing (in reverse dependency order)
DROP TABLE IF EXISTS simulation_result CASCADE;
DROP TABLE IF EXISTS simulation_scenario CASCADE;
DROP TABLE IF EXISTS hospital_assignment CASCADE;
DROP TABLE IF EXISTS resource_allocation CASCADE;
DROP TABLE IF EXISTS team_status_history CASCADE;
DROP TABLE IF EXISTS emergency_team CASCADE;
DROP TABLE IF EXISTS road_status_history CASCADE;
DROP TABLE IF EXISTS road CASCADE;
DROP TABLE IF EXISTS resource_history CASCADE;
DROP TABLE IF EXISTS resource CASCADE;
DROP TABLE IF EXISTS hospital_capacity_history CASCADE;
DROP TABLE IF EXISTS hospital CASCADE;
DROP TABLE IF EXISTS ambulance_status_history CASCADE;
DROP TABLE IF EXISTS ambulance_location_history CASCADE;
DROP TABLE IF EXISTS ambulance CASCADE;
DROP TABLE IF EXISTS patient CASCADE;
DROP TABLE IF EXISTS incident CASCADE;
DROP TABLE IF EXISTS user_account CASCADE;

-- -----------------------------------------------------------------------------
-- 1. USER_ACCOUNT (Role-based system access)
-- -----------------------------------------------------------------------------
CREATE TABLE user_account (
    user_id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('ADMIN', 'ADMINISTRATOR', 'CONTROL_OPERATOR', 'ANALYST', 'REPORTER')),
    full_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- 2. INCIDENT (Core emergency event entity)
-- -----------------------------------------------------------------------------
CREATE TABLE incident (
    incident_id VARCHAR(64) PRIMARY KEY,
    reporter_id VARCHAR(64) REFERENCES user_account(user_id) ON DELETE SET NULL,
    incident_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    country VARCHAR(64) NOT NULL DEFAULT 'India',
    state VARCHAR(64) NOT NULL DEFAULT 'Andhra Pradesh',
    district VARCHAR(64) NOT NULL DEFAULT 'Tirupati',
    city VARCHAR(64) NOT NULL DEFAULT 'Tirupati',
    locality VARCHAR(100),
    landmark VARCHAR(150),
    location_name VARCHAR(255) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'VERIFIED', 'ACTIVE', 'CONTAINED', 'RESOLVED', 'REJECTED', 'CANCELLED')),
    estimated_patient_count INT NOT NULL DEFAULT 1 CHECK (estimated_patient_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. HOSPITAL (Medical facility entity)
-- -----------------------------------------------------------------------------
CREATE TABLE hospital (
    hospital_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hospital_type VARCHAR(64) NOT NULL CHECK (hospital_type IN ('GOVERNMENT_GENERAL', 'TRAUMA_CENTER_LEVEL_1', 'TRAUMA_CENTER_LEVEL_2', 'DISTRICT_HOSPITAL', 'SPECIALTY_SURGICAL', 'PRIVATE_MULTI_SPECIALTY')),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    emergency_level VARCHAR(16) NOT NULL CHECK (emergency_level IN ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'COMMUNITY')),
    contact_placeholder VARCHAR(100) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'OVERWHELMED', 'EVACUATING', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. PATIENT (Triage entity associated with incidents)
-- -----------------------------------------------------------------------------
CREATE TABLE patient (
    patient_id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incident(incident_id) ON DELETE CASCADE,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('CRITICAL', 'SERIOUS', 'MODERATE', 'MINOR')),
    age INT CHECK (age >= 0 AND age <= 130),
    required_resource VARCHAR(64) NOT NULL CHECK (required_resource IN ('ICU_BED', 'EMERGENCY_BED', 'VENTILATOR', 'SURGERY', 'BURN_UNIT', 'OXYGEN', 'BLOOD_TRANSFUSION', 'GENERAL_OBSERVATION')),
    assigned_hospital_id VARCHAR(64) REFERENCES hospital(hospital_id) ON DELETE SET NULL,
    transport_status VARCHAR(32) NOT NULL DEFAULT 'AWAITING_TRIAGE' CHECK (transport_status IN ('AWAITING_TRIAGE', 'AMBULANCE_DISPATCHED', 'IN_TRANSIT', 'ARRIVED_AT_HOSPITAL', 'TREATED', 'DECEASED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. AMBULANCE (Mobile emergency response unit)
-- -----------------------------------------------------------------------------
CREATE TABLE ambulance (
    ambulance_id VARCHAR(64) PRIMARY KEY,
    registration_number VARCHAR(32) NOT NULL UNIQUE,
    ambulance_type VARCHAR(32) NOT NULL CHECK (ambulance_type IN ('ALS', 'BLS', 'NEONATAL', 'HAZMAT_PARAMEDIC', 'PATIENT_TRANSPORT')),
    capacity INT NOT NULL DEFAULT 1 CHECK (capacity >= 1),
    home_hospital_id VARCHAR(64) REFERENCES hospital(hospital_id) ON DELETE SET NULL,
    current_status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' CHECK (current_status IN ('AVAILABLE', 'DISPATCHED', 'TRANSPORTING', 'MAINTENANCE', 'OFFLINE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 6. AMBULANCE_LOCATION_HISTORY (Temporal GPS trajectory logs)
-- -----------------------------------------------------------------------------
CREATE TABLE ambulance_location_history (
    location_id VARCHAR(64) PRIMARY KEY,
    ambulance_id VARCHAR(64) NOT NULL REFERENCES ambulance(ambulance_id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    speed NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (speed >= 0),
    status VARCHAR(32) NOT NULL CHECK (status IN ('AVAILABLE', 'DISPATCHED', 'TRANSPORTING', 'MAINTENANCE', 'OFFLINE'))
);

-- -----------------------------------------------------------------------------
-- 7. AMBULANCE_STATUS_HISTORY (Temporal state transition interval records)
-- -----------------------------------------------------------------------------
CREATE TABLE ambulance_status_history (
    status_history_id VARCHAR(64) PRIMARY KEY,
    ambulance_id VARCHAR(64) NOT NULL REFERENCES ambulance(ambulance_id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL CHECK (status IN ('AVAILABLE', 'DISPATCHED', 'TRANSPORTING', 'MAINTENANCE', 'OFFLINE')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    reason TEXT,
    CONSTRAINT chk_ambulance_status_time CHECK (end_time IS NULL OR end_time >= start_time)
);

-- -----------------------------------------------------------------------------
-- 8. HOSPITAL_CAPACITY_HISTORY (Temporal hospital bed capacity snapshots)
-- -----------------------------------------------------------------------------
CREATE TABLE hospital_capacity_history (
    capacity_history_id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL REFERENCES hospital(hospital_id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    icu_total INT NOT NULL CHECK (icu_total >= 0),
    icu_available INT NOT NULL CHECK (icu_available >= 0 AND icu_available <= icu_total),
    emergency_beds_total INT NOT NULL CHECK (emergency_beds_total >= 0),
    emergency_beds_available INT NOT NULL CHECK (emergency_beds_available >= 0 AND emergency_beds_available <= emergency_beds_total),
    general_beds_total INT NOT NULL CHECK (general_beds_total >= 0),
    general_beds_available INT NOT NULL CHECK (general_beds_available >= 0 AND general_beds_available <= general_beds_total)
);

-- -----------------------------------------------------------------------------
-- 9. RESOURCE (Hospital stock inventory for critical supplies)
-- -----------------------------------------------------------------------------
CREATE TABLE resource (
    resource_id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL REFERENCES hospital(hospital_id) ON DELETE CASCADE,
    resource_type VARCHAR(64) NOT NULL CHECK (resource_type IN ('BLOOD_O_NEG', 'BLOOD_A_POS', 'BLOOD_B_POS', 'VENTILATOR', 'OXYGEN_CYLINDERS', 'SURGICAL_KIT', 'BURN_KIT', 'DEFIBRILLATOR', 'HAZMAT_SUIT')),
    total_quantity INT NOT NULL CHECK (total_quantity >= 0),
    available_quantity INT NOT NULL CHECK (available_quantity >= 0 AND available_quantity <= total_quantity),
    critical_threshold INT NOT NULL CHECK (critical_threshold >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'ADEQUATE' CHECK (status IN ('ADEQUATE', 'LOW', 'CRITICAL', 'DEPLETED')),
    CONSTRAINT uq_hospital_resource UNIQUE (hospital_id, resource_type)
);

-- -----------------------------------------------------------------------------
-- 10. RESOURCE_HISTORY (Temporal resource consumption audit logs)
-- -----------------------------------------------------------------------------
CREATE TABLE resource_history (
    resource_history_id VARCHAR(64) PRIMARY KEY,
    resource_id VARCHAR(64) NOT NULL REFERENCES resource(resource_id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    quantity_available INT NOT NULL CHECK (quantity_available >= 0),
    change_amount INT NOT NULL,
    change_reason TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- 11. ROAD (Emergency corridor transport network)
-- -----------------------------------------------------------------------------
CREATE TABLE road (
    road_id VARCHAR(64) PRIMARY KEY,
    road_name VARCHAR(255) NOT NULL,
    source_location VARCHAR(255) NOT NULL,
    destination_location VARCHAR(255) NOT NULL,
    distance_km NUMERIC(6, 2) NOT NULL CHECK (distance_km > 0),
    road_type VARCHAR(32) NOT NULL CHECK (road_type IN ('EXPRESSWAY', 'ARTERIAL_HIGHWAY', 'PRIMARY_URBAN', 'SECONDARY_ROAD', 'BRIDGE_TUNNEL')),
    start_lat NUMERIC(9, 6) NOT NULL,
    start_lng NUMERIC(9, 6) NOT NULL,
    end_lat NUMERIC(9, 6) NOT NULL,
    end_lng NUMERIC(9, 6) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 12. ROAD_STATUS_HISTORY (Temporal traffic congestion and blockage logs)
-- -----------------------------------------------------------------------------
CREATE TABLE road_status_history (
    road_status_id VARCHAR(64) PRIMARY KEY,
    road_id VARCHAR(64) NOT NULL REFERENCES road(road_id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    traffic_level VARCHAR(16) NOT NULL CHECK (traffic_level IN ('LOW', 'MEDIUM', 'HIGH', 'SEVERE')),
    average_speed NUMERIC(5, 2) NOT NULL CHECK (average_speed >= 0),
    blocked BOOLEAN NOT NULL DEFAULT FALSE
);

-- -----------------------------------------------------------------------------
-- 13. EMERGENCY_TEAM (Rapid response specialist squads)
-- -----------------------------------------------------------------------------
CREATE TABLE emergency_team (
    team_id VARCHAR(64) PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(64) NOT NULL CHECK (specialization IN ('TRAUMA_SURGICAL', 'HAZMAT_DECONTAMINATION', 'SEARCH_RESCUE', 'CARDIAC_RESPONSE', 'BURN_DISASTER_CARE', 'PEDIATRIC_TRIAGE')),
    capacity INT NOT NULL DEFAULT 5 CHECK (capacity >= 1),
    home_hospital_id VARCHAR(64) REFERENCES hospital(hospital_id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'DEPLOYED', 'STANDBY', 'RESTING', 'UNAVAILABLE'))
);

-- -----------------------------------------------------------------------------
-- 14. TEAM_STATUS_HISTORY (Temporal deployment records for emergency teams)
-- -----------------------------------------------------------------------------
CREATE TABLE team_status_history (
    team_status_id VARCHAR(64) PRIMARY KEY,
    team_id VARCHAR(64) NOT NULL REFERENCES emergency_team(team_id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('AVAILABLE', 'DEPLOYED', 'STANDBY', 'RESTING', 'UNAVAILABLE'))
);

-- -----------------------------------------------------------------------------
-- 15. RESOURCE_ALLOCATION (Allocations linked to incidents)
-- -----------------------------------------------------------------------------
CREATE TABLE resource_allocation (
    allocation_id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incident(incident_id) ON DELETE CASCADE,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMPTZ,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('REQUESTED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'RELEASED')),
    CONSTRAINT chk_alloc_time CHECK (released_at IS NULL OR released_at >= allocated_at)
);

-- -----------------------------------------------------------------------------
-- 16. HOSPITAL_ASSIGNMENT (Patient-to-Hospital routing records)
-- -----------------------------------------------------------------------------
CREATE TABLE hospital_assignment (
    assignment_id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incident(incident_id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES patient(patient_id) ON DELETE CASCADE,
    hospital_id VARCHAR(64) NOT NULL REFERENCES hospital(hospital_id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    arrival_time TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'DISPATCHED' CHECK (status IN ('DISPATCHED', 'ADMITTED', 'DIVERTED', 'TRANSFERRED', 'COMPLETED')),
    CONSTRAINT chk_assignment_time CHECK (arrival_time IS NULL OR arrival_time >= assigned_at)
);

-- -----------------------------------------------------------------------------
-- 17. SIMULATION_SCENARIO & RESULTS (What-if modeling storage)
-- -----------------------------------------------------------------------------
CREATE TABLE simulation_scenario (
    scenario_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    incident_type VARCHAR(64) NOT NULL,
    patient_count INT NOT NULL,
    severity VARCHAR(16) NOT NULL,
    disabled_hospital_ids TEXT NOT NULL DEFAULT '',
    blocked_road_ids TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE simulation_result (
    result_id VARCHAR(64) PRIMARY KEY,
    scenario_id VARCHAR(64) NOT NULL REFERENCES simulation_scenario(scenario_id) ON DELETE CASCADE,
    total_patients INT NOT NULL,
    allocated_patients INT NOT NULL,
    unallocated_patients INT NOT NULL,
    icu_allocated INT NOT NULL,
    emergency_beds_allocated INT NOT NULL,
    average_eta_minutes NUMERIC(5, 2) NOT NULL,
    allocation_plan_json JSON NOT NULL,
    execution_time_ms NUMERIC(6, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
