import React from 'react';
import { 
  LayoutDashboard, AlertTriangle, Truck, Building2, 
  Package, Users, Navigation, History, Network, 
  Sliders, BarChart3, Cpu, Database, Settings as SettingsIcon,
  ShieldCheck, Terminal, Layers, Send, Radio, FileText, Compass
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  user?: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, user }) => {
  const role = user?.role?.toUpperCase() || 'ADMINISTRATOR';

  // 1. REPORTER ROLE: Strictly Citizen Emergency Reporting & Live Tracker
  if (role === 'REPORTER') {
    return (
      <aside className="w-60 bg-[#121215] border-r border-zinc-800/80 flex flex-col justify-between p-3 select-none flex-shrink-0 overflow-y-auto font-mono text-zinc-300">
        <div>
          <div className="mb-4">
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Citizen Informant Portal
            </div>
            <div className="space-y-1">
              <button
                onClick={() => onSelectTab('reporter_portal')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'reporter_portal'
                    ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Report Emergency</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                  SOS
                </span>
              </button>

              <button
                onClick={() => onSelectTab('explore')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'explore'
                    ? 'bg-zinc-800 text-cyan-300 font-bold shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-cyan-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Road Safety & Games</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                  5 Games
                </span>
              </button>

              <button
                onClick={() => onSelectTab('settings')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <SettingsIcon className="w-4 h-4 text-zinc-500" />
                  <span>Platform Overview</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
          <div className="flex items-center justify-between font-bold text-zinc-200">
            <span>Role: REPORTER</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
            Every verified submission is committed to the authoritative relational database and queued for coordination.
          </p>
        </div>
      </aside>
    );
  }

  // 2. CONTROL OPERATOR ROLE: Strictly Emergency Operations & Dispatch
  if (role === 'CONTROL_OPERATOR') {
    const operatorNav = [
      { id: 'dashboard', label: 'EOC Command Center', icon: LayoutDashboard, badge: 'Live' },
      { id: 'incidents', label: 'Incident Triage Queue', icon: AlertTriangle },
      { id: 'ambulances', label: 'Fleet Ambulances', icon: Truck },
      { id: 'hospitals', label: 'Hospitals & Beds', icon: Building2 },
      { id: 'resources', label: 'Medical Inventory', icon: Package },
      { id: 'teams', label: 'Emergency Teams', icon: Users },
      { id: 'roads', label: 'Road Grid Corridors', icon: Navigation },
    ];

    const decisionNav = [
      { id: 'allocation', label: 'Allocation Engine', icon: Network, highlight: true },
      { id: 'simulation', label: 'Disaster Simulation', icon: Sliders, highlight: true },
      { id: 'historical', label: 'Temporal Intelligence', icon: History },
      { id: 'explore', label: 'Road Safety & Games', icon: Compass, badge: '5 Games' },
    ];

    return (
      <aside className="w-60 bg-[#121215] border-r border-zinc-800/80 flex flex-col justify-between p-3 select-none flex-shrink-0 overflow-y-auto font-mono text-zinc-300">
        <div className="space-y-4">
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Operations Center
            </div>
            <div className="space-y-0.5">
              {operatorNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Decision Support
            </div>
            <div className="space-y-0.5">
              {decisionNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-zinc-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
          <div className="flex items-center justify-between font-bold text-amber-400">
            <span>CONTROL OPERATOR</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
          <p className="text-[10px] text-zinc-500 font-sans">
            Triage, fleet dispatch, and capacity reservation with ACID rollback.
          </p>
        </div>
      </aside>
    );
  }

  // 3. ANALYST ROLE: Strictly Intelligence, Queries & Diagnostics
  if (role === 'ANALYST') {
    const analystNav = [
      { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3, badge: 'Insights' },
      { id: 'historical', label: 'Temporal Intelligence', icon: History },
      { id: 'sql_playground', label: 'SQL Query Console', icon: Terminal, badge: 'SELECT Guard' },
      { id: 'performance', label: 'Performance & EXPLAIN', icon: Cpu },
      { id: 'explorer', label: 'Database Explorer', icon: Database, badge: '18 Tables' },
      { id: 'dbms_architecture', label: 'DBMS Architecture', icon: Layers },
      { id: 'explore', label: 'Road Safety & Games', icon: Compass, badge: '5 Games' },
    ];

    return (
      <aside className="w-60 bg-[#121215] border-r border-zinc-800/80 flex flex-col justify-between p-3 select-none flex-shrink-0 overflow-y-auto font-mono text-zinc-300">
        <div>
          <div className="mb-4">
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Intelligence & SQL Studio
            </div>
            <div className="space-y-0.5">
              {analystNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
          <div className="flex items-center justify-between font-bold text-emerald-400">
            <span>DATA ANALYST</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>
          <p className="text-[10px] text-zinc-500 font-sans">
            Read-only queries, CTEs, time-travel analysis, and optimizer cost plan evaluations.
          </p>
        </div>
      </aside>
    );
  }

  // 4. HOSPITAL COORDINATOR ROLE (TERA Network)
  if (role === 'HOSPITAL_COORDINATOR') {
    const hospNav = [
      { id: 'hospital_coord', label: 'Trauma & Bed Management', icon: Building2, badge: 'Live Bed Matrix' },
      { id: 'resources', label: 'Critical Medical Supplies', icon: Package },
      { id: 'ambulances', label: 'Stationed Ambulance Units', icon: Truck },
      { id: 'incidents', label: 'Incoming Triage Requests', icon: AlertTriangle },
      { id: 'explore', label: 'Road Safety & Games', icon: Compass, badge: '5 Games' },
    ];

    return (
      <aside className="w-60 bg-[#121215] border-r border-zinc-800/80 flex flex-col justify-between p-3 select-none flex-shrink-0 overflow-y-auto font-mono text-zinc-300">
        <div>
          <div className="mb-4">
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Healthcare Network
            </div>
            <div className="space-y-0.5">
              {hospNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
          <div className="flex items-center justify-between font-bold text-emerald-400">
            <span>HOSPITAL COORDINATOR</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-[10px] text-zinc-500 font-sans">
            Authoritative bed availability updates with multi-tenant data isolation.
          </p>
        </div>
      </aside>
    );
  }

  // 5. FIELD RESPONDER ROLE (TERA Network)
  if (role === 'FIELD_RESPONDER') {
    const responderNav = [
      { id: 'field_responder', label: 'Active Dispatches & GPS', icon: Truck, badge: 'On-Call' },
      { id: 'incidents', label: 'Assigned Incident Details', icon: AlertTriangle },
      { id: 'explore', label: 'Road Safety & Games', icon: Compass, badge: '5 Games' },
    ];

    return (
      <aside className="w-60 bg-[#121215] border-r border-zinc-800/80 flex flex-col justify-between p-3 select-none flex-shrink-0 overflow-y-auto font-mono text-zinc-300">
        <div>
          <div className="mb-4">
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Field Operations
            </div>
            <div className="space-y-0.5">
              {responderNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
          <div className="flex items-center justify-between font-bold text-amber-400">
            <span>FIELD RESPONDER</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
          <p className="text-[10px] text-zinc-500 font-sans">
            Real-time en-route and on-scene milestone tracking for assigned units.
          </p>
        </div>
      </aside>
    );
  }

  // 6. ADMINISTRATOR ROLE: Full Master Control Center & User Management
  const adminGovernance = [
    { id: 'admin_users', label: 'User Accounts & Roles', icon: ShieldCheck, badge: 'Admin' },
    { id: 'dbms_architecture', label: 'DBMS Architecture (18 Tables)', icon: Layers, badge: '3NF/BCNF' },
    { id: 'explorer', label: 'Database Explorer', icon: Database },
    { id: 'sql_playground', label: 'SQL Query Console', icon: Terminal },
    { id: 'dashboard', label: 'EOC Command Center', icon: LayoutDashboard },
    { id: 'incidents', label: 'Master Incident Registry', icon: AlertTriangle },
    { id: 'hospitals', label: 'Hospitals & Master Beds', icon: Building2 },
    { id: 'ambulances', label: 'Fleet Ambulances', icon: Truck },
    { id: 'resources', label: 'Resource Stocks', icon: Package },
    { id: 'roads', label: 'Road Corridors', icon: Navigation },
    { id: 'settings', label: 'System Configuration', icon: SettingsIcon },
    { id: 'explore', label: 'TERA Explore 2.0', icon: Compass, badge: '5 Games' },
  ];

  return (
    <aside className="w-60 bg-[#121215] border-r border-zinc-800/80 flex flex-col justify-between p-3 select-none flex-shrink-0 overflow-y-auto font-mono text-zinc-300">
      <div>
        <div className="mb-4">
          <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            System Administration
          </div>
          <div className="space-y-0.5">
            {adminGovernance.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
        <div className="flex items-center justify-between font-bold text-zinc-200">
          <span>ADMINISTRATOR</span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
        </div>
        <p className="text-[10px] text-zinc-500 font-sans">
          Full governance authority: User accounts, schema management, and audit inspection.
        </p>
      </div>
    </aside>
  );
};
