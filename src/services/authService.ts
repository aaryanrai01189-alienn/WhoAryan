import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { userService } from './userService';
import { UserProfile } from '../types';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemo: boolean;
}

const DEMO_USER_ID = 'nexora_demo_operative';

class AuthService {
  /**
   * Listen to Firebase auth state changes and synchronize user profile
   */
  public subscribeAuthState(
    callback: (state: { user: User | null; profile: UserProfile | null; isDemo: boolean }) => void
  ): () => void {
    // Check if demo user is active in localStorage
    if (typeof window !== 'undefined' && localStorage.getItem('nexora_demo_active') === 'true') {
      const demoProfile: UserProfile = {
        uid: DEMO_USER_ID,
        email: 'operative@nexora.io',
        displayName: 'Commander Nova',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=nexora_commander',
        level: 4,
        totalXP: 2450,
        currentStreak: 7,
        longestStreak: 14,
        dailyTarget: 5,
        onboardingCompleted: true,
        lastActiveDate: new Date().toISOString().split('T')[0],
        preferences: {
          dailyTarget: 5,
          notificationPreferences: {
            taskReminders: true,
            streakReminders: true,
            goalReminders: true,
            levelUpNotifications: true,
            aiDailyPlanReminders: true,
          },
          theme: 'dark',
        },
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        isDemoUser: true,
      };

      callback({
        user: null,
        profile: demoProfile,
        isDemo: true,
      });
      return () => {};
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let profile = await userService.getUserProfile(firebaseUser.uid);
        if (!profile) {
          profile = await userService.createInitialProfile(
            firebaseUser.uid,
            firebaseUser.email || 'user@nexora.app',
            firebaseUser.displayName || undefined,
            firebaseUser.photoURL || undefined
          );
        }
        callback({ user: firebaseUser, profile, isDemo: false });
      } else {
        callback({ user: null, profile: null, isDemo: false });
      }
    });
  }

  /**
   * Sign up with Email and Password
   */
  public async signUp(email: string, pass: string, displayName: string): Promise<UserProfile> {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const profile = await userService.createInitialProfile(
      cred.user.uid,
      email,
      displayName
    );
    return profile;
  }

  /**
   * Sign in with Email and Password
   */
  public async signIn(email: string, pass: string): Promise<UserProfile | null> {
    this.clearDemoMode();
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    let profile = await userService.getUserProfile(cred.user.uid);
    if (!profile) {
      profile = await userService.createInitialProfile(cred.user.uid, email);
    }
    return profile;
  }

  /**
   * Sign in with Google Popup
   */
  public async signInWithGoogle(): Promise<UserProfile | null> {
    this.clearDemoMode();
    const cred = await signInWithPopup(auth, googleProvider);
    let profile = await userService.getUserProfile(cred.user.uid);
    if (!profile) {
      profile = await userService.createInitialProfile(
        cred.user.uid,
        cred.user.email || 'google_user@nexora.app',
        cred.user.displayName || undefined,
        cred.user.photoURL || undefined
      );
    }
    return profile;
  }

  /**
   * Switch to Instant Demo Mode
   */
  public signInDemo(): UserProfile {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexora_demo_active', 'true');
    }
    const demoProfile: UserProfile = {
      uid: DEMO_USER_ID,
      email: 'operative@nexora.io',
      displayName: 'Commander Nova',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=nexora_commander',
      level: 4,
      totalXP: 2450,
      currentStreak: 7,
      longestStreak: 14,
      dailyTarget: 5,
      onboardingCompleted: true,
      lastActiveDate: new Date().toISOString().split('T')[0],
      preferences: {
        dailyTarget: 5,
        notificationPreferences: {
          taskReminders: true,
          streakReminders: true,
          goalReminders: true,
          levelUpNotifications: true,
          aiDailyPlanReminders: true,
        },
        theme: 'dark',
      },
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      isDemoUser: true,
    };

    // Pre-populate some starter demo tasks if none exist
    if (typeof window !== 'undefined' && !localStorage.getItem(`nexora_tasks_${DEMO_USER_ID}`)) {
      const initialTasks = [
        {
          id: 'task_demo_1',
          userId: DEMO_USER_ID,
          title: 'Review System Architecture Specifications',
          notes: 'Prepare core components for mobile packaging',
          category: 'Work',
          difficulty: 'Hard',
          baseXP: 100,
          earnedXP: 0,
          estimatedDuration: 45,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task_demo_2',
          userId: DEMO_USER_ID,
          title: 'High-Intensity Interval Training Sprint',
          notes: 'Maintain peak aerobic output for 30 minutes',
          category: 'Fitness',
          difficulty: 'Medium',
          baseXP: 50,
          earnedXP: 0,
          estimatedDuration: 30,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task_demo_3',
          userId: DEMO_USER_ID,
          title: 'Study Advanced Quantum Computing Paper',
          notes: 'Take concise notes on qubit coherence mechanisms',
          category: 'Study',
          difficulty: 'Epic',
          baseXP: 200,
          earnedXP: 0,
          estimatedDuration: 60,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task_demo_4',
          userId: DEMO_USER_ID,
          title: 'Hydration & Posture Reset',
          category: 'Health',
          difficulty: 'Easy',
          baseXP: 20,
          earnedXP: 20,
          xpAwarded: true,
          completed: true,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(`nexora_tasks_${DEMO_USER_ID}`, JSON.stringify(initialTasks));
    }

    // Pre-populate starter demo goals if none exist
    if (typeof window !== 'undefined' && !localStorage.getItem(`nexora_goals_${DEMO_USER_ID}`)) {
      const initialGoals = [
        {
          id: 'goal_demo_1',
          userId: DEMO_USER_ID,
          title: 'Launch NEXORA Mobile Version',
          description: 'Package clean services and deploy to production',
          category: 'Work',
          deadline: '2026-10-31',
          progress: 65,
          status: 'in_progress',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'goal_demo_2',
          userId: DEMO_USER_ID,
          title: 'Master Advanced Algorithms Course',
          description: 'Complete 12 modules and finish final project',
          category: 'Study',
          deadline: '2026-11-15',
          progress: 40,
          status: 'in_progress',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(`nexora_goals_${DEMO_USER_ID}`, JSON.stringify(initialGoals));
    }

    return demoProfile;
  }

  /**
   * Send Password Reset Email
   */
  public async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  /**
   * Log out current user
   */
  public async signOut(): Promise<void> {
    this.clearDemoMode();
    await signOut(auth);
  }

  private clearDemoMode(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexora_demo_active');
    }
  }
}

export const authService = new AuthService();
