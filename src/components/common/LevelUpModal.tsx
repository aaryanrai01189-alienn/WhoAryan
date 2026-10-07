import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Zap, ChevronRight, Award } from 'lucide-react';
import { LevelInfo } from '../../types';

interface LevelUpModalProps {
  notice: { oldLevel: number; newLevel: number; info: LevelInfo } | null;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ notice, onClose }) => {
  if (!notice) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-8 text-center text-white border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.35)]"
        >
          {/* Radial ambient glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Floating Trophy / Badge */}
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-500 p-0.5 shadow-lg shadow-cyan-500/30"
          >
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
              <Trophy className="h-12 w-12 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-400 border border-cyan-500/30">
              Ascension Synchronized
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              LEVEL UP!
            </h2>
            <div className="mt-2 flex items-center justify-center gap-3 font-mono text-lg font-bold">
              <span className="text-slate-400 line-through">Lv. {notice.oldLevel}</span>
              <ChevronRight className="h-5 w-5 text-cyan-400" />
              <span className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 font-extrabold">
                Level {notice.newLevel}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-300">
              Rank Title: <span className="text-cyan-300 font-semibold">{notice.info.title}</span>
            </p>
          </motion.div>

          {/* Milestone stats card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 rounded-xl bg-slate-800/60 p-4 border border-slate-700/50 backdrop-blur-sm text-left text-xs text-slate-300 space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Zap className="h-4 w-4 text-cyan-400" /> Total XP Vault
              </span>
              <span className="font-mono font-bold text-white">
                {notice.info.totalXP.toLocaleString()} XP
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Award className="h-4 w-4 text-fuchsia-400" /> Next Tier Goal
              </span>
              <span className="font-mono font-bold text-white">
                Level {notice.newLevel + 1} ({notice.info.nextLevelXP.toLocaleString()} XP)
              </span>
            </div>
          </motion.div>

          {/* Dismiss button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-500 py-3.5 px-6 font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Claim & Continue Progress
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
