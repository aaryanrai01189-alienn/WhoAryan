import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Goal, TaskCategory, AIGoalMilestone } from '../types';
import { goalService } from '../services/goalService';
import { taskService } from '../services/taskService';
import { aiService } from '../services/aiService';
import { 
  Target, 
  Plus, 
  Bot, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Trash2, 
  Edit3, 
  X,
  Zap,
  ArrowRight
} from 'lucide-react';
import { ProgressRing } from '../components/common/ProgressRing';

export const GoalsPage: React.FC = () => {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // AI Breakdown states
  const [breakdownGoalTarget, setBreakdownGoalTarget] = useState<Goal | null>(null);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [breakdownResults, setBreakdownResults] = useState<{
    overview: string;
    milestones: AIGoalMilestone[];
  } | null>(null);
  const [isAddingTasks, setIsAddingTasks] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory | string>('Work');
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);

  const uid = profile?.uid || '';

  useEffect(() => {
    if (!uid) return;
    const unsub = goalService.subscribeGoals(uid, (list) => setGoals(list));
    return () => unsub();
  }, [uid]);

  const openCreateModal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setCategory('Work');
    setDeadline('');
    setProgress(0);
    setIsGoalModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setCategory(goal.category);
    setDeadline(goal.deadline || '');
    setProgress(goal.progress);
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !uid) return;

    if (editingGoal) {
      await goalService.updateGoal(uid, editingGoal.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        deadline: deadline || undefined,
        progress: Number(progress),
        status: Number(progress) >= 100 ? 'completed' : 'in_progress',
      });
    } else {
      await goalService.createGoal({
        userId: uid,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        deadline: deadline || undefined,
        progress: Number(progress),
        status: Number(progress) >= 100 ? 'completed' : 'in_progress',
      });
    }
    setIsGoalModalOpen(false);
  };

  const handleDeleteGoal = async (goalId: string) => {
    await goalService.deleteGoal(uid, goalId);
  };

  // Trigger AI Breakdown
  const handleStartBreakdown = async (goal: Goal) => {
    setBreakdownGoalTarget(goal);
    setIsBreakingDown(true);
    setBreakdownResults(null);
    setAddedSuccess(false);

    try {
      const resp = await aiService.breakdownGoal({
        goalTitle: goal.title,
        goalDescription: goal.description,
        deadline: goal.deadline,
      });

      setBreakdownResults({
        overview: resp.strategyOverview,
        milestones: resp.milestones,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsBreakingDown(false);
    }
  };

  // Add all AI generated milestone tasks to user's Task Queue
  const handleConfirmAddTasks = async () => {
    if (!breakdownResults || !uid || !breakdownGoalTarget) return;
    setIsAddingTasks(true);
    try {
      for (const m of breakdownResults.milestones) {
        await taskService.createTask({
          userId: uid,
          title: m.title,
          notes: m.description,
          category: (m.category || breakdownGoalTarget.category || 'Work') as TaskCategory,
          difficulty: m.difficulty,
          baseXP: m.xpReward || 50,
          estimatedDuration: m.estimatedDuration || 30,
        });
      }
      setAddedSuccess(true);
      setTimeout(() => {
        setBreakdownGoalTarget(null);
        setBreakdownResults(null);
        setAddedSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to add tasks:', err);
    } finally {
      setIsAddingTasks(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Strategic Goals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            High-horizon objectives broken down into actionable tactical milestones.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] font-bold text-xs sm:text-sm text-white shadow-md shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Strategic Goal</span>
        </button>
      </div>

      {/* Goals List Grid */}
      {goals.length === 0 ? (
        <div className="rounded-2xl p-12 text-center bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
          <Target className="w-10 h-10 text-cyan-500/50 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No active strategic goals established
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Setting macro goals provides a target trajectory. Use our AI Coach to automatically decompose them into tasks.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
          >
            Create First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-cyan-500/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30">
                      {goal.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2 leading-tight">
                      {goal.title}
                    </h3>
                  </div>

                  <ProgressRing progress={goal.progress} size={54} strokeWidth={4.5}>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {goal.progress}%
                    </span>
                  </ProgressRing>
                </div>

                {goal.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {goal.description}
                  </p>
                )}

                {goal.deadline && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs font-mono text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Target: {goal.deadline}</span>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {/* AI Breakdown Button */}
                <button
                  onClick={() => handleStartBreakdown(goal)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>AI Breakdown</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(goal)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Goal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goal Create/Edit Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                <span>{editingGoal ? 'Edit Strategic Goal' : 'Define Strategic Goal'}</span>
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Publish Research Paper or Run Marathon"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Description / Success Criteria
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why this matters and how success is measured..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {['Work', 'Study', 'Fitness', 'Health', 'Personal'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">
                  <span>Current Progress</span>
                  <span className="font-mono text-cyan-500">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110"
                >
                  {editingGoal ? 'Update Goal' : 'Establish Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Breakdown Review Modal */}
      {breakdownGoalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl p-6 text-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  AI Tactical Milestone Breakdown
                </h3>
              </div>
              <button
                onClick={() => setBreakdownGoalTarget(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isBreakingDown ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-mono">
                  Gemini analyzing strategic objective: "{breakdownGoalTarget.title}"...
                </p>
              </div>
            ) : breakdownResults ? (
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
                  <span className="font-bold text-cyan-400 uppercase tracking-wider block mb-1">Execution Strategy:</span>
                  {breakdownResults.overview}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Proposed Sub-tasks ({breakdownResults.milestones.length})
                  </h4>
                  {breakdownResults.milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                        {m.order || idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="text-xs font-bold text-white truncate">{m.title}</h5>
                          <span className="text-[10px] font-mono text-cyan-400">+{m.xpReward || 50} XP</span>
                        </div>
                        {m.description && (
                          <p className="text-[11px] text-slate-400 leading-snug">{m.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {addedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center">
                    All tasks successfully added to your Tactical Queue!
                  </div>
                )}
              </div>
            ) : null}

            {/* Footer with strict user confirmation buttons */}
            {breakdownResults && (
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBreakdownGoalTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddTasks}
                  disabled={isAddingTasks || addedSuccess}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] shadow-md shadow-cyan-500/20 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAddingTasks ? 'Deploying...' : 'Add All Tasks to Queue'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
