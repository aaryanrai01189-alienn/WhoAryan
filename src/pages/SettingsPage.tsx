import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { 
  Settings, 
  Bell, 
  User, 
  Moon, 
  Sun, 
  Smartphone, 
  Shield, 
  LogOut, 
  Check, 
  Flame,
  Target,
  Bot
} from 'lucide-react';

const AVATAR_SEEDS = ['nexora_commander', 'phoenix_pilot', 'quantum_sage', 'cyber_operative', 'stellar_voyager'];

export const SettingsPage: React.FC = () => {
  const { profile, updateUserProfile, signOut, theme, setTheme } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(
    profile?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${AVATAR_SEEDS[0]}`
  );
  const [dailyTarget, setDailyTarget] = useState(profile?.dailyTarget || 4);

  // Notification states
  const notifPrefs = profile?.preferences?.notificationPreferences || {
    taskReminders: true,
    streakReminders: true,
    goalReminders: true,
    levelUpNotifications: true,
    aiDailyPlanReminders: true,
  };

  const [taskReminders, setTaskReminders] = useState(notifPrefs.taskReminders);
  const [streakReminders, setStreakReminders] = useState(notifPrefs.streakReminders);
  const [goalReminders, setGoalReminders] = useState(notifPrefs.goalReminders);
  const [levelUpNotifications, setLevelUpNotifications] = useState(notifPrefs.levelUpNotifications);
  const [aiDailyPlanReminders, setAiDailyPlanReminders] = useState(notifPrefs.aiDailyPlanReminders);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(notificationService.getDeviceToken());
  const [fcmTesting, setFcmTesting] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        avatar: selectedAvatar,
        dailyTarget: Number(dailyTarget),
        preferences: {
          ...(profile?.preferences as any),
          dailyTarget: Number(dailyTarget),
          theme,
          notificationPreferences: {
            taskReminders,
            streakReminders,
            goalReminders,
            levelUpNotifications,
            aiDailyPlanReminders,
          },
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setFcmTesting(true);
    const hasPermission = await notificationService.requestPermission();
    const token = await notificationService.registerDeviceToken();
    setDeviceToken(token);

    notificationService.sendImmediateNotification(
      'NEXORA Notification Protocol',
      'System synchronized. Push notification architecture operational!',
      'taskReminders'
    );
    setFcmTesting(false);
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          System Configuration & Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tailor your operative identity, target quotas, and notification triggers.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          <span>Configuration saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Details Card */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Operative Identity</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Display Call-Sign / Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Select Identity Avatar
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                {AVATAR_SEEDS.map((seed) => {
                  const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                  const isSelected = selectedAvatar === url;
                  return (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => setSelectedAvatar(url)}
                      className={`p-1 rounded-full border-2 transition-all ${
                        isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/30 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={seed} className="w-12 h-12 rounded-full bg-slate-800" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Daily Completed Task Target
              </label>
              <div className="flex items-center gap-3 max-w-xs">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(Number(e.target.value))}
                  className="flex-1 accent-cyan-500"
                />
                <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                  {dailyTarget} tasks / day
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>Interface Theme</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Switch between High-Contrast Cyber Dark or Pure Daylight Clean
            </p>
          </div>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:border-cyan-500 transition-colors"
          >
            Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* Notification Preferences Card */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>Notification Signals & Push Subscriptions</span>
            </h3>

            <button
              type="button"
              onClick={handleTestNotification}
              disabled={fcmTesting}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30"
            >
              {fcmTesting ? 'Testing...' : 'Test Push Signal'}
            </button>
          </div>

          <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/80">
            {/* Task reminders */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Task Reminders</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Timely pings when scheduled task deadlines approach</p>
              </div>
              <input
                type="checkbox"
                checked={taskReminders}
                onChange={(e) => setTaskReminders(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </div>

            {/* Streak reminders */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-current" /> Streak Protection
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Evening alert if your daily activity is not yet recorded</p>
              </div>
              <input
                type="checkbox"
                checked={streakReminders}
                onChange={(e) => setStreakReminders(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </div>

            {/* Goal reminders */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-indigo-400" /> Goal Milestones
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Pings for strategic deadlines and milestone progress</p>
              </div>
              <input
                type="checkbox"
                checked={goalReminders}
                onChange={(e) => setGoalReminders(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </div>

            {/* Level up notifications */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Rank Ascension Fanfare</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Celebration alerts upon leveling up or earning badges</p>
              </div>
              <input
                type="checkbox"
                checked={levelUpNotifications}
                onChange={(e) => setLevelUpNotifications(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </div>

            {/* AI Daily Plan reminders */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" /> AI Morning Tactical Brief
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Morning prompt to review and launch your daily timetable</p>
              </div>
              <input
                type="checkbox"
                checked={aiDailyPlanReminders}
                onChange={(e) => setAiDailyPlanReminders(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </div>
          </div>
        </div>

        {/* Future Android / FCM Architecture Ready Status */}
        <div className="rounded-2xl p-5 bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/25 text-white space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Smartphone className="w-4 h-4" />
            <span>Android / FCM Bridge Synchronization Status</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            NEXORA uses a decoupled architecture. The notification service and business logic are fully abstracted so when deployed inside an Android WebView or native container, Firebase Cloud Messaging tokens bind without rewriting core tasks.
          </p>
          {deviceToken && (
            <div className="mt-2 text-[10px] font-mono text-cyan-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800 break-all">
              Token: {deviceToken}
            </div>
          )}
        </div>

        {/* Submit Save Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
