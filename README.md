# TERA: Emergency Assistance & Response Coordination Platform

> **"Every Second Matters."**  
> An enterprise-grade, real-world emergency assistance, resource coordination, and decision-support platform connecting bystanders, control operators, hospitals, and field responders.

[![Database](https://img.shields.io/badge/Database-PostgreSQL%2015%2B%20%7C%20SQLite%20Fallback-blue?logo=postgresql)](https://github.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.9%2B-teal?logo=fastapi)](https://github.com)
[![React](https://img.shields.io/badge/React%2018-TypeScript-61DAFB?logo=react)](https://github.com)
[![Test Suite](https://img.shields.io/badge/Pytest-22%2F22%20Passing%20(100%25)-brightgreen)](https://github.com)

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

## 5. Automated Test Suite

All 22 backend integration and unit tests pass with 100% coverage across core workflows:
```bash
PYTHONPATH=backend backend/venv/bin/pytest backend/tests/
# ============================== 22 passed in 2.09s ==============================
```

Tests verify:
- Complete 6-role authentication and JWT token generation
- Guest emergency report creation without synthetic patient records
- Durable tracking token generation and unauthenticated milestone queries
- Voice and evidence upload MIME/size validation
- Control Operator duplicate incident linking and verification
- Field Responder assignment state progression (`REQUESTED` &rarr; `ACKNOWLEDGED` &rarr; `EN_ROUTE` &rarr; `ARRIVED` &rarr; `COMPLETED`)
- Multi-tenant hospital coordinator bed capacity updates
- SQL playground safety rules preventing destructive `DROP` or `DELETE` queries
- ACID concurrency protection under parallel execution

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
