# TERA Relational Database Schema Specification

This document details the relational tables, column definitions, data types, constraints, and normalization decisions for the **TERA (Temporal Emergency Resource Allocation & Coordination System)** database.

---

## 1. Summary of Tables

| # | Table Name | Purpose | Normal Form |
|---|---|---|---|
| 1 | `user_account` | Role-based system access credentials | BCNF |
| 2 | `incident` | Core emergency incident events | 3NF |
| 3 | `patient` | Individual casualty triage records linked to incidents | 3NF |
| 4 | `ambulance` | Mobile emergency fleet vehicle inventory | BCNF |
| 5 | `ambulance_location_history` | Temporal GPS telemetry & trajectory points | 3NF |
| 6 | `ambulance_status_history` | Temporal state interval transitions | 3NF |
| 7 | `hospital` | Medical trauma facilities and center coordinates | BCNF |
| 8 | `hospital_capacity_history` | Temporal ICU & emergency bed snapshots | 3NF |
| 9 | `resource` | Hospital critical medical supplies inventory | 3NF |
| 10 | `resource_history` | Temporal consumption audit logs | 3NF |
| 11 | `road` | Transport corridor segments | BCNF |
| 12 | `road_status_history` | Temporal congestion and blockage logs | 3NF |
| 13 | `emergency_team` | Specialized trauma, hazmat, and rescue squads | 3NF |
| 14 | `team_status_history` | Temporal deployment records for squads | 3NF |
| 15 | `resource_allocation` | Multi-resource assignments to incidents | 3NF |
| 16 | `hospital_assignment` | Patient routing records with arrival times | 3NF |
| 17 | `simulation_scenario` | Isolated what-if disaster test configurations | 3NF |
| 18 | `simulation_result` | Calculated reallocation plans from simulations | 3NF |

---

## 2. Table Schemas & Integrity Constraints

### 2.1 `incident`
- `incident_id` `VARCHAR(64)` **PRIMARY KEY**
- `incident_type` `VARCHAR(64)` **NOT NULL** `CHECK (incident_type IN ('ROAD_ACCIDENT', 'BUILDING_FIRE', 'FLOOD', 'INDUSTRIAL_ACCIDENT', 'NATURAL_DISASTER', 'MASS_CASUALTY', 'HAZMAT', 'STRUCTURAL_COLLAPSE'))`
- `description` `TEXT` **NOT NULL**
- `severity` `VARCHAR(16)` **NOT NULL** `CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))`
- `latitude` `NUMERIC(9,6)` **NOT NULL**
- `longitude` `NUMERIC(9,6)` **NOT NULL**
- `location_name` `VARCHAR(255)` **NOT NULL**
- `occurred_at` `TIMESTAMPTZ` **NOT NULL**
- `reported_at` `TIMESTAMPTZ` **NOT NULL**
- `status` `VARCHAR(32)` **NOT NULL** `CHECK (status IN ('REPORTED', 'ACTIVE', 'CONTAINED', 'RESOLVED', 'CANCELLED'))`
- `estimated_patient_count` `INT` **NOT NULL** `CHECK (estimated_patient_count >= 0)`
- `created_at` `TIMESTAMPTZ` **NOT NULL**
- `updated_at` `TIMESTAMPTZ` **NOT NULL**

### 2.2 `hospital`
- `hospital_id` `VARCHAR(64)` **PRIMARY KEY**
- `name` `VARCHAR(255)` **NOT NULL**
- `hospital_type` `VARCHAR(64)` **NOT NULL**
- `latitude` `NUMERIC(9,6)` **NOT NULL**
- `longitude` `NUMERIC(9,6)` **NOT NULL**
- `emergency_level` `VARCHAR(16)` **NOT NULL** `CHECK (emergency_level IN ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'COMMUNITY'))`
- `contact_placeholder` `VARCHAR(100)` **NOT NULL**
- `status` `VARCHAR(32)` **NOT NULL** `CHECK (status IN ('ACTIVE', 'OVERWHELMED', 'EVACUATING', 'INACTIVE'))`
- `created_at` `TIMESTAMPTZ` **NOT NULL**

### 2.3 `hospital_capacity_history` (Temporal Snapshot)
- `capacity_history_id` `VARCHAR(64)` **PRIMARY KEY**
- `hospital_id` `VARCHAR(64)` **REFERENCES** `hospital(hospital_id) ON DELETE CASCADE`
- `timestamp` `TIMESTAMPTZ` **NOT NULL**
- `icu_total` `INT` **NOT NULL** `CHECK (icu_total >= 0)`
- `icu_available` `INT` **NOT NULL** `CHECK (icu_available >= 0 AND icu_available <= icu_total)`
- `emergency_beds_total` `INT` **NOT NULL** `CHECK (emergency_beds_total >= 0)`
- `emergency_beds_available` `INT` **NOT NULL** `CHECK (emergency_beds_available >= 0 AND emergency_beds_available <= emergency_beds_total)`
- `general_beds_total` `INT` **NOT NULL**
- `general_beds_available` `INT` **NOT NULL**

### 2.4 `ambulance` & `ambulance_location_history`
- `ambulance_id` `VARCHAR(64)` **PRIMARY KEY**
- `registration_number` `VARCHAR(32)` **UNIQUE NOT NULL**
- `ambulance_type` `VARCHAR(32)` **NOT NULL** `CHECK (ambulance_type IN ('ALS', 'BLS', 'NEONATAL', 'HAZMAT_PARAMEDIC', 'PATIENT_TRANSPORT'))`
- `capacity` `INT` **NOT NULL** `CHECK (capacity >= 1)`
- `home_hospital_id` `VARCHAR(64)` **REFERENCES** `hospital(hospital_id) ON DELETE SET NULL`
- `current_status` `VARCHAR(32)` **NOT NULL** `CHECK (current_status IN ('AVAILABLE', 'DISPATCHED', 'TRANSPORTING', 'MAINTENANCE', 'OFFLINE'))`
