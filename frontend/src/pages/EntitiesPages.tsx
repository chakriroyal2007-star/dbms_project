import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Truck, Building2, Package, 
  Navigation, Users, Settings as SettingsIcon, RefreshCw, 
  CheckCircle2, Plus, Trash2, Edit3, Eye, Search, Filter, Shield, Activity
} from 'lucide-react';
import api, { hospitalsApi, incidentsApi, ambulancesApi, resourcesApi, roadsApi, teamsApi } from '../services/api';
import { Incident, Ambulance, Hospital, ResourceItem, RoadSegment, EmergencyTeam, User } from '../types';
import { DetailDrawer } from '../components/DetailDrawer';
import { ErrorState } from '../components/ErrorState';

// -----------------------------------------------------------------------------
// Incidents View
// -----------------------------------------------------------------------------
export const IncidentsView: React.FC<{ user?: User | null }> = ({ user }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [newType, setNewType] = useState('BUILDING_FIRE');
  const [newDesc, setNewDesc] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [newLat, setNewLat] = useState('13.6288');
  const [newLng, setNewLng] = useState('79.4192');
  const [newSev, setNewSev] = useState('CRITICAL');
  const [newPatients, setNewPatients] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await incidentsApi.getAll({ limit: 100 });
      setIncidents(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Failed to fetch incidents from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, []);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsedLat = parseFloat(newLat);
      const parsedLng = parseFloat(newLng);
      await incidentsApi.create({
        incident_type: newType,
        description: newDesc || `Emergency triage incident at ${newLoc}`,
        severity: newSev,
        latitude: isNaN(parsedLat) ? 13.6288 : parsedLat,
        longitude: isNaN(parsedLng) ? 79.4192 : parsedLng,
        location_name: newLoc || "Central Urban Sector",
        estimated_patient_count: Number(newPatients)
      });
      setShowCreateModal(false);
      setNewDesc('');
      setNewLoc('');
      fetchIncidents();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create incident.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIncident = async (incidentId: string) => {
    if (!window.confirm(`Delete incident ${incidentId} and its triage records?`)) return;
    try {
      await incidentsApi.delete(incidentId);
      fetchIncidents();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to delete incident.');
    }
  };

  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = i.incident_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.incident_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.location_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || i.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  if (error) {
    return <ErrorState title="INCIDENTS DATABASE ERROR" message={error} onRetry={fetchIncidents} loading={loading} />;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">
              OPERATIONS
            </span>
            <span className="text-[10px] font-mono text-gray-500">RELATIONAL TABLE: incident</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2 mt-1">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span>INCIDENT LOG & TRIAGE DISPATCH MATRIX</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">Live emergency logs, patient counts, and geo-severity.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchIncidents} className="px-3 py-2 rounded-lg bg-[#111827] hover:bg-[#1C2538] border border-[#1F293D] text-xs font-medium text-gray-300 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-900/40 transition-all cursor-pointer font-mono"
          >
            <Plus className="w-4 h-4" />
            Report Incident
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-900/40 border border-gray-800 p-3 rounded-xl text-xs font-mono">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-black/50 border border-gray-700 px-3 py-1.5 rounded-lg">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search incident ID, type, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-gray-200 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-black/50 border border-gray-700 px-3 py-1.5 rounded-lg text-gray-300 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="SERIOUS">Serious</option>
            <option value="MODERATE">Moderate</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#141C2E] text-gray-400 font-mono uppercase text-[10px] border-b border-[#1F293D]">
            <tr>
              <th className="p-3">Incident ID</th>
              <th className="p-3">Type</th>
              <th className="p-3">Description</th>
              <th className="p-3">Location</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Patients</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F293D] text-gray-300 font-mono">
            {filteredIncidents.map((inc) => (
              <tr 
                key={inc.incident_id} 
                onClick={() => setSelectedIncident(inc)}
                className="hover:bg-[#141C2E]/80 transition-colors cursor-pointer"
              >
                <td className="p-3 font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400 opacity-60 hover:opacity-100" />
                  {inc.incident_id}
                </td>
                <td className="p-3 text-cyan-400 font-sans">{inc.incident_type.replace(/_/g, ' ')}</td>
                <td className="p-3 font-sans text-gray-300 max-w-[280px] truncate">{inc.description}</td>
                <td className="p-3 font-sans text-gray-400">{inc.location_name}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    inc.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-500/40' : 'bg-amber-950 text-amber-300 border-amber-500/40'
                  }`}>
                    {inc.severity}
                  </span>
                </td>
                <td className="p-3 font-bold text-amber-400">{inc.estimated_patient_count}</td>
                <td className="p-3 text-emerald-400 font-semibold">{inc.status}</td>
                <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleDeleteIncident(inc.incident_id)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete Incident"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        title={selectedIncident?.location_name || 'Incident Details'}
        subtitle={`Incident ID: ${selectedIncident?.incident_id}`}
        entityType="incident"
        data={selectedIncident}
      />

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0B1120] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-base font-bold text-gray-100 mb-1 flex items-center gap-2 font-mono">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Report New Multi-Casualty Incident
            </h2>
            <p className="text-xs text-gray-400 font-mono mb-4">
              Commits new incident record and generates triaged patient rows in PostgreSQL.
            </p>

            <form onSubmit={handleCreateIncident} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-gray-400 mb-1">Incident Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-red-500"
                >
                  <option value="BUILDING_COLLAPSE">BUILDING COLLAPSE</option>
                  <option value="INDUSTRIAL_EXPLOSION">INDUSTRIAL EXPLOSION</option>
                  <option value="HIGHWAY_MULTI_COLLISION">HIGHWAY MULTI COLLISION</option>
                  <option value="CHEMICAL_LEAK">CHEMICAL LEAK</option>
                  <option value="URBAN_FLASH_FLOOD">URBAN FLASH FLOOD</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Location Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alipiri Bypass Junction"
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-gray-200 focus:outline-none focus:border-red-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-gray-200 focus:outline-none focus:border-red-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Severity Tier</label>
                <select
                  value={newSev}
                  onChange={(e) => setNewSev(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-red-500"
                >
                  <option value="CRITICAL">CRITICAL (Mass Casualties / Code Red)</option>
                  <option value="SERIOUS">SERIOUS (Multiple Urgent Patients)</option>
                  <option value="MODERATE">MODERATE (Controlled Zone)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Estimated Patient Count</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={newPatients}
                  onChange={(e) => setNewPatients(Number(e.target.value))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-900/40 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Commit Incident to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Ambulances View
// -----------------------------------------------------------------------------
export const AmbulancesView: React.FC<{ user?: User | null }> = ({ user }) => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);

  const fetchAmbulances = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ambulancesApi.getAll({ limit: 100 });
      setAmbulances(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Failed to fetch ambulances from PostgreSQL database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAmbulances(); }, []);

  const handleStatusChange = async (ambId: string, newStatus: string) => {
    try {
      await ambulancesApi.updateStatus(ambId, newStatus, "Operator status manual override");
      fetchAmbulances();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update status.');
    }
  };

  if (error) {
    return <ErrorState title="AMBULANCES DATABASE ERROR" message={error} onRetry={fetchAmbulances} loading={loading} />;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              FLEET
            </span>
            <span className="text-[10px] font-mono text-gray-500">RELATIONAL TABLE: ambulance</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2 mt-1">
            <Truck className="w-6 h-6 text-cyan-400" />
            <span>EMERGENCY AMBULANCE FLEET REGISTRY</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">Real-time telemetry, vehicle classification, and dispatch status.</p>
        </div>
        <button onClick={fetchAmbulances} className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1C2538] border border-[#1F293D] text-xs font-medium text-gray-300 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#141C2E] text-gray-400 uppercase text-[10px] border-b border-[#1F293D]">
            <tr>
              <th className="p-3">Ambulance ID</th>
              <th className="p-3">Plate No</th>
              <th className="p-3">Type</th>
              <th className="p-3">Base Hospital</th>
              <th className="p-3">Capacity</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Quick Dispatch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F293D] text-gray-300">
            {ambulances.map((amb) => (
              <tr 
                key={amb.ambulance_id} 
                onClick={() => setSelectedAmbulance(amb)}
                className="hover:bg-[#141C2E]/80 transition-colors cursor-pointer"
              >
                <td className="p-3 font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400 opacity-60" />
                  {amb.ambulance_id}
                </td>
                <td className="p-3 text-gray-300">{amb.registration_number}</td>
                <td className="p-3 text-cyan-400">{amb.ambulance_type}</td>
                <td className="p-3 font-sans text-gray-400">{amb.home_hospital_name || 'Station 1'}</td>
                <td className="p-3 font-bold text-gray-200">{amb.capacity} Beds</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    amb.current_status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-amber-950 text-amber-300 border-amber-500/40'
                  }`}>
                    {amb.current_status}
                  </span>
                </td>
                <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={amb.current_status}
                    onChange={(e) => handleStatusChange(amb.ambulance_id, e.target.value)}
                    className="bg-black/60 border border-gray-700 text-[11px] rounded px-2 py-1 text-cyan-300 cursor-pointer"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="DISPATCHED">DISPATCHED</option>
                    <option value="EN_ROUTE_HOSPITAL">EN ROUTE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DetailDrawer
        isOpen={!!selectedAmbulance}
        onClose={() => setSelectedAmbulance(null)}
        title={selectedAmbulance?.registration_number || 'Ambulance Details'}
        subtitle={`Vehicle ID: ${selectedAmbulance?.ambulance_id}`}
        entityType="ambulance"
        data={selectedAmbulance}
      />
    </div>
  );
};

// -----------------------------------------------------------------------------
// Hospitals View
// -----------------------------------------------------------------------------
export const HospitalsView: React.FC<{ user?: User | null }> = ({ user }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hospitalsApi.getAll({ limit: 100 });
      setHospitals(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Failed to fetch hospitals from PostgreSQL database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHospitals(); }, []);

  const handleDeleteHospital = async (hospitalId: string) => {
    if (!window.confirm(`Permanently delete hospital ${hospitalId} and related capacity histories?`)) return;
    try {
      await hospitalsApi.delete(hospitalId);
      fetchHospitals();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to delete hospital.');
    }
  };

  if (error) {
    return <ErrorState title="HOSPITALS DATABASE ERROR" message={error} onRetry={fetchHospitals} loading={loading} />;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              FACILITIES
            </span>
            <span className="text-[10px] font-mono text-gray-500">RELATIONAL TABLE: hospital</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2 mt-1">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <span>HOSPITAL CAPACITY & OCCUPANCY GRID</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">ICU capacity, emergency bed occupancy, and facility triage levels.</p>
        </div>
        <button onClick={fetchHospitals} className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1C2538] border border-[#1F293D] text-xs font-medium text-gray-300 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#141C2E] text-gray-400 uppercase text-[10px] border-b border-[#1F293D]">
            <tr>
              <th className="p-3">Hospital Name</th>
              <th className="p-3">Level</th>
              <th className="p-3">ICU Available</th>
              <th className="p-3">Emergency Beds</th>
              <th className="p-3">General Beds</th>
              <th className="p-3">ICU Load %</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F293D] text-gray-300">
            {hospitals.map((h) => (
              <tr 
                key={h.hospital_id} 
                onClick={() => setSelectedHospital(h)}
                className="hover:bg-[#141C2E]/80 transition-colors cursor-pointer"
              >
                <td className="p-3 font-sans font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400 opacity-60" />
                  {h.name}
                </td>
                <td className="p-3 text-cyan-400 font-bold">{h.emergency_level}</td>
                <td className="p-3 font-bold text-emerald-400">{h.icu_available} / {h.icu_total}</td>
                <td className="p-3 font-bold text-amber-400">{h.emergency_beds_available} / {h.emergency_beds_total}</td>
                <td className="p-3 text-gray-300">{h.general_beds_available} / {h.general_beds_total}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${h.icu_occupancy_percent > 80 ? 'bg-red-500' : h.icu_occupancy_percent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${h.icu_occupancy_percent}%` }}
                      />
                    </div>
                    <span>{h.icu_occupancy_percent}%</span>
                  </div>
                </td>
                <td className="p-3 text-emerald-400">{h.status}</td>
                <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleDeleteHospital(h.hospital_id)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete Hospital"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DetailDrawer
        isOpen={!!selectedHospital}
        onClose={() => setSelectedHospital(null)}
        title={selectedHospital?.name || 'Hospital Details'}
        subtitle={`Facility ID: ${selectedHospital?.hospital_id}`}
        entityType="hospital"
        data={selectedHospital}
      />
    </div>
  );
};

// -----------------------------------------------------------------------------
// Resources View
// -----------------------------------------------------------------------------
export const ResourcesView: React.FC<{ user?: User | null }> = ({ user }) => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await resourcesApi.getAll({ limit: 100 });
      setResources(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Failed to fetch resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleAdjust = async (resId: string, delta: number) => {
    try {
      await resourcesApi.adjust(resId, delta, "Stock adjustment from EOC");
      fetchResources();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to adjust quantity.');
    }
  };

  if (error) {
    return <ErrorState title="RESOURCES DATABASE ERROR" message={error} onRetry={fetchResources} loading={loading} />;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
              SUPPLIES
            </span>
            <span className="text-[10px] font-mono text-gray-500">RELATIONAL TABLE: resource</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2 mt-1">
            <Package className="w-6 h-6 text-amber-400" />
            <span>CRITICAL MEDICAL & BLOOD BANK INVENTORY</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">Cross-hospital stocks of O-Negative Blood, Ventilators, and Oxygen Cylinders.</p>
        </div>
        <button onClick={fetchResources} className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1C2538] border border-[#1F293D] text-xs font-medium text-gray-300 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#141C2E] text-gray-400 uppercase text-[10px] border-b border-[#1F293D]">
            <tr>
              <th className="p-3">Resource Type</th>
              <th className="p-3">Hospital</th>
              <th className="p-3">Available</th>
              <th className="p-3">Total Stock</th>
              <th className="p-3">Threshold</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Quick Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F293D] text-gray-300">
            {resources.map((r) => (
              <tr key={r.resource_id} className="hover:bg-[#141C2E]/80 transition-colors">
                <td className="p-3 font-bold text-white">{r.resource_type}</td>
                <td className="p-3 font-sans text-gray-400">{r.hospital_name}</td>
                <td className="p-3 font-bold text-cyan-400">{r.available_quantity}</td>
                <td className="p-3 text-gray-400">{r.total_quantity}</td>
                <td className="p-3 text-amber-400">{r.critical_threshold}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    r.status === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-500/40' : r.status === 'LOW' ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => handleAdjust(r.resource_id, -1)}
                    className="px-2 py-0.5 bg-red-950/60 border border-red-800/40 text-red-300 rounded font-bold hover:bg-red-900 cursor-pointer"
                    title="Deduct 1"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => handleAdjust(r.resource_id, 1)}
                    className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 rounded font-bold hover:bg-emerald-900 cursor-pointer"
                    title="Add 1"
                  >
                    +1
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Emergency Teams View
// -----------------------------------------------------------------------------
export const TeamsView: React.FC<{ user?: User | null }> = ({ user }) => {
  const [teams, setTeams] = useState<EmergencyTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamsApi.getAll();
      setTeams(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Failed to fetch teams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleStatusChange = async (teamId: string, newStatus: string) => {
    try {
      await teamsApi.updateStatus(teamId, newStatus);
      fetchTeams();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update team status.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-zinc-400 hover:text-zinc-200">✕</button>
        </div>
      )}
      <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
              SPECIALISTS
            </span>
            <span className="text-[10px] font-mono text-gray-500">RELATIONAL TABLE: emergency_team</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2 mt-1">
            <Users className="w-6 h-6 text-purple-400" />
            <span>SPECIALIZED MEDICAL & HAZMAT TEAMS</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">Trauma surgical units, Hazmat decontamination, and Search & Rescue teams.</p>
        </div>
        <button onClick={fetchTeams} className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1C2538] border border-[#1F293D] text-xs font-medium text-gray-300 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#141C2E] text-gray-400 uppercase text-[10px] border-b border-[#1F293D]">
            <tr>
              <th className="p-3">Team Name</th>
              <th className="p-3">Specialization</th>
              <th className="p-3">Personnel Capacity</th>
              <th className="p-3">Station Hospital</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F293D] text-gray-300">
            {teams.map((t) => (
              <tr key={t.team_id} className="hover:bg-[#141C2E]/80 transition-colors">
                <td className="p-3 font-bold text-white">{t.team_name}</td>
                <td className="p-3 text-cyan-400">{t.specialization}</td>
                <td className="p-3 text-gray-300">{t.capacity} Members</td>
                <td className="p-3 font-sans text-gray-400">{t.home_hospital_name || 'Central EOC'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    t.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-amber-950 text-amber-300 border-amber-500/40'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <select
                    value={t.status}
                    onChange={(e) => handleStatusChange(t.team_id, e.target.value)}
                    className="bg-black/60 border border-gray-700 text-[11px] rounded px-2 py-1 text-purple-300 cursor-pointer"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="DEPLOYED">DEPLOYED</option>
                    <option value="STANDBY">STANDBY</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Roads View
// -----------------------------------------------------------------------------
export const RoadsView: React.FC<{ user?: User | null }> = ({ user }) => {
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roadsApi.getAll({ limit: 100 });
      setRoads(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Failed to fetch road segments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoads(); }, []);

  const handleToggleBlock = async (roadId: string, currentBlocked: boolean) => {
    try {
      await roadsApi.toggleBlock(roadId, !currentBlocked);
      fetchRoads();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to toggle road status.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-zinc-400 hover:text-zinc-200">✕</button>
        </div>
      )}
      <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
              INFRASTRUCTURE
            </span>
            <span className="text-[10px] font-mono text-gray-500">RELATIONAL TABLE: road</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2 mt-1">
            <Navigation className="w-6 h-6 text-blue-400" />
            <span>URBAN ROAD NETWORK & TRANSIT ROUTING</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">Dynamic congestion tracking, road blockages, and shortest-path calculation feeds.</p>
        </div>
        <button onClick={fetchRoads} className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1C2538] border border-[#1F293D] text-xs font-medium text-gray-300 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#141C2E] text-gray-400 uppercase text-[10px] border-b border-[#1F293D]">
            <tr>
              <th className="p-3">Road Segment</th>
              <th className="p-3">Corridor</th>
              <th className="p-3">Distance</th>
              <th className="p-3">Traffic Level</th>
              <th className="p-3">Avg Speed</th>
              <th className="p-3">Blocked Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F293D] text-gray-300">
            {roads.map((r) => (
              <tr key={r.road_id} className="hover:bg-[#141C2E]/80 transition-colors">
                <td className="p-3 font-bold text-white">{r.road_name}</td>
                <td className="p-3 text-gray-400">{r.source_location} &rarr; {r.destination_location}</td>
                <td className="p-3 text-cyan-400">{r.distance_km} km</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    r.traffic_level === 'SEVERE' ? 'bg-red-950 text-red-300 border-red-500/40' : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {r.traffic_level}
                  </span>
                </td>
                <td className="p-3 text-gray-300">{r.average_speed} km/h</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    r.blocked ? 'bg-red-950 text-red-300 border-red-500/40' : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {r.blocked ? 'BLOCKED' : 'CLEAR'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleToggleBlock(r.road_id, r.blocked)}
                    className={`px-3 py-1 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                      r.blocked ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900' : 'bg-red-950/60 text-red-400 border-red-800/50 hover:bg-red-900'
                    }`}
                  >
                    {r.blocked ? 'Unblock Road' : 'Block Road'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Settings & Architecture View
// -----------------------------------------------------------------------------
export const SettingsView: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto select-none">
      <div className="flex items-center justify-between pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              ENGINE INFO
            </span>
            <span className="text-[10px] font-mono text-gray-500">TERA ARCHITECTURE SPECIFICATION</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2 mt-1">
            <SettingsIcon className="w-6 h-6 text-cyan-400" />
            <span>SYSTEM ARCHITECTURE & DBMS SPECIFICATION</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">Relational schema characteristics, indexing parameters, and temporal engine design.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-3 font-mono text-xs">
          <h3 className="text-sm font-bold text-cyan-400">Database Engine Configuration</h3>
          <div className="space-y-1.5 text-gray-300">
            <div><span className="text-gray-500">RDBMS:</span> PostgreSQL 15 / SQLite WAL</div>
            <div><span className="text-gray-500">ORM / SQL:</span> SQLAlchemy 2.0 with Parameterized Queries</div>
            <div><span className="text-gray-500">Normal Form:</span> 3NF / Boyce-Codd Normal Form (BCNF)</div>
            <div><span className="text-gray-500">Isolation Level:</span> READ COMMITTED / SERIALIZABLE Allocations</div>
            <div><span className="text-gray-500">Total Tables:</span> 18+ Relational Schema Tables</div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-3 font-mono text-xs">
          <h3 className="text-sm font-bold text-cyan-400">Security & Role-Based Access Control</h3>
          <div className="space-y-1.5 text-gray-300">
            <div><span className="text-gray-500">Auth Token:</span> JSON Web Token (JWT) with HS256 Signature</div>
            <div><span className="text-gray-500">Password Storage:</span> SHA-256 / PBKDF2 Cryptographic Hashes</div>
            <div><span className="text-gray-500">Role 1:</span> ADMINISTRATOR (Master CRUD & Audit Authority)</div>
            <div><span className="text-gray-500">Role 2:</span> CONTROL OPERATOR (Triage & Dispatch Authority)</div>
            <div><span className="text-gray-500">Role 3:</span> ANALYST (Read-Only Analytics & SQL Playground)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
