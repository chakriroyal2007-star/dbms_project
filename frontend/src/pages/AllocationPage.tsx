import React, { useState, useEffect } from 'react';
import { 
  Network, CheckCircle2, AlertTriangle, Building2, 
  Truck, ArrowRight, ShieldCheck, Zap, RefreshCw, Send
} from 'lucide-react';
import api from '../services/api';
import { Incident, AllocationPlan } from '../types';

interface AllocationPageProps {
  initialIncidentId?: string | null;
}

export const AllocationPage: React.FC<AllocationPageProps> = ({ initialIncidentId }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(initialIncidentId || '');
  const [plan, setPlan] = useState<AllocationPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<string | null>(null);

  // Manual configuration form state
  const [patientCount, setPatientCount] = useState<number>(8);
  const [requiredIcu, setRequiredIcu] = useState<number>(3);
  const [requiredEmergency, setRequiredEmergency] = useState<number>(5);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await api.get('/incidents?status=ACTIVE');
        setIncidents(res.data);
        if (!selectedIncidentId && res.data.length > 0) {
          setSelectedIncidentId(res.data[0].incident_id);
        }
      } catch (err) {
        console.error('Error fetching incidents:', err);
      }
    };
    fetchIncidents();
  }, []);

  const handleSolve = async () => {
    try {
      setLoading(true);
      setCommitResult(null);
      const payload: any = {
        patient_count: patientCount,
        required_icu: requiredIcu,
        required_emergency: requiredEmergency
      };
      if (selectedIncidentId) {
        payload.incident_id = selectedIncidentId;
      }
      const res = await api.post('/allocation/solve', payload);
      setPlan(res.data);
    } catch (err) {
      console.error('Error calculating allocation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommitTransaction = async () => {
    if (!plan) return;
    try {
      setCommitting(true);
      const res = await api.post('/allocation/commit', plan);
      setCommitResult(res.data.message || 'ACID Transaction Committed Successfully.');
    } catch (err: any) {
      setCommitResult(`Transaction Rollback: ${err?.response?.data?.detail || 'Failed to commit allocation'}`);
    } finally {
      setCommitting(false);
    }
  };

  useEffect(() => {
    if (selectedIncidentId) {
      handleSolve();
    }
  }, [selectedIncidentId]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* Header */}
      <div className="pb-2 border-b border-[#1F293D]">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Network className="w-6 h-6 text-cyan-400" />
          <span>MULTI-INCIDENT EMERGENCY RESOURCE ALLOCATION ENGINE</span>
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Capacity-constrained decision support system ranking feasible trauma centers, ambulances, and routing under acute resource limits.
        </p>
      </div>

      {/* Triage Selector Controls */}
      <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] shadow-xl space-y-4">
        <div className="text-xs font-bold uppercase font-mono text-gray-300">
          Target Incident & Casualty Contention Parameters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-mono text-gray-400 mb-1">
              Select Active Incident
            </label>
            <select
              value={selectedIncidentId}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#141C2E] border border-[#1F293D] text-xs text-gray-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {incidents.map((inc) => (
                <option key={inc.incident_id} value={inc.incident_id}>
                  {inc.incident_id} - {inc.incident_type} ({inc.estimated_patient_count} pts)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-gray-400 mb-1">
              Total Casualties Requiring Transport
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={patientCount}
              onChange={(e) => setPatientCount(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg bg-[#141C2E] border border-[#1F293D] text-xs text-gray-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-gray-400 mb-1">
              Required ICU Beds (Critical)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={requiredIcu}
              onChange={(e) => setRequiredIcu(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-[#141C2E] border border-[#1F293D] text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSolve}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Zap className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Solving Constraints...' : 'SOLVE ALLOCATION'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Allocation Recommendation Results */}
      {plan && (
        <div className="space-y-6">
          {/* Status Header Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            plan.is_fully_feasible 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            <div className="flex items-center space-x-3">
              {plan.is_fully_feasible ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              )}
              <div>
                <h3 className="text-sm font-bold uppercase font-mono">
                  {plan.is_fully_feasible ? 'FEASIBLE ALLOCATION PLAN GENERATED' : 'PARTIAL ALLOCATION (RESOURCE SHORTAGE)'}
                </h3>
                <p className="text-xs text-gray-300">
                  {plan.allocated_patients} of {plan.total_patients} patients assigned across {plan.assigned_hospitals.length} verified facilities.
                </p>
              </div>
            </div>

            <button
              onClick={handleCommitTransaction}
              disabled={committing}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{committing ? 'Committing ACID Tx...' : 'COMMIT TRANSACTION'}</span>
            </button>
          </div>

          {commitResult && (
            <div className="p-3.5 rounded-lg bg-[#141C2E] border border-cyan-500/40 text-cyan-300 text-xs font-mono">
              ⚡ {commitResult}
            </div>
          )}

          {/* Allocation Cards by Hospital */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plan.assigned_hospitals.map((hosp, idx) => (
              <div
                key={hosp.hospital_id}
                className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] shadow-lg space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-bold text-xs text-cyan-400 font-mono">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white text-sm truncate max-w-[180px]">
                      {hosp.hospital_name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    ETA {hosp.eta_minutes} min
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-2 rounded bg-[#141C2E] border border-[#1F293D]">
                    <span className="text-[9px] text-gray-400 block uppercase">Patients</span>
                    <span className="text-base font-bold text-white">{hosp.assigned_patients}</span>
                  </div>
                  <div className="p-2 rounded bg-[#141C2E] border border-[#1F293D]">
                    <span className="text-[9px] text-gray-400 block uppercase">ICU Beds</span>
                    <span className="text-base font-bold text-cyan-400">{hosp.assigned_icu_beds}</span>
                  </div>
                  <div className="p-2 rounded bg-[#141C2E] border border-[#1F293D]">
                    <span className="text-[9px] text-gray-400 block uppercase">Emergency</span>
                    <span className="text-base font-bold text-blue-400">{hosp.assigned_emergency_beds}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-gray-400 text-[11px] font-mono flex items-center justify-between">
                    <span>Dispatched Ambulances:</span>
                    <span className="text-emerald-400 font-semibold">
                      {hosp.assigned_ambulances.length > 0 ? hosp.assigned_ambulances.join(', ') : 'None assigned'}
                    </span>
                  </div>
                  <div className="text-gray-400 text-[11px] font-mono flex items-center justify-between">
                    <span>Distance from Incident:</span>
                    <span className="text-gray-200">{hosp.distance_km} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Feasibility Notes & Rationale */}
          <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 font-mono">
              Database Feasibility & Constraint Verification Log
            </h3>
            <div className="space-y-1.5 font-mono text-xs text-gray-300">
              {plan.feasibility_notes.map((note, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
