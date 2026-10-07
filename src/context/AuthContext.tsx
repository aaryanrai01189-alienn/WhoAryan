import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { UserProfile, LevelInfo, Achievement } from '../types';
import { calculateLevel } from '../services/xpService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  levelInfo: LevelInfo;
  isDemo: boolean;
  loading: boolean;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  levelUpNotice: { oldLevel: number; newLevel: number; info: LevelInfo } | null;
  closeLevelUpNotice: () => void;
  recentUnlockedBadge: Achievement | null;
  closeBadgeNotice: () => void;
  triggerLevelUpCheck: (previousXP: number, newXP: number) => void;
  triggerBadgeUnlock: (badge: Achievement) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [levelUpNotice, setLevelUpNotice] = useState<{ oldLevel: number; newLevel: number; info: LevelInfo } | null>(null);
  const [recentUnlockedBadge, setRecentUnlockedBadge] = useState<Achievement | null>(null);

  useEffect(() => {
    // Check saved theme
    const savedTheme = localStorage.getItem('nexora_theme') as 'dark' | 'light';
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    const unsub = authService.subscribeAuthState(({ user, profile, isDemo }) => {
      setUser(user);
      setProfile(profile);
      setIsDemo(isDemo);
      setLoading(false);

      if (profile?.preferences?.theme) {
        setThemeState(profile.preferences.theme);
        document.documentElement.classList.toggle('dark', profile.preferences.theme === 'dark');
      }
    });

    return () => unsub();
  }, []);

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    localStorage.setItem('nexora_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    if (profile) {
      userService.updateProfile(profile.uid, {
        preferences: {
          ...(profile.preferences as any),
          theme: newTheme,
        },
      });
    }
  };

  const refreshProfile = async () => {
    if (!profile) return;
    const fresh = await userService.getUserProfile(profile.uid);
    if (fresh) setProfile(fresh);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    await userService.updateProfile(profile.uid, updates);
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const newProfile = await authService.signUp(email, pass, name);
    setProfile(newProfile);
  };

  const signIn = async (email: string, pass: string) => {
    const loggedProfile = await authService.signIn(email, pass);
    if (loggedProfile) setProfile(loggedProfile);
  };

  const signInWithGoogle = async () => {
    const loggedProfile = await authService.signInWithGoogle();
    if (loggedProfile) setProfile(loggedProfile);
  };

  const signInDemo = () => {
    const demo = authService.signInDemo();
    setProfile(demo);
    setIsDemo(true);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setIsDemo(false);
  };

  const levelInfo = calculateLevel(profile?.totalXP || 0);

  const triggerLevelUpCheck = (previousXP: number, newXP: number) => {
    const oldLvl = calculateLevel(previousXP).level;
    const newLvl = calculateLevel(newXP).level;
    if (newLvl > oldLvl) {
      const info = calculateLevel(newXP);
      setLevelUpNotice({ oldLevel: oldLvl, newLevel: newLvl, info });
      // Update profile level field if changed
      if (profile) {
        updateUserProfile({ level: newLvl });
      }
    }
  };

  const closeLevelUpNotice = () => setLevelUpNotice(null);

  const triggerBadgeUnlock = (badge: Achievement) => {
    setRecentUnlockedBadge(badge);
  };

  const closeBadgeNotice = () => setRecentUnlockedBadge(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        levelInfo,
        isDemo,
        loading,
        theme,
        setTheme,
        signUp,
        signIn,
        signInWithGoogle,
        signInDemo,
        signOut,
        updateUserProfile,
        refreshProfile,
        levelUpNotice,
        closeLevelUpNotice,
        recentUnlockedBadge,
        closeBadgeNotice,
        triggerLevelUpCheck,
        triggerBadgeUnlock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
