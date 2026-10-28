import React from 'react';
import { 
  AlertTriangle, Truck, Building2, Terminal, ShieldCheck, 
  ArrowRight, Radio, Layers, Database, Activity, CheckCircle2, ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onReportEmergency?: () => void;
  onExplore: () => void;
  onViewArchitecture?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onStart, 
  onReportEmergency,
  onExplore,
  onViewArchitecture 
}) => {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between select-none font-mono">
      {/* Top Minimal Navigation Bar */}
      <header className="h-16 border-b border-zinc-800/80 px-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 font-black flex items-center justify-center text-sm shadow-sm">
            T
          </div>
          <div>
            <span className="font-bold text-base text-zinc-100 tracking-tight">TERA</span>
            <span className="text-xs text-zinc-400 font-sans ml-2">Temporal Emergency Resource Allocation & Coordination Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={onViewArchitecture}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all cursor-pointer font-sans"
          >
            <Layers className="w-4 h-4 text-zinc-500" />
            <span>18-Table Schema</span>
          </button>
          <button
            onClick={onStart}
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 font-bold rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-2"
          >
            <span>Enter Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 sm:py-20 flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs shadow-inner font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>POSTGRESQL RELATIONAL ENGINE • 3NF / BCNF ARCHITECTURE</span>
        </div>

        <div className="space-y-4 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-100 leading-tight font-sans">
            Coordinate Every Resource.<br />
            <span className="text-zinc-400">Respond When It Matters Most.</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-sans leading-relaxed">
            One unified, database-driven operational view for multi-casualty incidents, hospital bed contention, ambulance fleet dispatch, and automated capacity allocation.
          </p>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-7 py-3 bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-bold rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2.5 font-mono"
          >
            <span>Launch EOC Operations Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onReportEmergency && (
            <button
              onClick={onReportEmergency}
              className="w-full sm:w-auto px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 font-mono"
            >
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Citizen Emergency SOS Portal</span>
            </button>
          )}
        </div>

        {/* Visual Lifecycle Pipeline */}
        <div className="w-full max-w-5xl pt-10">
          <div className="p-5 rounded-2xl bg-[#121215] border border-zinc-800/80 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                End-to-End Emergency Lifecycle Pipeline
              </span>
              <span className="text-[10px] text-zinc-500">ACID Transaction Guarantee</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                <div className="text-[10px] font-bold uppercase text-rose-400">1. Incident Report</div>
                <div className="font-bold text-zinc-200">PostgreSQL Commit</div>
                <p className="text-[11px] text-zinc-400 font-sans leading-snug">
                  GPS coordinates, casualties, and tracking code generated with status <span className="font-mono text-rose-400">RECEIVED</span>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                <div className="text-[10px] font-bold uppercase text-amber-400">2. EOC Verification</div>
                <div className="font-bold text-zinc-200">Triage Queue</div>
                <p className="text-[11px] text-zinc-400 font-sans leading-snug">
                  Dispatcher reviews severity and triggers the multi-criteria allocation solver.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                <div className="text-[10px] font-bold uppercase text-sky-400">3. Resource Solver</div>
                <div className="font-bold text-zinc-200">ACID Reservation</div>
                <p className="text-[11px] text-zinc-400 font-sans leading-snug">
                  Beds reserved with <span className="font-mono text-sky-300">SELECT FOR UPDATE</span> and fleet ambulances dispatched.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                <div className="text-[10px] font-bold uppercase text-emerald-400">4. Audit & Analysis</div>
                <div className="font-bold text-zinc-200">Immutable Audit Log</div>
                <p className="text-[11px] text-zinc-400 font-sans leading-snug">
                  JSON mutation diffs recorded in <span className="font-mono text-emerald-300">audit_log</span> for time-travel replay.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Dedicated Roles Grid */}
        <div className="w-full max-w-5xl pt-8 space-y-4">
          <div className="text-left">
            <h2 className="text-lg font-bold text-zinc-100 font-sans">Role-Based Operational Environments</h2>
            <p className="text-xs text-zinc-400 font-sans">Experience the system through four strictly segregated access tiers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {/* Reporter */}
            <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Reporter</span>
                  <Radio className="w-4 h-4 text-rose-400" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100">Citizen Informant</h3>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Submit emergencies with GPS, casualties, and track live response progress.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
                Login: <span className="text-zinc-300">reporter</span> / <span className="text-zinc-300">reporter123</span>
              </div>
            </div>

            {/* Operator */}
            <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Operator</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100">Control Operator</h3>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Verify triage queue, dispatch fleet ambulances, and allocate trauma beds.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
                Login: <span className="text-zinc-300">operator</span> / <span className="text-zinc-300">operator123</span>
              </div>
            </div>

            {/* Admin */}
            <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Admin</span>
                  <ShieldCheck className="w-4 h-4 text-zinc-300" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100">Administrator</h3>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Manage user accounts, audit mutation diffs, and inspect the 18-table relational catalog.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
                Login: <span className="text-zinc-300">admin</span> / <span className="text-zinc-300">admin123</span>
              </div>
            </div>

            {/* Analyst */}
            <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Analyst</span>
                  <Terminal className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100">Data Analyst</h3>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Execute safe read-only SQL queries, analyze EXPLAIN plans, and inspect historical trends.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
                Login: <span className="text-zinc-300">analyst</span> / <span className="text-zinc-300">analyst123</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 px-6 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-sans">
        <div>
          <span>TERA • Technology-Enabled Relational Architecture</span>
        </div>
        <div className="flex items-center gap-4">
          <span>FastAPI</span>
          <span>•</span>
          <span>SQLAlchemy 2.0</span>
          <span>•</span>
          <span>PostgreSQL (18 Tables)</span>
          <span>•</span>
          <span>React 18</span>
        </div>
      </footer>
    </div>
  );
};
