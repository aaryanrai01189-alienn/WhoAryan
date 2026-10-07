import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { taskService } from '../services/taskService';
import { Logo } from '../components/brand/Logo';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  Flame, 
  Target, 
  Bell, 
  Clock,
  Zap
} from 'lucide-react';
import { TaskCategory } from '../types';

const GOAL_OPTIONS = [
  { id: 'Study', label: 'Academic & Deep Study', desc: 'Focus sprints, exam preparation, and research mastery' },
  { id: 'Fitness', label: 'Physical Fitness & Athletics', desc: 'Workout streaks, endurance runs, and athletic consistency' },
  { id: 'Work', label: 'Engineering & Career Velocity', desc: 'Deep work blocks, project launches, and milestone execution' },
  { id: 'Health', label: 'Health & Holistic Wellness', desc: 'Hydration, posture, meditation, and daily mental clarity' },
  { id: 'All', label: 'All-Round Apex Progress', desc: 'Balanced mastery across mind, body, and output' },
];

export const OnboardingPage: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { profile } = useAuth();
  const [step, setStep] = useState(1);

  // Selections
  const [selectedGoal, setSelectedGoal] = useState('All');
  const [dailyTarget, setDailyTarget] = useState(4);
  const [includeStarterTasks, setIncludeStarterTasks] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uid = profile?.uid || '';

  const handleFinish = async () => {
    if (!uid) return;
    setIsSubmitting(true);
    try {
      await userService.completeOnboarding(uid, {
        mainGoal: selectedGoal,
        dailyTarget,
        notificationPreferences: {
          taskReminders: true,
          streakReminders: true,
          goalReminders: true,
          levelUpNotifications: true,
          aiDailyPlanReminders: true,
        },
        theme: 'dark',
      });

      // Populate starter tasks if selected
      if (includeStarterTasks) {
        const starterList = [
          {
            title: `First ${selectedGoal === 'All' ? 'Strategic' : selectedGoal} Sprint`,
            category: (selectedGoal === 'All' ? 'Work' : selectedGoal) as TaskCategory,
            difficulty: 'Medium' as const,
            baseXP: 50,
            estimatedDuration: 30,
            notes: 'Generated during NEXORA operative onboarding',
          },
          {
            title: 'Hydration & Posture Reset',
            category: 'Health' as const,
            difficulty: 'Easy' as const,
            baseXP: 20,
            estimatedDuration: 5,
            notes: 'Quick health win to ignite your streak',
          },
        ];

        for (const t of starterList) {
          await taskService.createTask({
            ...t,
            userId: uid,
          });
        }
      }

      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      {/* Background ambient lighting */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <Logo size="md" showTagline={false} />
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
            <span>Step {step} of 3</span>
          </div>
        </div>

        {/* STEP 1: Main Focus */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-cyan-400">
                Operative Orientation
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                What is your primary focus trajectory?
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                We'll tailor your starting experience and XP multipliers to match your ambition.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {GOAL_OPTIONS.map((g) => {
                const isSelected = selectedGoal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGoal(g.id)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 border-cyan-500 ring-1 ring-cyan-500'
                        : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                        isSelected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{g.label}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{g.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 font-bold text-xs text-white shadow-md shadow-cyan-500/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Daily Target Quota */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-cyan-400">
                Momentum Calibration
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                How many tasks do you aim to conquer daily?
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Completing this target keeps your streak alive and triggers bonus multipliers.
              </p>
            </div>

            <div className="py-6 text-center bg-slate-800/40 rounded-2xl border border-slate-700/60 space-y-3">
              <div className="text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400">
                {dailyTarget}
              </div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                Missions / Day Target
              </span>

              <div className="max-w-xs mx-auto px-4">
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 font-bold text-xs text-white shadow-md shadow-cyan-500/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Final Options & Starter Pack */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-cyan-400">
                Launch Preparation
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Deploy starter tactical queue?
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                We can pre-load 2 starter missions aligned with your focus to help you earn your first 70 XP immediately.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStarterTasks}
                  onChange={(e) => setIncludeStarterTasks(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-cyan-500 rounded"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">Generate Starter Tasks</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Includes a focused {selectedGoal} task (+50 XP) and a Health task (+20 XP).
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-500 hover:brightness-110 font-bold text-xs text-white shadow-lg shadow-cyan-500/25 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Synchronizing...' : 'Enter NEXORA Platform'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Skip button always available */}
        <div className="mt-6 text-center">
          <button
            onClick={handleFinish}
            className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            Skip onboarding setup and jump straight to dashboard →
          </button>
        </div>
      </div>
    </div>
  );
};
