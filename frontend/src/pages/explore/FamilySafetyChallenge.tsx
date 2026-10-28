import React, { useState } from 'react';
import { 
  Users, CheckCircle2, ShieldCheck, Award, Heart, 
  Baby, GraduationCap, Car, Sparkles, AlertCircle, 
  Printer, ArrowRight, RotateCcw, CheckSquare, Square
} from 'lucide-react';
import { exploreApi } from '../../services/api';

interface FamilySafetyChallengeProps {
  onComplete?: (xpEarned: number, badge?: string) => void;
  onExit?: () => void;
}

interface MemberHabit {
  id: string;
  role: string;
  icon: any;
  ageGroup: string;
  correctHabitId: string;
  explanation: string;
}

const FAMILY_ROLES: MemberHabit[] = [
  {
    id: 'child',
    role: 'Toddler / Young Child (Age 2-6)',
    icon: Baby,
    ageGroup: 'Height < 135 cm',
    correctHabitId: 'rear_seat_booster',
    explanation: 'Children under 135 cm must use a certified child restraint system in the rear seat with child-locks engaged. Never seat small children in the front passenger seat where airbag deployment can cause fatal head/chest trauma.'
  },
  {
    id: 'teen',
    role: 'Teenager / Student (Age 14-18)',
    icon: GraduationCap,
    ageGroup: 'Bicycle / Pillion Commuter',
    correctHabitId: 'helmet_no_earphones',
    explanation: 'Always wear a snug ISI/ECE helmet even as a pillion passenger. Never use headphones or smartphones while cycling or walking across intersections—auditory cues like horns and sirens save lives.'
  },
  {
    id: 'parent',
    role: 'Parent / Primary Driver',
    icon: Car,
    ageGroup: 'Four-Wheeler / Motorcyclist',
    correctHabitId: 'seatbelt_phone_docked',
    explanation: 'Fasten 3-point seatbelt before turning on ignition. Place mobile phone in Do-Not-Disturb driving mode. Model safe driving behaviors because children mirror adult habits on the road.'
  },
  {
    id: 'senior',
    role: 'Grandparent / Senior Citizen',
    icon: Users,
    ageGroup: 'Pedestrian / Rear Passenger',
    correctHabitId: 'reflective_pedestrian',
    explanation: 'Always cross at designated zebra crossings with high-visibility or light-colored attire in low-light hours. In cars, always wear the rear lap-and-shoulder belt even on short urban trips.'
  }
];

const HABIT_OPTIONS = [
  { id: 'rear_seat_booster', label: 'Use certified rear-seat child car restraint system with child door-locks engaged' },
  { id: 'helmet_no_earphones', label: 'Wear certified helmet as pillion and keep ears free from headphones during commute' },
  { id: 'seatbelt_phone_docked', label: 'Fasten 3-point seatbelt, dock phone in silent mode, observe 40 km/h urban limit' },
  { id: 'reflective_pedestrian', label: 'Cross only at signalized crossings, wear high-contrast clothing during dawn/dusk' },
  { id: 'front_lap_holding', label: 'Sit on adult’s lap in the front passenger seat' },
  { id: 'loud_music_cycling', label: 'Cycle with noise-cancelling earbuds on maximum volume' }
];

const PRE_TRAVEL_CHECKLIST = [
  { id: 'tires', label: 'Tyre tread depth & air pressure inspected (including spare wheel)', critical: true },
  { id: 'belts', label: 'Every occupant secured in a 3-point seatbelt or child restraint', critical: true },
  { id: 'kit', label: 'Emergency medical kit, triangle reflector & torch verified', critical: false },
  { id: 'phone', label: 'Navigation pre-set; phone docked in Hands-Free/DND mode', critical: true },
  { id: 'rest', label: 'Driver has slept 7+ hours; scheduled breaks every 2 hours', critical: true },
  { id: 'weather', label: 'Monsoon wiper blades tested and windshield defogger functional', critical: false }
];

export const FamilySafetyChallenge: React.FC<FamilySafetyChallengeProps> = ({ onComplete, onExit }) => {
  const [activeStep, setActiveStep] = useState<'roles' | 'checklist' | 'pledge' | 'certificate'>('roles');
  
  // Role Matching State
  const [selectedMatches, setSelectedMatches] = useState<Record<string, string>>({});
  const [roleFeedback, setRoleFeedback] = useState<boolean | null>(null);

  // Checklist State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Pledge State
  const [familyName, setFamilyName] = useState('');
  const [pledgeCity, setPledgeCity] = useState('Tirupati');
  const [commitRules, setCommitRules] = useState({
    helmet_seatbelt: true,
    no_phones: true,
    speed_compliance: true,
    child_restraint: true,
    calm_courtesy: true
  });
  const [isSubmittingPledge, setIsSubmittingPledge] = useState(false);
  const [certificateData, setCertificateData] = useState<{ id: string; date: string; familyName: string; city: string } | null>(null);

  // Handle Role Assignment
  const handleSelectHabit = (roleId: string, habitId: string) => {
    setSelectedMatches(prev => ({ ...prev, [roleId]: habitId }));
    setRoleFeedback(null);
  };

  const verifyRoles = () => {
    const isAllSelected = FAMILY_ROLES.every(r => selectedMatches[r.id]);
    if (!isAllSelected) return;

    const allCorrect = FAMILY_ROLES.every(r => selectedMatches[r.id] === r.correctHabitId);
    setRoleFeedback(allCorrect);
    if (allCorrect) {
      setTimeout(() => {
        setActiveStep('checklist');
      }, 1200);
    }
  };

  const toggleChecklist = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isChecklistComplete = PRE_TRAVEL_CHECKLIST.every(item => checkedItems[item.id]);

  const handleSignPledge = async () => {
    if (!familyName.trim()) return;
    setIsSubmittingPledge(true);

    const certId = `TERA-FAM-${Math.floor(100000 + Math.random() * 900000)}`;
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    try {
      await exploreApi.signPledge({
        pledge_name: familyName.trim(),
        family_members_count: 4,
        commitments: Object.keys(commitRules).filter(k => (commitRules as any)[k])
      });
    } catch {
      // Graceful offline fallback
    }

    setCertificateData({
      id: certId,
      date: today,
      familyName: familyName.trim(),
      city: pledgeCity
    });
    setIsSubmittingPledge(false);
    setActiveStep('certificate');

    if (onComplete) {
      onComplete(120, 'Family Safety Advocate');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-emerald-950/40 border border-amber-500/20 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-2">
              <Heart className="w-4 h-4 fill-amber-400" />
              <span>COMMUNITY & FAMILY ROAD SAFETY</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Family Safety Challenge</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              “Make Every Journey a Memory Worth Keeping.” Build shared family habits, inspect your pre-travel readiness, and sign your official Family Safety Pledge.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> +120 XP Reward
            </span>
            {onExit && (
              <button 
                onClick={onExit}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 hover:text-white transition"
              >
                Back to Explore
              </button>
            )}
          </div>
        </div>

        {/* Steps Breadcrumbs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-xs">
          <div className={`p-2 rounded-lg text-center font-medium transition ${activeStep === 'roles' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 bg-slate-900/40'}`}>
            1. Role Habits
          </div>
          <div className={`p-2 rounded-lg text-center font-medium transition ${activeStep === 'checklist' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 bg-slate-900/40'}`}>
            2. Travel Checklist
          </div>
          <div className={`p-2 rounded-lg text-center font-medium transition ${activeStep === 'pledge' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 bg-slate-900/40'}`}>
            3. Sign Family Pledge
          </div>
          <div className={`p-2 rounded-lg text-center font-medium transition ${activeStep === 'certificate' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 bg-slate-900/40'}`}>
            4. Honor Certificate
          </div>
        </div>
      </div>

      {/* STEP 1: ROLE HABITS */}
      {activeStep === 'roles' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Assign Correct Road Safety Habits to Each Family Member
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Match each member with their vital protection rule before embarking on any journey.
              </p>
            </div>
            {roleFeedback === false && (
              <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-800 px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-4 h-4" /> Some assignments are unsafe. Review choices below.
              </div>
            )}
            {roleFeedback === true && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-950/40 border border-emerald-800 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4" /> Excellent! All habits properly assigned.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAMILY_ROLES.map(role => {
              const Icon = role.icon;
              const currentHabit = selectedMatches[role.id];
              const isCorrect = currentHabit === role.correctHabitId;

              return (
                <div 
                  key={role.id} 
                  className={`p-5 rounded-xl border transition ${
                    roleFeedback === true
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : roleFeedback === false && !isCorrect
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{role.role}</h3>
                      <span className="text-[11px] text-slate-400">{role.ageGroup}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <label className="text-[11px] font-medium text-slate-400">Select Essential Safety Habit:</label>
                    <select
                      value={currentHabit || ''}
                      onChange={(e) => handleSelectHabit(role.id, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="">-- Choose safe behavior --</option>
                      {HABIT_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {roleFeedback !== null && (
                    <p className="text-[11px] mt-2.5 text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="font-semibold text-amber-300">Safety Principle: </span>
                      {role.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={verifyRoles}
              disabled={FAMILY_ROLES.some(r => !selectedMatches[r.id])}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 hover:from-amber-400 hover:to-amber-500 transition disabled:opacity-50"
            >
              Verify Habits & Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PRE-TRAVEL CHECKLIST */}
      {activeStep === 'checklist' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Pre-Travel Family Inspection Checklist
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Verify all pre-trip physical checks together before taking off for work, school, or holiday journeys.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRE_TRAVEL_CHECKLIST.map(item => {
              const checked = !!checkedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition ${
                    checked 
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <button className="mt-0.5 text-emerald-400">
                    {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-600" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-xs font-medium leading-snug">{item.label}</p>
                    {item.critical && (
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                        ★ Critical Inspection
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveStep('roles')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Back to Roles
            </button>
            <button
              onClick={() => setActiveStep('pledge')}
              disabled={!isChecklistComplete}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs flex items-center gap-2 hover:from-emerald-400 hover:to-teal-500 transition disabled:opacity-50"
            >
              All Items Checked — Proceed to Pledge <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SIGN FAMILY PLEDGE */}
      {activeStep === 'pledge' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Official TERA Community Commitment
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">The Family Road Safety Pledge</h2>
            <p className="text-slate-400 text-xs">
              “Someone is waiting for you at home. Ride safe, drive calm, and protect the people who matter most.”
            </p>
          </div>

          <div className="max-w-xl mx-auto bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Family / Household Name</label>
                <input 
                  type="text" 
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g. The Reddy Family"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Town / City</label>
                <input 
                  type="text" 
                  value={pledgeCity}
                  onChange={(e) => setPledgeCity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <label className="text-xs font-semibold text-slate-300 block">Our Household Promises:</label>
              {[
                { id: 'helmet_seatbelt', text: 'We promise 100% helmet use for two-wheeler rides and seatbelts for all car passengers.' },
                { id: 'no_phones', text: 'We promise zero mobile phone handling while driving or cycling.' },
                { id: 'speed_compliance', text: 'We promise to adhere to posted speed limits, especially in school & residential zones.' },
                { id: 'child_restraint', text: 'We promise never to let children sit unrestrained or in the front seat.' },
                { id: 'calm_courtesy', text: 'We promise to give immediate right of way to emergency ambulances and pedestrians.' }
              ].map(rule => (
                <label key={rule.id} className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(commitRules as any)[rule.id]}
                    onChange={(e) => setCommitRules(prev => ({ ...prev, [rule.id]: e.target.checked }))}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                  />
                  <span>{rule.text}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveStep('checklist')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Back to Checklist
            </button>
            <button
              onClick={handleSignPledge}
              disabled={!familyName.trim() || isSubmittingPledge}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 hover:brightness-110 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isSubmittingPledge ? 'Recording Pledge...' : 'Sign Pledge & Generate Certificate'}
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: HONOR CERTIFICATE */}
      {activeStep === 'certificate' && certificateData && (
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl relative overflow-hidden text-center space-y-6">
            {/* Certificate Decorative Border */}
            <div className="absolute inset-2 border border-amber-500/20 rounded-2xl pointer-events-none" />

            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Award className="w-9 h-9" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-400 tracking-widest uppercase">
                TERA CITIZEN SAFETY INITIATIVE • CERTIFICATE OF COMMITMENT
              </span>
              <h2 className="text-3xl font-serif text-white tracking-wide">
                Family Road Safety Honor Roll
              </h2>
            </div>

            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              This certificate proudly honors the dedication of
            </p>

            <div className="py-2 border-y border-amber-500/30 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-amber-300 font-serif">
                {certificateData.familyName}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{certificateData.city}, Andhra Pradesh</p>
            </div>

            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed italic">
              “For championing defensive travel habits, prioritizing child passenger safety, observing speed discipline, and ensuring every member makes coming home a promise.”
            </p>

            <div className="grid grid-cols-2 pt-4 border-t border-slate-800 text-left text-[11px] text-slate-400 max-w-md mx-auto">
              <div>
                <p className="text-slate-500 font-mono">PLEDGE ID</p>
                <p className="font-mono text-amber-400/90 font-medium">{certificateData.id}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 font-mono">DATE RECORDED</p>
                <p className="text-slate-300 font-medium">{certificateData.date}</p>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-mono pt-2">
              Tirupati Emergency Resource Allocation & Coordination Platform (TERA) • MoRTH Road Safety Mission
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 transition"
            >
              <Printer className="w-4 h-4 text-slate-400" /> Print / Save Certificate
            </button>
            <button
              onClick={() => {
                setActiveStep('roles');
                setSelectedMatches({});
                setCheckedItems({});
                setRoleFeedback(null);
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" /> Start Another Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
