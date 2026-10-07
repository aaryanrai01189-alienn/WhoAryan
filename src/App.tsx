import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { LevelUpModal } from './components/common/LevelUpModal';
import { AchievementToast } from './components/common/AchievementToast';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { GoalsPage } from './pages/GoalsPage';
import { AICoachPage } from './pages/AICoachPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { Logo } from './components/brand/Logo';

const MainApp: React.FC = () => {
  const { 
    user, 
    profile, 
    isDemo, 
    loading, 
    levelUpNotice, 
    closeLevelUpNotice, 
    recentUnlockedBadge, 
    closeBadgeNotice,
    refreshProfile
  } = useAuth();

  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" showTagline={true} />
          <div className="flex items-center gap-2 mt-4 font-mono text-xs text-cyan-400">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>INITIALIZING NEXORA PROTOCOL...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user && !isDemo) {
    return <AuthPage />;
  }

  // First time onboarding check
  if (profile && !profile.onboardingCompleted) {
    return <OnboardingPage onComplete={() => refreshProfile()} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Structure: Sidebar + Content Area */}
      <div className="flex max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar currentSection={currentSection} onSelectSection={setCurrentSection} />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-24 md:pb-12">
          {currentSection === 'dashboard' && <DashboardPage onNavigate={setCurrentSection} />}
          {currentSection === 'tasks' && <TasksPage />}
          {currentSection === 'goals' && <GoalsPage />}
          {currentSection === 'ai' && <AICoachPage />}
          {currentSection === 'stats' && <StatisticsPage />}
          {currentSection === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentSection={currentSection} onSelectSection={setCurrentSection} />

      {/* Global Modals & Notifications */}
      <LevelUpModal notice={levelUpNotice} onClose={closeLevelUpNotice} />
      <AchievementToast badge={recentUnlockedBadge} onClose={closeBadgeNotice} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
