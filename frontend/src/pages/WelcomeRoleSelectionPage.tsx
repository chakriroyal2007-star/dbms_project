import React, { useState } from 'react';
import { 
  Shield, Radio, Building2, Truck, BarChart3, Settings, 
  ArrowRight, Search, Lock, User, Mail, Eye, EyeOff, 
  AlertTriangle, CheckCircle2, ChevronRight, X, HeartPulse,
  PhoneCall, LifeBuoy, FileText, Clock, Sparkles
} from 'lucide-react';
import { User as UserType, RoleType, PublicTrackedIncident } from '../types';
import { authApi, incidentsApi } from '../services/api';

interface WelcomeRoleSelectionPageProps {
  onSelectRole: (role: RoleType) => void;
  onLoginSuccess: (user: UserType, targetRole: RoleType) => void;
  onGuestEmergencyReport: () => void;
  onTrackIncident: (incident: PublicTrackedIncident) => void;
  onExploreSystem: () => void;
}

interface RoleCardConfig {
  id: RoleType;
  title: string;
  portalName: string;
  subtitle: string;
  description: string;
  color: string;
  borderColor: string;
  glowColor: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultUserHint?: string;
  isPublic?: boolean;
}

export const WelcomeRoleSelectionPage: React.FC<WelcomeRoleSelectionPageProps> = ({
  onSelectRole,
  onLoginSuccess,
  onGuestEmergencyReport,
  onTrackIncident,
  onExploreSystem
}) => {
  // Modal & Auth State
  const [selectedRoleForAuth, setSelectedRoleForAuth] = useState<RoleCardConfig | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick Tracker State
  const [quickTrackCode, setQuickTrackCode] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const roleCards: RoleCardConfig[] = [
    {
      id: 'REPORTER',
      title: 'Public Bystander',
      portalName: 'TERA Assist',
      subtitle: 'Citizen Emergency SOS',
      description: 'Report road accidents, collapses, or trauma. Access instant first-aid guidance and live response tracking.',
      color: 'from-rose-500/20 to-orange-500/20 text-rose-400',
      borderColor: 'border-rose-500/40 hover:border-rose-400',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]',
      badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      badgeText: 'Guest or Registered',
      icon: Radio,
      defaultUserHint: 'reporter / reporter123',
      isPublic: true
    },
    {
      id: 'CONTROL_OPERATOR',
      title: 'Control Operator',
      portalName: 'TERA Command',
      subtitle: 'EOC Incident Triage',
      description: 'Review incoming reports, eliminate duplicates, prioritize severity, and coordinate emergency fleet dispatch.',
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400',
      borderColor: 'border-cyan-500/40 hover:border-cyan-400',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
      badgeText: 'Authorized Operations',
      icon: Shield,
      defaultUserHint: 'operator / operator123'
    },
    {
      id: 'HOSPITAL_COORDINATOR',
      title: 'Hospital Coordinator',
      portalName: 'TERA Network',
      subtitle: 'Trauma & Bed Management',
      description: 'Update real-time ICU, ER, and burn bed availability. Review and acknowledge incoming ambulance transfers.',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400',
      borderColor: 'border-emerald-500/40 hover:border-emerald-400',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      badgeText: 'Healthcare Network',
      icon: Building2,
      defaultUserHint: 'hospital_coord / hospital123'
    },
    {
      id: 'FIELD_RESPONDER',
      title: 'Field Responder',
      portalName: 'TERA Network',
      subtitle: 'Ambulance & Paramedics',
      description: 'Acknowledge unit dispatch, stream live en-route and on-scene arrival status, and record patient handovers.',
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400',
      borderColor: 'border-amber-500/40 hover:border-amber-400',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      badgeText: 'Active Field Units',
      icon: Truck,
      defaultUserHint: 'responder / responder123'
    },
    {
      id: 'ANALYST',
      title: 'Operational Analyst',
      portalName: 'TERA Insights',
      subtitle: 'Disaster & Grid Intelligence',
      description: 'Measure time-to-arrival distributions, identify hospital contention bottlenecks, and audit response SLAs.',
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-400',
      borderColor: 'border-purple-500/40 hover:border-purple-400',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]',
      badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
      badgeText: 'Analytics & SLA',
      icon: BarChart3,
      defaultUserHint: 'analyst / analyst123'
    },
    {
      id: 'ADMINISTRATOR',
      title: 'System Administrator',
      portalName: 'TERA Admin',
      subtitle: 'Governance & Security',
      description: 'Manage user lifecycles, configure multi-tenant organizations, review immutable audit logs, and inspect integrations.',
      color: 'from-zinc-500/20 to-slate-500/20 text-zinc-300',
      borderColor: 'border-zinc-600/50 hover:border-zinc-400',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(212,212,216,0.2)]',
      badgeBg: 'bg-zinc-800 border-zinc-700 text-zinc-300',
      badgeText: 'Security & Access',
      icon: Settings,
      defaultUserHint: 'admin / admin123'
    }
  ];

  const handleCardClick = (role: RoleCardConfig) => {
    setSelectedRoleForAuth(role);
    setAuthMode('login');
    setAuthError(null);
    setAuthSuccess(null);
    
    // Auto-fill credential hint for easy demonstration without automatic login
    if (role.id === 'REPORTER') {
      setUsername('reporter');
      setPassword('reporter123');
    } else if (role.id === 'CONTROL_OPERATOR') {
      setUsername('operator');
      setPassword('operator123');
    } else if (role.id === 'HOSPITAL_COORDINATOR') {
      setUsername('hospital_coord');
      setPassword('hospital123');
    } else if (role.id === 'FIELD_RESPONDER') {
      setUsername('responder');
      setPassword('responder123');
    } else if (role.id === 'ANALYST') {
      setUsername('analyst');
      setPassword('analyst123');
    } else if (role.id === 'ADMINISTRATOR') {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setLoading(true);

    try {
      if (authMode === 'login') {
        const authData = await authApi.login(username.trim(), password);
        const userRole = (authData.role || '').toUpperCase();
        const targetRoleId = selectedRoleForAuth?.id;

        // Backend Role Validation
        const isOperator = userRole === 'CONTROL_OPERATOR';
        const isAdmin = userRole === 'ADMINISTRATOR' || userRole === 'ADMIN';
        const isHospital = userRole === 'HOSPITAL_COORDINATOR';
        const isResponder = userRole === 'FIELD_RESPONDER';
        const isAnalyst = userRole === 'ANALYST';
        const isReporter = userRole === 'REPORTER';

        let hasAccess = false;
        if (isAdmin) {
          hasAccess = true; // Admin has global oversight
        } else if (targetRoleId === 'CONTROL_OPERATOR' && isOperator) {
          hasAccess = true;
        } else if (targetRoleId === 'HOSPITAL_COORDINATOR' && isHospital) {
          hasAccess = true;
        } else if (targetRoleId === 'FIELD_RESPONDER' && isResponder) {
          hasAccess = true;
        } else if (targetRoleId === 'ANALYST' && isAnalyst) {
          hasAccess = true;
        } else if (targetRoleId === 'REPORTER' && (isReporter || true)) {
          hasAccess = true;
        }

        if (!hasAccess) {
          setAuthError(
            `Access Denied: Your authenticated account holds the role '${authData.role}', which does not grant access to the ${selectedRoleForAuth?.portalName} portal. Please select your authorized role or contact an administrator.`
          );
          setLoading(false);
          return;
        }

        const authenticatedUser: UserType = {
          username: authData.username,
          role: authData.role,
          full_name: authData.full_name,
          access_token: authData.access_token
        };

        if (targetRoleId) {
          onLoginSuccess(authenticatedUser, targetRoleId);
        }
      } else if (authMode === 'register') {
        if (!fullName.trim() || !email.trim() || !username.trim() || !password.trim()) {
          setAuthError('Please fill in all registration fields.');
          setLoading(false);
          return;
        }

        const registered = await authApi.register({
          username: username.trim(),
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          role: selectedRoleForAuth?.id === 'REPORTER' ? 'REPORTER' : 'REPORTER'
        });

        const authenticatedUser: UserType = {
          username: registered.username,
          role: registered.role,
          full_name: registered.full_name,
          access_token: registered.access_token
        };

        onLoginSuccess(authenticatedUser, 'REPORTER');
      } else if (authMode === 'forgot') {
        if (!email.trim()) {
          setAuthError('Please enter your registered email address.');
          setLoading(false);
          return;
        }
        setAuthSuccess('Password reset verification token has been dispatched to your verified email address.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Authentication failed. Please verify credentials.';
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTrackCode.trim()) return;
    setTrackingLoading(true);
    setTrackingError(null);

    try {
      const data = await incidentsApi.trackByCode(quickTrackCode.trim());
      onTrackIncident(data);
    } catch (err: any) {
      setTrackingError(err.response?.data?.detail || 'Tracking code not found. Please verify the 8-character reference code.');
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-zinc-100 flex flex-col justify-between select-none font-sans relative overflow-x-hidden">
      {/* Background Ambient Glow & Grid lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.12),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Navigation */}
      <header className="relative z-10 h-20 border-b border-zinc-800/80 px-6 sm:px-12 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <div className="w-full h-full bg-[#090C15] rounded-[10px] flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-zinc-50 tracking-tight">TERA</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono uppercase tracking-wider font-semibold">
                Grid OS v2.1
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">Emergency Assistance & Response Coordination</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExploreSystem}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800/80 transition-all text-xs font-medium cursor-pointer"
          >
            <FileText className="w-4 h-4 text-zinc-500" />
            <span>Database Architecture</span>
          </button>

          <button
            onClick={onGuestEmergencyReport}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs tracking-wide shadow-[0_0_25px_rgba(244,63,94,0.4)] flex items-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Radio className="w-4 h-4 text-white animate-pulse" />
            <span>Instant SOS Assist</span>
          </button>
        </div>
      </header>

      {/* Main Hero & Profile Selection Experience */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 py-10 sm:py-16 flex flex-col items-center text-center space-y-12 w-full">
        {/* Cinematic Headline */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs shadow-inner font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>REAL-TIME MULTI-AGENCY GRID • ACID INTEGRITY</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Every Second Matters.<br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Coordinated Response in Motion.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Connecting witnesses, emergency dispatchers, hospital trauma beds, and active field ambulances in one unified, auditable database coordination platform.
          </p>
        </div>

        {/* Quick Tracking Search Bar */}
        <div className="w-full max-w-xl">
          <form onSubmit={handleQuickTrack} className="relative flex items-center">
            <div className="absolute left-4 pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={quickTrackCode}
              onChange={(e) => setQuickTrackCode(e.target.value)}
              placeholder="Track an incident with your code (e.g. TRK-260912-A83B41)..."
              className="w-full pl-11 pr-28 py-3 bg-[#0C101A] border border-zinc-800 focus:border-cyan-500/80 rounded-2xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 shadow-xl focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={trackingLoading || !quickTrackCode.trim()}
              className="absolute right-2 px-3.5 py-1.5 bg-zinc-800 hover:bg-cyan-500 hover:text-zinc-950 text-zinc-300 font-semibold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {trackingLoading ? 'Searching...' : 'Track'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
          {trackingError && (
            <p className="mt-2 text-xs text-rose-400 text-left font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{trackingError}</span>
            </p>
          )}
        </div>

        {/* Netflix-Inspired "Who's Using TERA?" Section */}
        <div className="w-full space-y-8 pt-4">
          <div className="flex flex-col items-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
              Who's Using TERA?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Select your operational profile to enter your dedicated workflow.
            </p>
          </div>

          {/* 6 Illustrated Role Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {roleCards.map((role) => {
              const IconComp = role.icon;
              return (
                <div
                  key={role.id}
                  onClick={() => handleCardClick(role)}
                  className={`group relative p-6 rounded-2xl bg-[#0D121F]/90 border ${role.borderColor} transition-all duration-300 cursor-pointer flex flex-col justify-between text-left hover:-translate-y-1.5 ${role.glowColor}`}
                >
                  <div className="space-y-4">
                    {/* Top Role Header */}
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} border border-white/10 flex items-center justify-center transition-transform group-hover:scale-105 shadow-inner`}>
                        <IconComp className="w-6 h-6" />
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase border ${role.badgeBg}`}>
                        {role.badgeText}
                      </span>
                    </div>

                    {/* Role Title & Subtitle */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-cyan-400 font-mono tracking-wider uppercase">
                        {role.portalName}
                      </span>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {role.title}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                        {role.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Hint */}
                  <div className="pt-6 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-mono text-[11px]">
                      Hint: {role.defaultUserHint}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-zinc-300 group-hover:text-white transition-colors">
                      <span>Launch</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Direct Guest Bystander Callout */}
        <div className="w-full max-w-4xl p-6 rounded-2xl bg-gradient-to-r from-rose-950/20 via-zinc-900/60 to-orange-950/20 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">Witnessing an Active Road Accident or Medical Crisis?</h4>
              <p className="text-xs text-zinc-400">Public reporting requires zero registration. Instant GPS capture, voice transcription, and first-aid.</p>
            </div>
          </div>

          <button
            onClick={onGuestEmergencyReport}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
          >
            <span>Report Emergency as Guest</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-6 px-6 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
        <div>
          <span>TERA Emergency Coordination Grid • PostgreSQL Relational Architecture</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onExploreSystem} className="hover:text-zinc-300 transition-colors cursor-pointer">Schema Inspector</button>
          <span>•</span>
          <button onClick={onGuestEmergencyReport} className="hover:text-rose-400 transition-colors cursor-pointer">Citizen SOS</button>
          <span>•</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Grid Engine Online
          </span>
        </div>
      </footer>

      {/* Role-Aware Authentication Modal */}
      {selectedRoleForAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0D111C] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedRoleForAuth.color} flex items-center justify-center`}>
                  <selectedRoleForAuth.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    {selectedRoleForAuth.portalName}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {authMode === 'login' ? `Sign In as ${selectedRoleForAuth.title}` : (authMode === 'register' ? 'Create Account' : 'Reset Password')}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedRoleForAuth(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Public Bypass for Reporter */}
            {selectedRoleForAuth.isPublic && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
                <span>In a hurry? No account needed to report an emergency.</span>
                <button
                  onClick={() => {
                    setSelectedRoleForAuth(null);
                    onGuestEmergencyReport();
                  }}
                  className="px-2.5 py-1 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-[11px] whitespace-nowrap cursor-pointer transition-colors"
                >
                  Guest SOS
                </button>
              </div>
            )}

            {/* Error / Success Alerts */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="w-full px-3.5 py-2.5 bg-[#080B13] border border-zinc-800 focus:border-cyan-500 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>
              )}

              {authMode !== 'forgot' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Username or Email</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username or email"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-[#080B13] border border-zinc-800 focus:border-cyan-500 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                    />
                    <User className="absolute right-3.5 top-3 w-4 h-4 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
              )}

              {(authMode === 'register' || authMode === 'forgot') && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@organization.gov"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-[#080B13] border border-zinc-800 focus:border-cyan-500 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                    />
                    <Mail className="absolute right-3.5 top-3 w-4 h-4 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
              )}

              {authMode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Password</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setAuthError(null);
                        }}
                        className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-[#080B13] border border-zinc-800 focus:border-cyan-500 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : (authMode === 'login' ? `Access ${selectedRoleForAuth.portalName}` : (authMode === 'register' ? 'Submit Registration' : 'Send Reset Link'))}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Bottom Toggle between login / register */}
            <div className="pt-2 text-center text-xs text-zinc-400">
              {authMode === 'login' ? (
                <span>
                  Don't have an approved account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                    }}
                    className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                  >
                    Request Access / Register
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                  className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                >
                  ← Return to Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
