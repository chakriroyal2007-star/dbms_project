import React, { useState, useEffect } from 'react';
import { 
  Truck, Navigation, Radio, CheckCircle2, Clock, AlertTriangle, 
  MapPin, PhoneCall, RefreshCw, Send, ShieldCheck, XCircle, ChevronRight
} from 'lucide-react';
import { coordinationApi } from '../services/api';
import { ResponderAssignment, User } from '../types';

interface FieldResponderPageProps {
  user: User | null;
}

export const FieldResponderPage: React.FC<FieldResponderPageProps> = ({ user }) => {
  const [assignments, setAssignments] = useState<ResponderAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<ResponderAssignment | null>(null);
  const [declinePrompt, setDeclinePrompt] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await coordinationApi.getResponderAssignments();
      setAssignments(data || []);
      if (data && data.length > 0 && !selectedAssignment) {
        setSelectedAssignment(data[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch field assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleUpdateStatus = async (assignmentId: string, status: string, reason?: string) => {
    try {
      setActionLoading(assignmentId);
      setError(null);
      await coordinationApi.updateAssignmentStatus(assignmentId, status, reason);
      setDeclinePrompt(null);
      setDeclineReason('');
      await fetchAssignments();
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to update status to ${status}.`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#090C15] p-6 lg:p-8 space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Active Ambulance Field Unit</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                GPS Live Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Responder: {user?.full_name || 'Paramedic Lead Rajesh Kumar'} • Unit: ALS-01
            </p>
          </div>
        </div>

        <button
          onClick={fetchAssignments}
          className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Tasks</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Incidents Queue */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider font-mono">
            Assigned Queue ({assignments.length})
          </h2>

          {loading ? (
            <div className="p-8 text-center text-zinc-500 text-xs font-mono">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
              Loading field tasks...
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0D121F] border border-zinc-800 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Active Dispatches</h3>
              <p className="text-xs text-zinc-400">Unit ALS-01 is currently in standby status at home hospital station.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div
                  key={a.assignment_id}
                  onClick={() => setSelectedAssignment(a)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    selectedAssignment?.assignment_id === a.assignment_id
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-[#0D121F] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-white">{a.incident_type}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                      {a.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="truncate">{a.location_name}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Mission Action Center */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAssignment ? (
            <div className="p-6 rounded-2xl bg-[#0D121F] border border-zinc-800 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                    Incident ID: {selectedAssignment.incident_id}
                  </span>
                  <h3 className="text-xl font-bold text-white">{selectedAssignment.incident_type}</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span>{selectedAssignment.location_name}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://maps.google.com/?q=${selectedAssignment.latitude},${selectedAssignment.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Open GPS Nav</span>
                  </a>
                  <button
                    onClick={() => alert('Direct EOC Triage Hotline: +91-877-2287777 Connected')}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Stepper Progression */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                  Operational Milestone Transitions
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleUpdateStatus(selectedAssignment.assignment_id, 'ACKNOWLEDGED')}
                    disabled={actionLoading === selectedAssignment.assignment_id || selectedAssignment.status !== 'REQUESTED'}
                    className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      selectedAssignment.status === 'ACKNOWLEDGED' || selectedAssignment.acknowledged_at
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-[#080B13] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white disabled:opacity-40'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    <span>1. Acknowledge</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedAssignment.assignment_id, 'EN_ROUTE')}
                    disabled={actionLoading === selectedAssignment.assignment_id || (selectedAssignment.status !== 'ACKNOWLEDGED' && selectedAssignment.status !== 'REQUESTED')}
                    className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      selectedAssignment.status === 'EN_ROUTE' || selectedAssignment.en_route_at
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-[#080B13] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white disabled:opacity-40'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-amber-400" />
                    <span>2. En Route</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedAssignment.assignment_id, 'ARRIVED')}
                    disabled={actionLoading === selectedAssignment.assignment_id || selectedAssignment.status !== 'EN_ROUTE'}
                    className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      selectedAssignment.status === 'ARRIVED' || selectedAssignment.arrived_at
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-[#080B13] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white disabled:opacity-40'
                    }`}
                  >
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <span>3. On Scene</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedAssignment.assignment_id, 'COMPLETED')}
                    disabled={actionLoading === selectedAssignment.assignment_id || selectedAssignment.status !== 'ARRIVED'}
                    className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      selectedAssignment.status === 'COMPLETED'
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                        : 'bg-[#080B13] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white disabled:opacity-40'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                    <span>4. Handover</span>
                  </button>
                </div>
              </div>

              {/* Decline Option */}
              {selectedAssignment.status === 'REQUESTED' && (
                <div className="pt-4 border-t border-zinc-800/80">
                  {declinePrompt === selectedAssignment.assignment_id ? (
                    <div className="p-4 rounded-xl bg-[#080B13] border border-rose-500/30 space-y-3">
                      <span className="text-xs font-bold text-rose-400">Specify operational reason for declining:</span>
                      <input
                        type="text"
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="e.g. Mechanical breakdown, road blockage, patient onboard"
                        className="w-full px-3 py-2 bg-[#0C101A] border border-zinc-800 rounded-xl text-xs text-white"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(selectedAssignment.assignment_id, 'DECLINED', declineReason)}
                          className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Confirm Decline
                        </button>
                        <button
                          onClick={() => setDeclinePrompt(null)}
                          className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeclinePrompt(selectedAssignment.assignment_id)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline assignment due to mechanical or road barrier...</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-500 text-xs font-mono">
              Select an assignment from the queue to view GPS coordinates and update status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
