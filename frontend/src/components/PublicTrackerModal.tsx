import React from 'react';
import { 
  X, CheckCircle2, Clock, AlertTriangle, ShieldCheck, MapPin, 
  PhoneCall, LifeBuoy, ArrowRight, Share2, Copy, Check
} from 'lucide-react';
import { PublicTrackedIncident } from '../types';

interface PublicTrackerModalProps {
  incident: PublicTrackedIncident | null;
  onClose: () => void;
}

export const PublicTrackerModal: React.FC<PublicTrackerModalProps> = ({ incident, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!incident) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(incident.tracking_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold">1. Received</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">2. Under Review</span>;
      case 'VERIFIED':
      case 'RESPONSE_REQUESTED':
        return <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-bold">3. Confirmed & Coordinated</span>;
      case 'ASSIGNED':
      case 'RESOURCE_ACKNOWLEDGED':
      case 'EN_ROUTE':
        return <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-xs font-bold">4. Responders En Route</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">5. On Scene</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-xs font-bold">6. Resolved</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-mono text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0D111C] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-start justify-between bg-gradient-to-r from-zinc-900 to-[#0D111C]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Durable Emergency Tracking
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 text-xs font-mono">{new Date(incident.reported_at).toLocaleString()}</span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{incident.incident_type.replace(/_/g, ' ')}</span>
              {getStatusBadge(incident.status)}
            </h3>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>{incident.location_name}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tracking Code Banner */}
          <div className="p-4 rounded-2xl bg-[#080B13] border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Your Permanent Reference Code</span>
              <p className="text-base font-black text-cyan-300 font-mono tracking-wider">{incident.tracking_code}</p>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Real-Time Event Milestone Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
              Live Response Milestones
            </h4>

            <div className="space-y-2 border-l-2 border-zinc-800 pl-4 ml-2">
              {incident.timeline && incident.timeline.length > 0 ? (
                incident.timeline.map((evt, idx) => (
                  <div key={idx} className="relative pb-4 last:pb-0 space-y-1">
                    <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-[#0D111C]" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{evt.title}</span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{evt.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-500">Waiting for control operator review...</div>
              )}
            </div>
          </div>

          {/* Medically Reviewed First-Aid Guidelines */}
          {incident.first_aid_guidance && incident.first_aid_guidance.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/20 via-zinc-900/60 to-orange-950/20 border border-rose-500/20 space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <LifeBuoy className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                  Immediate First-Aid Protocols While Awaiting Units
                </h4>
              </div>

              <div className="space-y-2 text-xs text-zinc-300">
                {incident.first_aid_guidance.map((step, idx) => (
                  <p key={idx} className="leading-relaxed">{step}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Helpline */}
        <div className="p-4 border-t border-zinc-800 bg-[#080B13] flex items-center justify-between text-xs">
          <span className="text-zinc-500 font-mono text-[11px]">Need urgent phone escalation?</span>
          <a
            href="tel:108"
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 108 Emergency Direct</span>
          </a>
        </div>
      </div>
    </div>
  );
};
