import React, { useState, useEffect } from 'react';
import { 
  Building2, Activity, BedDouble, AlertCircle, CheckCircle2, 
  Clock, ShieldAlert, Phone, RefreshCw, Save, ArrowUpRight, Flame
} from 'lucide-react';
import { coordinationApi } from '../services/api';
import { User } from '../types';

interface HospitalCoordinatorPageProps {
  user: User | null;
}

export const HospitalCoordinatorPage: React.FC<HospitalCoordinatorPageProps> = ({ user }) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Capacities
  const [icuAvailable, setIcuAvailable] = useState<number>(5);
  const [erAvailable, setErAvailable] = useState<number>(12);
  const [genAvailable, setGenAvailable] = useState<number>(30);
  const [hospitalStatus, setHospitalStatus] = useState<string>('ACTIVE');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await coordinationApi.getHospitalProfile();
      setProfile(data);
      if (data.current_capacity) {
        setIcuAvailable(data.current_capacity.icu_available ?? 5);
        setErAvailable(data.current_capacity.emergency_available ?? 12);
        setGenAvailable(data.current_capacity.general_available ?? 30);
      }
      setHospitalStatus(data.status || 'ACTIVE');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load hospital profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);
      await coordinationApi.updateHospitalCapacity(icuAvailable, erAvailable, genAvailable, hospitalStatus);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update capacity.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#090C15] text-zinc-400 font-mono text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
        <span>Loading Hospital Network Portal...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#090C15] p-6 lg:p-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{profile?.name || 'SVRR Government Trauma Center'}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                hospitalStatus === 'ACTIVE' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {hospitalStatus}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Emergency Level: {profile?.emergency_level || 'LEVEL_1'} • Coordinator: {user?.full_name || user?.username || 'Authorized Coordinator'} • Source: Verified Manual Report
            </p>
          </div>
        </div>

        <button
          onClick={fetchProfile}
          className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Capacity</span>
        </button>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>Hospital capacity successfully updated and propagated across the EOC triage grid.</span>
        </div>
      )}

      {/* Capacity Management Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0D121F] border border-zinc-800 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
            <div>
              <h2 className="text-base font-bold text-white">Live Bed Availability Adjustment</h2>
              <p className="text-xs text-zinc-400">Updates here immediately reflect in automated ambulance allocation.</p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Immutable Audit Trail</span>
          </div>

          <form onSubmit={handleSaveCapacity} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* ICU Beds */}
              <div className="p-4 rounded-xl bg-[#080B13] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">ICU Beds</span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIcuAvailable(Math.max(0, icuAvailable - 1))}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-2xl font-black text-white font-mono">{icuAvailable}</span>
                  <button
                    type="button"
                    onClick={() => setIcuAvailable(icuAvailable + 1)}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-zinc-500 block text-center">Total Baseline: 20</span>
              </div>

              {/* Emergency ER Beds */}
              <div className="p-4 rounded-xl bg-[#080B13] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">ER Trauma Beds</span>
                  <BedDouble className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setErAvailable(Math.max(0, erAvailable - 1))}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-2xl font-black text-white font-mono">{erAvailable}</span>
                  <button
                    type="button"
                    onClick={() => setErAvailable(erAvailable + 1)}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-zinc-500 block text-center">Total Baseline: 35</span>
              </div>

              {/* General Inpatient */}
              <div className="p-4 rounded-xl bg-[#080B13] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">General Beds</span>
                  <BedDouble className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setGenAvailable(Math.max(0, genAvailable - 1))}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-2xl font-black text-white font-mono">{genAvailable}</span>
                  <button
                    type="button"
                    onClick={() => setGenAvailable(genAvailable + 1)}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-zinc-500 block text-center">Total Baseline: 120</span>
              </div>
            </div>

            {/* Operational Status Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-300">Operational Triage Status:</span>
                <select
                  value={hospitalStatus}
                  onChange={(e) => setHospitalStatus(e.target.value)}
                  className="px-3 py-1.5 bg-[#080B13] border border-zinc-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ACTIVE">ACTIVE (Accepting Patients)</option>
                  <option value="OVERWHELMED">OVERWHELMED (Contention Warning)</option>
                  <option value="DIVERTING">DIVERTING (Reroute Non-Critical)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Publishing...' : 'Publish Capacity Update'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Info Box */}
        <div className="p-6 rounded-2xl bg-[#0D121F] border border-zinc-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white">Facility Details & Direct Line</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#080B13] border border-zinc-800 space-y-1">
              <span className="text-zinc-500 font-mono text-[10px]">DIRECT HOTLINE</span>
              <p className="text-white font-mono font-bold flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>+91-877-2287777 (Trauma Desk)</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#080B13] border border-zinc-800 space-y-1">
              <span className="text-zinc-500 font-mono text-[10px]">FACILITY COORDINATES</span>
              <p className="text-white font-mono">13.6350° N, 79.4150° E</p>
              <p className="text-zinc-400 text-[11px]">Alipiri Corridor Sector 1, Tirupati</p>
            </div>

            <div className="p-3 rounded-xl bg-[#080B13] border border-zinc-800 space-y-1">
              <span className="text-zinc-500 font-mono text-[10px]">STATIONED AMBULANCE UNITS</span>
              <p className="text-emerald-400 font-bold">4 Units Available (ALS-01, ALS-02, BLS-05, BLS-06)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
