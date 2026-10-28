import React, { useState, useEffect } from 'react';
import { 
  Award, Sparkles, CheckCircle2, Lock, Flame, 
  BookOpen, ShieldCheck, Gamepad2, ArrowRight, RotateCcw,
  Star, Calendar, Target, Heart
} from 'lucide-react';
import { exploreApi, Achievement, UserProgress } from '../../services/api';

interface MySafetyJourneyViewProps {
  onStartActivity?: (tab: string) => void;
  onExit?: () => void;
}

export const MySafetyJourneyView: React.FC<MySafetyJourneyViewProps> = ({ onStartActivity, onExit }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgression();
  }, []);

  const loadProgression = async () => {
    setLoading(true);
    try {
      const [achData, progData] = await Promise.all([
        exploreApi.getAchievements(),
        exploreApi.getProgress()
      ]);
      setAchievements(achData);
      setProgress(progData);
    } catch {
      // Fallback
      const storedXp = Number(localStorage.getItem('tera_explore_xp') || '140');
      const storedCompletedGames = JSON.parse(localStorage.getItem('tera_completed_games') || '["decision_sim"]');
      
      setProgress({
        user_id: 'guest_citizen',
        total_xp: storedXp,
        level: storedXp >= 500 ? 4 : storedXp >= 250 ? 3 : storedXp >= 100 ? 2 : 1,
        level_title: storedXp >= 500 ? 'Road Safety Guardian' : storedXp >= 250 ? 'Defensive Champion' : storedXp >= 100 ? 'Cautious Commuter' : 'Defensive Scout',
        quizzes_completed: 3,
        quiz_accuracy_pct: 82.5,
        games_completed: storedCompletedGames.length,
        lessons_read: 2,
        streak_days: 3,
        earned_badges: ['first_safe_choice', 'hazard_spotter']
      });

      setAchievements([
        {
          id: 'first_safe_choice',
          title: 'First Safe Choice',
          description: 'Completed your first scenario in the Road Safety Decision Simulator.',
          icon: 'CheckCircle2',
          category: 'decision',
          xp_reward: 50,
          unlocked: true,
          unlocked_at: '2026-10-27'
        },
        {
          id: 'hazard_spotter',
          title: 'Hazard Spotter',
          description: 'Identified all active traffic hazards in Level 1 of Spot the Hazard.',
          icon: 'Eye',
          category: 'hazard',
          xp_reward: 75,
          unlocked: true,
          unlocked_at: '2026-10-28'
        },
        {
          id: 'helmet_champion',
          title: 'Helmet Safety Champion',
          description: 'Answered all helmet and motorcycle safety assessment questions with 100% accuracy.',
          icon: 'Shield',
          category: 'quiz',
          xp_reward: 80,
          unlocked: false
        },
        {
          id: 'road_sign_explorer',
          title: 'Road Sign Explorer',
          description: 'Completed the Road Safety Memory Challenge matching game.',
          icon: 'Compass',
          category: 'memory',
          xp_reward: 80,
          unlocked: false
        },
        {
          id: 'family_advocate',
          title: 'Family Safety Advocate',
          description: 'Completed the Family Safety Challenge and signed your official household pledge.',
          icon: 'Heart',
          category: 'family',
          xp_reward: 120,
          unlocked: false
        },
        {
          id: 'five_day_streak',
          title: 'Five-Day Learning Streak',
          description: 'Completed a daily safety habit or quiz for five consecutive days.',
          icon: 'Flame',
          category: 'streak',
          xp_reward: 150,
          unlocked: false
        },
        {
          id: 'road_safety_master',
          title: 'Road Safety Master',
          description: 'Reached Level 4 and completed all 5 interactive road safety experiences.',
          icon: 'Award',
          category: 'mastery',
          xp_reward: 250,
          unlocked: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentLevel = progress?.level || 1;
  const currentXp = progress?.total_xp || 0;
  // Level threshold calculation
  const nextLevelXp = currentLevel === 1 ? 100 : currentLevel === 2 ? 250 : currentLevel === 3 ? 500 : 1000;
  const prevLevelXp = currentLevel === 1 ? 0 : currentLevel === 2 ? 100 : currentLevel === 3 ? 250 : 500;
  const levelProgressPct = Math.min(100, Math.max(0, Math.round(((currentXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100)));

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-purple-500/20 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold mb-2">
              <Award className="w-4 h-4" />
              <span>DEFENSIVE PROGRESSION & MASTERY</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Safety Journey</h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">
              Track your defensive skill progression, earned achievements, daily streaks, and commitment to accident prevention.
            </p>
          </div>
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

      {/* Level & XP Overview Card */}
      {progress && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-500/20">
                {progress.level}
              </div>
              <div>
                <span className="text-[11px] text-purple-400 uppercase font-semibold tracking-wider">
                  Tier {progress.level} Citizen Rank
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {progress.level_title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total Experience: <strong className="text-amber-400 font-mono">{progress.total_xp} XP</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-medium block">Learning Streak</span>
                  <span className="text-sm font-bold text-white font-mono">{progress.streak_days} Consecutive Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Level Progress</span>
              <span>
                <strong className="text-purple-300">{currentXp}</strong> / {nextLevelXp} XP ({levelProgressPct}%)
              </span>
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                style={{ width: `${levelProgressPct}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Stat Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase">Games Finished</span>
              <div className="text-lg font-bold text-white font-mono mt-0.5">{progress.games_completed}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase">Quizzes Completed</span>
              <div className="text-lg font-bold text-white font-mono mt-0.5">{progress.quizzes_completed}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase">Quiz Accuracy</span>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{progress.quiz_accuracy_pct}%</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase">Modules Studied</span>
              <div className="text-lg font-bold text-teal-400 font-mono mt-0.5">{progress.lessons_read}</div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Challenges Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            Today's Daily Safety Challenges
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'c1',
              title: 'Spot 3 Blind Spot Hazards',
              action: 'Spot the Hazard',
              tab: 'hazard',
              reward: '+50 XP',
              completed: true
            },
            {
              id: 'c2',
              title: 'Complete 1 Safe Journey Pre-Trip Audit',
              action: 'Build a Safe Journey',
              tab: 'journey',
              reward: '+75 XP',
              completed: false
            },
            {
              id: 'c3',
              title: 'Score 80%+ on Daily Safety Quiz',
              action: 'Take Daily Quiz',
              tab: 'quizzes',
              reward: '+40 XP',
              completed: false
            }
          ].map(challenge => (
            <div
              key={challenge.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                challenge.completed 
                  ? 'bg-emerald-950/20 border-emerald-500/40' 
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{challenge.reward}</span>
                  {challenge.completed ? (
                    <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">Incomplete</span>
                  )}
                </div>
                <h3 className="text-xs font-semibold text-white">{challenge.title}</h3>
              </div>

              {onStartActivity && !challenge.completed && (
                <button
                  onClick={() => onStartActivity(challenge.tab)}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium flex items-center justify-center gap-1.5 transition"
                >
                  {challenge.action} <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Showcase */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Safety Badges & Achievements
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Badges are earned through verified completed educational activities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map(ach => (
            <div
              key={ach.id}
              className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                ach.unlocked
                  ? 'bg-purple-950/20 border-purple-500/40 text-purple-100 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 opacity-60'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                ach.unlocked 
                  ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300' 
                  : 'bg-slate-800 text-slate-600'
              }`}>
                {ach.unlocked ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white">{ach.title}</h3>
                  <span className="text-[10px] font-mono text-amber-400">+{ach.xp_reward} XP</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {ach.description}
                </p>
                {ach.unlocked && ach.unlocked_at && (
                  <span className="text-[10px] text-purple-400/80 font-mono block pt-1">
                    Unlocked on {ach.unlocked_at}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
