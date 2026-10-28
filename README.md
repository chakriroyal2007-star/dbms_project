# TERA: Temporal Emergency Resource Allocation & Coordination Platform

> **"Every Second Matters. Every Life Matters."**  
> An enterprise-grade, real-world emergency assistance, resource coordination, and decision-support platform connecting bystanders, control operators, hospitals, and field responders.

[![Database](https://img.shields.io/badge/Database-PostgreSQL%2015%2B%20%7C%20SQLite%20Fallback-blue?logo=postgresql)](https://github.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.9%2B-teal?logo=fastapi)](https://github.com)
[![React](https://img.shields.io/badge/React%2018-TypeScript-61DAFB?logo=react)](https://github.com)
[![Test Suite](https://img.shields.io/badge/Pytest-90%2F90%20Passing%20(100%25)-brightgreen)](https://github.com)
[![Frontend Tests](https://img.shields.io/badge/Vitest-21%2F21%20Passing%20(100%25)-brightgreen)](https://github.com)

---

## 1. System Vision & Workflow

TERA connects the four critical parts of emergency response:

1. **People witnessing or experiencing emergencies** (Bystanders / Citizens): Rapid reporting, voice recording, live GPS accuracy verification, durable tracking code, and medically reviewed step-by-step first-aid guidance.
2. **Emergency Control Operators** (EOC Command Center): Reviewing incoming incident reports, reviewing voice transcripts and scene evidence, linking duplicates, verifying emergencies, and coordinating dispatch with concurrency protection.
3. **Hospital Coordinators** (TERA Network): Maintaining real-time ICU, Emergency, and General bed availability, acknowledging referrals, and providing facility status.
4. **Authorized Field Responders** (Ambulance Crews & Paramedics): Receiving assigned missions, managing 4-stage progression (`Acknowledge` &rarr; `En Route` &rarr; `On Scene` &rarr; `Handover`), and routing via GPS.

---

## 2. Netflix-Inspired Cinematic Role Selection & Portal Matrix

On launch, TERA presents a cinematic profile selection experience with six customized illustrated role cards:

| # | Role Profile | Subsystem | Scope & Capabilities |
|---|---|---|---|
| 1 | **Public Reporter** | `TERA Assist` | Rapid mobile-first bystander reporting (voice notes, photo evidence, GPS accuracy, unknown casualty reporting), persistent `TRK-...` tracking codes, interactive first-aid decision trees, and Good Samaritan legal protections. No account required for guest SOS reports. |
| 2 | **Control Operator** | `TERA Command` | EOC Triage board, incoming reports queue, voice audio review, scene photo inspector, duplicate incident linking, report verification, fleet dispatch, and allocation engine. |
| 3 | **Hospital Coordinator** | `TERA Network` | Multi-tenant hospital organization management, real-time ICU and trauma bed availability adjustments, and facility status controls. |
| 4 | **Field Responder** | `TERA Network` | Live ambulance crew mission dashboard with 4-stage progression buttons (`Acknowledge`, `En Route`, `On Scene`, `Handover`), GPS directions, and incident detail inspection. |
| 5 | **Operational Analyst** | `TERA Insights` | Temporal time-travel reconstruction, capacity utilization trends, query optimization (`EXPLAIN`), and resource contention analytics. |
| 6 | **System Administrator** | `TERA Admin` | User account lifecycle management, organization multi-tenancy, system health indicators, and immutable database audit logs. |

---

## 3. Core Architectural Highlights

- **Zero Fabricated Data**: No synthetic patient ages, diagnoses, or fictitious fleet coordinates are invented. Unknown information is explicitly marked as unknown.
- **Durable Incident Tracking**: Every submitted report receives an unpredictable tracking code (`TRK-...`) persisted in the database. Anyone with the code can track live milestone progress and access medically reviewed first-aid guidance without logging in (`GET /incidents/track/{code}`).
- **Speech-to-Text & Evidence Pipeline**: Secure audio recording (`MediaRecorder` API) and photo evidence uploads (`POST /api/evidence/upload`) validated by MIME type and size limits, integrated with transcription boundaries.
- **Strict RBAC & Multi-Tenant Authorization**: Protected endpoints verify user roles and organization ownership (`organization_id`). Client-side role claims cannot escalate permissions.
- **ACID-Compliant Relational Schema**: 19 normalized tables, composite B-tree indexes, temporal snapshot history, and foreign keys.

---

## 4. Quickstart & Local Setup

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm
- PostgreSQL 15+ (or built-in SQLite for local evaluation)

### 1. Clone & Configure
```bash
git clone git@github.com:chakriroyal2007-star/dbms_project.git
cd dbms_project
cp .env.example .env
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python3 -m venv backend/venv
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations (adds tracking and organization tables)
python backend/migrate.py

# Run test suite
PYTHONPATH=backend pytest backend/tests/
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Automated Test Suite & Academic Verification

All 90 backend pytest tests and all 21 frontend RBAC/queue synchronization tests pass with 100% coverage:

```bash
# Run 90 backend tests
PYTHONPATH=backend ./backend/.venv/bin/pytest backend/tests/ -v
# ======================== 90 passed in 3.44s =========================

# Run 21 frontend tests
cd frontend && npm test
# 🎉 All 14 Frontend Routing & RBAC tests passed successfully!
# 🎉 All 7 Frontend Operator Queue & Synchronization tests passed successfully!
```

Comprehensive test suites verify:
- **DBMS Mini Project Criteria** (`test_dbms_mini_project_requirements.py` - 15 tests): 4 core workflows, 3NF constraints, 3 nontrivial business rules, multi-tenant RBAC across 6 roles, ACID transaction rollback, multi-table SQL JOINs, and GROUP BY reports.
- **Reporter-to-Operator Synchronization** (`test_reporter_operator_data_flow.py` - 10 tests): Guest ingestion, atomic DB commit, immediate pre-verification operator visibility, idempotency deduplication, and polling reconciliation.
- **Full Production Workflows** (`test_production_workflows.py`, `test_master_e2e_workflow.py`): Referral tracking, bed capacity updates, hospital coordination, and voice transcription error boundaries.

---

## 6. Academic DBMS Submission Artifacts

Complete project documentation complying with the **DBMS Mini Project (20 Marks)** evaluation rubric:
- [DBMS Mini Project Submission Report (20 Marks)](docs/DBMS_SUBMISSION_REPORT.md)
- [Entity-Relationship (ER) Diagram](docs/ER_DIAGRAM.md)
- [Relational Database Schema & 3NF Normalization](docs/SCHEMA.md)
- [Comprehensive Engineering Project Report](docs/PROJECT_REPORT.md)

---

## 6. Seed Credentials for Local Testing

| Role | Username | Password |
|---|---|---|
| System Administrator | `admin` | `admin123` |
| Control Operator | `operator` | `operator123` |
| Hospital Coordinator | `hospital_coord` | `hospital123` |
| Field Responder | `responder` | `responder123` |
| Operational Analyst | `analyst` | `analyst123` |
| Citizen Reporter | `reporter` | `reporter123` |

*(Note: Public bystanders can also report emergencies directly as Guests without creating an account or logging in.)*
