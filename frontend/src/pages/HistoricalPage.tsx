import React, { useState, useEffect } from 'react';
import { 
  History, Clock, Calendar, Search, RefreshCw, 
  AlertTriangle, Users, Truck, Bed, Navigation, ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { TemporalState } from '../types';

export const HistoricalPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2026-09-12');
  const [selectedTime, setSelectedTime] = useState('19:30');
  const [loading, setLoading] = useState(false);
  const [temporalState, setTemporalState] = useState<TemporalState | null>(null);

  const timelineSteps = [
    { label: '7:00 PM', time: '19:00', desc: 'Pre-Spike State' },
    { label: '7:15 PM', time: '19:15', desc: 'Accident & Fire Reports' },
    { label: '7:30 PM', time: '19:30', desc: 'Major Disaster Peak (4 Incidents)' },
    { label: '7:45 PM', time: '19:45', desc: 'Acute Bed Contention' },
    { label: '8:00 PM', time: '20:00', desc: 'Triage Stabilization' },
  ];

  const handleReconstruct = async (overrideTime?: string) => {
    const timeToUse = overrideTime || selectedTime;
    if (overrideTime) {
      setSelectedTime(overrideTime);
    }

    try {
      setLoading(true);
      const isoTimestamp = `${selectedDate}T${timeToUse}:00`;
      const res = await api.get(`/temporal/reconstruct?timestamp=${encodeURIComponent(isoTimestamp)}`);
      setTemporalState(res.data);
    } catch (err) {
      console.error('Error reconstructing temporal state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch for 19:30
    handleReconstruct('19:30');
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* Header Banner */}
      <div className="pb-2 border-b border-[#1F293D]">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <History className="w-6 h-6 text-cyan-400" />
          <span>HISTORICAL INTELLIGENCE & TEMPORAL STATE RECONSTRUCTION</span>
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Signature DBMS Capability: Reconstruct exact database-backed emergency and capacity states at any historical moment.
        </p>
      </div>

      {/* Time-Travel Control Panel */}
      <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1.5 uppercase">
                Date Sieve
              </label>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#141C2E] border border-[#1F293D] text-sm text-gray-200">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent focus:outline-none font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1.5 uppercase">
                Timestamp (24H)
              </label>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#141C2E] border border-[#1F293D] text-sm text-gray-200">
                <Clock className="w-4 h-4 text-cyan-400" />
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bg-transparent focus:outline-none font-mono text-xs"
                />
              </div>
            </div>

            <button
              onClick={() => handleReconstruct()}
              disabled={loading}
              className="mt-4 md:mt-0 flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Search className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Reconstructing...' : 'RECONSTRUCT STATE'}</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-500/40">
            Temporal Query: <span className="font-bold text-white">{selectedDate} {selectedTime}:00 IST</span>
          </div>
        </div>

        {/* Interactive Timeline Scrubber */}
        <div className="pt-3 border-t border-[#1F293D]/60 space-y-2">
          <div className="text-[10px] font-bold uppercase font-mono text-gray-400">
            Simulated Timeline Scrubber (Click snapshot marker to travel in time)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {timelineSteps.map((step) => {
              const isCurrent = selectedTime === step.time;
              return (
                <button
                  key={step.time}
                  onClick={() => handleReconstruct(step.time)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-md shadow-cyan-950/50 scale-[1.02]'
                      : 'bg-[#141C2E] border-[#1F293D] hover:border-gray-600 hover:bg-[#1A2438]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black font-mono ${isCurrent ? 'text-cyan-300' : 'text-gray-200'}`}>
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-400 text-black font-bold font-mono">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate mt-1">
                    {step.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reconstructed State Metrics */}
      {temporalState && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 via-[#0E1524] to-cyan-950/60 border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  EMERGENCY STATE AT {selectedTime} IST ({selectedDate})
                </h3>
                <p className="text-xs text-gray-400">
                  Point-in-time reconstruction executed across 100 hospitals, 500 ambulances, and 150 road segments.
                </p>
              </div>
            </div>
            <div className="text-xs font-mono text-gray-300">
              Database Mode: <span className="text-emerald-400 font-bold">TEMPORAL AUDIT VALID</span>
            </div>
          </div>

          {/* 6 Core Reconstructed KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
            <div className="p-3.5 rounded-xl bg-[#0E1524] border border-[#1F293D]">
              <div className="text-[10px] font-mono text-gray-400 mb-1 uppercase">Active Incidents</div>
              <div className="text-xl font-black text-red-400">{temporalState.active_incidents_count}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0E1524] border border-[#1F293D]">
              <div className="text-[10px] font-mono text-gray-400 mb-1 uppercase">Critical Patients</div>
              <div className="text-xl font-black text-amber-400">{temporalState.critical_patients_count}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0E1524] border border-[#1F293D]">
              <div className="text-[10px] font-mono text-gray-400 mb-1 uppercase">Available Ambulances</div>
              <div className="text-xl font-black text-emerald-400">{temporalState.available_ambulances_count}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0E1524] border border-[#1F293D]">
              <div className="text-[10px] font-mono text-gray-400 mb-1 uppercase">Available ICU Beds</div>
              <div className="text-xl font-black text-cyan-300">{temporalState.available_icu_beds_count}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0E1524] border border-[#1F293D]">
              <div className="text-[10px] font-mono text-gray-400 mb-1 uppercase">Emergency Beds</div>
              <div className="text-xl font-black text-blue-300">{temporalState.available_emergency_beds_count}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0E1524] border border-[#1F293D]">
              <div className="text-[10px] font-mono text-gray-400 mb-1 uppercase">Blocked Roads</div>
              <div className="text-xl font-black text-rose-400">{temporalState.blocked_roads_count}</div>
            </div>
          </div>

          {/* Reconstructed Detailed Snapshots (Incidents & Hospital Capacity at Time T) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Historical Incidents Snapshot */}
            <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 font-mono flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Active Incidents at {selectedTime} ({temporalState.incidents_snapshot.length})</span>
              </h3>

              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {temporalState.incidents_snapshot.map((inc) => (
                  <div key={inc.incident_id} className="p-3 rounded-lg bg-[#141C2E] border border-[#1F293D] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{inc.incident_type.replace(/_/g, ' ')}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-950 text-red-300 border border-red-500/30">
                        {inc.severity}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{inc.description}</div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1">
                      <span>📍 {inc.location_name}</span>
                      <span className="text-amber-400 font-bold">{inc.patient_count} Casualties ({inc.critical_patient_count} Critical)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Hospital Capacity Snapshot */}
            <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 font-mono flex items-center space-x-2">
                <Bed className="w-4 h-4 text-cyan-400" />
                <span>Hospital Capacities at {selectedTime}</span>
              </h3>

              <div className="overflow-x-auto max-h-[350px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141C2E] text-gray-400 font-mono uppercase text-[10px] border-b border-[#1F293D]">
                    <tr>
                      <th className="p-2">Hospital</th>
                      <th className="p-2">Level</th>
                      <th className="p-2">ICU Beds</th>
                      <th className="p-2">Emergency Beds</th>
                      <th className="p-2">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F293D] text-gray-300">
                    {temporalState.hospitals_snapshot.slice(0, 8).map((h) => (
                      <tr key={h.hospital_id} className="hover:bg-[#141C2E]/60">
                        <td className="p-2 font-semibold text-white truncate max-w-[140px]">{h.name}</td>
                        <td className="p-2 font-mono text-[10px] text-cyan-400">{h.emergency_level}</td>
                        <td className="p-2 font-mono text-cyan-300">{h.icu_available} / {h.icu_total}</td>
                        <td className="p-2 font-mono text-blue-300">{h.emergency_beds_available} / {h.emergency_beds_total}</td>
                        <td className="p-2 font-mono font-bold text-rose-400">{h.icu_occupancy_percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
