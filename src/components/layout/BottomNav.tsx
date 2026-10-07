import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Target, 
  Bot, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import { NavSection } from './Sidebar';

interface BottomNavProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentSection, onSelectSection }) => {
  const navItems: { id: NavSection; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'ai', label: 'AI Coach', icon: Bot },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'settings', label: 'Profile', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-2 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-cyan-500 dark:text-cyan-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
