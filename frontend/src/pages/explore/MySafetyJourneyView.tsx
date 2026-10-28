import React, { useState, useEffect } from 'react';
import { 
  Award, Sparkles, CheckCircle2, Lock, Flame, 
  BookOpen, ShieldCheck, Gamepad2, ArrowRight, RotateCcw,
  Star, Calendar, Target, Heart, FileText, CheckCircle,
  AlertTriangle, TrendingUp, RefreshCw
} from 'lucide-react';
import { 
  exploreApi, 
  Badge, 
  UserProgress, 
  DailyChallengeItem,
  ActivityCompletionResponse,
  getAuthoritativeSessionId 
} from '../../services/api';

interface MySafetyJourneyViewProps {
  onStartActivity?: (tab: string) => void;
  onExit?: () => void;
  userProgress?: UserProgress | null;
  guestId?: string;
  onRefresh?: () => void;
  onActivityComplete?: (response: ActivityCompletionResponse) => void;
}

export const MySafetyJourneyView: React.FC<MySafetyJourneyViewProps> = ({ 
  onStartActivity, 
  onExit,
  userProgress,
  guestId,
  onRefresh,
  onActivityComplete
}) => {
  const [progress, setProgress] = useState<UserProgress | null>(userProgress || null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState<boolean>(!userProgress);
  const [error, setError] = useState<string | null>(null);
  const [claimingChallengeId, setClaimingChallengeId] = useState<string | null>(null);

  const effectiveSessionId = guestId || getAuthoritativeSessionId();

  useEffect(() => {
    loadProgression();
  }, [guestId]);

  useEffect(() => {
    if (userProgress) {
      setProgress(userProgress);
      setLoading(false);
    }
  }, [userProgress]);

  const loadProgression = async () => {
    setLoading(true);
    setError(null);
    try {
      const [progData, badgeData] = await Promise.all([
        exploreApi.getProgress(effectiveSessionId),
        exploreApi.getBadges(effectiveSessionId)
      ]);
      setProgress(progData);
      setBadges(badgeData.badges || []);
    } catch (err) {
      console.error('Failed to load authoritative progression:', err);
      setError('Unable to synchronize with server ledger. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    await loadProgression();
    if (onRefresh) onRefresh();
  };

  const handleClaimDailyChallenge = async (challengeId: string) => {
    setClaimingChallengeId(challengeId);
    try {
      const res = await exploreApi.completeDailyChallenge(challengeId, effectiveSessionId);
      if (onActivityComplete) {
        onActivityComplete(res);
      }
      // Re-fetch updated authoritative progress
      await loadProgression();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to complete daily challenge:', err);
    } finally {
      setClaimingChallengeId(null);
    }
  };

  // Progression math
  const currentXp = progress?.total_xp ?? 0;
  const currentLevel = progress?.level ?? 1;

  // Level thresholds
  const prevLevelXp = currentLevel === 1 ? 0 : currentLevel === 2 ? 100 : currentLevel === 3 ? 250 : 500;
  const nextLevelXp = currentLevel === 1 ? 100 : currentLevel === 2 ? 250 : currentLevel === 3 ? 500 : 1000;

  // Incremental XP inside current level tier
  const xpInLevel = progress?.level_progress?.xp_in_level ?? Math.max(0, currentXp - prevLevelXp);
  const xpNeededInLevel = progress?.level_progress?.xp_needed_in_level ?? Math.max(1, nextLevelXp - prevLevelXp);
  const levelProgressPct = progress?.level_progress?.level_percentage ?? Math.min(100, Math.max(0, Math.round((xpInLevel / xpNeededInLevel) * 100)));
  const overallMilestonePct = progress?.level_progress?.overall_milestone_percentage ?? Math.min(100, Math.max(0, Math.round((currentXp / nextLevelXp) * 100)));

  const dailyChallenges: DailyChallengeItem[] = progress?.daily_challenges && progress.daily_challenges.length > 0 
    ? progress.daily_challenges 
    : [
        {
          id: 'c1_blind_spot_hazards',
          title: 'Spot 3 Blind Spot Hazards',
          action: 'Spot the Hazard',
          tab: 'game_hazard',
          reward_xp: 50,
          completed: false,
          criteria: 'Identify traffic hazards in Spot the Hazard'
        },
        {
          id: 'c2_safe_journey_audit',
          title: 'Complete 1 Safe Journey Pre-Trip Audit',
          action: 'Build a Safe Journey',
          tab: 'game_journey',
          reward_xp: 75,
          completed: false,
          criteria: 'Assemble vehicle safety checklist and route plan'
        },
        {
          id: 'c3_daily_safety_quiz',
          title: 'Score 80%+ on Daily Safety Quiz',
          action: 'Take Daily Quiz',
          tab: 'quiz',
          reward_xp: 40,
          completed: false,
          criteria: 'Pass a quiz with 80% or higher score'
        }
      ];

  const earnedBadges = badges.filter(b => b.unlocked);

  if (loading && !progress) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-slate-400 space-y-3 font-mono">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-sm">Synchronizing your authoritative Road Safety Journey...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-purple-500/20 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold mb-2">
              <Award className="w-4 h-4" />
              <span>AUTHORITATIVE DEFENSIVE PROGRESSION</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Safety Journey</h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">
              Track your verified defensive competencies, server-persisted Safety XP, earned badges, and daily accident-prevention milestones.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
              id="btn-sync-safety-journey"
              title="Synchronize with Authoritative Database"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
              Sync
            </button>
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
      </div>

      {/* Recoverable Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleManualRefresh}
            className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Level & XP Overview Card */}
      {progress && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-500/20">
                {currentLevel}
              </div>
              <div>
                <span className="text-[11px] text-purple-400 uppercase font-semibold tracking-wider">
                  Tier {currentLevel} Citizen Rank
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {progress.level_title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lifetime Experience: <strong className="text-amber-400 font-mono">{currentXp} XP</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-medium block">Learning Streak</span>
                  <span className="text-sm font-bold text-white font-mono">{progress.streak_days} Consecutive Day{progress.streak_days === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Corrected Mathematical XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">
                Tier {currentLevel} Progress: <strong className="text-purple-300 font-mono">{xpInLevel}</strong> / {xpNeededInLevel} XP ({levelProgressPct}%)
              </span>
              <span className="text-slate-500 text-[11px] font-mono">
                Milestone: {currentXp} / {nextLevelXp} Lifetime XP ({overallMilestonePct}%)
              </span>
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                style={{ width: `${levelProgressPct}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Authoritative Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-medium">Games Finished</span>
              <div className="text-lg font-bold text-white font-mono mt-0.5">{progress.games_completed}</div>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-medium">Quizzes Completed</span>
              <div className="text-lg font-bold text-white font-mono mt-0.5">{progress.quizzes_completed}</div>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-medium">Quiz Accuracy</span>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{progress.quiz_accuracy_pct}%</div>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-medium">Modules Studied</span>
              <div className="text-lg font-bold text-teal-400 font-mono mt-0.5">{progress.lessons_read}</div>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 uppercase font-medium">Case Studies</span>
              <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">{progress.case_studies_completed ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Persisted Daily Challenges Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              Today's Daily Safety Challenges
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Completed challenges award verified Safety XP once per day.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {dailyChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition duration-200 ${
                challenge.completed 
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm' 
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                    +{challenge.reward_xp} XP
                  </span>
                  {challenge.completed ? (
                    <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px] font-medium">Available</span>
                  )}
                </div>
                <h3 className="text-xs font-semibold text-white leading-snug">{challenge.title}</h3>
                <p className="text-[11px] text-slate-400">{challenge.criteria}</p>
              </div>

              <div>
                {challenge.completed ? (
                  <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Reward Claimed Today
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    {onStartActivity && (
                      <button
                        onClick={() => onStartActivity(challenge.tab)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium flex items-center justify-center gap-1 transition"
                      >
                        <span>{challenge.action}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      disabled={claimingChallengeId === challenge.id}
                      onClick={() => handleClaimDailyChallenge(challenge.id)}
                      className="py-1.5 px-3 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-semibold border border-teal-500/40 transition whitespace-nowrap"
                    >
                      {claimingChallengeId === challenge.id ? 'Claiming...' : 'Claim XP'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Badges & Achievements Gallery Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Official Safety Badges ({earnedBadges.length} / {badges.length || 15} Earned)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Badges are authoritatively verified and stored in the database ledger.
            </p>
          </div>
          {onStartActivity && (
            <button
              onClick={() => onStartActivity('badges')}
              className="text-xs text-purple-400 font-semibold hover:text-purple-300 flex items-center gap-1 self-start sm:self-auto"
            >
              View Complete 15 Badges Gallery <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badges.slice(0, 6).map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                badge.unlocked
                  ? 'bg-purple-950/20 border-purple-500/40 text-purple-100 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 opacity-60'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                badge.unlocked 
                  ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300' 
                  : 'bg-slate-800 text-slate-600 grayscale'
              }`}>
                {badge.icon}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-white truncate">{badge.title}</h3>
                  <span className="text-[10px] font-mono text-amber-400 font-semibold shrink-0">
                    +{badge.xp_reward} XP
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {badge.description}
                </p>
                {badge.unlocked ? (
                  <span className="text-[10px] text-emerald-400 font-medium block pt-1">
                    ✓ Earned {badge.earned_at ? `on ${badge.earned_at}` : 'and verified'}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 block pt-1 truncate">
                    Requirement: {badge.criteria}
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

export default MySafetyJourneyView;
