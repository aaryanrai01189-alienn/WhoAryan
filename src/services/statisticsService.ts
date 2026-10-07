import { doc, getDoc, setDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DailyStatistic, UserProfile } from '../types';
import { userService } from './userService';

class StatisticsService {
  /**
   * Helper to format a Date into consistent local YYYY-MM-DD
   */
  public getLocalDateString(d: Date = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calculates difference in days between two YYYY-MM-DD dates in user local time
   */
  public getDaysDiff(dateStrA: string, dateStrB: string): number {
    const [y1, m1, d1] = dateStrA.split('-').map(Number);
    const [y2, m2, d2] = dateStrB.split('-').map(Number);
    const dt1 = new Date(y1, m1 - 1, d1).getTime();
    const dt2 = new Date(y2, m2 - 1, d2).getTime();
    return Math.round((dt2 - dt1) / (1000 * 60 * 60 * 24));
  }

  /**
   * Records daily progress and updates streak with timezone safety
   */
  public async recordActivity(
    uid: string,
    currentProfile: UserProfile,
    xpEarned: number,
    taskCompleted: boolean,
    focusMinutes: number = 0
  ): Promise<{
    updatedProfile: UserProfile;
    streakIncreased: boolean;
    motivationalMessage: string;
  }> {
    const todayStr = this.getLocalDateString();
    let currentStreak = currentProfile.currentStreak || 0;
    let longestStreak = currentProfile.longestStreak || 0;
    let streakIncreased = false;
    let motivationalMessage = 'Progress recorded!';

    const lastActive = currentProfile.lastActiveDate;

    if (!lastActive) {
      // First day
      currentStreak = 1;
      longestStreak = Math.max(longestStreak, 1);
      streakIncreased = true;
      motivationalMessage = '🔥 First day streak initiated! Keep the fire burning!';
    } else if (lastActive === todayStr) {
      // Already active today; maintain streak
      motivationalMessage = '🔥 Momentum maintained today! Great job staying focused!';
    } else {
      const diff = this.getDaysDiff(lastActive, todayStr);
      if (diff === 1) {
        // Consecutive day
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
        streakIncreased = true;
        motivationalMessage = `🔥 STREAK CONTINUES! You are on a ${currentStreak}-day roll!`;
      } else if (diff > 1) {
        // Gap of more than 1 day: restart streak
        currentStreak = 1;
        streakIncreased = false;
        motivationalMessage = '🔥 Streak reset, but your journey re-ignites right now!';
      }
    }

    const updatedProfile: UserProfile = {
      ...currentProfile,
      totalXP: (currentProfile.totalXP || 0) + xpEarned,
      currentStreak,
      longestStreak,
      lastActiveDate: todayStr,
      updatedAt: new Date().toISOString(),
    };

    // Save profile update
    await userService.updateProfile(uid, {
      totalXP: updatedProfile.totalXP,
      currentStreak,
      longestStreak,
      lastActiveDate: todayStr,
    });

    // Update or create today's DailyStatistic doc
    try {
      const statRef = doc(db, `users/${uid}/statistics`, todayStr);
      const snap = await getDoc(statRef);
      const existing = snap.exists() ? (snap.data() as DailyStatistic) : null;

      const newStat: DailyStatistic = {
        userId: uid,
        date: todayStr,
        xpEarned: (existing?.xpEarned || 0) + xpEarned,
        tasksCompleted: (existing?.tasksCompleted || 0) + (taskCompleted ? 1 : 0),
        focusMinutes: (existing?.focusMinutes || 0) + focusMinutes,
        streakCount: currentStreak,
      };

      await setDoc(statRef, newStat);
      this.cacheDailyStat(uid, newStat);
    } catch (err) {
      console.warn('Could not write daily stat remotely, saving locally:', err);
    }

    return {
      updatedProfile,
      streakIncreased,
      motivationalMessage,
    };
  }

  /**
   * Gets history of daily statistics for charts
   */
  public async getRecentStats(uid: string, days: number = 7): Promise<DailyStatistic[]> {
    if (!uid) return [];
    try {
      const q = query(
        collection(db, `users/${uid}/statistics`),
        orderBy('date', 'desc'),
        limit(days)
      );
      const snap = await getDocs(q);
      const stats = snap.docs.map((d) => d.data() as DailyStatistic);
      
      // Ensure we fill missing days with zero stats for beautiful charts
      const result: DailyStatistic[] = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = this.getLocalDateString(d);
        const found = stats.find((s) => s.date === dateStr);
        result.push(
          found || {
            userId: uid,
            date: dateStr,
            xpEarned: 0,
            tasksCompleted: 0,
            focusMinutes: 0,
            streakCount: 0,
          }
        );
      }
      return result;
    } catch (err) {
      console.warn('Could not load statistics, generating local fallback:', err);
      return this.generateFallbackStats(uid, days);
    }
  }

  private generateFallbackStats(uid: string, days: number): DailyStatistic[] {
    const result: DailyStatistic[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      result.push({
        userId: uid,
        date: this.getLocalDateString(d),
        xpEarned: 0,
        tasksCompleted: 0,
        focusMinutes: 0,
        streakCount: 0,
      });
    }
    return result;
  }

  private cacheDailyStat(uid: string, stat: DailyStatistic): void {
    try {
      if (typeof window !== 'undefined') {
        const key = `nexora_stat_${uid}_${stat.date}`;
        localStorage.setItem(key, JSON.stringify(stat));
      }
    } catch {
      // Ignore
    }
  }
}

export const statisticsService = new StatisticsService();
