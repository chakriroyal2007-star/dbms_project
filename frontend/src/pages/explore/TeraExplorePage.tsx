import React, { useState, useEffect } from 'react';
import { 
  Compass, Shield, AlertTriangle, Gamepad2, Award, 
  BookOpen, BarChart2, Heart, Sparkles, ArrowRight, 
  RotateCcw, CheckCircle2, ChevronRight, Eye, Brain,
  Car, Users, PhoneCall, Zap, PlayCircle, Flame, FileText,
  X, Check
} from 'lucide-react';

// Subcomponents
import { DecisionSimulatorGame } from './DecisionSimulatorGame';
import { SpotTheHazardGame } from './SpotTheHazardGame';
import { MemoryChallengeGame } from './MemoryChallengeGame';
import { BuildSafeJourneyGame } from './BuildSafeJourneyGame';
import { FamilySafetyChallenge } from './FamilySafetyChallenge';
import { QuizCenterView } from './QuizCenterView';
import { RoadSafetyStatsView } from './RoadSafetyStatsView';
import { SafetyLearningLibrary } from './SafetyLearningLibrary';
import { MySafetyJourneyView } from './MySafetyJourneyView';

// Phase 2, 3, 6 Major Views
import { SomeoneWaitingCampaignView } from './SomeoneWaitingCampaignView';
import { AccidentCaseStudiesView } from './AccidentCaseStudiesView';
import { MyBadgesView } from './MyBadgesView';

import { exploreApi, UserProgress, ActivityCompletionResponse } from '../../services/api';

interface TeraExplorePageProps {
  onReturnToOperations?: () => void;
  onNavigateToSOS?: () => void;
}

export type ExploreTab = 
  | 'home' 
  | 'stories'
  | 'case_studies'
  | 'my_badges'
  | 'game_decision' 
  | 'game_hazard' 
  | 'game_memory' 
  | 'game_journey' 
  | 'game_family' 
  | 'quiz' 
  | 'stats' 
  | 'learn' 
  | 'my_journey';

export const TeraExplorePage: React.FC<TeraExplorePageProps> = ({ 
  onReturnToOperations, 
  onNavigateToSOS 
}) => {
  const [activeTab, setActiveTab] = useState<ExploreTab>('home');
  const [totalXp, setTotalXp] = useState<number>(() => {
    return Number(localStorage.getItem('tera_explore_xp') || '140');
  });
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  // Authoritative Toast & Badge Celebration state
  const [xpToast, setXpToast] = useState<{ amount: number; message?: string; id: number } | null>(null);
  const [unlockedBadge, setUnlockedBadge] = useState<{
    id: string;
    title: string;
    category: string;
    description: string;
    icon: string;
    xp_reward: number;
  } | null>(null);

  const getSessionId = (): string => {
    const userStr = localStorage.getItem('tera_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.id || u.uid || u.email) return u.id || u.uid || u.email;
      } catch {}
    }
    let guest = localStorage.getItem('tera_explore_session_id');
    if (!guest) {
      guest = 'guest_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('tera_explore_session_id', guest);
    }
    return guest;
  };

  const guestId = getSessionId();

  const loadUserProgress = async () => {
    try {
      const prog = await exploreApi.getProgress(guestId);
      if (prog) {
        setUserProgress(prog);
        setTotalXp(prog.total_xp);
        localStorage.setItem('tera_explore_xp', String(prog.total_xp));
      }
    } catch (err) {
      console.error('Error fetching user progress from backend:', err);
    }
  };

  useEffect(() => {
    loadUserProgress();
  }, [guestId]);

  // Handle authoritative activity completions
  const handleAuthoritativeActivityComplete = async (
    activityType: string,
    activityId: string,
    score?: number,
    passed: boolean = true
  ) => {
    try {
      const res = await exploreApi.completeActivity({
        session_id: guestId,
        activity_type: activityType,
        activity_id: activityId,
        score: score,
        passed: passed
      });

      handleAuthoritativeResponse(res);
      return res;
    } catch (err) {
      console.error('Error completing activity:', err);
    }
  };

  const handleAuthoritativeResponse = (res: ActivityCompletionResponse) => {
    if (res.current_total_xp !== undefined) {
      setTotalXp(res.current_total_xp);
      localStorage.setItem('tera_explore_xp', String(res.current_total_xp));
    }

    if (res.xp_awarded > 0) {
      setXpToast({
        amount: res.xp_awarded,
        message: res.message,
        id: Date.now()
      });
      setTimeout(() => {
        setXpToast((prev) => (prev?.id === res.xp_awarded ? null : prev));
      }, 4500);
    }

    if (res.newly_unlocked_badges && res.newly_unlocked_badges.length > 0) {
      setUnlockedBadge(res.newly_unlocked_badges[0]);
    }

    loadUserProgress();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* FLOATING AUTHORITATIVE XP TOAST */}
      {xpToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-500 max-w-sm p-4 rounded-2xl bg-slate-900 border-2 border-amber-500/80 shadow-2xl shadow-amber-500/20 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-amber-300 text-sm">
                +{xpToast.amount} XP Earned!
              </span>
              <button
                onClick={() => setXpToast(null)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              {xpToast.message || 'Server verified reward committed to persistent ledger.'}
            </p>
          </div>
        </div>
      )}

      {/* NEW BADGE CELEBRATION MODAL */}
      {unlockedBadge && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" /> Achievement Unlocked
            </div>

            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/30">
              {unlockedBadge.icon}
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-white">{unlockedBadge.title}</h2>
              <div className="text-xs text-amber-400 font-semibold">{unlockedBadge.category}</div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                {unlockedBadge.description}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-center gap-2 text-xs font-mono text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>+{unlockedBadge.xp_reward} XP Bonus Awarded & Saved</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setUnlockedBadge(null);
                  setActiveTab('my_badges');
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs hover:brightness-110 transition shadow-lg shadow-amber-500/20"
              >
                View My Badges Gallery
              </button>
              <button
                onClick={() => setUnlockedBadge(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700 transition"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY EXPLORE TOP BAR WITH PROMINENT EMERGENCY SOS ACCESS */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 text-left group"
              id="btn-nav-brand"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Compass className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">TERA</span>
                  <span className="text-xs font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    EXPLORE 2.0
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 -mt-0.5 font-medium">Road Safety & Prevention Academy</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-medium">
            {[
              { id: 'home', label: 'Explore Home' },
              { id: 'stories', label: 'Someone Waiting' },
              { id: 'case_studies', label: 'Case Studies' },
              { id: 'game_decision', label: 'Safety Games' },
              { id: 'quiz', label: 'Quiz Center' },
              { id: 'stats', label: 'Accident Analytics' },
              { id: 'my_badges', label: 'My Badges' },
              { id: 'my_journey', label: 'My Journey' }
            ].map(navItem => {
              const isSelected = activeTab === navItem.id || (navItem.id === 'game_decision' && activeTab.startsWith('game_'));
              return (
                <button
                  key={navItem.id}
                  onClick={() => setActiveTab(navItem.id as ExploreTab)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    isSelected 
                      ? 'bg-slate-800 text-teal-300 font-semibold shadow-inner' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  id={`nav-link-${navItem.id}`}
                >
                  {navItem.label}
                </button>
              );
            })}
          </nav>

          {/* XP Counter & Emergency Reporting Shortcut */}
          <div className="flex items-center gap-3">
            {/* XP Pill */}
            <button
              onClick={() => setActiveTab('my_badges')}
              className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/30 px-3 py-1.5 rounded-full text-xs hover:border-amber-500/60 transition cursor-pointer"
              title="Click to view My Badges & Verified XP"
              id="btn-header-xp-badge"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300 font-mono font-medium">{totalXp}</span>
              <span className="text-amber-400 font-bold text-[10px]">XP</span>
            </button>

            {/* EMERGENCY SOS BUTTON (Immediate 1-Click Return to Reporting) */}
            <button
              onClick={onNavigateToSOS || onReturnToOperations}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 active:scale-95 transition"
              title="Return immediately to Emergency Reporting / Active Incidents"
              id="btn-header-emergency-sos"
            >
              <AlertTriangle className="w-4 h-4 fill-white" />
              <span className="tracking-wide uppercase">Emergency SOS</span>
            </button>

            {/* Back to Operations Portal Link */}
            {onReturnToOperations && (
              <button
                onClick={onReturnToOperations}
                className="hidden md:flex text-xs text-slate-400 hover:text-white underline underline-offset-4 pl-1"
              >
                Operations Portal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 pb-16">
        {/* VIEW: DISCOVERY LANDING HOME */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            {/* CINEMATIC HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 pt-12 pb-16 px-4 md:px-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.12),transparent_50%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(245,158,11,0.08),transparent_50%)] pointer-events-none" />

              <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide">
                  <Shield className="w-3.5 h-3.5" />
                  <span>TERA EXPLORE 2.0 • CITIZEN ROAD SAFETY INITIATIVE</span>
                </div>

                <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
                  “Every Journey Deserves a <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Safe Return.”</span>
                </h1>

                <p className="text-slate-300 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed font-light">
                  Learn smarter. Choose safer. Protect the people who matter most. 
                  Explore accredited accident case studies, interactive games, challenge quizzes, and emotional campaigns that bring our families home safely.
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('stories')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 hover:brightness-110 transition flex items-center justify-center gap-2"
                    id="btn-hero-someone-waiting"
                  >
                    <Heart className="w-4 h-4 fill-slate-950" />
                    Someone Is Waiting for You
                  </button>
                  <button
                    onClick={() => setActiveTab('case_studies')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 hover:brightness-110 transition flex items-center justify-center gap-2"
                    id="btn-hero-case-studies"
                  >
                    <FileText className="w-4 h-4" />
                    Major Accident Case Studies
                  </button>
                  <button
                    onClick={() => setActiveTab('my_badges')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-sm hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-2"
                    id="btn-hero-my-badges"
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                    My Badges ({userProgress?.earned_badges?.length ?? 1} / 15)
                  </button>
                </div>

                {/* Featured Emotional Campaign Card */}
                <div 
                  onClick={() => setActiveTab('stories')}
                  className="mt-8 max-w-2xl mx-auto bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/30 border border-amber-500/40 rounded-2xl p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:border-amber-500/70 transition group shadow-xl"
                  id="card-featured-campaign"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Heart className="w-6 h-6 fill-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">Public Safety Campaign</span>
                      <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                        “Someone Is Waiting for You.”
                      </h4>
                      <p className="text-xs text-slate-300">
                        Explore 6 emotional family stories, watch accredited MoRTH & WHO videos, and sign the family safety pledge.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition shrink-0" />
                </div>
              </div>
            </section>

            {/* ACCIDENT CASE STUDIES HIGHLIGHT SECTION */}
            <section className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    <span>Accredited Crash Investigation Archive</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Major Accident Case Studies</h2>
                  <p className="text-xs text-slate-400">
                    Rigorous 7-section forensic breakdown (A-G) of 10 real roadway collisions with evidence-based quizzes.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('case_studies')}
                  className="text-xs text-teal-400 font-bold hover:underline flex items-center gap-1 self-start md:self-auto"
                >
                  View All 10 Case Studies <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div
                  onClick={() => setActiveTab('case_studies')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 cursor-pointer transition space-y-3 group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 font-semibold">
                      Highway Pile-Up
                    </span>
                    <span className="text-amber-400 font-mono font-bold">+20 XP</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition">
                    NH-44 Multi-Vehicle Chain Collision in Winter Fog
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    Analysis of stopping sightline physics, radiation fog scattering, and disabled agricultural tractors.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('case_studies')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 cursor-pointer transition space-y-3 group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 font-semibold">
                      Heavy Commercial
                    </span>
                    <span className="text-amber-400 font-mono font-bold">+20 XP</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition">
                    Rear Underrun Crash Involving Stationary Freight Trailer
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    Evaluation of Rear Under-Ride Protection Devices (RUPD IS:14812) and shoulder parking protocol.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('case_studies')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 cursor-pointer transition space-y-3 group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 font-semibold">
                      Two-Wheeler Safety
                    </span>
                    <span className="text-amber-400 font-mono font-bold">+20 XP</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition">
                    Urban Intersection Ejection & Helmet Retention Failure
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    Chinstrap tension mechanics, unfastened micrometric buckles, and side-swipe collision dynamics.
                  </p>
                </div>
              </div>
            </section>

            {/* 5 ROAD SAFETY INTERACTIVE GAMES SECTION */}
            <section className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                    <Gamepad2 className="w-4 h-4" />
                    <span>Interactive Game Suite</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">5 Road Safety Games</h2>
                  <p className="text-xs text-slate-400">Play real-world defensive scenarios, hazard perception tests, and family challenges.</p>
                </div>
                <span className="text-xs text-amber-400 font-mono font-semibold">Earn verified XP & Unlock Badges</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Game 1: Decision Simulator */}
                <div 
                  onClick={() => setActiveTab('game_decision')}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 group hover:bg-slate-900/90"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                        Game 1
                      </span>
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">+15 XP</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                      Road Safety Decision Simulator
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Encounter 6 branching real-world traffic dilemmas. Test your judgment against highway phone calls, tailgaters, and monsoon spray.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition gap-1">
                    Play Simulator <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Game 2: Spot the Hazard */}
                <div 
                  onClick={() => setActiveTab('game_hazard')}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 group hover:bg-slate-900/90"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                        Game 2
                      </span>
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">+15 XP</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                      Spot the Hazard
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Interactive visual perception test. Identify blind-spot motorcyclists, opening car doors, and pedestrian risks across 3 difficulty levels.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-amber-400 group-hover:translate-x-1 transition gap-1">
                    Scan Hazards <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Game 3: Memory Challenge */}
                <div 
                  onClick={() => setActiveTab('game_memory')}
                  className="bg-slate-900 border border-slate-800 hover:border-purple-500/60 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 group hover:bg-slate-900/90"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                        Game 3
                      </span>
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">+15 XP</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">
                      Road Sign Memory Match
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Match mandatory, cautionary, and informatory Indian road signs with their legal meanings before the clock runs out.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-purple-400 group-hover:translate-x-1 transition gap-1">
                    Test Memory <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Game 4: Build Safe Journey */}
                <div 
                  onClick={() => setActiveTab('game_journey')}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 group hover:bg-slate-900/90"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        Game 4
                      </span>
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">+15 XP</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                      Build a Safe Journey
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Assemble your vehicle checklist, calculate safe following distance, and plan weather routing to maximize your trip Safety Index.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition gap-1">
                    Plan Safe Trip <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Game 5: Family Safety Challenge */}
                <div 
                  onClick={() => setActiveTab('game_family')}
                  className="bg-slate-900 border border-slate-800 hover:border-pink-500/60 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 group hover:bg-slate-900/90 md:col-span-2"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider bg-pink-950/80 px-2 py-0.5 rounded border border-pink-800">
                        Game 5 • Community Special
                      </span>
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">+15 XP & Badge</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition">
                      Family Safety Challenge & Honor Certificate
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Assign age-appropriate safety habits to children, teens, and parents. Inspect the pre-travel checklist and sign your official Family Road Safety Pledge to receive a personalized certificate.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-pink-400 group-hover:translate-x-1 transition gap-1">
                    Complete Family Challenge <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </section>

            {/* ESSENTIAL ROAD SAFETY PORTALS */}
            <section className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-xl font-bold text-white tracking-tight">Essential Road Safety Portals</h2>
                <p className="text-xs text-slate-400">Explore data, master quizzes, read inspiring stories, and track official badges.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Quiz Center Card */}
                <div 
                  onClick={() => setActiveTab('quiz')}
                  className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-sm group-hover:text-indigo-300">Quiz Center</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Daily 5-question check, 12 topic categories, rapid challenge mode, and +10 to +15 XP per completion.
                    </p>
                  </div>
                  <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
                    Take a Quiz <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Accident Statistics Card */}
                <div 
                  onClick={() => setActiveTab('stats')}
                  className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/60 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <BarChart2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-sm group-hover:text-sky-300">Accident Analytics</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      MoRTH 2023 & WHO verified figures, vulnerable road users, highway risks, and non-compliance impacts.
                    </p>
                  </div>
                  <span className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                    View Data Charts <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* My Badges Card */}
                <div 
                  onClick={() => setActiveTab('my_badges')}
                  className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 group"
                  id="card-portal-my-badges"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-sm group-hover:text-amber-300">My Badges Gallery</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      15 official competency badges across Getting Started, Road Safety, Learning, Consistency, and Mastery.
                    </p>
                  </div>
                  <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    View 15 Badges <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Prevention Library Card */}
                <div 
                  onClick={() => setActiveTab('learn')}
                  className="bg-slate-900/90 border border-slate-800 hover:border-teal-500/60 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-sm group-hover:text-teal-300">Prevention Library</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Physics of helmet EPS liners, truck blind spots, aquaplaning, and interactive stopping distance lab.
                    </p>
                  </div>
                  <span className="text-xs text-teal-400 font-semibold flex items-center gap-1">
                    Explore Physics <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW: SOMEONE IS WAITING FOR YOU CAMPAIGN (PHASE 2) */}
        {activeTab === 'stories' && (
          <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6">
            <SomeoneWaitingCampaignView 
              guestId={guestId}
              onNavigateTab={(tab) => setActiveTab(tab as ExploreTab)}
              onActivityComplete={handleAuthoritativeResponse}
            />
          </div>
        )}

        {/* VIEW: MAJOR ACCIDENT CASE STUDIES LIBRARY (PHASE 3) */}
        {activeTab === 'case_studies' && (
          <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6">
            <AccidentCaseStudiesView 
              guestId={guestId}
              onNavigateTab={(tab) => setActiveTab(tab as ExploreTab)}
              onActivityComplete={handleAuthoritativeResponse}
            />
          </div>
        )}

        {/* VIEW: MY BADGES (PHASE 6) */}
        {activeTab === 'my_badges' && (
          <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6">
            <MyBadgesView 
              guestId={guestId}
              onNavigateTab={(tab) => setActiveTab(tab as ExploreTab)}
              userProgress={userProgress}
              onRefreshProgress={loadUserProgress}
            />
          </div>
        )}

        {/* SUBVIEW ROUTING FOR INTERACTIVE GAMES */}
        {activeTab === 'game_decision' && (
          <DecisionSimulatorGame 
            onComplete={(score: number, xp: number) => {
              handleAuthoritativeActivityComplete('scenario', 'decision_simulator', score, true);
            }}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'game_hazard' && (
          <SpotTheHazardGame 
            onCompleteLevel={(level: number, xp: number) => {
              handleAuthoritativeActivityComplete('hazard_game', `hazard_level_${level}`, 100, true);
            }}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'game_memory' && (
          <MemoryChallengeGame 
            onComplete={(moves: number, time: number, xp: number) => {
              handleAuthoritativeActivityComplete('game_memory', 'memory_game', 100, true);
            }}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'game_journey' && (
          <BuildSafeJourneyGame 
            onComplete={(safetyIndex: number, xp: number) => {
              handleAuthoritativeActivityComplete('journey_game', 'safe_journey_planner', safetyIndex, safetyIndex >= 70);
            }}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'game_family' && (
          <FamilySafetyChallenge 
            onComplete={(xp: number, badge?: string) => {
              handleAuthoritativeActivityComplete('family_challenge', 'family_safety_challenge', 100, true);
            }}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizCenterView 
            onCompleteQuiz={(score: number, total: number, xp: number) => {
              const pct = Math.round((score / total) * 100);
              handleAuthoritativeActivityComplete('quiz', 'quiz_center', pct, pct >= 60);
            }}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'stats' && (
          <RoadSafetyStatsView 
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'learn' && (
          <SafetyLearningLibrary 
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'my_journey' && (
          <MySafetyJourneyView 
            userProgress={userProgress}
            guestId={guestId}
            onRefresh={loadUserProgress}
            onActivityComplete={handleAuthoritativeResponse}
            onStartActivity={(tab) => {
              if (tab === 'hazard' || tab === 'game_hazard') setActiveTab('game_hazard');
              else if (tab === 'journey' || tab === 'game_journey') setActiveTab('game_journey');
              else if (tab === 'quizzes' || tab === 'quiz') setActiveTab('quiz');
              else if (tab === 'badges' || tab === 'my_badges') setActiveTab('my_badges');
              else if (tab === 'case_studies') setActiveTab('case_studies');
              else if (tab === 'stories') setActiveTab('stories');
              else setActiveTab('home');
            }}
            onExit={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* FOOTER WITH FINAL SLOGAN */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <p className="font-serif italic text-slate-400 text-sm">
          “Every Second Matters. Every Life Matters. Make Every Journey Safer.”
        </p>
        <p className="font-mono text-[11px]">
          TERA Explore 2.0 • Tirupati Emergency Resource Allocation & Coordination Platform
        </p>
        <div className="flex justify-center gap-4 text-[10px] text-slate-600 pt-1">
          <span>MoRTH Motor Vehicles Act 2019</span>
          <span>•</span>
          <span>WHO Global Status Report on Road Safety</span>
          <span>•</span>
          <span>Section 134A Good Samaritan Protection</span>
        </div>
      </footer>
    </div>
  );
};

export default TeraExplorePage;
