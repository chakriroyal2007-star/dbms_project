import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, MapPin, Send, CheckCircle2, ShieldAlert, 
  Flame, Navigation, Users, Clock, ArrowRight, RefreshCw, PhoneCall, Radio,
  Activity, CheckCircle, Search, FileText, UserCheck, Shield, LifeBuoy, Check
} from 'lucide-react';
import { incidentsApi } from '../services/api';
import { Incident, User } from '../types';

interface ReporterPortalPageProps {
  initialSubTab?: 'home' | 'report' | 'my_reports' | 'tracker' | 'profile';
  onSwitchToEOC?: () => void;
  user?: User | null;
}

export const ReporterPortalPage: React.FC<ReporterPortalPageProps> = ({ 
  initialSubTab = 'report', 
  onSwitchToEOC,
  user 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'report' | 'my_reports' | 'tracker' | 'profile'>(initialSubTab);
  
  // Form State
  const [incidentType, setIncidentType] = useState('ROAD_ACCIDENT');
  const [country, setCountry] = useState('India');
  const [stateName, setStateName] = useState('Andhra Pradesh');
  const [district, setDistrict] = useState('Tirupati');
  const [city, setCity] = useState('Tirupati');
  const [locality, setLocality] = useState('Alipiri Corridor');
  const [landmark, setLandmark] = useState('Near Garuda Statue Circle');
  const [locationName, setLocationName] = useState('Alipiri Bypass Circle Sector 2, Tirupati');
  const [description, setDescription] = useState('');
  const [patientCount, setPatientCount] = useState<number>(3);
  const [severity, setSeverity] = useState('CRITICAL');
  const [reporterName, setReporterName] = useState(user?.full_name || 'Field Citizen');
  const [reporterPhone, setReporterPhone] = useState('+91-9876543210');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 13.6550, lng: 79.3950 });
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // My Reports State (SQL Enforced where reporter_id = current_user.id)
  const [myReports, setMyReports] = useState<Incident[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Tracking Search
  const [searchCode, setSearchCode] = useState('');
  const [trackedIncident, setTrackedIncident] = useState<Incident | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Geographic presets for realistic demonstration
  const locationPresets = [
    {
      label: "Alipiri Bypass Circle (Sector 2)",
      locality: "Alipiri Corridor",
      landmark: "Garuda Statue Circle",
      lat: 13.6550,
      lng: 79.3950,
      fullName: "Alipiri Bypass Circle Sector 2, Tirupati"
    },
    {
      label: "NH-71 Airport Expressway (Km 14)",
      locality: "Airport Corridor",
      landmark: "Tirupati Airport Toll Gate",
      lat: 13.6420,
      lng: 79.4850,
      fullName: "NH-71 Expressway Km 14 Near Airport Junction, Tirupati"
    },
    {
      label: "Town Center Plaza (Gandhi Road)",
      locality: "Central Commercial Sector",
      landmark: "Gandhi Road Clock Tower",
      lat: 13.6260,
      lng: 79.4210,
      fullName: "Town Center Plaza, Gandhi Road, Tirupati"
    },
    {
      label: "Settipalli Freight Hub (Block C)",
      locality: "Settipalli Industrial Hub",
      landmark: "Railway Cargo Gate 4",
      lat: 13.6180,
      lng: 79.4520,
      fullName: "Settipalli Freight Yard Shed 3, Tirupati"
    }
  ];

  const fetchMyReports = async () => {
    try {
      setLoadingReports(true);
      // Calls API - backend automatically filters where reporter_id = current_user.id for REPORTER role
      const data = await incidentsApi.getAll({ my_reports: true, limit: 25 });
      setMyReports(data || []);
    } catch (err) {
      console.error('Failed to fetch my reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
    const interval = setInterval(fetchMyReports, 4000); // Poll every 4 seconds for live Operator status changes
    return () => clearInterval(interval);
  }, []);

  const handleSelectPreset = (preset: typeof locationPresets[0]) => {
    setLocality(preset.locality);
    setLandmark(preset.landmark);
    setLocationName(preset.fullName);
    setCoords({ lat: preset.lat, lng: preset.lng });
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationName(`GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          setLocality("GPS Detected Area");
          setLandmark("Live User Coordinates");
        },
        () => {
          handleSelectPreset(locationPresets[0]);
        }
      );
    } else {
      handleSelectPreset(locationPresets[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim() || !description.trim()) {
      setError("Please fill in location and emergency description.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const data = await incidentsApi.reportEmergency({
        incident_type: incidentType,
        description,
        severity,
        latitude: coords.lat,
        longitude: coords.lng,
        country,
        state: stateName,
        district,
        city,
        locality,
        landmark,
        location_name: locationName,
        estimated_patient_count: Number(patientCount),
        reporter_name: reporterName || user?.full_name || "Field Citizen",
        reporter_contact: reporterPhone || "N/A"
      });
      setReceipt(data);
      fetchMyReports();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to submit emergency report to PostgreSQL database.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setReceipt(null);
    setDescription('');
    setPatientCount(3);
  };

  const handleTrackIncident = () => {
    if (!searchCode.trim()) return;
    setTrackingError(null);
    const found = myReports.find(r => 
      r.incident_id.toLowerCase() === searchCode.trim().toLowerCase()
    );
    if (found) {
      setTrackedIncident(found);
    } else {
      // Search by fetching single incident
      incidentsApi.getById(searchCode.trim().toUpperCase())
        .then(res => setTrackedIncident(res))
        .catch(() => setTrackingError(`Incident ID '${searchCode}' not found in database.`));
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-[#070B14] via-[#0B1120] to-[#070B14] p-4 sm:p-8 max-w-6xl mx-auto space-y-6 font-mono text-gray-200 select-none">
      {/* Top Banner & Role Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-rose-400 bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800/40">
              CITIZEN / FIELD PORTAL
            </span>
            <span className="text-[10px] text-gray-500 font-sans">ROLE: REPORTER • SINGLE SOURCE OF TRUTH</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Radio className="w-6 h-6 text-rose-500 animate-pulse" />
            <span>Emergency Reporting & Incident Tracker</span>
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-0.5">
            Submit field incidents directly into PostgreSQL. Control Operators receive your submission in real-time in the EOC Triage Queue.
          </p>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center bg-[#111827] border border-[#1F293D] rounded-xl p-1 text-xs">
          <button
            onClick={() => { setActiveTab('home'); setReceipt(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'home' ? 'bg-rose-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => { setActiveTab('report'); setReceipt(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'report' ? 'bg-rose-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Report Incident
          </button>
          <button
            onClick={() => { setActiveTab('my_reports'); setReceipt(null); fetchMyReports(); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my_reports' ? 'bg-rose-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>My Reports</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-rose-200 font-bold">
              {myReports.length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('tracker'); setReceipt(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'tracker' ? 'bg-rose-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Status Tracker
          </button>
          <button
            onClick={() => { setActiveTab('profile'); setReceipt(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-rose-600 text-white font-bold shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Profile
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: HOME / EMERGENCY DESK */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'home' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Quick Action Hero Card */}
          <div className="bg-gradient-to-r from-rose-950/70 via-[#0F172A] to-[#0B1120] border border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl space-y-4">
              <span className="text-[10px] font-bold tracking-widest text-rose-400 uppercase bg-rose-900/60 px-2.5 py-1 rounded border border-rose-500/30">
                24/7 EOC EMERGENCY DISPATCH
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Witnessed an Emergency? Report Directly to Operations.
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 font-sans leading-relaxed">
                Your report creates an ACID-compliant PostgreSQL record that triggers instant alerting in the EOC Command Center, initiating fleet ambulance dispatch and hospital bed triage.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('report')}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-900/50 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Report Emergency Incident Now</span>
                </button>
                <button
                  onClick={() => setActiveTab('my_reports')}
                  className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs rounded-xl border border-gray-700 cursor-pointer transition-all"
                >
                  View My Previous Reports ({myReports.length})
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Helplines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-2">
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>YOUR REPORTED INCIDENTS</span>
                <FileText className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-black text-white">{myReports.length}</div>
              <div className="text-[10px] text-gray-400 font-sans">
                {myReports.filter(r => r.status === 'RECEIVED').length} Awaiting Verification • {myReports.filter(r => r.status === 'VERIFIED' || r.status === 'ACTIVE').length} Active / Dispatched
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-2">
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>EMERGENCY HELPLINES</span>
                <PhoneCall className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-emerald-400">112 / 108 (Trauma)</div>
              <div className="text-[10px] text-gray-400 font-sans">
                Tirupati EOC Hotline: +91-877-2200108
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-2">
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>DATABASE INTEGRITY</span>
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-lg font-bold text-cyan-300">PostgreSQL ACID</div>
              <div className="text-[10px] text-gray-400 font-sans">
                Strict RBAC isolation enforced in SQL layer
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: REPORT INCIDENT FORM & RECEIPT */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'report' && (
        <div className="space-y-6 animate-in fade-in">
          {receipt ? (
            /* Confirmation Receipt Screen */
            <div className="bg-[#0B1120] border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
                <div className="p-3 bg-emerald-500/20 rounded-full border border-emerald-500/40 text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                    POSTGRESQL RELATIONAL RECORD COMMITTED
                  </span>
                  <h2 className="text-xl font-bold text-gray-100">
                    Emergency Report Successfully Submitted
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-sans">
                    Incident ID <span className="text-cyan-300 font-bold">{receipt.incident_id}</span> is now recorded in PostgreSQL and queued in the EOC Control Operator triage board.
                  </p>
                </div>
              </div>

              {/* Receipt Key-Value Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 block uppercase">Incident ID</span>
                  <span className="font-bold text-cyan-300 text-sm">{receipt.incident_id}</span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 block uppercase">Current Status in DB</span>
                  <span className="font-bold text-rose-400 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    {receipt.status}
                  </span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 block uppercase">Tracking Reference</span>
                  <span className="font-bold text-amber-300 text-sm">{receipt.tracking_code}</span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 block uppercase">Emergency Type</span>
                  <span className="font-bold text-gray-200">{receipt.incident_type.replace(/_/g, ' ')}</span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 block uppercase">Location / Locality</span>
                  <span className="font-bold text-gray-200 truncate block">{receipt.location_name}</span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 block uppercase">Estimated Casualties</span>
                  <span className="font-bold text-red-400">{receipt.estimated_patient_count} Patients</span>
                </div>
              </div>

              {/* Real-Time Lifecycle Timeline */}
              <div className="p-4 bg-[#070B14] rounded-xl border border-gray-800 space-y-3">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                  Incident Triage & Response Lifecycle
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px]">
                  <div className="flex items-center gap-2 p-2.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold">1. Stored in DB</div>
                      <div className="text-[9px] text-emerald-400/80">RECEIVED</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300">
                    <Activity className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
                    <div>
                      <div className="font-bold">2. EOC Triage Queue</div>
                      <div className="text-[9px] text-amber-400/80">Awaiting Operator</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded bg-gray-900 border border-gray-800 text-gray-400">
                    <Clock className="w-4 h-4 text-gray-500 shrink-0" />
                    <div>
                      <div className="font-bold">3. Fleet Dispatch</div>
                      <div className="text-[9px] text-gray-500">ACTIVE</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded bg-gray-900 border border-gray-800 text-gray-400">
                    <Check className="w-4 h-4 text-gray-500 shrink-0" />
                    <div>
                      <div className="font-bold">4. Containment</div>
                      <div className="text-[9px] text-gray-500">RESOLVED</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-800">
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Report Another Incident
                </button>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('my_reports')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
                  >
                    View in My Reports
                  </button>
                  {onSwitchToEOC && (
                    <button
                      onClick={onSwitchToEOC}
                      className="w-full sm:w-auto px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Switch to EOC Control View</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Emergency Form */
            <div className="bg-[#0B1120] border border-rose-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl font-mono">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 text-xs">
                {/* 1. Incident Type */}
                <div>
                  <label className="block text-gray-300 font-bold uppercase mb-2">
                    1. Select Emergency Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'ROAD_ACCIDENT', label: 'Road Accident / Pileup' },
                      { id: 'BUILDING_FIRE', label: 'Structural Fire' },
                      { id: 'BUILDING_COLLAPSE', label: 'Building Collapse' },
                      { id: 'HAZMAT', label: 'Chemical / Hazmat Leak' },
                      { id: 'MASS_CASUALTY', label: 'Mass Casualty' },
                      { id: 'FLOOD', label: 'Urban Flash Flood' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setIncidentType(type.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          incidentType === type.id
                            ? 'bg-rose-950/70 border-rose-500 text-white font-bold shadow-lg shadow-rose-950/50 ring-1 ring-rose-500'
                            : 'bg-black/40 border-gray-800 text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
                        }`}
                      >
                        <span className="block text-[11px] leading-snug">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Structured Geographic Location */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300 font-bold uppercase">
                      2. Emergency Location & Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Use GPS Location
                    </button>
                  </div>

                  {/* Location Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {locationPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2 rounded-lg border text-left text-[10px] transition-all cursor-pointer ${
                          locationName === preset.fullName
                            ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 font-bold'
                            : 'bg-black/40 border-gray-800 text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        <div className="truncate font-semibold">{preset.label}</div>
                        <div className="text-[9px] text-gray-500">{preset.locality}</div>
                      </button>
                    ))}
                  </div>

                  {/* Full Location Input */}
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Full location address / landmark..."
                    className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-rose-500 font-sans"
                  />

                  {/* Structured Geographic Hierarchy Inputs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">District / City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => { setCity(e.target.value); setDistrict(e.target.value); }}
                        className="w-full bg-black/40 border border-gray-800 rounded-lg p-2 text-gray-300 text-[11px] font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Locality / Area</label>
                      <input
                        type="text"
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="w-full bg-black/40 border border-gray-800 rounded-lg p-2 text-gray-300 text-[11px] font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Landmark</label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        className="w-full bg-black/40 border border-gray-800 rounded-lg p-2 text-gray-300 text-[11px] font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Latitude / Longitude</label>
                      <div className="text-[11px] text-cyan-400 p-2 bg-black/40 border border-gray-800 rounded-lg">
                        {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Scale & Severity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 font-bold uppercase mb-1.5">
                      3. Approximate People Affected / Casualties
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="150"
                      required
                      value={patientCount}
                      onChange={(e) => setPatientCount(Number(e.target.value))}
                      className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-bold uppercase mb-1.5">
                      4. Observed Severity Level
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as any)}
                      className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="CRITICAL">CRITICAL (Life Threatening / Mass Injuries)</option>
                      <option value="HIGH">HIGH (Severe Trauma / Major Damage)</option>
                      <option value="MEDIUM">MEDIUM (Contained Injuries)</option>
                      <option value="LOW">LOW (Minor Hazards)</option>
                    </select>
                  </div>
                </div>

                {/* 4. Description */}
                <div>
                  <label className="block text-gray-300 font-bold uppercase mb-1.5">
                    5. What Happened? (Detailed Description)
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe situation, visible hazards, structural collapse, or trapped persons..."
                    className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-gray-200 text-xs focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
                  />
                </div>

                {/* 5. Informant Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-800">
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Your Name / Informant ID</label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="w-full bg-black/40 border border-gray-800 rounded-lg p-2 text-gray-300 text-xs font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Contact Phone</label>
                    <input
                      type="tel"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      className="w-full bg-black/40 border border-gray-800 rounded-lg p-2 text-gray-300 text-xs font-sans"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:brightness-110 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xl shadow-rose-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${submitting ? 'animate-bounce' : ''}`} />
                  {submitting ? 'COMMITTING TO POSTGRESQL DATABASE...' : 'TRANSMIT EMERGENCY REPORT'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: MY REPORTS (SQL ENFORCED) */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'my_reports' && (
        <div className="bg-[#0E1524] border border-[#1F293D] rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                My Reported Incidents ({myReports.length})
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 font-sans hidden sm:inline">
                SQL: WHERE reporter_id = current_user.id
              </span>
              <button
                onClick={fetchMyReports}
                disabled={loadingReports}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141C2E] hover:bg-[#1C2538] border border-gray-700 text-[11px] text-gray-300 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingReports ? 'animate-spin text-rose-400' : ''}`} />
                <span>Refresh Status</span>
              </button>
            </div>
          </div>

          {myReports.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400 space-y-2">
              <div>No incidents reported by this user account yet.</div>
              <button
                onClick={() => setActiveTab('report')}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Submit Your First Emergency Report
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141C2E] text-gray-400 uppercase text-[10px] border-b border-[#1F293D]">
                  <tr>
                    <th className="p-3">Incident ID / Type</th>
                    <th className="p-3">Location & Locality</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Casualties</th>
                    <th className="p-3">PostgreSQL Status</th>
                    <th className="p-3">Reported At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F293D] text-gray-300">
                  {myReports.map((inc) => (
                    <tr key={inc.incident_id} className="hover:bg-[#141C2E]/60 transition-colors">
                      <td className="p-3 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          {inc.status === 'RECEIVED' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                          {inc.status === 'VERIFIED' && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                          {inc.status === 'ACTIVE' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                          <span>{inc.incident_id}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-sans">{inc.incident_type.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="p-3 font-sans text-gray-300 max-w-[220px]">
                        <div className="truncate font-semibold">{inc.location_name}</div>
                        <div className="text-[10px] text-gray-400">{inc.locality || inc.city || 'Tirupati'}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          inc.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-500/50' : 'bg-amber-950 text-amber-300 border-amber-500/50'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-amber-400">
                        {inc.estimated_patient_count} Patients
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                          inc.status === 'RECEIVED' 
                            ? 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse'
                            : inc.status === 'VERIFIED'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 font-black'
                            : inc.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                            : 'bg-gray-800 text-gray-300 border-gray-600'
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] text-gray-400 font-mono">
                        {new Date(inc.reported_at || inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: STATUS TRACKER */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'tracker' && (
        <div className="bg-[#0E1524] border border-[#1F293D] rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Track Incident Dispatch Status
            </h3>
            <p className="text-xs text-gray-400 font-sans mt-0.5">
              Enter your Incident ID (e.g. INC_FIELD_1042) to inspect real-time database verification and triage progress.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-black/50 border border-gray-700 rounded-xl px-3 py-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Enter Incident ID (e.g. INC_FIELD_1042)..."
                className="bg-transparent text-gray-200 text-xs focus:outline-none w-full font-mono"
              />
            </div>
            <button
              onClick={handleTrackIncident}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Track Status
            </button>
          </div>

          {trackingError && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 text-xs text-red-300 rounded-xl">
              {trackingError}
            </div>
          )}

          {trackedIncident && (
            <div className="p-5 rounded-xl bg-black/40 border border-gray-800 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                  <span className="text-xs font-bold text-cyan-300">{trackedIncident.incident_id}</span>
                  <div className="text-sm font-bold text-white font-sans mt-0.5">{trackedIncident.location_name}</div>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-bold border ${
                  trackedIncident.status === 'RECEIVED' ? 'bg-rose-950 text-rose-300 border-rose-500' : 'bg-emerald-950 text-emerald-300 border-emerald-500'
                }`}>
                  Status: {trackedIncident.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 text-[10px] block">TYPE</span>
                  <span className="font-semibold text-gray-200">{trackedIncident.incident_type}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">SEVERITY</span>
                  <span className="font-semibold text-amber-400">{trackedIncident.severity}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">CASUALTIES</span>
                  <span className="font-semibold text-gray-200">{trackedIncident.estimated_patient_count} Patients</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">REPORTED AT</span>
                  <span className="font-semibold text-gray-400">
                    {new Date(trackedIncident.reported_at || trackedIncident.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 5: REPORTER PROFILE */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'profile' && (
        <div className="bg-[#0E1524] border border-[#1F293D] rounded-2xl p-6 shadow-xl space-y-6 max-w-xl mx-auto animate-in fade-in">
          <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
            <div className="w-12 h-12 rounded-full bg-rose-900/50 border border-rose-500/50 flex items-center justify-center text-rose-300 font-bold text-lg">
              {user?.username.charAt(0).toUpperCase() || 'R'}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{user?.full_name || 'Citizen Informant'}</h3>
              <div className="text-xs text-rose-400 font-mono">Role: {user?.role || 'REPORTER'}</div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-black/40 rounded-xl border border-gray-800 flex justify-between">
              <span className="text-gray-400">Username</span>
              <span className="text-white font-bold">{user?.username || 'reporter'}</span>
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-gray-800 flex justify-between">
              <span className="text-gray-400">Access Scope</span>
              <span className="text-rose-300 font-bold">Emergency Reporting & Personal Submissions</span>
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-gray-800 flex justify-between">
              <span className="text-gray-400">Database Role Guard</span>
              <span className="text-emerald-400 font-bold">WHERE reporter_id = current_user.id</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
