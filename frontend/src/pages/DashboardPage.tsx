import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Users, Truck, Bed, ShieldAlert, 
  Activity, RefreshCw, AlertCircle, ArrowUpRight, Flame, 
  Radio, CheckCircle2, ArrowRight
} from 'lucide-react';
import api, { incidentsApi } from '../services/api';
import { EmergencyMap } from '../components/EmergencyMap';
import { 
  Incident, Ambulance, Hospital, RoadSegment, 
  EOCMetrics, ResourceAlert 
} from '../types';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';

interface DashboardPageProps {
  onSelectIncidentForAllocation?: (incidentId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  onSelectIncidentForAllocation,
  onNavigateTab 
}) => {
  const [metrics, setMetrics] = useState<EOCMetrics | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [alerts, setAlerts] = useState<ResourceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [mRes, iRes, aRes, hRes, rRes, altRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/incidents?limit=50'),
        api.get('/ambulances?limit=50'),
        api.get('/hospitals?limit=25'),
        api.get('/roads?limit=50'),
        api.get('/dashboard/alerts')
      ]);

      setMetrics(mRes.data);
      setIncidents(iRes.data || []);
      setAmbulances(aRes.data || []);
      setHospitals(hRes.data || []);
      setRoads(rRes.data || []);
      setAlerts(altRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleVerifyIncident = async (incId: string) => {
    try {
      await incidentsApi.transitionStatus(incId, 'VERIFIED');
      setActionSuccess(`Incident ${incId} verified! Status: RECEIVED → VERIFIED in PostgreSQL.`);
      fetchDashboardData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to verify incident.');
    }
  };

  const handleActivateIncident = async (incId: string) => {
    try {
      await incidentsApi.transitionStatus(incId, 'ACTIVE');
      setActionSuccess(`Incident ${incId} activated for EOC fleet dispatch & hospital allocation!`);
      fetchDashboardData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to activate incident.');
    }
  };

  const handleRejectIncident = async (incId: string) => {
    if (!window.confirm(`Reject / Cancel incoming incident report ${incId}?`)) return;
    try {
      await incidentsApi.transitionStatus(incId, 'CANCELLED');
      setActionSuccess(`Incident ${incId} rejected and moved to CANCELLED state.`);
      fetchDashboardData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to cancel incident.');
    }
  };

  // Filter incoming citizen reports (status: RECEIVED)
  const incomingReports = incidents.filter(i => i.status === 'RECEIVED');

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto select-none font-mono text-zinc-100">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Operations Center
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Live PostgreSQL Feed</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 font-sans">
            Emergency Operations Command Center
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            Real-time situational telemetry across multi-casualty incidents, ICU beds, ambulance fleet, and trauma inventory.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-zinc-400' : ''}`} />
            <span>Refresh Grid</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Incoming Citizen Reports Triage Queue Notification Banner */}
      {incomingReports.length > 0 && (
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-rose-500/40 shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                Incoming Citizen Field Reports ({incomingReports.length} Awaiting Dispatch Verification)
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">PostgreSQL Status: RECEIVED</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {incomingReports.map((inc) => (
              <div key={inc.incident_id} className="p-3 bg-black/60 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100">{inc.incident_type.replace(/_/g, ' ')}</span>
                    <StatusBadge status={inc.severity} size="sm" showDot={false} />
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate mt-0.5">{inc.location_name}</div>
                  <div className="text-[10px] text-zinc-500">{inc.estimated_patient_count} Patients Reported</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleVerifyIncident(inc.incident_id)}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold rounded-lg border border-zinc-700 transition-all cursor-pointer whitespace-nowrap"
                    title="Verify incident (Status: RECEIVED -> VERIFIED)"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleActivateIncident(inc.incident_id)}
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold rounded-lg shadow transition-all cursor-pointer whitespace-nowrap"
                    title="Activate & Dispatch Fleet (Status: -> ACTIVE)"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleRejectIncident(inc.incident_id)}
                    className="px-2 py-1 bg-zinc-900 hover:bg-rose-950 text-zinc-500 hover:text-rose-300 text-[10px] font-bold rounded-lg border border-zinc-800 transition-all cursor-pointer whitespace-nowrap"
                    title="Reject report"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 Clean Apple-Style Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          label="Active Incidents"
          value={metrics?.active_incidents ?? incidents.length}
          icon={AlertTriangle}
          variant="danger"
          statusText="Multi-hazard active"
        />
        <MetricCard
          label="Critical Patients"
          value={metrics?.critical_patients ?? '-'}
          icon={Users}
          variant="warning"
          statusText="In Triage / ICU"
        />
        <MetricCard
          label="Ambulances Avail"
          value={metrics?.available_ambulances ?? '-'}
          subValue={`/ ${metrics?.total_ambulances ?? 500}`}
          icon={Truck}
          variant="success"
          statusText="Ready for dispatch"
        />
        <MetricCard
          label="ICU Beds Avail"
          value={metrics?.available_icu_beds ?? '-'}
          subValue={`/ ${metrics?.total_icu_beds ?? 791}`}
          icon={Bed}
          variant="info"
          statusText="High contention"
        />
        <MetricCard
          label="Emergency Beds"
          value={metrics?.available_emergency_beds ?? '-'}
          subValue={`/ ${metrics?.total_emergency_beds ?? 2487}`}
          icon={Activity}
          variant="default"
          statusText="Triage ward cap"
        />
        <MetricCard
          label="Active Teams"
          value={metrics?.active_emergency_teams ?? '-'}
          subValue={`/ ${metrics?.total_emergency_teams ?? 60}`}
          icon={ShieldAlert}
          variant="default"
          statusText="Trauma & Hazmat"
        />
      </div>

      {/* Main Grid Layout: GIS Map & Resource Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Map Canvas */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              <span>Regional GIS Operations Map & Incident Density</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Live Coordinate Mesh
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 overflow-hidden shadow-lg bg-[#121215]">
            <EmergencyMap
              incidents={incidents}
              ambulances={ambulances}
              hospitals={hospitals}
              roads={roads}
              height="460px"
            />
          </div>
        </div>

        {/* Right Col: Resource Alerts Feed */}
        <div className="space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Critical Resource Alerts</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {alerts.length} Active
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#121215] border border-zinc-800/80 flex-1 overflow-y-auto max-h-[460px] space-y-2.5">
            {alerts.length === 0 ? (
              <div className="text-center py-16 text-xs text-zinc-500 font-sans">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mx-auto mb-2" />
                <span>All hospital stock levels within normal operational thresholds.</span>
              </div>
            ) : (
              alerts.map((alt) => (
                <div
                  key={alt.alert_id}
                  className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={alt.severity} size="sm" />
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Stock: {alt.available_quantity} / Thresh: {alt.critical_threshold}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-zinc-200 font-sans">
                    {alt.message}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {alt.hospital_name}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two Split Tables: Incidents & Hospital Capacity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
        {/* Incidents Table */}
        <div className="p-4 rounded-2xl bg-[#121215] border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono flex items-center space-x-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Simultaneous Incidents Matrix ({incidents.length})</span>
            </h3>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('incidents')}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 cursor-pointer font-sans"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900 text-zinc-400 font-mono uppercase text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="p-2.5">ID / Type</th>
                  <th className="p-2.5">Location</th>
                  <th className="p-2.5">Severity</th>
                  <th className="p-2.5">Patients</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {incidents.slice(0, 8).map((inc) => (
                  <tr key={inc.incident_id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="p-2.5">
                      <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                        {inc.incident_id}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-sans">{inc.incident_type.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="p-2.5 max-w-[140px] truncate text-zinc-300 font-sans">
                      {inc.location_name}
                    </td>
                    <td className="p-2.5">
                      <StatusBadge status={inc.severity} size="sm" showDot={false} />
                    </td>
                    <td className="p-2.5 font-mono font-bold text-zinc-200">
                      {inc.estimated_patient_count}
                    </td>
                    <td className="p-2.5">
                      <StatusBadge status={inc.status} size="sm" />
                    </td>
                    <td className="p-2.5 text-right">
                      {inc.status === 'RECEIVED' ? (
                        <button
                          onClick={() => handleVerifyIncident(inc.incident_id)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[10px] transition-all cursor-pointer border border-zinc-700"
                        >
                          Verify
                        </button>
                      ) : (
                        onSelectIncidentForAllocation && (
                          <button
                            onClick={() => onSelectIncidentForAllocation(inc.incident_id)}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] transition-all shadow cursor-pointer"
                          >
                            Allocate
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hospital Capacity Table */}
        <div className="p-4 rounded-2xl bg-[#121215] border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono flex items-center space-x-2">
              <Bed className="w-4 h-4 text-sky-400" />
              <span>Hospital Capacity & ICU Contention</span>
            </h3>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('hospitals')}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 cursor-pointer font-sans"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900 text-zinc-400 font-mono uppercase text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="p-2.5">Hospital</th>
                  <th className="p-2.5">Level</th>
                  <th className="p-2.5">ICU Avail / Total</th>
                  <th className="p-2.5">Emergency Beds</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {hospitals.slice(0, 8).map((hosp) => (
                  <tr key={hosp.hospital_id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="p-2.5">
                      <div className="font-bold text-zinc-100 truncate max-w-[150px] font-sans">{hosp.name}</div>
                      <div className="text-[10px] text-zinc-500 font-sans">{hosp.hospital_type.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-zinc-400">
                      {hosp.emergency_level}
                    </td>
                    <td className="p-2.5 font-mono">
                      <span className={`font-bold ${hosp.icu_available <= 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {hosp.icu_available}
                      </span>
                      <span className="text-zinc-500"> / {hosp.icu_total}</span>
                    </td>
                    <td className="p-2.5 font-mono">
                      <span className="text-zinc-200 font-semibold">{hosp.emergency_beds_available}</span>
                      <span className="text-zinc-500"> / {hosp.emergency_beds_total}</span>
                    </td>
                    <td className="p-2.5">
                      <StatusBadge status={hosp.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
