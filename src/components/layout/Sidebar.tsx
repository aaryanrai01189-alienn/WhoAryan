import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Target, 
  Bot, 
  BarChart3, 
  Settings, 
  LogOut,
  Flame,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavSection = 'dashboard' | 'tasks' | 'goals' | 'ai' | 'stats' | 'settings';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSelectSection }) => {
  const { signOut, profile } = useAuth();

  const navItems: { id: NavSection; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks & Timer', icon: CheckSquare },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'ai', label: 'AI Coach & Plan', icon: Bot },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 transition-colors min-h-[calc(100vh-61px)]">
      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.id === 'ai' && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-500 dark:text-cyan-300 font-bold uppercase tracking-wider">
                  Gemini
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Motivational Quick Banner */}
      <div className="my-4 rounded-xl p-3 bg-gradient-to-br from-cyan-950/40 via-indigo-950/40 to-slate-900/60 border border-cyan-500/20 text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
          <Flame className="w-4 h-4 fill-current text-orange-400" />
          <span>Active Streak</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          {profile?.currentStreak
            ? `${profile.currentStreak}-day streak rolling! Maintain momentum to maximize XP multipliers.`
            : 'Complete your first task today to ignite your streak!'}
        </p>
      </div>

      {/* Logout button */}
      <button
        onClick={() => signOut()}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors w-full"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    </aside>
  );
};
