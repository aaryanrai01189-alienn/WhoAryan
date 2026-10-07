import React from 'react';
import { LevelInfo } from '../../types';
import { Zap } from 'lucide-react';

interface XPBarProps {
  levelInfo: LevelInfo;
  className?: string;
  showDetails?: boolean;
}

export const XPBar: React.FC<XPBarProps> = ({
  levelInfo,
  className = '',
  showDetails = true,
}) => {
  const currentIntoLevel = levelInfo.totalXP - levelInfo.currentLevelXP;
  const levelSpan = levelInfo.nextLevelXP - levelInfo.currentLevelXP;

  return (
    <div className={`w-full ${className}`}>
      {showDetails && (
        <div className="flex items-center justify-between mb-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-cyan-500 dark:text-cyan-400">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="uppercase tracking-wider">Level {levelInfo.level} • {levelInfo.title}</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 font-mono">
            <span className="text-slate-900 dark:text-white font-bold">{currentIntoLevel.toLocaleString()}</span> /{' '}
            {levelSpan.toLocaleString()} XP ({levelInfo.progressPercent}%)
          </div>
        </div>
      )}

      {/* Futuristic glowing track container */}
      <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700/60 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(6,182,212,0.4)] relative"
          style={{ width: `${Math.max(3, Math.min(100, levelInfo.progressPercent))}%` }}
        >
          {/* Subtle animated scan light */}
          <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/60 rounded-full blur-[1px] animate-pulse" />
        </div>
      </div>

      {showDetails && (
        <div className="flex justify-between mt-1 text-[10px] text-slate-400 dark:text-slate-400 font-mono">
          <span>{levelInfo.totalXP.toLocaleString()} Total XP</span>
          <span>{levelInfo.xpToNextLevel.toLocaleString()} XP to Level {levelInfo.level + 1}</span>
        </div>
      )}
    </div>
  );
};
