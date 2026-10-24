import React, { useState, useEffect } from 'react';
import { 
  Sliders, Play, Building2, Navigation, AlertCircle, 
  ArrowRight, CheckCircle2, RotateCcw, TrendingUp
} from 'lucide-react';
import api from '../services/api';
import { Hospital, RoadSegment } from '../types';

export const SimulationPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [scenarioName, setScenarioName] = useState('Hospital B Outage & R17 Blockage');
  const [incidentType, setIncidentType] = useState('ROAD_ACCIDENT');
  const [patientCount, setPatientCount] = useState<number>(20);
  const [severity, setSeverity] = useState('CRITICAL');

  // Interactive toggle states
  const [disabledHospitalIds, setDisabledHospitalIds] = useState<string[]>(['HOSP_001']);
  const [blockedRoadIds, setBlockedRoadIds] = useState<string[]>(['ROAD_002']);

  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hRes, rRes] = await Promise.all([
          api.get('/hospitals?limit=15'),
          api.get('/roads?limit=15')
        ]);
        setHospitals(hRes.data);
        setRoads(rRes.data);
      } catch (err) {
        console.error('Error loading simulation inputs:', err);
      }
    };
    fetchData();
  }, []);

  const toggleHospital = (hId: string) => {
    setDisabledHospitalIds(prev => 
      prev.includes(hId) ? prev.filter(id => id !== hId) : [...prev, hId]
    );
  };

  const toggleRoad = (rId: string) => {
    setBlockedRoadIds(prev => 
      prev.includes(rId) ? prev.filter(id => id !== rId) : [...prev, rId]
    );
  };

  const handleRunSimulation = async () => {
    try {
      setLoading(true);
      const payload = {
        scenario_name: scenarioName,
        incident_type: incidentType,
        patient_count: patientCount,
        severity: severity,
        latitude: 13.6288,
        longitude: 79.4192,
        disabled_hospital_ids: disabledHospitalIds,
        blocked_road_ids: blockedRoadIds
      };
      const res = await api.post('/simulation/run', payload);
      setSimResult(res.data);
    } catch (err) {
      console.error('Simulation execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* Header */}
      <div className="pb-2 border-b border-[#1F293D]">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Sliders className="w-6 h-6 text-cyan-400" />
          <span>WHAT-IF DISASTER SIMULATION & RECALCULATION SANDBOX</span>
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Simulate critical facility shutdowns, bridge/corridor blockages, and evaluate live resource redistribution without altering production records.
        </p>
      </div>

      {/* Simulation Configuration Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Disaster Parameters */}
        <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-4 shadow-xl">
          <h3 className="text-xs font-bold uppercase font-mono text-gray-200">
            1. Disaster Scenario Config
          </h3>

          <div>
            <label className="block text-[11px] font-mono text-gray-400 mb-1">Scenario Label</label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#141C2E] border border-[#1F293D] text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-gray-400 mb-1">Incident Type</label>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#141C2E] border border-[#1F293D] text-xs text-gray-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="ROAD_ACCIDENT">Major Road Accident / Pileup</option>
              <option value="BUILDING_FIRE">Commercial Building Fire</option>
              <option value="FLOOD">Flash Flood Inundation</option>
              <option value="INDUSTRIAL_ACCIDENT">Chemical Industrial Explosion</option>
              <option value="MASS_CASUALTY">Mass Casualty Public Event</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1">Casualties</label>
              <input
                type="number"
                min="1"
                max="100"
                value={patientCount}
                onChange={(e) => setPatientCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-[#141C2E] border border-[#1F293D] text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#141C2E] border border-[#1F293D] text-xs text-red-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 text-white font-black text-xs shadow-xl shadow-red-950/50 active:scale-95 transition-all"
          >
            <Play className={`w-4 h-4 ${loading ? 'animate-spin' : 'fill-white'}`} />
            <span>{loading ? 'Recalculating Network...' : 'RUN SIMULATION'}</span>
          </button>
        </div>

        {/* Col 2: Hospital Failure Toggles */}
        <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase font-mono text-gray-200 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>2. Facility Outage Toggles</span>
            </h3>
            <span className="text-[10px] font-mono text-red-400">
              {disabledHospitalIds.length} Disabled
            </span>
          </div>

          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {hospitals.map((hosp) => {
              const isDisabled = disabledHospitalIds.includes(hosp.hospital_id);
              return (
                <div
                  key={hosp.hospital_id}
                  onClick={() => toggleHospital(hosp.hospital_id)}
                  className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isDisabled 
                      ? 'bg-red-950/60 border-red-500/60 text-red-200' 
                      : 'bg-[#141C2E] border-[#1F293D] text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <div className="truncate max-w-[200px]">
                    <div className="text-xs font-semibold">{hosp.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      ICU: {hosp.icu_available} • {hosp.emergency_level}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    isDisabled ? 'bg-red-900 text-white' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {isDisabled ? 'UNAVAILABLE' : 'AVAILABLE'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Col 3: Road Corridor Blockage Toggles */}
        <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase font-mono text-gray-200 flex items-center space-x-1.5">
              <Navigation className="w-4 h-4 text-blue-400" />
              <span>3. Corridor Blockage Toggles</span>
            </h3>
            <span className="text-[10px] font-mono text-rose-400">
              {blockedRoadIds.length} Blocked
            </span>
          </div>

          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {roads.map((road) => {
              const isBlocked = blockedRoadIds.includes(road.road_id);
              return (
                <div
                  key={road.road_id}
                  onClick={() => toggleRoad(road.road_id)}
                  className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isBlocked 
                      ? 'bg-rose-950/60 border-rose-500/60 text-rose-200' 
                      : 'bg-[#141C2E] border-[#1F293D] text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <div className="truncate max-w-[200px]">
                    <div className="text-xs font-semibold">{road.road_name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{road.distance_km} km</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    isBlocked ? 'bg-rose-900 text-white' : 'bg-blue-950 text-blue-300'
                  }`}>
                    {isBlocked ? 'BLOCKED' : 'OPEN'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Simulation Output Comparison Diff */}
      {simResult && (
        <div className="space-y-6 pt-2">
          <div className="p-4 rounded-xl bg-[#0E1524] border border-cyan-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase font-mono text-white">
                  TERA RECALCULATION & COMPARATIVE IMPACT DIFF
                </h3>
              </div>
              <div className="text-xs font-mono text-cyan-300">
                Execution Time: <span className="font-bold">{simResult.execution_time_ms} ms</span>
              </div>
            </div>

            {/* Impact Metric Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#141C2E] border border-[#1F293D]">
                <div className="text-[10px] font-mono text-gray-400">Disabled Facilities</div>
                <div className="text-lg font-black text-red-400">{simResult.impact_summary.disabled_facilities_count}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#141C2E] border border-[#1F293D]">
                <div className="text-[10px] font-mono text-gray-400">Blocked Corridors</div>
                <div className="text-lg font-black text-rose-400">{simResult.impact_summary.blocked_corridors_count}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#141C2E] border border-[#1F293D]">
                <div className="text-[10px] font-mono text-gray-400">Rerouted Hospitals</div>
                <div className="text-lg font-black text-cyan-300">{simResult.impact_summary.rerouted_facilities_count}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#141C2E] border border-[#1F293D]">
                <div className="text-[10px] font-mono text-gray-400">Average ETA Shift</div>
                <div className="text-lg font-black text-amber-400">+{simResult.impact_summary.eta_shift_minutes} min</div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Plan Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Baseline Normal Allocation */}
            <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-3">
              <div className="text-xs font-bold uppercase font-mono text-gray-400 flex items-center justify-between">
                <span>Baseline Allocation (All Facilities Operational)</span>
                <span className="text-emerald-400">
                  {simResult.baseline_plan.allocated_patients} / {simResult.baseline_plan.total_patients} Pts
                </span>
              </div>
              <div className="space-y-2">
                {simResult.baseline_plan.assigned_hospitals.map((h: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#141C2E] border border-[#1F293D] flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-200">{h.hospital_name}</span>
                    <span className="font-mono text-cyan-400 font-bold">➔ {h.assigned_patients} Patients ({h.assigned_icu_beds} ICU)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recalculated Simulated Allocation */}
            <div className="p-4 rounded-xl bg-[#0E1524] border border-red-500/30 space-y-3">
              <div className="text-xs font-bold uppercase font-mono text-red-300 flex items-center justify-between">
                <span>Simulated Reallocation (Rerouted Plan)</span>
                <span className="text-amber-400">
                  {simResult.simulated_plan.allocated_patients} / {simResult.simulated_plan.total_patients} Pts
                </span>
              </div>
              <div className="space-y-2">
                {simResult.simulated_plan.assigned_hospitals.map((h: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#141C2E] border border-[#1F293D] flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-200">{h.hospital_name}</span>
                    <span className="font-mono text-emerald-400 font-bold">➔ {h.assigned_patients} Patients ({h.assigned_icu_beds} ICU)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
