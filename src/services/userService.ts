import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import { UserProfile, UserPreferences } from '../types';

const DEFAULT_PREFERENCES: UserPreferences = {
  dailyTarget: 4,
  notificationPreferences: {
    taskReminders: true,
    streakReminders: true,
    goalReminders: true,
    levelUpNotifications: true,
    aiDailyPlanReminders: true,
  },
  theme: 'dark',
};

class UserService {
  /**
   * Loads user profile from Firestore or local fallback cache
   */
  public async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!uid) return null;
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const profile = snap.data() as UserProfile;
        this.cacheProfile(profile);
        return profile;
      }
      return this.getCachedProfile(uid);
    } catch (error) {
      console.warn('Falling back to local profile cache:', error);
      return this.getCachedProfile(uid);
    }
  }

  /**
   * Initializes a brand-new user profile in Firestore
   */
  public async createInitialProfile(
    uid: string,
    email: string,
    displayName?: string,
    avatar?: string
  ): Promise<UserProfile> {
    const now = new Date().toISOString();
    const newProfile: UserProfile = {
      uid,
      email,
      displayName: displayName || email.split('@')[0] || 'Chrono Operative',
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
      level: 1,
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      dailyTarget: 4,
      onboardingCompleted: false,
      preferences: DEFAULT_PREFERENCES,
      createdAt: now,
      updatedAt: now,
    };

    const path = `users/${uid}`;
    try {
      await setDoc(doc(db, 'users', uid), newProfile);
      this.cacheProfile(newProfile);
      return newProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Updates partial profile fields
   */
  public async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}`;
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, 'users', uid), payload);
      const cached = this.getCachedProfile(uid);
      if (cached) {
        this.cacheProfile({ ...cached, ...payload });
      }
    } catch (error) {
      console.warn('Update profile failed, saving to local cache:', error);
      const cached = this.getCachedProfile(uid);
      if (cached) {
        this.cacheProfile({ ...cached, ...payload });
      }
    }
  }

  /**
   * Updates onboarding completion and user preferences
   */
  public async completeOnboarding(
    uid: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    if (!uid) return;
    const current = (await this.getUserProfile(uid)) || this.getCachedProfile(uid);
    const updatedPreferences: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...(current?.preferences || {}),
      ...preferences,
    };

    await this.updateProfile(uid, {
      onboardingCompleted: true,
      dailyTarget: preferences.dailyTarget || current?.dailyTarget || 4,
      preferences: updatedPreferences,
    });
  }

  private cacheProfile(profile: UserProfile): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`nexora_profile_${profile.uid}`, JSON.stringify(profile));
      }
    } catch {
      // Ignore
    }
  }

  private getCachedProfile(uid: string): UserProfile | null {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(`nexora_profile_${uid}`);
        return raw ? JSON.parse(raw) : null;
      }
    } catch {
      // Ignore
    }
    return null;
  }
}

export const userService = new UserService();
