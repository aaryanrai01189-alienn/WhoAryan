import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Task, Goal, Achievement } from '../types';
import { taskService } from '../services/taskService';
import { goalService } from '../services/goalService';
import { achievementService } from '../services/achievementService';
import { statisticsService } from '../services/statisticsService';
import { XPBar } from '../components/common/XPBar';
import { ProgressRing } from '../components/common/ProgressRing';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskModal } from '../components/tasks/TaskModal';
import { ActiveTimerModal } from '../components/tasks/ActiveTimerModal';
import { 
  Plus, 
  Flame, 
  Bot, 
  Target, 
  CheckCircle2, 
  ArrowRight, 
  Award,
  Sparkles,
  Trophy
} from 'lucide-react';
import { NavSection } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (section: NavSection) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { 
    profile, 
    levelInfo, 
    updateUserProfile, 
    triggerLevelUpCheck, 
    triggerBadgeUnlock 
  } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTimerTask, setActiveTimerTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const uid = profile?.uid || '';

  useEffect(() => {
    if (!uid) return;

    const unsubTasks = taskService.subscribeTasks(uid, (list) => setTasks(list));
    const unsubGoals = goalService.subscribeGoals(uid, (list) => setGoals(list));

    achievementService.getUserAchievements(uid).then((list) => setAchievements(list));

    return () => {
      unsubTasks();
      unsubGoals();
    };
  }, [uid]);

  // Handle task completion with anti-farming XP & streak update
  const handleToggleComplete = async (task: Task) => {
    if (!profile) return;
    const oldXP = profile.totalXP;

    const result = await taskService.toggleTaskCompletion(uid, task);

    if (result.isFirstCompletion && result.newlyEarnedXP > 0) {
      // Record activity, update streak with timezone safety
      const { updatedProfile, motivationalMessage } = await statisticsService.recordActivity(
        uid,
        profile,
        result.newlyEarnedXP,
        true,
        task.actualDuration || 0
      );

      // Check level-up
      triggerLevelUpCheck(oldXP, updatedProfile.totalXP);

      // Check achievements
      const completedTasksCount = tasks.filter((t) => t.completed).length + 1;
      const completedGoalsCount = goals.filter((g) => g.status === 'completed').length;
      const newlyUnlocked = await achievementService.evaluateAndUnlock(
        uid,
        updatedProfile,
        completedTasksCount,
        completedGoalsCount,
        achievements
      );

      newlyUnlocked.forEach((badge) => {
        triggerBadgeUnlock(badge);
        setAchievements((prev) => [...prev, badge]);
      });
    }
  };

  const handleCompleteWithTimer = async (task: Task, elapsedMinutes: number) => {
    if (!profile) return;
    const oldXP = profile.totalXP;

    const result = await taskService.toggleTaskCompletion(uid, task, elapsedMinutes);

    if (result.isFirstCompletion && result.newlyEarnedXP > 0) {
      const { updatedProfile } = await statisticsService.recordActivity(
        uid,
        profile,
        result.newlyEarnedXP,
        true,
        elapsedMinutes
      );

      triggerLevelUpCheck(oldXP, updatedProfile.totalXP);

      // Deep diver badge check if focused 25+ min
      if (elapsedMinutes >= 25) {
        const diverBadge = await achievementService.unlockSpecificBadge(uid, 'deep_focus');
        if (diverBadge) {
          triggerBadgeUnlock(diverBadge);
          setAchievements((prev) => [...prev, diverBadge]);
        }
      }
    }
  };

  const handleSaveTask = async (taskData: any) => {
    if (editingTask) {
      await taskService.updateTask(uid, editingTask.id, taskData);
      setEditingTask(null);
    } else {
      await taskService.createTask({
        ...taskData,
        userId: uid,
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await taskService.deleteTask(uid, taskId);
  };

  // Metrics
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTodayTasks = tasks.filter((t) => t.completed);
  const dailyTarget = profile?.dailyTarget || 4;
  const todayProgressPercent = Math.min(100, Math.round((completedTodayTasks.length / dailyTarget) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
              {profile?.displayName || 'Operative'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Turn your time into progress. Level up your focus today.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('ai')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:brightness-110 font-bold text-xs sm:text-sm transition-all shadow-sm"
          >
            <Bot className="w-4 h-4 text-cyan-500" />
            <span>Generate My Day</span>
          </button>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] font-bold text-xs sm:text-sm text-white shadow-md shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Hero Progression Matrix: 3 Column Gamified Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Level & XP Vault */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-600 dark:text-cyan-400">
                Rank Progression
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Level {levelInfo.level}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {levelInfo.title}
              </p>
            </div>
            <ProgressRing progress={levelInfo.progressPercent} size={64} strokeWidth={5}>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {levelInfo.progressPercent}%
              </span>
            </ProgressRing>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <XPBar levelInfo={levelInfo} showDetails={false} />
            <div className="flex justify-between items-center mt-2 text-[11px] font-mono text-slate-400">
              <span>{levelInfo.totalXP.toLocaleString()} XP Total</span>
              <span className="text-cyan-500 font-semibold">{levelInfo.xpToNextLevel.toLocaleString()} to Lv.{levelInfo.level + 1}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Streak & Daily Momentum */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-slate-900/40 border border-orange-500/25 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current animate-pulse" /> Active Streak
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {profile?.currentStreak || 0} <span className="text-base font-normal text-slate-400">Days</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Personal Record: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{profile?.longestStreak || 0} days</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-sm">
              <Flame className="w-7 h-7 fill-current" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-orange-500/15 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>Daily target: {dailyTarget} tasks</span>
            <span className="font-bold text-orange-500">
              {completedTodayTasks.length >= dailyTarget ? 'Target Achieved! 🔥' : `${dailyTarget - completedTodayTasks.length} remaining`}
            </span>
          </div>
        </div>

        {/* Card 3: Today's Target Progress */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 dark:text-indigo-400">
                Daily Execution
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {completedTodayTasks.length} / {dailyTarget} Completed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {todayProgressPercent}% of daily quota fulfilled
              </p>
            </div>
            <ProgressRing progress={todayProgressPercent} size={64} strokeWidth={5} colorGradientId="ring-emerald">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </ProgressRing>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">{pendingTasks.length} pending missions</span>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-cyan-500 font-bold hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Tasks (Left 2 cols) & Goals / Badges (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Priority Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tactical Queue</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {pendingTasks.length}
              </span>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-cyan-500 hover:text-cyan-400 flex items-center gap-1"
            >
              <span>Full Task Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
              <Sparkles className="w-10 h-10 text-cyan-500/60 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                All objectives completed!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Great job maintaining velocity. Deploy a new task or generate your tactical daily plan with AI.
              </p>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
              >
                Deploy Task
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingTasks.slice(0, 5).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onStartTimer={(t) => setActiveTimerTask(t)}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setIsTaskModalOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}

          {/* AI Coach Quick Recommendation Banner */}
          <div className="rounded-2xl p-4 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-indigo-950/30 border border-cyan-500/25 flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex-shrink-0 mt-0.5">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs uppercase tracking-wider font-bold text-cyan-400">
                AI Coach Strategic Tip
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                "Start with your hardest difficulty task during your first 90 minutes. High cognitive stamina yields +100 XP with lower friction."
              </p>
            </div>
            <button
              onClick={() => onNavigate('ai')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 whitespace-nowrap transition-colors"
            >
              Ask Coach
            </button>
          </div>
        </div>

        {/* Right Column: Strategic Goals & Unlocked Badges */}
        <div className="space-y-6">
          {/* Strategic Goals Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Goals</h3>
              </div>
              <button
                onClick={() => onNavigate('goals')}
                className="text-xs font-semibold text-cyan-500 hover:text-cyan-400"
              >
                Manage
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="rounded-xl p-4 text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                No active strategic goals set yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {goals.slice(0, 3).map((goal) => (
                  <div
                    key={goal.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-900 dark:text-white truncate">{goal.title}</span>
                      <span className="font-mono text-cyan-500 font-semibold">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Achievements */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Achievements</h3>
              </div>
              <button
                onClick={() => onNavigate('stats')}
                className="text-xs font-semibold text-cyan-500 hover:text-cyan-400"
              >
                View all ({achievements.length})
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {achievements.slice(0, 4).map((badge) => (
                <div
                  key={badge.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 flex-shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{badge.title}</h5>
                    <span className="text-[10px] font-mono text-cyan-400">+{badge.xpReward} XP</span>
                  </div>
                </div>
              ))}
              {achievements.length === 0 && (
                <div className="col-span-2 rounded-xl p-4 text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  Complete tasks to unlock your first badge!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
      />

      <ActiveTimerModal
        task={activeTimerTask}
        isOpen={!!activeTimerTask}
        onClose={() => setActiveTimerTask(null)}
        onCompleteWithTime={handleCompleteWithTimer}
      />
    </div>
  );
};
