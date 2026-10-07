import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../../types';
import { X, Play, Pause, RotateCcw, CheckCircle, Zap, Clock } from 'lucide-react';
import { getBaseXP, MAX_TIME_BONUS_XP } from '../../services/xpService';

interface ActiveTimerModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteWithTime: (task: Task, elapsedMinutes: number) => Promise<void>;
}

export const ActiveTimerModal: React.FC<ActiveTimerModalProps> = ({
  task,
  isOpen,
  onClose,
  onCompleteWithTime,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSecondsElapsed(0);
      setIsActive(true);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, task]);

  useEffect(() => {
    if (isActive && isOpen) {
      timerRef.current = window.setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isOpen]);

  if (!isOpen || !task) return null;

  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const baseXP = getBaseXP(task.difficulty);
  const bonusXP = Math.min(minutes, MAX_TIME_BONUS_XP);
  const totalProjectedXP = baseXP + bonusXP;

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const activeMinutes = Math.max(1, Math.round(secondsElapsed / 60));
      await onCompleteWithTime(task, activeMinutes);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] p-6 text-center text-white overflow-hidden">
        {/* Subtle background ambient pulse */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar with close */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Active Focus Chamber
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Title & Category */}
        <div className="mb-6 text-left bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between text-[11px] uppercase font-bold text-slate-400 mb-1">
            <span>{task.category}</span>
            <span className="text-cyan-400 font-mono">{task.difficulty} Tier</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">{task.title}</h3>
        </div>

        {/* Central Futuristic Digital Stopwatch */}
        <div className="my-6 relative flex flex-col items-center justify-center">
          <div className="w-48 h-48 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-950/80 shadow-inner relative">
            {/* Glowing active indicator ring */}
            <div className={`absolute inset-0 rounded-full border-4 border-cyan-400/80 ${isActive ? 'animate-pulse' : 'opacity-40'}`} />
            
            <div className="text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400">
              {formattedTime}
            </div>
            <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mt-1">
              {isActive ? 'Session Live' : 'Session Paused'}
            </span>
          </div>
        </div>

        {/* Real-time XP projection engine */}
        <div className="rounded-xl bg-slate-800/80 p-3.5 border border-slate-700/80 text-left mb-6 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> Base Task XP:
            </span>
            <span className="font-bold text-white">+{baseXP} XP</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Time Focus Bonus (+1/min, max 50):
            </span>
            <span className="font-bold text-cyan-400">+{bonusXP} XP</span>
          </div>
          <div className="pt-1.5 border-t border-slate-700/60 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-200">Total XP on Completion:</span>
            <span className="text-cyan-300 text-base">+{totalProjectedXP} XP</span>
          </div>
        </div>

        {/* Play / Pause / Reset Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => setSecondsElapsed(0)}
            className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsActive(!isActive)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors font-bold text-sm"
          >
            {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isActive ? 'Pause Focus' : 'Resume Focus'}</span>
          </button>
        </div>

        {/* Final Complete Button */}
        <button
          onClick={handleComplete}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-[0.98] transition-all font-bold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50"
        >
          <CheckCircle className="w-5 h-5" />
          <span>{isSubmitting ? 'Finalizing...' : `Complete Task & Claim ${totalProjectedXP} XP`}</span>
        </button>
      </div>
    </div>
  );
};
