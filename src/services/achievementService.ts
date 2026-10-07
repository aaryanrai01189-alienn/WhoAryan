import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import { Achievement, BadgeDefinition, UserProfile } from '../types';

export const MASTER_BADGES: BadgeDefinition[] = [
  {
    badgeId: 'first_task',
    title: 'First Step',
    description: 'Completed your very first task on NEXORA',
    xpReward: 50,
    icon: 'Sparkles',
    category: 'starter',
  },
  {
    badgeId: 'first_100_xp',
    title: 'Centurion Novice',
    description: 'Earned your first 100 XP',
    xpReward: 50,
    icon: 'Zap',
    category: 'starter',
  },
  {
    badgeId: 'level_5',
    title: 'Vanguard Ascendant',
    description: 'Attained Level 5 in NEXORA progression',
    xpReward: 200,
    icon: 'ShieldAlert',
    category: 'mastery',
  },
  {
    badgeId: 'streak_3',
    title: 'Spark of Momentum',
    description: 'Maintained an active 3-day streak',
    xpReward: 100,
    icon: 'Flame',
    category: 'streak',
  },
  {
    badgeId: 'streak_7',
    title: 'Iron Discipline',
    description: 'Maintained a legendary 7-day streak',
    xpReward: 250,
    icon: 'Flame',
    category: 'streak',
  },
  {
    badgeId: 'streak_30',
    title: 'Chrono Titan',
    description: 'Unbroken focus for 30 consecutive days',
    xpReward: 1000,
    icon: 'Trophy',
    category: 'streak',
  },
  {
    badgeId: 'tasks_50',
    title: 'Execution Engine',
    description: 'Completed 50 tasks across all categories',
    xpReward: 300,
    icon: 'CheckCircle2',
    category: 'volume',
  },
  {
    badgeId: 'tasks_100',
    title: 'Apex Achiever',
    description: 'Completed 100 verified tasks',
    xpReward: 600,
    icon: 'Award',
    category: 'volume',
  },
  {
    badgeId: 'deep_focus',
    title: 'Deep Diver',
    description: 'Completed an active focused task of 25+ minutes',
    xpReward: 100,
    icon: 'Clock',
    category: 'focus',
  },
  {
    badgeId: 'first_goal',
    title: 'Visionary',
    description: 'Created and brought a strategic goal to 100% completion',
    xpReward: 200,
    icon: 'Target',
    category: 'mastery',
  },
  {
    badgeId: 'ai_collaborator',
    title: 'AI Synergy',
    description: 'Generated a customized daily plan with the AI Coach',
    xpReward: 75,
    icon: 'Bot',
    category: 'starter',
  },
];

class AchievementService {
  /**
   * Fetches all unlocked achievements for a user
   */
  public async getUserAchievements(uid: string): Promise<Achievement[]> {
    if (!uid) return [];
    const path = `users/${uid}/achievements`;
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Achievement));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  /**
   * Evaluates current user stats against badge criteria.
   * Returns array of newly unlocked achievements.
   */
  public async evaluateAndUnlock(
    uid: string,
    profile: UserProfile,
    totalCompletedTasks: number,
    completedGoalCount: number,
    existingAchievements: Achievement[]
  ): Promise<Achievement[]> {
    if (!uid) return [];

    const existingMap = new Set(existingAchievements.map((a) => a.badgeId));
    const newlyUnlocked: Achievement[] = [];

    const checks: { badgeId: string; condition: boolean }[] = [
      { badgeId: 'first_task', condition: totalCompletedTasks >= 1 },
      { badgeId: 'first_100_xp', condition: profile.totalXP >= 100 },
      { badgeId: 'level_5', condition: profile.level >= 5 },
      { badgeId: 'streak_3', condition: profile.currentStreak >= 3 },
      { badgeId: 'streak_7', condition: profile.currentStreak >= 7 },
      { badgeId: 'streak_30', condition: profile.currentStreak >= 30 },
      { badgeId: 'tasks_50', condition: totalCompletedTasks >= 50 },
      { badgeId: 'tasks_100', condition: totalCompletedTasks >= 100 },
      { badgeId: 'first_goal', condition: completedGoalCount >= 1 },
    ];

    for (const check of checks) {
      if (check.condition && !existingMap.has(check.badgeId)) {
        const badgeDef = MASTER_BADGES.find((b) => b.badgeId === check.badgeId);
        if (badgeDef) {
          const achievementDoc: Achievement = {
            id: check.badgeId,
            userId: uid,
            badgeId: check.badgeId,
            title: badgeDef.title,
            description: badgeDef.description,
            xpReward: badgeDef.xpReward,
            icon: badgeDef.icon,
            unlockedAt: new Date().toISOString(),
          };

          const path = `users/${uid}/achievements/${check.badgeId}`;
          try {
            await setDoc(doc(db, `users/${uid}/achievements`, check.badgeId), achievementDoc);
            newlyUnlocked.push(achievementDoc);
          } catch (err) {
            console.error('Error recording achievement:', err);
          }
        }
      }
    }

    return newlyUnlocked;
  }

  /**
   * Explicitly unlocks a specific badge (e.g. for AI usage or Deep focus timer)
   */
  public async unlockSpecificBadge(uid: string, badgeId: string): Promise<Achievement | null> {
    if (!uid) return null;
    const badgeDef = MASTER_BADGES.find((b) => b.badgeId === badgeId);
    if (!badgeDef) return null;

    const path = `users/${uid}/achievements/${badgeId}`;
    try {
      const achievementDoc: Achievement = {
        id: badgeId,
        userId: uid,
        badgeId,
        title: badgeDef.title,
        description: badgeDef.description,
        xpReward: badgeDef.xpReward,
        icon: badgeDef.icon,
        unlockedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, `users/${uid}/achievements`, badgeId), achievementDoc);
      return achievementDoc;
    } catch (err) {
      console.warn('Could not unlock badge:', err);
      return null;
    }
  }
}

export const achievementService = new AchievementService();
