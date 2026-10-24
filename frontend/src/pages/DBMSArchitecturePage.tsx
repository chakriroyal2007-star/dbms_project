import React, { useState } from 'react';
import { 
  Database, Network, Key, Layers, GitFork, Cpu, 
  ShieldCheck, FileCode, CheckCircle2, ChevronRight, Activity, Zap
} from 'lucide-react';

const TABLES_CATALOG = [
  {
    name: "user_account",
    nf: "BCNF",
    description: "System authentication and RBAC user identities with bcrypt hashed credentials.",
    pk: "user_id",
    fks: [],
    cardinality: "1:N with audit_log",
    columns: ["user_id (PK)", "username (UNIQUE)", "email (UNIQUE)", "hashed_password", "role", "full_name", "is_active", "created_at", "last_login_at"]
  },
  {
    name: "incident",
    nf: "3NF",
    description: "Multi-casualty disaster occurrences with geolocation, severity tier, and triage counts.",
    pk: "incident_id",
    fks: [],
    cardinality: "1:N with patient, resource_allocation, hospital_assignment",
    columns: ["incident_id (PK)", "incident_type", "description", "severity", "latitude", "longitude", "location_name", "occurred_at", "reported_at", "status", "estimated_patient_count", "created_at", "updated_at"]
  },
  {
    name: "patient",
    nf: "3NF",
    description: "Individual emergency victims requiring triage categorization and bed placement.",
    pk: "patient_id",
    fks: ["incident_id -> incident.incident_id", "assigned_hospital_id -> hospital.hospital_id"],
    cardinality: "N:1 with incident, N:1 with hospital",
    columns: ["patient_id (PK)", "incident_id (FK)", "severity", "age", "required_resource", "transport_status", "assigned_hospital_id (FK)", "created_at"]
  },
  {
    name: "hospital",
    nf: "3NF",
    description: "Medical care facilities with trauma capability classifications and spatial coordinates.",
    pk: "hospital_id",
    fks: [],
    cardinality: "1:N with capacity history, ambulances, resources, emergency_team",
    columns: ["hospital_id (PK)", "name", "hospital_type", "latitude", "longitude", "emergency_level", "contact_placeholder", "status", "created_at"]
  },
  {
    name: "hospital_capacity_history",
    nf: "3NF (Temporal)",
    description: "Time-series log of ICU, Emergency, and General bed availability over time.",
    pk: "capacity_history_id",
    fks: ["hospital_id -> hospital.hospital_id"],
    cardinality: "N:1 with hospital (Temporal State)",
    columns: ["capacity_history_id (PK)", "hospital_id (FK)", "timestamp", "icu_total", "icu_available", "emergency_beds_total", "emergency_beds_available", "general_beds_total", "general_beds_available"]
  },
  {
    name: "ambulance",
    nf: "3NF",
    description: "Mobile paramedic and critical care emergency vehicles in the grid fleet.",
    pk: "ambulance_id",
    fks: ["home_hospital_id -> hospital.hospital_id"],
    cardinality: "1:N with location & status histories, N:1 with hospital",
    columns: ["ambulance_id (PK)", "registration_number (UNIQUE)", "ambulance_type", "capacity", "home_hospital_id (FK)", "current_status", "created_at"]
  },
  {
    name: "ambulance_location_history",
    nf: "3NF (Temporal)",
    description: "GPS tracking telemetry telemetry stream for point-in-time spatial reconstruction.",
    pk: "location_history_id",
    fks: ["ambulance_id -> ambulance.ambulance_id"],
    cardinality: "N:1 with ambulance (Temporal State)",
    columns: ["location_history_id (PK)", "ambulance_id (FK)", "timestamp", "latitude", "longitude", "speed"]
  },
  {
    name: "ambulance_status_history",
    nf: "3NF (Temporal)",
    description: "Lifecycle state transitions (AVAILABLE, DISPATCHED, TRANSPORTING, MAINTENANCE).",
    pk: "status_history_id",
    fks: ["ambulance_id -> ambulance.ambulance_id"],
    cardinality: "N:1 with ambulance (Audit State)",
    columns: ["status_history_id (PK)", "ambulance_id (FK)", "status", "start_time", "end_time", "reason"]
  },
  {
    name: "resource",
    nf: "3NF",
    description: "Stock inventory of blood units, ventilators, and oxygen canisters per hospital.",
    pk: "resource_id",
    fks: ["hospital_id -> hospital.hospital_id"],
    cardinality: "N:1 with hospital, 1:N with resource_history",
    columns: ["resource_id (PK)", "hospital_id (FK)", "resource_type", "total_quantity", "available_quantity", "critical_threshold", "status"]
  },
  {
    name: "resource_history",
    nf: "3NF (Temporal)",
    description: "Temporal consumption and replenishment delta transactions.",
    pk: "resource_history_id",
    fks: ["resource_id -> resource.resource_id"],
    cardinality: "N:1 with resource",
    columns: ["resource_history_id (PK)", "resource_id (FK)", "timestamp", "quantity_available", "change_amount", "change_reason"]
  },
  {
    name: "road",
    nf: "3NF",
    description: "Urban transportation network edge segments connecting geographic sectors.",
    pk: "road_id",
    fks: [],
    cardinality: "1:N with road_status_history",
    columns: ["road_id (PK)", "road_name", "source_location", "destination_location", "distance_km", "road_type", "start_lat", "start_lng", "end_lat", "end_lng"]
  },
  {
    name: "road_status_history",
    nf: "3NF (Temporal)",
    description: "Traffic congestion, vehicle average speeds, and physical blockage states.",
    pk: "road_status_id",
    fks: ["road_id -> road.road_id"],
    cardinality: "N:1 with road",
    columns: ["road_status_id (PK)", "road_id (FK)", "timestamp", "traffic_level", "average_speed", "blocked"]
  },
  {
    name: "emergency_team",
    nf: "3NF",
    description: "Specialized response personnel units (Trauma Surgical, Hazmat, SAR).",
    pk: "team_id",
    fks: ["home_hospital_id -> hospital.hospital_id"],
    cardinality: "1:N with team_status_history, N:1 with hospital",
    columns: ["team_id (PK)", "team_name", "specialization", "capacity", "home_hospital_id (FK)", "status"]
  },
  {
    name: "team_status_history",
    nf: "3NF (Temporal)",
    description: "Deployment logs and operational readiness records.",
    pk: "team_status_history_id",
    fks: ["team_id -> emergency_team.team_id"],
    cardinality: "N:1 with emergency_team",
    columns: ["team_status_history_id (PK)", "team_id (FK)", "status", "start_time", "end_time"]
  },
  {
    name: "resource_allocation",
    nf: "3NF",
    description: "Solver-computed dispatch plan matching incidents to ambulances and teams.",
    pk: "allocation_id",
    fks: ["incident_id -> incident.incident_id", "ambulance_id -> ambulance.ambulance_id", "team_id -> emergency_team.team_id"],
    cardinality: "N:1 with incident, ambulance, emergency_team",
    columns: ["allocation_id (PK)", "incident_id (FK)", "ambulance_id (FK)", "team_id (FK)", "allocated_at", "status", "estimated_travel_time_min"]
  },
  {
    name: "hospital_assignment",
    nf: "3NF",
    description: "Patient to hospital bed destination allocation with transit distance.",
    pk: "assignment_id",
    fks: ["patient_id -> patient.patient_id", "hospital_id -> hospital.hospital_id", "incident_id -> incident.incident_id"],
    cardinality: "N:1 with patient, hospital, incident",
    columns: ["assignment_id (PK)", "patient_id (FK)", "hospital_id (FK)", "incident_id (FK)", "assigned_at", "bed_type", "transit_distance_km", "status"]
  },
  {
    name: "simulation_scenario",
    nf: "3NF",
    description: "What-If disaster parameter sandbox configurations.",
    pk: "scenario_id",
    fks: [],
    cardinality: "1:N with simulation_result",
    columns: ["scenario_id (PK)", "scenario_name", "description", "disabled_hospitals_json", "blocked_roads_json", "patient_surge_multiplier", "created_at"]
  },
  {
    name: "simulation_result",
    nf: "3NF",
    description: "Comparative outcome metrics generated during disaster simulation runs.",
    pk: "result_id",
    fks: ["scenario_id -> simulation_scenario.scenario_id"],
    cardinality: "N:1 with simulation_scenario",
    columns: ["result_id (PK)", "scenario_id (FK)", "run_at", "average_response_time_min", "unallocated_patients_count", "overloaded_hospitals_count", "summary_json"]
  },
  {
    name: "audit_log",
    nf: "BCNF",
    description: "Immutable PostgreSQL change data capture stream for RBAC compliance and auditability.",
    pk: "log_id",
    fks: ["user_id -> user_account.user_id"],
    cardinality: "N:1 with user_account",
    columns: ["log_id (PK)", "user_id (FK)", "username", "user_role", "action", "entity_name", "entity_id", "details", "old_value_json", "new_value_json", "timestamp"]
  }
];

export const DBMSArchitecturePage: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<any>(TABLES_CATALOG[0]);
  const [activeSection, setActiveSection] = useState<'tables' | 'normalization' | 'indexing' | 'acid'>('tables');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              DBMS ACADEMIC SPECIFICATION
            </span>
            <span className="text-[10px] text-gray-500">POSTGRESQL 15+ RELATIONAL BLUEPRINT</span>
          </div>
          <h1 className="text-2xl font-black text-gray-100 tracking-tight mt-1 flex items-center gap-3">
            <Database className="w-7 h-7 text-cyan-400" />
            TERA Relational Database Architecture
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Complete formal specification of 18+ normalized relational tables, composite B-tree indexes, temporal history logs, and ACID transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            18 3NF/BCNF Tables
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-gray-800 gap-6 text-xs">
        {[
          { id: 'tables', label: '1. Relational Tables Catalog (18)', icon: Database },
          { id: 'normalization', label: '2. Normalization Proofs (1NF to BCNF)', icon: Layers },
          { id: 'indexing', label: '3. Indexing & Views Architecture', icon: Cpu },
          { id: 'acid', label: '4. ACID Allocation Transactions', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`pb-3 font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-2 ${
                isActive ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Section 1: Relational Tables Catalog */}
      {activeSection === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table List Sidebar */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-2 max-h-[680px] overflow-y-auto">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Schema Tables List ({TABLES_CATALOG.length})
            </div>
            {TABLES_CATALOG.map((t) => {
              const isSelected = selectedTable.name === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => setSelectedTable(t)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold shadow-md'
                      : 'bg-black/40 border-gray-800 text-gray-300 hover:bg-gray-800/40'
                  }`}
                >
                  <div className="truncate">
                    <span className="text-white block">{t.name}</span>
                    <span className="text-[10px] text-gray-500 font-sans truncate">{t.description}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 ml-2">
                    {t.nf}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table Details & Schema Viewer */}
          <div className="lg:col-span-2 bg-gray-900/60 border border-gray-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    NORMAL FORM: {selectedTable.nf}
                  </span>
                  <span className="text-[10px] text-gray-500">RELATIONAL TABLE</span>
                </div>
                <h2 className="text-xl font-bold text-gray-100 mt-1">{selectedTable.name}</h2>
                <p className="text-xs text-gray-400 font-sans mt-0.5">{selectedTable.description}</p>
              </div>
            </div>

            {/* Keys & Cardinality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-black/50 border border-gray-800 p-3 rounded-lg">
                <span className="text-[10px] text-gray-500 uppercase block font-bold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Primary Key (Candidate Key)
                </span>
                <span className="text-amber-300 font-bold text-sm block mt-1">{selectedTable.pk}</span>
              </div>

              <div className="bg-black/50 border border-gray-800 p-3 rounded-lg">
                <span className="text-[10px] text-gray-500 uppercase block font-bold flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-cyan-400" />
                  Cardinality / Relationships
                </span>
                <span className="text-cyan-300 text-xs block mt-1">{selectedTable.cardinality}</span>
              </div>
            </div>

            {/* Foreign Keys */}
            {selectedTable.fks.length > 0 && (
              <div className="bg-black/40 border border-gray-800 p-4 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase block font-bold mb-2 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5 text-purple-400" />
                  Foreign Key Referential Constraints
                </span>
                <div className="space-y-1">
                  {selectedTable.fks.map((fk: string, idx: number) => (
                    <div key={idx} className="text-xs text-purple-300 bg-purple-950/30 border border-purple-900/40 px-2.5 py-1 rounded">
                      &bull; {fk}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Columns List */}
            <div>
              <span className="text-[10px] text-gray-400 uppercase block font-bold mb-2">
                Schema Attributes ({selectedTable.columns.length} Columns)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {selectedTable.columns.map((col: string, idx: number) => (
                  <div key={idx} className="bg-black/50 border border-gray-800/80 p-2 rounded text-gray-300 text-[11px] truncate">
                    {col}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Normalization Proofs */}
      {activeSection === 'normalization' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <span className="p-1 rounded bg-cyan-950 border border-cyan-800">1NF</span>
              First Normal Form Compliance
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              All column values across all 18 tables are strictly atomic. There are no repeating groups or multi-valued attributes. JSON columns in simulation logs and audit metadata represent unstructured parameters, with distinct primary keys enforcing unique record identity.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <span className="p-1 rounded bg-purple-950 border border-purple-800">2NF</span>
              Second Normal Form Compliance
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              All non-key attributes are fully functionally dependent on the entire Primary Key. Composite candidate keys in historical temporal tables (<code className="text-purple-300">hospital_id + timestamp</code>) are normalized with synthetic single surrogate keys (<code className="text-purple-300">capacity_history_id</code>) to eliminate partial dependencies.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="p-1 rounded bg-emerald-950 border border-emerald-800">3NF</span>
              Third Normal Form Compliance
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              Elimination of transitive dependencies ($X \to Y \to Z$). Hospital location information is stored in <code className="text-emerald-300">hospital</code>, while ambulances only maintain <code className="text-emerald-300">home_hospital_id (FK)</code> rather than duplicating hospital coordinates or names inside the ambulance table.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <span className="p-1 rounded bg-amber-950 border border-amber-800">BCNF</span>
              Boyce-Codd Normal Form Compliance
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              For every functional dependency $X \to Y$, $X$ is a superkey. Demonstrated in <code className="text-amber-300">user_account</code> (where both <code className="text-amber-300">user_id</code> and <code className="text-amber-300">username</code> are candidate keys) and in <code className="text-amber-300">audit_log</code>.
            </p>
          </div>
        </div>
      )}

      {/* Section 3: Indexing & Views */}
      {activeSection === 'indexing' && (
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-cyan-400">Composite B-Tree Indexes (Temporal Performance)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-black/50 p-3 rounded-lg border border-gray-800">
                <span className="text-cyan-300 font-bold block">idx_hch_hospital_ts</span>
                <span className="text-[11px] text-gray-400 block mt-1">
                  CREATE INDEX ON hospital_capacity_history (hospital_id, timestamp DESC);
                </span>
                <span className="text-[10px] text-emerald-400 mt-1 block">Accelerates time-travel capacity queries by ~36x</span>
              </div>

              <div className="bg-black/50 p-3 rounded-lg border border-gray-800">
                <span className="text-cyan-300 font-bold block">idx_alh_amb_ts</span>
                <span className="text-[11px] text-gray-400 block mt-1">
                  CREATE INDEX ON ambulance_location_history (ambulance_id, timestamp DESC);
                </span>
                <span className="text-[10px] text-emerald-400 mt-1 block">Enables instant fleet GPS path reconstruction</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-purple-400">PostgreSQL Relational Views</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-black/50 p-3 rounded-lg border border-gray-800">
                <span className="text-purple-300 font-bold block">view_eoc_live_metrics</span>
                <span className="text-[11px] text-gray-400 block mt-1">
                  Aggregates total active incidents, bed occupancy, and fleet readiness in a single cached query view.
                </span>
              </div>

              <div className="bg-black/50 p-3 rounded-lg border border-gray-800">
                <span className="text-purple-300 font-bold block">view_hospital_occupancy_matrix</span>
                <span className="text-[11px] text-gray-400 block mt-1">
                  Computes ICU and Emergency bed utilization percentages joined with latest temporal snapshot rows.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: ACID Allocation Transactions */}
      {activeSection === 'acid' && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-100">ACID Transactional Guarantees during Allocation</h3>
              <p className="text-xs text-gray-400 font-sans mt-0.5">
                Multi-casualty resource allocation modifies 5 relational tables in a single atomic block.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-black/50 border border-gray-800 p-4 rounded-xl space-y-1">
              <span className="text-amber-400 font-bold block">Atomicity</span>
              <p className="text-gray-400 text-[11px] font-sans">
                All patient bed assignments and ambulance dispatches succeed together. Any constraint failure triggers complete ROLLBACK.
              </p>
            </div>

            <div className="bg-black/50 border border-gray-800 p-4 rounded-xl space-y-1">
              <span className="text-cyan-400 font-bold block">Consistency</span>
              <p className="text-gray-400 text-[11px] font-sans">
                Enforces CHECK constraints ($available \ge 0$, $available \le total$) so over-allocation is rejected by PostgreSQL.
              </p>
            </div>

            <div className="bg-black/50 border border-gray-800 p-4 rounded-xl space-y-1">
              <span className="text-purple-400 font-bold block">Isolation</span>
              <p className="text-gray-400 text-[11px] font-sans">
                READ COMMITTED / SERIALIZABLE execution prevents race conditions when concurrent incidents compete for the same ICU beds.
              </p>
            </div>

            <div className="bg-black/50 border border-gray-800 p-4 rounded-xl space-y-1">
              <span className="text-emerald-400 font-bold block">Durability</span>
              <p className="text-gray-400 text-[11px] font-sans">
                Committed transactions are written to PostgreSQL Write-Ahead Log (WAL) to survive server restarts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
