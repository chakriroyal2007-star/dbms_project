import React, { useState } from 'react';
import { 
  Terminal, Play, Clock, CheckCircle, AlertTriangle, 
  Database, Copy, FileText, ShieldCheck, Cpu, ArrowRight, Sparkles, Layers
} from 'lucide-react';
import api, { sqlApi } from '../services/api';

const SQL_PRESETS = [
  {
    name: "1. Active Critical Incidents with Triage Count (JOIN + GROUP BY)",
    description: "Demonstrates 1:N relational join between incidents and triage patients with aggregation.",
    query: `SELECT 
    i.incident_id,
    i.incident_type,
    i.location_name,
    i.severity,
    COUNT(p.patient_id) AS total_triaged_patients,
    SUM(CASE WHEN p.severity = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_patients_count
FROM incident i
LEFT JOIN patient p ON i.incident_id = p.incident_id
WHERE i.status = 'ACTIVE'
GROUP BY i.incident_id, i.incident_type, i.location_name, i.severity
ORDER BY critical_patients_count DESC, i.occurred_at DESC;`
  },
  {
    name: "2. Hospital Capacity & Real-Time Occupancy Analysis (Subquery + JOIN)",
    description: "Demonstrates latest temporal capacity joins with percentage occupancy calculations.",
    query: `SELECT 
    h.hospital_id,
    h.name AS hospital_name,
    h.emergency_level,
    c.icu_total,
    c.icu_available,
    ROUND(((c.icu_total - c.icu_available)::numeric / NULLIF(c.icu_total, 0)) * 100, 1) AS icu_occupancy_pct,
    c.emergency_beds_total,
    c.emergency_beds_available
FROM hospital h
JOIN (
    SELECT hospital_id, icu_total, icu_available, emergency_beds_total, emergency_beds_available,
           ROW_NUMBER() OVER (PARTITION BY hospital_id ORDER BY timestamp DESC) as rn
    FROM hospital_capacity_history
) c ON h.hospital_id = c.hospital_id AND c.rn = 1
WHERE h.status = 'ACTIVE'
ORDER BY icu_occupancy_pct DESC;`
  },
  {
    name: "3. Fleet Readiness and Status Distribution (GROUP BY + HAVING)",
    description: "Aggregates available and dispatched ambulances grouped by vehicle classification.",
    query: `SELECT 
    ambulance_type,
    current_status,
    COUNT(ambulance_id) AS fleet_count,
    AVG(capacity) AS avg_patient_capacity
FROM ambulance
GROUP BY ambulance_type, current_status
HAVING COUNT(ambulance_id) >= 1
ORDER BY ambulance_type, fleet_count DESC;`
  },
  {
    name: "4. Multi-Table CTE for Resource Criticality Matrix (WITH Clause)",
    description: "Demonstrates advanced Common Table Expression (CTE) isolating hospitals with low stock.",
    query: `WITH CriticalStock AS (
    SELECT 
        hospital_id,
        resource_type,
        total_quantity,
        available_quantity,
        critical_threshold,
        (available_quantity <= critical_threshold) AS is_deficit
    FROM resource
    WHERE available_quantity <= critical_threshold
)
SELECT 
    h.name AS hospital_name,
    cs.resource_type,
    cs.total_quantity,
    cs.available_quantity,
    cs.critical_threshold
FROM CriticalStock cs
JOIN hospital h ON cs.hospital_id = h.hospital_id
ORDER BY cs.available_quantity ASC;`
  }
];

export const SqlPlaygroundPage: React.FC = () => {
  const [sqlQuery, setSqlQuery] = useState<string>(SQL_PRESETS[0].query);
  const [executing, setExecuting] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [explainResult, setExplainResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'results' | 'explain'>('results');

  const handleExecute = async () => {
    if (!sqlQuery.trim()) return;
    setExecuting(true);
    setError(null);
    setResult(null);
    setExplainResult(null);
    setActiveMode('results');

    try {
      const data = await sqlApi.execute(sqlQuery);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Execution failed. Check SQL query syntax or permissions.');
    } finally {
      setExecuting(false);
    }
  };

  const handleExplain = async () => {
    if (!sqlQuery.trim()) return;
    setExecuting(true);
    setError(null);
    setActiveMode('explain');

    try {
      const res = await api.post('/performance/custom-explain', { sql_query: sqlQuery });
      setExplainResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to generate execution plan.');
    } finally {
      setExecuting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto select-none font-mono text-zinc-100">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              SQL Studio & AST Guard
            </span>
            <span className="text-[10px] text-zinc-500">Read-Only PostgreSQL Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 font-sans flex items-center gap-2">
            <Terminal className="w-6 h-6 text-emerald-400" />
            <span>Interactive SQL Query Console & EXPLAIN Analyzer</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            Directly test relational CTEs, multi-table joins, subqueries, and analyze visual query execution plans with cost models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-1.5 font-sans">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Destructive DDL/DML Blocked</span>
          </div>
        </div>
      </div>

      {/* Query Presets Toolbar */}
      <div className="p-4 rounded-2xl bg-[#121215] border border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Educational Relational Presets
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">1-Click Load</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SQL_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSqlQuery(preset.query);
                setError(null);
              }}
              className="p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300 transition-colors line-clamp-1">
                {preset.name}
              </div>
              <p className="text-[10px] text-zinc-400 font-sans mt-1 line-clamp-2">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* SQL Editor Area */}
      <div className="rounded-2xl bg-[#121215] border border-zinc-800/80 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <span className="text-xs text-zinc-400 font-mono ml-2">query.sql</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 text-xs transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-zinc-800"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleExplain}
              disabled={executing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>EXPLAIN Plan</span>
            </button>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{executing ? 'Executing...' : 'Run Query'}</span>
            </button>
          </div>
        </div>

        <textarea
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          rows={7}
          spellCheck={false}
          className="w-full bg-[#09090b] text-emerald-400 p-4 font-mono text-xs focus:outline-none resize-y border-none leading-relaxed selection:bg-emerald-900 selection:text-white"
          placeholder="Enter SQL statement e.g. SELECT * FROM hospital LIMIT 10;"
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-rose-200 uppercase mb-0.5">Database Query Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Visual EXPLAIN Plan View */}
      {activeMode === 'explain' && explainResult && (
        <div className="p-5 rounded-2xl bg-[#121215] border border-zinc-800/80 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                PostgreSQL Query Execution Plan & Cost Tree
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span>Total Cost: <strong className="text-zinc-200">{explainResult.total_cost}</strong></span>
              <span>Planning: <strong className="text-zinc-200">{explainResult.planning_time_ms} ms</strong></span>
              <span>Execution: <strong className="text-sky-300">{explainResult.execution_time_ms} ms</strong></span>
            </div>
          </div>

          {/* Node Hierarchy */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
              Execution Tree Hierarchy
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(explainResult.nodes || []).map((node: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400">{node.name}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                      Cost: {node.cost}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-300 font-sans">{node.description}</div>
                  <div className="text-[10px] text-zinc-500">Rows estimate: {node.rows}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Advice */}
          {explainResult.optimization_advice && (
            <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/30 text-xs text-sky-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sky-200 mb-0.5">Optimizer Diagnostic Advice:</span>
                <span>{explainResult.optimization_advice}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table Results View */}
      {activeMode === 'results' && result && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-mono bg-zinc-900/80 border border-zinc-800 px-4 py-2.5 rounded-xl">
            <div className="flex items-center gap-4">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Query Executed Successfully
              </span>
              <span className="text-zinc-400">
                Returned <strong className="text-zinc-200">{result.row_count}</strong> rows
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Latency: <strong className="text-sky-300">{result.execution_time_ms} ms</strong>
              </span>
            </div>
          </div>

          <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase tracking-wider sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="p-3 pl-4 text-zinc-600 w-12 text-center">#</th>
                    {result.columns.map((col: string, idx: number) => (
                      <th key={idx} className="p-3 text-emerald-400 font-bold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {result.rows.length === 0 ? (
                    <tr>
                      <td colSpan={result.columns.length + 1} className="p-8 text-center text-zinc-500 font-sans">
                        Query executed successfully but returned 0 rows.
                      </td>
                    </tr>
                  ) : (
                    result.rows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="p-3 pl-4 text-zinc-600 text-center">{rIdx + 1}</td>
                        {result.columns.map((col: string, cIdx: number) => {
                          const val = row[col];
                          return (
                            <td key={cIdx} className="p-3 whitespace-nowrap">
                              {val === null || val === undefined ? (
                                <span className="text-zinc-600 italic">NULL</span>
                              ) : typeof val === 'boolean' ? (
                                val ? <span className="text-emerald-400">TRUE</span> : <span className="text-zinc-400">FALSE</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
