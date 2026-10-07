import { TaskDifficulty, LevelInfo } from '../types';

export const LEVEL_THRESHOLDS: { level: number; xp: number; title: string }[] = [
  { level: 1, xp: 0, title: 'Initiate' },
  { level: 2, xp: 500, title: 'Novice Pathfinder' },
  { level: 3, xp: 1200, title: 'Focus Operative' },
  { level: 4, xp: 2000, title: 'Momentum Specialist' },
  { level: 5, xp: 3000, title: 'Vanguard Achiever' },
  { level: 6, xp: 4200, title: 'Quantum Strategist' },
  { level: 7, xp: 5600, title: 'Cyber Architect' },
  { level: 8, xp: 7200, title: 'Master Chrono' },
  { level: 9, xp: 9000, title: 'Apex Synthesizer' },
  { level: 10, xp: 11000, title: 'Nexora Luminary' },
];

export const DIFFICULTY_BASE_XP: Record<TaskDifficulty, number> = {
  Easy: 20,
  Medium: 50,
  Hard: 100,
  Epic: 200,
};

// Max time-based bonus to prevent unlimited XP farming
export const MAX_TIME_BONUS_XP = 50;

/**
 * Calculates base XP for a given difficulty
 */
export function getBaseXP(difficulty: TaskDifficulty): number {
  return DIFFICULTY_BASE_XP[difficulty] || 20;
}

/**
 * Computes XP earned including capped focus time bonus
 * 1 XP per minute, capped at MAX_TIME_BONUS_XP (50 XP)
 */
export function calculateEarnedXP(difficulty: TaskDifficulty, focusedMinutes: number = 0): number {
  const base = getBaseXP(difficulty);
  const timeBonus = Math.min(Math.max(0, Math.floor(focusedMinutes)), MAX_TIME_BONUS_XP);
  return base + timeBonus;
}

/**
 * Determines current level, level title, and progress percentage
 */
export function calculateLevel(totalXP: number): LevelInfo {
  const safeXP = Math.max(0, totalXP || 0);

  // For levels above the pre-defined list
  let level = 1;
  let currentLevelXP = 0;
  let nextLevelXP = 500;
  let title = 'Initiate';

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (safeXP >= LEVEL_THRESHOLDS[i].xp) {
      level = LEVEL_THRESHOLDS[i].level;
      currentLevelXP = LEVEL_THRESHOLDS[i].xp;
      title = LEVEL_THRESHOLDS[i].title;
      
      if (i < LEVEL_THRESHOLDS.length - 1) {
        nextLevelXP = LEVEL_THRESHOLDS[i + 1].xp;
      } else {
        // Linear extension beyond level 10: 2500 XP per level
        const extraLevels = Math.floor((safeXP - currentLevelXP) / 2500);
        level += extraLevels;
        currentLevelXP += extraLevels * 2500;
        nextLevelXP = currentLevelXP + 2500;
        title = `Nexora Sovereign Lv.${level}`;
      }
      break;
    }
  }

  const range = nextLevelXP - currentLevelXP;
  const xpIntoCurrent = safeXP - currentLevelXP;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpIntoCurrent / range) * 100)));
  const xpToNextLevel = Math.max(0, nextLevelXP - safeXP);

  return {
    level,
    title,
    currentLevelXP,
    nextLevelXP,
    progressPercent,
    xpToNextLevel,
    totalXP: safeXP,
  };
}
