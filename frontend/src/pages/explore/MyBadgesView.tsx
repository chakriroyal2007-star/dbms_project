import React, { useState, useEffect } from 'react';
import {
  Award,
  Shield,
  CheckCircle,
  Lock,
  Flame,
  BookOpen,
  HelpCircle,
  Gamepad2,
  FileText,
  RotateCw,
  Sparkles,
  TrendingUp,
  Filter,
  ArrowRight
} from 'lucide-react';
import { exploreApi, Badge, UserProgress } from '../../services/api';

interface MyBadgesViewProps {
  guestId?: string;
  onNavigateTab?: (tab: string) => void;
  userProgress?: UserProgress | null;
  onRefreshProgress?: () => void;
}

export const MyBadgesView: React.FC<MyBadgesViewProps> = ({
  guestId = 'guest_explore_user',
  onNavigateTab,
  userProgress,
  onRefreshProgress
}) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(userProgress || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EARNED' | 'IN_PROGRESS' | 'LOCKED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    loadBadgeData();
  }, [guestId]);

  useEffect(() => {
    if (userProgress) {
      setProgress(userProgress);
    }
  }, [userProgress]);

  const loadBadgeData = async () => {
    try {
      setLoading(true);
      const [badgeRes, progRes] = await Promise.all([
        exploreApi.getBadges(guestId),
        exploreApi.getProgress(guestId)
      ]);
      setBadges(badgeRes.badges || []);
      setProgress(progRes);
    } catch (err) {
      console.error('Failed to load badges or progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    await loadBadgeData();
    if (onRefreshProgress) {
      onRefreshProgress();
    }
  };

  // Categories list
  const categories = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'Getting Started', label: 'Getting Started' },
    { id: 'Road User Safety', label: 'Road User Safety' },
    { id: 'Learning Achievements', label: 'Learning Achievements' },
    { id: 'Consistency', label: 'Consistency & Streaks' },
    { id: 'Mastery', label: 'Mastery' }
  ];

  const earnedCount = badges.filter((b) => b.unlocked).length;
  const inProgressCount = badges.filter(
    (b) => !b.unlocked && b.current_progress > 0 && b.current_progress < b.max_progress
  ).length;
  const lockedCount = badges.filter((b) => !b.unlocked && b.current_progress === 0).length;

  const filteredBadges = badges.filter((b) => {
    // Status filter
    if (statusFilter === 'EARNED' && !b.unlocked) return false;
    if (statusFilter === 'LOCKED' && (b.unlocked || b.current_progress > 0)) return false;
    if (
      statusFilter === 'IN_PROGRESS' &&
      (b.unlocked || b.current_progress === 0 || b.current_progress >= b.max_progress)
    )
      return false;

    // Category filter
    if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;

    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              Verified Safety Achievements
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Your Safety Journey
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Every lesson learned is another step toward safer journeys. Track your genuine road
              safety competencies, official badges, and verifiable XP awards.
            </p>
          </div>

          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition self-start md:self-auto shrink-0"
            id="btn-refresh-badges"
          >
            <RotateCw className="w-3.5 h-3.5 text-teal-400" />
            Sync Progress
          </button>
        </div>

        {/* Live Progress Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-8 mt-4 border-t border-slate-800/80">
          {/* Total XP */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs text-amber-400/90 font-medium">
              <span>Total XP</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {progress?.total_xp ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {progress?.level_title ?? 'Road Safety Scout'}
            </div>
          </div>

          {/* Earned Badges */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-teal-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs text-teal-400/90 font-medium">
              <span>Badges Earned</span>
              <Award className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-teal-300 font-mono">
              {earnedCount} <span className="text-xs text-slate-500 font-normal">/ {badges.length || 15}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {Math.round(((earnedCount || 0) / (badges.length || 15)) * 100)}% Completed
            </div>
          </div>

          {/* Lessons Completed */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Lessons</span>
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {progress?.lessons_completed ?? progress?.lessons_read ?? 0}
            </div>
            <div className="text-[10px] text-slate-400">Verified Units</div>
          </div>

          {/* Quizzes Completed */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Quizzes</span>
              <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {progress?.quizzes_completed ?? 0}
            </div>
            <div className="text-[10px] text-slate-400">Knowledge Tests</div>
          </div>

          {/* Case Studies Completed */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Case Studies</span>
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {progress?.case_studies_completed ?? 0}
            </div>
            <div className="text-[10px] text-slate-400">Accident Analyses</div>
          </div>

          {/* Streak Days */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Streak</span>
              <Flame className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {progress?.streak_days ?? 1} <span className="text-xs text-slate-500 font-normal">Day</span>
            </div>
            <div className="text-[10px] text-slate-400">Consecutive Activity</div>
          </div>
        </div>
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Badges ({badges.length})
          </button>
          <button
            onClick={() => setStatusFilter('EARNED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              statusFilter === 'EARNED'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Earned ({earnedCount})
          </button>
          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setStatusFilter('LOCKED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              statusFilter === 'LOCKED'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Locked ({lockedCount})
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm">Retrieving safety credentials from server ledger...</p>
        </div>
      ) : filteredBadges.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Award className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Badges Match Selected Filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try switching filters or continue completing learning modules to unlock badges.
          </p>
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setCategoryFilter('ALL');
            }}
            className="px-4 py-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30 text-xs font-semibold"
          >
            View All Badges
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBadges.map((badge) => {
            const isEarned = badge.unlocked;
            const isInProgress = !badge.unlocked && badge.current_progress > 0;

            return (
              <div
                key={badge.id}
                className={`p-6 rounded-2xl border transition duration-300 flex flex-col justify-between space-y-5 relative overflow-hidden group ${
                  isEarned
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : isInProgress
                    ? 'bg-slate-900 border-teal-500/30'
                    : 'bg-slate-900/60 border-slate-800 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Status Indicator pill */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {badge.category}
                  </span>
                  {isEarned ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle className="w-3 h-3" />
                      UNLOCKED
                    </span>
                  ) : isInProgress ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      <TrendingUp className="w-3 h-3" />
                      IN PROGRESS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      <Lock className="w-3 h-3" />
                      LOCKED
                    </span>
                  )}
                </div>

                {/* Badge Icon and Title */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner ${
                      isEarned
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-amber-500/30 scale-105'
                        : isInProgress
                        ? 'bg-slate-800 text-teal-300 border border-teal-500/40'
                        : 'bg-slate-800/80 text-slate-500 grayscale'
                    }`}
                  >
                    {badge.icon}
                  </div>
                  <div className="space-y-1">
                    <h3
                      className={`text-base font-bold leading-tight ${
                        isEarned ? 'text-amber-200' : 'text-white'
                      }`}
                    >
                      {badge.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {/* Criteria and Progress */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-300 font-medium">
                    <span className="text-slate-500">Requirement: </span>
                    {badge.criteria}
                  </div>

                  {/* Progress bar if locked or in progress */}
                  {!isEarned && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Progress</span>
                        <span>
                          {badge.current_progress} / {badge.max_progress} ({badge.progress_percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${badge.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Date earned if unlocked */}
                  {isEarned && (
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-emerald-400 font-medium">
                        ✓ Awarded: {badge.earned_at ? new Date(badge.earned_at).toLocaleDateString() : 'Verified'}
                      </span>
                      <span className="text-amber-300 font-mono font-bold">
                        +{badge.xp_reward} XP
                      </span>
                    </div>
                  )}
                </div>

                {/* Call to action if not earned */}
                {!isEarned && onNavigateTab && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (badge.id.includes('case')) {
                          onNavigateTab('case_studies');
                        } else if (badge.id.includes('quiz') || badge.id.includes('sign')) {
                          onNavigateTab('quizzes');
                        } else if (badge.id.includes('hazard')) {
                          onNavigateTab('hazards');
                        } else if (badge.id.includes('pledge') || badge.id.includes('family')) {
                          onNavigateTab('stories');
                        } else {
                          onNavigateTab('scenarios');
                        }
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <span>Work Towards Badge</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBadgesView;
