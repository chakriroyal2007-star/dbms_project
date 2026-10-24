import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle2, ShieldAlert, X, Radio } from 'lucide-react';
import api from '../../services/api';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/alerts').catch(() => ({ data: [] }));
      setAlerts(res.data || []);
    } catch (e) {
      console.error('Failed to load notification alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl bg-[#121215] border border-zinc-800 shadow-2xl overflow-hidden z-50 font-mono text-zinc-100 animate-in fade-in-50 zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            System Alerts & Dispatch Feed
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Alert Feed */}
      <div className="max-h-80 overflow-y-auto p-3 space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500 font-sans">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2 opacity-80" />
            <span>All systems optimal. No acute resource shortages recorded.</span>
          </div>
        ) : (
          alerts.map((alt) => (
            <div
              key={alt.alert_id}
              onClick={() => {
                onNavigateTab('resources');
                onClose();
              }}
              className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  alt.severity === 'CRITICAL'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {alt.severity} • {alt.alert_type.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {alt.hospital_name || 'Hospital Ward'}
                </span>
              </div>
              <div className="text-xs text-zinc-300 font-sans font-medium">
                {alt.message}
              </div>
              <div className="text-[10px] text-zinc-500">
                Current Stock: <span className="font-bold text-zinc-300">{alt.available_quantity}</span> | Threshold: {alt.critical_threshold}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
        <span>PostgreSQL Alert Stream</span>
        <button
          onClick={fetchAlerts}
          className="text-sky-400 hover:text-sky-300 cursor-pointer"
        >
          Refresh Feed
        </button>
      </div>
    </div>
  );
};
