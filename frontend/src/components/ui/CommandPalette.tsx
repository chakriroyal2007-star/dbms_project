import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, AlertTriangle, Building2, Truck, Users, 
  Terminal, BarChart3, Database, ShieldCheck, ArrowRight, X, Radio
} from 'lucide-react';
import api from '../../services/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onSelectIncident?: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectIncident
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    incidents: any[];
    hospitals: any[];
    ambulances: any[];
  }>({ incidents: [], hospitals: [], ambulances: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults({ incidents: [], hospitals: [], ambulances: [] });
      return;
    }

    const searchTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const [iRes, hRes, aRes] = await Promise.all([
          api.get('/incidents?limit=10').catch(() => ({ data: [] })),
          api.get('/hospitals?limit=10').catch(() => ({ data: [] })),
          api.get('/ambulances?limit=10').catch(() => ({ data: [] }))
        ]);

        const q = query.toLowerCase();
        const matchedInc = (iRes.data || []).filter((i: any) =>
          i.incident_id.toLowerCase().includes(q) ||
          i.location_name.toLowerCase().includes(q) ||
          i.incident_type.toLowerCase().includes(q)
        );
        const matchedHosp = (hRes.data || []).filter((h: any) =>
          h.name.toLowerCase().includes(q) ||
          h.hospital_id.toLowerCase().includes(q)
        );
        const matchedAmb = (aRes.data || []).filter((a: any) =>
          a.registration_number.toLowerCase().includes(q) ||
          a.ambulance_id.toLowerCase().includes(q)
        );

        setSearchResults({
          incidents: matchedInc.slice(0, 4),
          hospitals: matchedHosp.slice(0, 4),
          ambulances: matchedAmb.slice(0, 4)
        });
      } catch (err) {
        console.error('Command search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(searchTimer);
  }, [query]);

  if (!isOpen) return null;

  const quickNav = [
    { id: 'dashboard', label: 'EOC Live Dashboard', icon: BarChart3, category: 'Navigation' },
    { id: 'reporter_portal', label: 'Report Citizen Emergency', icon: Radio, category: 'Actions' },
    { id: 'allocation', label: 'Resource Allocation Engine', icon: Truck, category: 'Operations' },
    { id: 'sql_playground', label: 'SQL Query Console', icon: Terminal, category: 'Intelligence' },
    { id: 'dbms_architecture', label: 'DBMS 18-Table Blueprint', icon: Database, category: 'Architecture' },
    { id: 'admin_users', label: 'User & Role Management', icon: ShieldCheck, category: 'Governance' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl rounded-2xl bg-[#121215] border border-zinc-800 shadow-2xl overflow-hidden font-mono text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-800 gap-3">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, tracking code, incident, hospital, or ambulance..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Quick Actions (when query is empty) */}
          {!query.trim() && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Quick Navigation & Workspaces
              </div>
              <div className="space-y-1 mt-1">
                {quickNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-sans">{item.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Matches */}
          {query.trim() && (
            <>
              {searchResults.incidents.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Incidents ({searchResults.incidents.length})</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {searchResults.incidents.map((inc) => (
                      <button
                        key={inc.incident_id}
                        onClick={() => {
                          if (onSelectIncident) onSelectIncident(inc.incident_id);
                          onNavigate('dashboard');
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800/60 text-xs text-left cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-zinc-200">{inc.incident_id} • {inc.incident_type.replace(/_/g, ' ')}</div>
                          <div className="text-[11px] text-zinc-400 truncate">{inc.location_name}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                          {inc.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.hospitals.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Hospitals ({searchResults.hospitals.length})</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {searchResults.hospitals.map((hosp) => (
                      <button
                        key={hosp.hospital_id}
                        onClick={() => {
                          onNavigate('hospitals');
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800/60 text-xs text-left cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-zinc-200">{hosp.name}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">{hosp.emergency_level}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.ambulances.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Ambulances ({searchResults.ambulances.length})</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {searchResults.ambulances.map((amb) => (
                      <button
                        key={amb.ambulance_id}
                        onClick={() => {
                          onNavigate('ambulances');
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800/60 text-xs text-left cursor-pointer"
                      >
                        <div className="font-bold text-zinc-200">{amb.registration_number} ({amb.ambulance_type})</div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-mono">
                          {amb.current_status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.incidents.length === 0 && searchResults.hospitals.length === 0 && searchResults.ambulances.length === 0 && !loading && (
                <div className="text-center py-8 text-xs text-zinc-500 font-sans">
                  No matching records found for "{query}".
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-zinc-900/80 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">ESC</kbd> to exit</span>
          <span>TERA Command Matrix</span>
        </div>
      </div>
    </div>
  );
};
