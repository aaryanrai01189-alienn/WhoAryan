import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Task, TaskCategory, TaskDifficulty } from '../types';
import { taskService } from '../services/taskService';
import { statisticsService } from '../services/statisticsService';
import { achievementService } from '../services/achievementService';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskModal } from '../components/tasks/TaskModal';
import { ActiveTimerModal } from '../components/tasks/ActiveTimerModal';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  ListFilter, 
  Sparkles,
  Zap
} from 'lucide-react';

const CATEGORIES: ('All' | TaskCategory)[] = ['All', 'Work', 'Study', 'Fitness', 'Health', 'Sleep', 'Personal'];
const DIFFICULTIES: ('All' | TaskDifficulty)[] = ['All', 'Easy', 'Medium', 'Hard', 'Epic'];

export const TasksPage: React.FC = () => {
  const { profile, triggerLevelUpCheck, triggerBadgeUnlock } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [selectedCategory, setSelectedCategory] = useState<'All' | TaskCategory>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | TaskDifficulty>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTimerTask, setActiveTimerTask] = useState<Task | null>(null);

  const uid = profile?.uid || '';

  useEffect(() => {
    if (!uid) return;
    const unsub = taskService.subscribeTasks(uid, (list) => setTasks(list));
    return () => unsub();
  }, [uid]);

  const handleToggleComplete = async (task: Task) => {
    if (!profile) return;
    const oldXP = profile.totalXP;

    const result = await taskService.toggleTaskCompletion(uid, task);

    if (result.isFirstCompletion && result.newlyEarnedXP > 0) {
      const { updatedProfile } = await statisticsService.recordActivity(
        uid,
        profile,
        result.newlyEarnedXP,
        true,
        task.actualDuration || 0
      );

      triggerLevelUpCheck(oldXP, updatedProfile.totalXP);

      // Check achievements
      const completedTasksCount = tasks.filter((t) => t.completed).length + 1;
      const achievements = await achievementService.getUserAchievements(uid);
      const newlyUnlocked = await achievementService.evaluateAndUnlock(
        uid,
        updatedProfile,
        completedTasksCount,
        0,
        achievements
      );

      newlyUnlocked.forEach((b) => triggerBadgeUnlock(b));
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

      if (elapsedMinutes >= 25) {
        const diverBadge = await achievementService.unlockSpecificBadge(uid, 'deep_focus');
        if (diverBadge) triggerBadgeUnlock(diverBadge);
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

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    const matchesTab = activeTab === 'pending' ? !t.completed : t.completed;
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || t.difficulty === selectedDifficulty;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesCategory && matchesDifficulty && matchesSearch;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Task Matrix
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Execute objectives, track active focus sessions, and collect verified XP.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] font-bold text-xs sm:text-sm text-white shadow-md shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy New Task</span>
        </button>
      </div>

      {/* Control Bar: Search & Status Tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Active vs Completed Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Active Queue</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/10 text-cyan-500 font-mono">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Completed</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 font-mono">
              {completedCount}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search objectives, keywords, tags..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Category & Difficulty Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-semibold flex-shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-cyan-400" /> Difficulty:
          </span>
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1 rounded-lg font-semibold flex-shrink-0 transition-all ${
                selectedDifficulty === diff
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Task List Render */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl p-12 text-center bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
          <Sparkles className="w-10 h-10 text-cyan-500/50 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No matching tasks located
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {activeTab === 'pending'
              ? 'Your queue is clear. Create a new task or adjust your search filters.'
              : 'No completed tasks found matching your filters.'}
          </p>
          {activeTab === 'pending' && (
            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
            >
              Deploy Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
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
