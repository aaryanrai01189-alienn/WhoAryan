import React, { useState, useEffect } from 'react';
import { Task, TaskCategory, TaskDifficulty, RecurringOption } from '../../types';
import { X, Zap, Clock, Tag, RotateCcw, Calendar } from 'lucide-react';
import { DIFFICULTY_BASE_XP } from '../../services/xpService';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    notes?: string;
    category: TaskCategory | string;
    difficulty: TaskDifficulty;
    baseXP: number;
    estimatedDuration?: number;
    dueDate?: string;
    recurring?: RecurringOption;
  }) => Promise<void>;
  initialTask?: Task | null;
}

const CATEGORIES: TaskCategory[] = ['Work', 'Study', 'Fitness', 'Health', 'Sleep', 'Personal', 'Custom'];
const DIFFICULTIES: { level: TaskDifficulty; xp: number; desc: string }[] = [
  { level: 'Easy', xp: 20, desc: 'Quick win (under 15 mins)' },
  { level: 'Medium', xp: 50, desc: 'Standard focus (15-45 mins)' },
  { level: 'Hard', xp: 100, desc: 'Challenging milestone (45-90 mins)' },
  { level: 'Epic', xp: 200, desc: 'High cognitive intensity (90+ mins)' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<TaskCategory | string>('Work');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('Medium');
  const [estimatedDuration, setEstimatedDuration] = useState<number>(30);
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState<RecurringOption>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setNotes(initialTask.notes || '');
      setCategory(initialTask.category);
      setDifficulty(initialTask.difficulty);
      setEstimatedDuration(initialTask.estimatedDuration || 30);
      setDueDate(initialTask.dueDate || '');
      setRecurring(initialTask.recurring || 'none');
    } else {
      setTitle('');
      setNotes('');
      setCategory('Work');
      setDifficulty('Medium');
      setEstimatedDuration(30);
      setDueDate('');
      setRecurring('none');
    }
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        notes: notes.trim() || undefined,
        category,
        difficulty,
        baseXP: DIFFICULTY_BASE_XP[difficulty],
        estimatedDuration: Number(estimatedDuration) || undefined,
        dueDate: dueDate || undefined,
        recurring,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-500" />
            <span>{initialTask ? 'Edit Tactical Task' : 'Deploy New Task'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Task Objective *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete chapter 4 analysis or 5km morning run"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    category === cat
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-cyan-500/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty & XP Matrix */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-500" /> Difficulty Tier & XP Yield
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.level}
                  type="button"
                  onClick={() => setDifficulty(d.level)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    difficulty === d.level
                      ? 'bg-gradient-to-br from-cyan-500/10 to-indigo-500/15 border-cyan-500 ring-1 ring-cyan-500'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{d.level}</span>
                    <span className="font-mono text-xs font-bold text-cyan-500">+{d.xp} XP</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Est. Duration (Mins)
              </label>
              <input
                type="number"
                min="5"
                max="480"
                step="5"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-mono"
              />
            </div>
          </div>

          {/* Recurrence Option */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Recurrence Cycle
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['none', 'daily', 'weekdays', 'weekly'] as RecurringOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRecurring(opt)}
                  className={`py-2 px-2 text-center rounded-lg text-xs font-semibold capitalize border transition-all ${
                    recurring === opt
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/40'
                  }`}
                >
                  {opt === 'none' ? 'One-time' : opt}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Strategic Notes / Sub-steps
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key deliverables, context, or links..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Deploying...' : initialTask ? 'Update Task' : 'Deploy Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
