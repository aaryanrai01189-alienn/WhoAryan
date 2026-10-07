export type TaskDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Epic';

export type TaskCategory = 
  | 'Study' 
  | 'Fitness' 
  | 'Work' 
  | 'Sleep' 
  | 'Health' 
  | 'Personal' 
  | 'Custom';

export type RecurringOption = 'none' | 'daily' | 'weekly' | 'weekdays';

export interface Task {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  category: TaskCategory | string;
  difficulty: TaskDifficulty;
  baseXP: number;
  earnedXP?: number;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // active tracked minutes
  completed: boolean;
  completedAt?: string;
  xpAwarded?: boolean;
  dueDate?: string;
  recurring?: RecurringOption;
  createdAt: string;
  updatedAt: string;
}

export type GoalStatus = 'in_progress' | 'completed' | 'paused';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: TaskCategory | string;
  deadline?: string;
  progress: number; // 0 to 100
  status: GoalStatus;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  relatedTaskIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  badgeId: string;
  title: string;
  description: string;
  xpReward: number;
  icon: string;
  unlockedAt: string;
}

export interface BadgeDefinition {
  badgeId: string;
  title: string;
  description: string;
  xpReward: number;
  icon: string;
  category: 'starter' | 'streak' | 'volume' | 'mastery' | 'focus';
}

export interface DailyStatistic {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  xpEarned: number;
  tasksCompleted: number;
  focusMinutes: number;
  streakCount: number;
}

export interface NotificationPreferences {
  taskReminders: boolean;
  streakReminders: boolean;
  goalReminders: boolean;
  levelUpNotifications: boolean;
  aiDailyPlanReminders: boolean;
}

export interface UserPreferences {
  mainGoal?: string;
  productivityInterests?: string[];
  preferredCategories?: string[];
  dailyTarget: number;
  notificationPreferences: NotificationPreferences;
  theme: 'dark' | 'light';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatar?: string;
  level: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  dailyTarget: number;
  onboardingCompleted: boolean;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
  isDemoUser?: boolean;
}

export interface LevelInfo {
  level: number;
  title: string;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
  xpToNextLevel: number;
  totalXP: number;
}

export interface AIProposedTask {
  title: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  estimatedDuration: number;
  notes?: string;
}

export interface AIDailyPlanBlock {
  time: string;
  activity: string;
  type: 'deep_work' | 'quick_win' | 'wellness' | 'review';
  difficulty?: TaskDifficulty;
  xp?: number;
  energyLevel: 'High' | 'Medium' | 'Low';
  tips?: string;
  isNewTask?: boolean;
  taskData?: AIProposedTask;
}

export interface AIDailyPlanResponse {
  summary: string;
  focusMotto: string;
  totalEstimatedHours: number;
  potentialXP: number;
  blocks: AIDailyPlanBlock[];
}

export interface AIGoalMilestone {
  title: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  estimatedDuration: number;
  xpReward: number;
  order: number;
  description?: string;
}

export interface AIGoalBreakdownResponse {
  strategyOverview: string;
  milestones: AIGoalMilestone[];
}
