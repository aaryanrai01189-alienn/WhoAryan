import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Zap, X } from 'lucide-react';
import { Achievement } from '../../types';

interface AchievementToastProps {
  badge: Achievement | null;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ badge, onClose }) => {
  useEffect(() => {
    if (badge) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [badge, onClose]);

  if (!badge) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl bg-slate-900/95 p-4 text-white border border-yellow-500/40 shadow-[0_0_25px_rgba(234,179,8,0.25)] backdrop-blur-md max-w-sm"
      >
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 text-slate-950 font-bold shadow-md shadow-yellow-500/30">
          <Award className="h-6 w-6 text-slate-950" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-yellow-400">
            <span>Badge Unlocked!</span>
            <span className="flex items-center gap-0.5 text-cyan-400 font-mono">
              <Zap className="h-3 w-3 fill-current" /> +{badge.xpReward} XP
            </span>
          </div>
          <h4 className="text-sm font-bold text-white truncate">{badge.title}</h4>
          <p className="text-xs text-slate-300 truncate">{badge.description}</p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
