import React, { useState } from 'react';
import { 
  Compass, Shield, AlertTriangle, Gamepad2, Award, 
  BookOpen, BarChart2, Heart, Sparkles, ArrowRight, 
  RotateCcw, CheckCircle2, ChevronRight, Eye, Brain,
  Car, Users, PhoneCall, Zap, PlayCircle, Flame
} from 'lucide-react';

// Subcomponents
import { DecisionSimulatorGame } from './DecisionSimulatorGame';
import { SpotTheHazardGame } from './SpotTheHazardGame';
import { MemoryChallengeGame } from './MemoryChallengeGame';
import { BuildSafeJourneyGame } from './BuildSafeJourneyGame';
import { FamilySafetyChallenge } from './FamilySafetyChallenge';
import { QuizCenterView } from './QuizCenterView';
import { RoadSafetyStatsView } from './RoadSafetyStatsView';
import { EmotionalStoriesView } from './EmotionalStoriesView';
import { SafetyLearningLibrary } from './SafetyLearningLibrary';
import { MySafetyJourneyView } from './MySafetyJourneyView';

interface TeraExplorePageProps {
  onReturnToOperations?: () => void;
  onNavigateToSOS?: () => void;
}

export type ExploreTab = 
  | 'home' 
  | 'game_decision' 
  | 'game_hazard' 
  | 'game_memory' 
  | 'game_journey' 
  | 'game_family' 
  | 'quiz' 
  | 'stats' 
  | 'stories' 
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

  const handleEarnXp = (amount: number, badge?: string) => {
    const updated = totalXp + amount;
    setTotalXp(updated);
    localStorage.setItem('tera_explore_xp', String(updated));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* STICKY EXPLORE TOP BAR WITH PROMINENT EMERGENCY SOS ACCESS */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 text-left group"
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
              { id: 'game_decision', label: '5 Safety Games' },
              { id: 'quiz', label: 'Quiz Center' },
              { id: 'stats', label: 'Accident Analytics' },
              { id: 'stories', label: 'Someone Waiting' },
              { id: 'learn', label: 'Prevention Library' },
              { id: 'my_journey', label: 'My Journey' }
            ].map(navItem => {
              const isSelected = activeTab.startsWith(navItem.id.split('_')[0]) || activeTab === navItem.id;
              return (
                <button
                  key={navItem.id}
                  onClick={() => setActiveTab(navItem.id as ExploreTab)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    isSelected 
                      ? 'bg-slate-800 text-cyan-300 font-semibold shadow-inner' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
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
              onClick={() => setActiveTab('my_journey')}
              className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-amber-500/30 px-3 py-1.5 rounded-full text-xs hover:border-amber-500/60 transition"
              title="Click to view My Safety Journey"
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
                Operational Dashboard
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
                  Explore interactive games, challenge quizzes, accident epidemiology, and stories that keep our families whole.
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('my_journey')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 hover:brightness-110 transition flex items-center justify-center gap-2"
                  >
                    Start Your Safety Journey <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab('game_decision')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-sm hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-2"
                  >
                    <Gamepad2 className="w-4 h-4 text-amber-400" /> Play a Road Safety Challenge
                  </button>
                </div>

                {/* Secondary Emotional Campaign Card */}
                <div 
                  onClick={() => setActiveTab('stories')}
                  className="mt-8 max-w-2xl mx-auto bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/30 border border-amber-500/30 rounded-2xl p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:border-amber-500/60 transition group shadow-lg"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Heart className="w-5 h-5 fill-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">Featured Campaign</span>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                        “Someone Is Waiting for You.”
                      </h4>
                      <p className="text-xs text-slate-400">
                        Read cinematic stories of near-misses, family promises, and the habits that save lives.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition shrink-0" />
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
                <span className="text-xs text-slate-400 font-mono">Earn up to +500 XP</span>
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
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">+100 XP</span>
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
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">+75 XP</span>
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
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">+80 XP</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">
                      Road Safety Memory Challenge
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Match mandatory traffic signs, personal protective equipment, and defensive driving principles against the clock or in relaxed learning mode.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-purple-400 group-hover:translate-x-1 transition gap-1">
                    Start Matching <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Game 4: Build a Safe Journey */}
                <div 
                  onClick={() => setActiveTab('game_journey')}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 group hover:bg-slate-900/90"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        Game 4
                      </span>
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">+90 XP</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                      Build a Safe Journey
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Select your travel vehicle, conduct a pre-departure audit of tyre pressure, rest sleep, weather, and kit, and achieve a 100% Journey Safety Index.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition gap-1">
                    Plan Journey <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Game 5: Family Safety Challenge */}
                <div 
                  onClick={() => setActiveTab('game_family')}
                  className="bg-slate-900 border border-slate-800 hover:border-pink-500/60 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 group hover:bg-slate-900/90 md:col-span-2 lg:col-span-2"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider bg-pink-950/80 px-2 py-0.5 rounded border border-pink-800">
                        Game 5 • Community Special
                      </span>
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">+120 XP</span>
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

            {/* EXPLORE MODULES GRID */}
            <section className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-xl font-bold text-white tracking-tight">Essential Road Safety Portals</h2>
                <p className="text-xs text-slate-400">Explore data, master quizzes, read inspiring stories, and understand the science of prevention.</p>
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
                      Daily 5-question check, 12 topic categories, rapid challenge mode, and instant statutory principles.
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

                {/* My Safety Journey Card */}
                <div 
                  onClick={() => setActiveTab('my_journey')}
                  className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/60 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-sm group-hover:text-purple-300">My Safety Journey</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      XP level badges, daily learning streaks, challenge checklists, and earned achievement showcases.
                    </p>
                  </div>
                  <span className="text-xs text-purple-400 font-semibold flex items-center gap-1">
                    Track Progress <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* SUBVIEW ROUTING */}
        {activeTab === 'game_decision' && (
          <DecisionSimulatorGame 
            onComplete={(score: number, xp: number) => handleEarnXp(xp)}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'game_hazard' && (
          <SpotTheHazardGame 
            onCompleteLevel={(level: number, xp: number) => handleEarnXp(xp)}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'game_memory' && (
          <MemoryChallengeGame 
            onComplete={(moves: number, time: number, xp: number) => handleEarnXp(xp)}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'game_journey' && (
          <BuildSafeJourneyGame 
            onComplete={(safetyIndex: number, xp: number) => handleEarnXp(xp)}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'game_family' && (
          <FamilySafetyChallenge 
            onComplete={(xp: number, badge?: string) => handleEarnXp(xp, badge)}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizCenterView 
            onCompleteQuiz={(score: number, total: number, xp: number) => handleEarnXp(xp)}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'stats' && (
          <RoadSafetyStatsView 
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'stories' && (
          <EmotionalStoriesView 
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
            onStartActivity={(tab) => {
              if (tab === 'hazard') setActiveTab('game_hazard');
              else if (tab === 'journey') setActiveTab('game_journey');
              else if (tab === 'quizzes') setActiveTab('quiz');
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
