# TERA: Technology-Enabled Relational Architecture
## Enterprise Emergency Operations & Resource Coordination DBMS Engine

> **"Coordinate Every Resource. Respond When It Matters Most."**

[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Full--Stack%20Live-brightgreen?logo=vercel)](https://tera-one-ruby.vercel.app)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2015%2B%20%7C%203NF%2FBCNF-blue?logo=postgresql)](https://github.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.9%2B-teal?logo=fastapi)](https://github.com)
[![React](https://img.shields.io/badge/React%2018-TypeScript-61DAFB?logo=react)](https://github.com)

🔗 **Live Production URL**: [https://tera-one-ruby.vercel.app](https://tera-one-ruby.vercel.app)  
🔗 **Interactive OpenAPI/Swagger Docs**: [https://tera-one-ruby.vercel.app/docs](https://tera-one-ruby.vercel.app/docs)  
🔗 **Live EOC Telemetry Stream**: [https://tera-one-ruby.vercel.app/api/dashboard/metrics](https://tera-one-ruby.vercel.app/api/dashboard/metrics)

---

## 1. System Architecture

```text
                                 TERA COMMAND PLATFORM (React 18 + TS)
                                                  │
                                                  ▼
                                     FastAPI REST Layer (RBAC + JWT)
                                                  │
                                                  ▼
                                      SQLAlchemy 2.0 ORM Engine
                                                  │
                                                  ▼
                                      POSTGRESQL 15+ RELATIONAL DB
        ┌─────────────────────────┬───────────────┴───────────────┬─────────────────────────┐
        ▼                         ▼                               ▼                         ▼
  18 Relational Tables     Temporal Snapshot History      Composite B-Tree Indexes     Immutable Audit Logs
 (Hospitals, Incidents,    (Capacity, Location, Status,   (idx_hch_hospital_ts,        (log_id, user_id, action,
  Ambulances, Patients)     Resource, Road Histories)     idx_alh_amb_ts)               old_val, new_val)
```

TERA is a high-performance Emergency Operations Center (EOC) Decision-Support DBMS platform. It maintains real-time relational state across **18 normalized (3NF/BCNF) tables**, temporal audit histories, and composite B-tree indexes to manage multi-casualty disasters with strict ACID transaction guarantees.

---

## 2. Four Authentic User Roles & Role-Based Access Control (RBAC)

| Role | Username | Password | Dedicated Portal & Scope |
|---|---|---|---|
| **REPORTER** | `reporter` | `reporter123` | **Citizen Emergency Portal**: Streamlined interface to report live field emergencies with geolocation and casualty counts. Generates official tracking receipt and commits to PostgreSQL in `RECEIVED` state. |
| **CONTROL OPERATOR** | `operator` | `operator123` | **Emergency Operations Center (EOC)**: Live incident triage, workflow verification (`RECEIVED` &rarr; `VERIFIED` &rarr; `ACTIVE` &rarr; `CONTAINED` &rarr; `RESOLVED`), fleet dispatch, multi-hospital resource allocation engine with ACID transaction commit, disaster simulations. |
| **ADMINISTRATOR** | `admin` | `admin123` | **System Control Center**: User account management (`user_account` table CRUD), role assignment, master data management, system diagnostics, and immutable audit logs review. |
| **ANALYST** | `analyst` | `analyst123` | **Analytics & Intelligence Center**: Read-only temporal state reconstruction (time-travel), cross-hospital utilization trends, SQL Query Playground with query cost inspection (`EXPLAIN`), dynamic database explorer. |

*Note: The top header includes an instant **Role Switcher** that authenticates with `/api/auth/login` and issues signed JWT tokens.*

---

## 3. Strict Permission Matrix (Enforced in Backend & Frontend)

| Feature / Action | REPORTER | CONTROL OPERATOR | ADMINISTRATOR | ANALYST |
|---|:---:|:---:|:---:|:---:|
| **Submit Emergency Report** | ✅ YES | ✅ YES | ✅ YES | ❌ NO |
| **Verify / Transition Incident Status** | ❌ NO | ✅ YES | ✅ YES | ❌ NO |
| **Dispatch Ambulance Fleet** | ❌ NO | ✅ YES | ✅ YES | ❌ NO |
| **Run & Commit Allocation Engine** | ❌ NO | ✅ YES | ✅ YES | ❌ NO |
| **Run What-If Disaster Simulation** | ❌ NO | ✅ YES | ✅ YES | ❌ NO |
| **User Account Management (CRUD)** | ❌ NO | ❌ NO | ✅ YES | ❌ NO |
| **Master Hospital / Road CRUD** | ❌ NO | ❌ NO | ✅ YES | ❌ NO |
| **Temporal Time-Travel Reconstruction** | ❌ NO | ✅ YES | ✅ YES | ✅ YES |
| **Database Explorer & Schema Inspector** | ❌ NO | ✅ YES | ✅ YES | ✅ YES |
| **SQL Query Console (SELECT / CTE / EXPLAIN)** | ❌ NO | ❌ NO | ✅ YES | ✅ YES |
| **Immutable Audit Trail Review** | ❌ NO | ❌ NO | ✅ YES | 👁️ READ-ONLY |

---

## 4. Controlled Incident Status State Machine

```text
       [Citizen Report]
              │
              ▼
          RECEIVED
              │  (EOC Operator Triage)
              ▼
          VERIFIED
              │  (Dispatch Units)
              ▼
           ACTIVE
              │  (Hazards Mitigated)
              ▼
          CONTAINED
              │  (All Patients Admitted)
              ▼
          RESOLVED
```

---

## 5. PostgreSQL Local Setup & Run Guide

### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/your-username/tera.git
cd tera
cp .env.example .env
```

### Step 2: Create PostgreSQL Database
Ensure PostgreSQL 14/15/16 is running on your system:
```bash
createdb tera_db
```

Update your `.env` file with your PostgreSQL connection string:
```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tera_db
SECRET_KEY=tera_super_secret_eoc_master_key_2026_production
```

### Step 3: Backend Setup & Automated Seeding
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run automated tests
PYTHONPATH=. venv/bin/pytest tests/

# Start FastAPI server on port 8000
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 4: Frontend Setup (React 18 + Vite)
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 6. Comprehensive 26-Step DBMS Viva Presentation Demonstration

| Step | User Role | Action | What to Explain to the Examiner |
|---|---|---|---|
| **1** | Public | Open `http://localhost:3000` | Landing page explaining TERA: Technology-Enabled Relational Architecture. |
| **2** | Reporter | Click **Report an Emergency** | Dedicated Citizen Reporting portal with GPS and field casualty inputs. |
| **3** | Reporter | Fill form & Click **Transmit Emergency Report** | Generates real PostgreSQL row in `incident` with status `RECEIVED` and triage patient rows. |
| **4** | Reporter | View receipt | Explain tracking code and that sensitive EOC telemetry is protected from citizen view. |
| **5** | Switch Role | Click **OPERATOR** in top header | Demonstrates live JWT token exchange and role transition to `CONTROL_OPERATOR`. |
| **6** | Operator | Go to **EOC Live Dashboard** | Notice live KPI cards update with real database metrics from PostgreSQL. |
| **7** | Operator | Click top-right **Load Disaster Scenario** | Seeds 4 simultaneous multi-casualty incidents with 49 triaged patients. |
| **8** | Operator | Open **Incidents & Triage Matrix** | View the newly reported incident with status `RECEIVED`. |
| **9** | Operator | Click row & open **Detail Drawer** | Demonstrates deep relational attribute inspection and foreign key associations. |
| **10** | Operator | Transition status: `RECEIVED` &rarr; `VERIFIED` &rarr; `ACTIVE` | Demonstrates state machine constraint enforcement and audit logging. |
| **11** | Operator | Open **Fleet Ambulances** | Dispatch available ambulances to active incident coordinates. |
| **12** | Operator | Open **Hospitals & Beds** | Inspect real-time ICU occupancy load percentages. |
| **13** | Operator | Open **Resource Allocation Engine** | Select active incident, review capacity constraint checks across hospitals. |
| **14** | Operator | Click **Solve Allocation** | Algorithmic matching considering distance, trauma level, and bed availability. |
| **15** | Operator | Click **Commit Allocation** | Executes atomic PostgreSQL transaction modifying 5 tables with automatic rollback on failure. |
| **16** | Operator | Open **Disaster Simulation** | Toggle off a major hospital and block a road; run what-if rerouting calculations. |
| **17** | Switch Role | Click **ADMIN** in top header | Transitions to `ADMINISTRATOR` role. |
| **18** | Admin | Open **User & Audit Control** | View `user_account` relational table; create a new user; toggle active status. |
| **19** | Admin | View **System Audit Trail** | Inspect immutable change logs with JSON payload diffs. |
| **20** | Admin | Open **DBMS Architecture** | Interactive visual catalog of all 18 tables, PK, FK, and 1:N / M:N relationships. |
| **21** | Admin | View Normalization Tab | Explain 1NF, 2NF, 3NF, and BCNF proofs across candidate keys. |
| **22** | Switch Role | Click **ANALYST** in top header | Transitions to `ANALYST` role. |
| **23** | Analyst | Open **Temporal Intelligence** | Pick timestamp (e.g. 19:30), click **Reconstruct State** to time-travel system history. |
| **24** | Analyst | Open **SQL Query Console** | Load preset **4. Multi-Table CTE for Resource Criticality**, execute query. |
| **25** | Analyst | Run malicious `DROP TABLE hospital;` query | Show read-only query guard blocking destructive arbitrary SQL. |
| **26** | Analyst | Open **Performance & EXPLAIN** | Inspect EXPLAIN query optimizer plan and composite B-tree index scans. |

---

## 7. Directory Structure

```text
tera/
├── frontend/                     # React 18 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Header, Sidebar, EmergencyMap, DetailDrawer, ErrorState
│   │   ├── pages/                # Dashboard, Entities, ReporterPortal, DBMSArchitecture,
│   │   │                         # Historical, Allocation, Simulation, Analytics, SQL Playground,
│   │   │                         # Performance, Explorer, AdminUserManagement
│   │   ├── services/             # Axios typed API client (authApi, sqlApi, incidentsApi, etc.)
│   │   └── types/                # TypeScript interfaces
│   └── package.json
├── backend/                      # FastAPI + SQLAlchemy 2.0
│   ├── app/
│   │   ├── api/                  # 15 REST API routers with RBAC dependencies
│   │   ├── database/             # PostgreSQL engine & session management
│   │   ├── models/               # 18+ SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic V2 schemas
│   │   └── services/             # Security, Seed, Audit, Temporal, Allocation, Simulation
│   └── tests/                    # Pytest automated test suite (16 passing tests)
├── database/                     # SQL Scripts
│   ├── schema.sql                # 3NF/BCNF DDL with constraints
│   ├── indexes.sql               # B-Tree composite indexes
│   ├── views.sql                 # Operational & analytical views
│   ├── functions.sql             # Temporal reconstruction stored functions
│   ├── triggers.sql              # Audit logging triggers
│   └── queries.sql               # CTEs, Window functions, JOIN showcase
├── .env.example                  # PostgreSQL connection template
└── README.md
```
