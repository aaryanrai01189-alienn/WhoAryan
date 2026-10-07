import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../brand/Logo';
import { Sun, Moon, Zap, Flame, Bell } from 'lucide-react';

interface NavbarProps {
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { profile, levelInfo, theme, setTheme, isDemo } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Brand Logo */}
        <Logo size="md" showTagline={false} />

        {/* Center/Right: Gamified Status Chips & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Streak Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold font-mono shadow-sm">
            <Flame className="w-4 h-4 fill-current animate-bounce" />
            <span>{profile?.currentStreak || 0} D</span>
          </div>

          {/* Level & XP Chip */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold">
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-500 fill-current" />
              <span className="font-bold">Lv. {levelInfo.level}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">{levelInfo.totalXP.toLocaleString()} XP</span>
          </div>

          {/* Demo Indicator badge if applicable */}
          {isDemo && (
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-violet-500/15 text-violet-400 border border-violet-500/30">
              Demo Operative
            </span>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Avatar */}
          <div className="relative flex items-center gap-2">
            <img
              src={profile?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.uid || 'nexora'}`}
              alt={profile?.displayName || 'User'}
              className="w-8 h-8 rounded-full border border-cyan-500/40 bg-slate-800 object-cover"
            />
            <span className="hidden lg:inline text-xs font-semibold text-slate-800 dark:text-slate-200">
              {profile?.displayName || 'Operative'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
