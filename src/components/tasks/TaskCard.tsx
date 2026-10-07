import React from 'react';
import { Task } from '../../types';
import { Check, Clock, Play, Trash2, Edit2, Zap, RotateCcw } from 'lucide-react';
import { getBaseXP } from '../../services/xpService';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onStartTimer: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Easy: { bg: 'bg-emerald-500/10', text: 'text-emerald-500 dark:text-emerald-400', border: 'border-emerald-500/30' },
  Medium: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30' },
  Hard: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  Epic: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-500/30' },
};

const CATEGORY_COLORS: Record<string, string> = {
  Study: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  Fitness: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
  Work: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
  Sleep: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
  Health: 'bg-teal-500/10 text-teal-500 border-teal-500/30',
  Personal: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onStartTimer,
  onEdit,
  onDelete,
}) => {
  const diffStyle = DIFFICULTY_COLORS[task.difficulty] || DIFFICULTY_COLORS.Medium;
  const catStyle = CATEGORY_COLORS[task.category] || 'bg-slate-500/10 text-slate-500 border-slate-500/30';
  const xpReward = task.earnedXP || getBaseXP(task.difficulty);

  return (
    <div
      className={`group relative flex items-start gap-3.5 p-4 rounded-xl transition-all border ${
        task.completed
          ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-60 hover:opacity-100'
          : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 hover:border-cyan-500/50 hover:shadow-lg dark:hover:shadow-cyan-500/5'
      }`}
    >
      {/* Checkbox button */}
      <button
        onClick={() => onToggleComplete(task)}
        aria-label={task.completed ? 'Mark incomplete' : 'Complete task'}
        className={`mt-1 flex-shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
          task.completed
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
            : 'border-slate-300 dark:border-slate-700 hover:border-cyan-500 hover:bg-cyan-500/10'
        }`}
      >
        {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
      </button>

      {/* Main task content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {/* Category Chip */}
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${catStyle}`}>
            {task.category}
          </span>

          {/* Difficulty & XP reward */}
          <span className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border}`}>
            <Zap className="w-2.5 h-2.5 fill-current" />
            <span>{task.difficulty}</span>
            <span className="font-mono">+{xpReward} XP</span>
          </span>

          {/* Estimated or Actual Duration */}
          {task.estimatedDuration && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{task.estimatedDuration}m</span>
            </span>
          )}

          {/* Recurring indicator */}
          {task.recurring && task.recurring !== 'none' && (
            <span className="flex items-center gap-0.5 text-[10px] text-indigo-400 font-mono">
              <RotateCcw className="w-2.5 h-2.5" />
              <span className="capitalize">{task.recurring}</span>
            </span>
          )}
        </div>

        <h4 className={`text-sm font-semibold tracking-tight leading-snug ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
          {task.title}
        </h4>

        {task.notes && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {task.notes}
          </p>
        )}

        {task.actualDuration && task.actualDuration > 0 && (
          <div className="mt-1 text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
            ⏱ Focused active time: {task.actualDuration} min
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!task.completed && (
          <button
            onClick={() => onStartTimer(task)}
            title="Start focused timer for bonus XP"
            className="p-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        )}
        <button
          onClick={() => onEdit(task)}
          title="Edit Task"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          title="Delete Task"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
