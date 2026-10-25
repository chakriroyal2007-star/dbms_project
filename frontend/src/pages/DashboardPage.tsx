import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Users, Truck, Bed, ShieldAlert, 
  Activity, RefreshCw, AlertCircle, ArrowUpRight, Flame, 
  Radio, CheckCircle2, ArrowRight, Eye, Link2, X, Camera, Mic, FileText,
  MapPin, Clock, Filter, Layers, Navigation
} from 'lucide-react';
import api, { incidentsApi } from '../services/api';
import { EmergencyMap } from '../components/EmergencyMap';
import { 
  Incident, Ambulance, Hospital, RoadSegment, 
  EOCMetrics, ResourceAlert 
} from '../types';
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

  // Active Workspace View Tab: 'queue' | 'map' | 'hospitals'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'queue' | 'map' | 'hospitals'>('queue');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECEIVED' | 'ACTIVE' | 'RESOLVED'>('ALL');

  // Operator Detailed Incident Inspection Modal
  const [reviewIncident, setReviewIncident] = useState<Incident | null>(null);
  const [linkingMasterId, setLinkingMasterId] = useState<string>('');
  const [linkingLoading, setLinkingLoading] = useState(false);

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
      setActionSuccess(`Incident ${incId} verified: Status transitioned to VERIFIED.`);
      fetchDashboardData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to verify incident.');
    }
  };

  const handleActivateIncident = async (incId: string) => {
    try {
      await incidentsApi.transitionStatus(incId, 'ACTIVE');
      setActionSuccess(`Incident ${incId} activated for fleet dispatch & resource coordination.`);
      fetchDashboardData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to activate incident.');
    }
  };

  const handleRejectIncident = async (incId: string) => {
    if (!window.confirm(`Reject incident report ${incId}?`)) return;
    try {
      await incidentsApi.transitionStatus(incId, 'CANCELLED');
      setActionSuccess(`Incident ${incId} moved to CANCELLED state.`);
      fetchDashboardData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to cancel incident.');
    }
  };

  const handleLinkDuplicate = async (incidentId: string, masterId: string) => {
    if (!masterId.trim()) return;
    try {
      setLinkingLoading(true);
      await incidentsApi.linkDuplicate(incidentId, masterId.trim().toUpperCase());
      setActionSuccess(`Linked incident ${incidentId} as duplicate of master ${masterId}!`);
      setReviewIncident(null);
      fetchDashboardData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to link duplicate incident.');
    } finally {
      setLinkingLoading(false);
    }
  };

  // Filtered incidents
  const filteredIncidents = incidents.filter(i => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'RECEIVED') return i.status === 'RECEIVED' || i.status === 'UNDER_REVIEW';
    if (statusFilter === 'ACTIVE') return i.status === 'ACTIVE' || i.status === 'VERIFIED' || i.status === 'ASSIGNED' || i.status === 'EN_ROUTE';
    if (statusFilter === 'RESOLVED') return i.status === 'RESOLVED' || i.status === 'CONTAINED' || i.status === 'CANCELLED';
    return true;
  });

  const pendingVerificationCount = incidents.filter(i => i.status === 'RECEIVED').length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto font-sans text-zinc-100">
      
      {/* 1. Calm, Focused Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">
              Live Operations Mesh
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Operations Command Center
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Authoritative incident verification, responder coordination, and facility capacity management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. Four Key High-Signal Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0D121F] border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Active Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics?.active_incidents ?? incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CANCELLED').length}
          </div>
          <div className="text-[11px] text-zinc-500">
            {pendingVerificationCount > 0 ? (
              <span className="text-amber-400 font-semibold">{pendingVerificationCount} awaiting triage</span>
            ) : (
              'All reports triaged'
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D121F] border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Critical Casualties</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics?.critical_patients ?? '-'}
          </div>
          <div className="text-[11px] text-zinc-500">Trauma triage tracking</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D121F] border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Ambulances Available</span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {metrics?.available_ambulances ?? ambulances.filter(a => a.current_status === 'AVAILABLE').length}
            <span className="text-xs text-zinc-500 font-normal ml-1">/ {metrics?.total_ambulances ?? ambulances.length}</span>
          </div>
          <div className="text-[11px] text-zinc-500">Ready for dispatch</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D121F] border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>ICU Beds Available</span>
            <Bed className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {metrics?.available_icu_beds ?? hospitals.reduce((acc, h) => acc + (h.icu_available || 0), 0)}
            <span className="text-xs text-zinc-500 font-normal ml-1">
              / {metrics?.total_icu_beds ?? hospitals.reduce((acc, h) => acc + (h.icu_total || 0), 0)}
            </span>
          </div>
          <div className="text-[11px] text-zinc-500">Across regional network</div>
        </div>
      </div>

      {/* 3. Primary Workspace Switcher (Reduced Overcrowding) */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveWorkspaceTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeWorkspaceTab === 'queue'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Incident Queue</span>
            {pendingVerificationCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                {pendingVerificationCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveWorkspaceTab('map')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeWorkspaceTab === 'map'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Regional GIS Mesh</span>
          </button>

          <button
            onClick={() => setActiveWorkspaceTab('hospitals')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeWorkspaceTab === 'hospitals'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            <span>Hospital Network</span>
            {alerts.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                {alerts.length} Alerts
              </span>
            )}
          </button>
        </div>

        {activeWorkspaceTab === 'queue' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-zinc-500 hidden sm:inline">Filter:</span>
            {(['ALL', 'RECEIVED', 'ACTIVE', 'RESOLVED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab === 'RECEIVED' ? 'Needs Review' : tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. WORKSPACE TAB A: INCIDENT QUEUE */}
      {activeWorkspaceTab === 'queue' && (
        <div className="space-y-4">
          {filteredIncidents.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0D121F] border border-zinc-800/80 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="text-sm font-semibold text-zinc-300">No Incidents in this View</div>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No emergency reports currently match the selected status filter. New citizen reports will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0D121F] border border-zinc-800/80 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121829] text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
                    <tr>
                      <th className="p-3.5">Incident ID / Type</th>
                      <th className="p-3.5">Location & Landmark</th>
                      <th className="p-3.5">Severity</th>
                      <th className="p-3.5">Casualties</th>
                      <th className="p-3.5">Current Status</th>
                      <th className="p-3.5">Reported</th>
                      <th className="p-3.5 text-right">Operational Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {filteredIncidents.map((inc) => (
                      <tr key={inc.incident_id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-white flex items-center gap-2">
                            <span>{inc.incident_id}</span>
                            {inc.voice_transcript && (
                              <span title="Voice Note Available" className="text-cyan-400">
                                <Mic className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                            {inc.incident_type.replace(/_/g, ' ')}
                          </div>
                        </td>

                        <td className="p-3.5 max-w-[220px]">
                          <div className="truncate font-medium text-zinc-200">{inc.location_name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {inc.locality || inc.city || 'Tirupati'}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <StatusBadge status={inc.severity} size="sm" showDot={false} />
                        </td>

                        <td className="p-3.5 font-mono font-semibold text-zinc-200">
                          {inc.estimated_patient_count === 0 ? (
                            <span className="text-zinc-500 font-normal">Unspecified</span>
                          ) : (
                            `${inc.estimated_patient_count} pts`
                          )}
                        </td>

                        <td className="p-3.5">
                          <StatusBadge status={inc.status} size="sm" />
                        </td>

                        <td className="p-3.5 text-[11px] text-zinc-400 font-mono whitespace-nowrap">
                          {new Date(inc.reported_at || inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setReviewIncident(inc)}
                              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-cyan-300 text-xs font-medium transition-all cursor-pointer border border-zinc-700 flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>

                            {inc.status === 'RECEIVED' ? (
                              <button
                                onClick={() => handleVerifyIncident(inc.incident_id)}
                                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-sm"
                              >
                                Verify
                              </button>
                            ) : (
                              onSelectIncidentForAllocation && (
                                <button
                                  onClick={() => onSelectIncidentForAllocation(inc.incident_id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1"
                                >
                                  <span>Allocate</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. WORKSPACE TAB B: GIS MAP */}
      {activeWorkspaceTab === 'map' && (
        <div className="rounded-2xl border border-zinc-800/80 overflow-hidden shadow-lg bg-[#0D121F]">
          <EmergencyMap
            incidents={incidents}
            ambulances={ambulances}
            hospitals={hospitals}
            roads={roads}
            height="580px"
          />
        </div>
      )}

      {/* 6. WORKSPACE TAB C: HOSPITAL NETWORK & CAPACITY */}
      {activeWorkspaceTab === 'hospitals' && (
        <div className="space-y-4">
          {alerts.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Active Facility Capacity Alerts ({alerts.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {alerts.map(alt => (
                  <div key={alt.alert_id} className="p-2.5 bg-black/40 rounded-lg border border-amber-500/20 text-zinc-300">
                    <span className="font-semibold text-white">{alt.hospital_name}:</span> {alt.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-[#0D121F] border border-zinc-800/80 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121829] text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="p-3.5">Hospital Name</th>
                    <th className="p-3.5">Tier & Type</th>
                    <th className="p-3.5">ICU Availability</th>
                    <th className="p-3.5">Emergency Beds</th>
                    <th className="p-3.5">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {hospitals.map(hosp => (
                    <tr key={hosp.hospital_id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{hosp.name}</div>
                        <div className="text-[11px] text-zinc-500">{hosp.hospital_id}</div>
                      </td>
                      <td className="p-3.5 text-zinc-300 font-mono text-[11px]">
                        {hosp.emergency_level} • {hosp.hospital_type.replace(/_/g, ' ')}
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className={`font-bold ${hosp.icu_available <= 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {hosp.icu_available}
                        </span>
                        <span className="text-zinc-500"> / {hosp.icu_total}</span>
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className="font-semibold text-zinc-200">{hosp.emergency_beds_available}</span>
                        <span className="text-zinc-500"> / {hosp.emergency_beds_total}</span>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={hosp.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Operator Incident Detailed Inspection & Triage Drawer */}
      {reviewIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0D121F] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 text-xs">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-mono font-bold text-sm">{reviewIncident.incident_id}</span>
                  <StatusBadge status={reviewIncident.status} size="sm" />
                  <StatusBadge status={reviewIncident.severity} size="sm" showDot={false} />
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">{reviewIncident.location_name}</div>
              </div>

              <button
                onClick={() => setReviewIncident(null)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-black/40 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">TYPE</span>
                <span className="font-bold text-zinc-200">{reviewIncident.incident_type.replace(/_/g, ' ')}</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">CASUALTIES</span>
                <span className="font-bold text-amber-400">
                  {reviewIncident.estimated_patient_count === 0 ? 'Unspecified' : `${reviewIncident.estimated_patient_count} Patients`}
                </span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">TRACKING CODE</span>
                <span className="font-bold text-cyan-300 font-mono">{reviewIncident.tracking_code || 'N/A'}</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">COORDINATES</span>
                <span className="font-mono text-zinc-300">{reviewIncident.latitude.toFixed(4)}, {reviewIncident.longitude.toFixed(4)}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold">Field Description</span>
              <div className="p-3 bg-black/50 border border-zinc-800 rounded-xl text-zinc-200 leading-relaxed">
                {reviewIncident.description}
              </div>
            </div>

            {/* Voice AI Transcript Preview (if available) */}
            {reviewIncident.voice_transcript && (
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Verified Voice Speech-to-Text Transcript</span>
                </div>
                <div className="text-xs text-zinc-200 italic font-sans">
                  "{reviewIncident.voice_transcript}"
                </div>
              </div>
            )}

            {/* Attached Evidence Preview */}
            {((reviewIncident.evidence_urls && reviewIncident.evidence_urls.length > 0) || (reviewIncident.evidence_urls_json && reviewIncident.evidence_urls_json.length > 0)) && (
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Scene Evidence Attachments ({(reviewIncident.evidence_urls || reviewIncident.evidence_urls_json || []).length})</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {(reviewIncident.evidence_urls || reviewIncident.evidence_urls_json || []).map((ev: any, idx: number) => (
                    <a
                      key={idx}
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-black/60 border border-zinc-700 rounded-lg text-cyan-300 hover:text-cyan-200 text-[11px] flex items-center gap-1.5 cursor-pointer font-mono"
                    >
                      <span>[{ev.category || ev.media_category || 'EVIDENCE'}] View Attachment #{idx + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Duplicate Incident Linking Section */}
            <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-2">
              <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Link Duplicate Incident to Master</span>
              </span>
              <p className="text-[11px] text-zinc-400">
                Consolidate response under a master incident while preserving this report's audit trail.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={linkingMasterId}
                  onChange={(e) => setLinkingMasterId(e.target.value.toUpperCase())}
                  placeholder="Master Incident ID (e.g. INC_FIELD_1042)..."
                  className="bg-black/60 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-amber-500 font-mono flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleLinkDuplicate(reviewIncident.incident_id, linkingMasterId)}
                  disabled={linkingLoading || !linkingMasterId.trim()}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded-lg cursor-pointer disabled:opacity-50 transition-all font-mono"
                >
                  {linkingLoading ? 'Linking...' : 'Link Duplicate'}
                </button>
              </div>
            </div>

            {/* Operator Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleVerifyIncident(reviewIncident.incident_id);
                    setReviewIncident(null);
                  }}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg border border-zinc-700 cursor-pointer text-xs"
                >
                  Mark Verified
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleActivateIncident(reviewIncident.incident_id);
                    setReviewIncident(null);
                  }}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg cursor-pointer text-xs shadow-sm"
                >
                  Activate & Dispatch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRejectIncident(reviewIncident.incident_id);
                    setReviewIncident(null);
                  }}
                  className="px-3.5 py-2 bg-rose-950/70 hover:bg-rose-900 text-rose-300 font-semibold rounded-lg border border-rose-800/40 cursor-pointer text-xs"
                >
                  Reject
                </button>
              </div>

              <button
                type="button"
                onClick={() => setReviewIncident(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-lg cursor-pointer text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
