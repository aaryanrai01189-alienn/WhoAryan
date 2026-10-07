import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { statisticsService } from '../services/statisticsService';
import { achievementService, MASTER_BADGES } from '../services/achievementService';
import { taskService } from '../services/taskService';
import { DailyStatistic, Achievement, Task } from '../types';
import { 
  BarChart3, 
  Flame, 
  Trophy, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Award, 
  Calendar,
  Layers
} from 'lucide-react';

export const StatisticsPage: React.FC = () => {
  const { profile, levelInfo } = useAuth();
  const [stats, setStats] = useState<DailyStatistic[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(7);

  const uid = profile?.uid || '';

  useEffect(() => {
    if (!uid) return;
    statisticsService.getRecentStats(uid, timeRange).then((data) => setStats(data));
    achievementService.getUserAchievements(uid).then((data) => setAchievements(data));
    taskService.getTasks(uid).then((data) => setTasks(data));
  }, [uid, timeRange]);

  // Calculations
  const completedTasks = tasks.filter((t) => t.completed);
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  const totalFocusMinutes = tasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  // Category breakdown
  const categoryCounts: Record<string, { total: number; completed: number }> = {};
  tasks.forEach((t) => {
    const cat = t.category || 'General';
    if (!categoryCounts[cat]) categoryCounts[cat] = { total: 0, completed: 0 };
    categoryCounts[cat].total += 1;
    if (t.completed) categoryCounts[cat].completed += 1;
  });

  // Max XP in stats for chart scaling
  const maxXP = Math.max(...stats.map((s) => s.xpEarned), 100);

  const unlockedBadgeIds = new Set(achievements.map((a) => a.badgeId));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Productivity Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Telemetry on your XP acceleration, completion rates, and streak longevity.
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500 flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current" /> Total XP
          </span>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {profile?.totalXP?.toLocaleString() || 0}
          </div>
          <span className="text-[10px] text-slate-400">Level {levelInfo.level}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {completedTasks.length}
          </div>
          <span className="text-[10px] text-slate-400">{totalTasks} registered</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" /> Completion Rate
          </span>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {completionRate}%
          </div>
          <span className="text-[10px] text-slate-400">Overall ratio</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-current" /> Current Streak
          </span>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {profile?.currentStreak || 0}d
          </div>
          <span className="text-[10px] text-slate-400">Active</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-1">
            <Trophy className="w-3 h-3" /> Best Streak
          </span>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {profile?.longestStreak || 0}d
          </div>
          <span className="text-[10px] text-slate-400">All-time record</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Focused Hours
          </span>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {totalFocusHours}h
          </div>
          <span className="text-[10px] text-slate-400">{totalFocusMinutes} min total</span>
        </div>
      </div>

      {/* Main XP Velocity Activity Chart */}
      <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>XP Yield Velocity</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily accumulated experience earned through task completion and focus sprints.
            </p>
          </div>

          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            {([7, 14, 30] as (7 | 14 | 30)[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  timeRange === r
                    ? 'bg-white dark:bg-slate-900 text-cyan-500 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r} Days
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Bar Chart Canvas */}
        <div className="h-56 flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
          {stats.map((s, idx) => {
            const heightPercent = Math.max(8, Math.min(100, (s.xpEarned / maxXP) * 100));
            const dayLabel = new Date(s.date + 'T00:00:00').toLocaleDateString([], { weekday: 'narrow' });
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 z-10 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none shadow-md font-mono whitespace-nowrap border border-slate-700">
                  {s.date}: +{s.xpEarned} XP ({s.tasksCompleted} tasks)
                </div>

                {/* Bar */}
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500/30 to-cyan-400 group-hover:to-cyan-300 transition-all duration-300 shadow-sm"
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Day label */}
                <span className="text-[10px] font-mono text-slate-400">
                  {timeRange <= 7 ? dayLabel : s.date.slice(8)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Performance & Mastery */}
      <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Category Performance Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(categoryCounts).map(([cat, count]) => {
            const catRate = count.total > 0 ? Math.round((count.completed / count.total) * 100) : 0;
            return (
              <div
                key={cat}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cat}</span>
                  <span className="font-mono text-cyan-500 font-bold">{catRate}% completed</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                    style={{ width: `${catRate}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                  <span>{count.completed} Completed</span>
                  <span>{count.total} Total</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements Gallery */}
      <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              <span>Achievements & Medals</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Unlock milestones across streaks, task execution volume, and deep work sessions.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400">
            {achievements.length} / {MASTER_BADGES.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {MASTER_BADGES.map((b) => {
            const isUnlocked = unlockedBadgeIds.has(b.badgeId);
            return (
              <div
                key={b.badgeId}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  isUnlocked
                    ? 'bg-slate-50 dark:bg-slate-800/80 border-yellow-500/40 shadow-sm'
                    : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-50 grayscale'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isUnlocked
                      ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{b.title}</h5>
                    <span className="text-[10px] font-mono text-cyan-500 font-bold">+{b.xpReward} XP</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {b.description}
                  </p>
                  {isUnlocked && (
                    <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-bold mt-1 block">
                      Unlocked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
