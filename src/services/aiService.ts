import { 
  AIProposedTask, 
  AIDailyPlanResponse, 
  AIGoalBreakdownResponse, 
  Task, 
  Goal 
} from '../types';

export interface AICoachResponse {
  text: string;
  suggestedTasks?: AIProposedTask[] | null;
}

class AIService {
  /**
   * Communicates with AI Coach backend
   */
  public async askCoach(
    message: string,
    context?: {
      userLevel?: number;
      totalXP?: number;
      streak?: number;
      pendingTasksCount?: number;
      activeGoalsCount?: number;
      topPriorities?: string[];
    },
    chatHistory?: { sender: 'user' | 'coach'; text: string }[]
  ): Promise<AICoachResponse> {
    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context, chatHistory }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn('AI Coach server call failed, using fallback:', err);
      return {
        text: `### ⚡ NEXORA Strategic Directive\n\nI've analyzed your request: **"${message}"**.\n\nHere is your high-impact execution guidance:\n\n1. **Prime Focus (45 mins)**: Tackle the single highest resistance milestone first.\n2. **Energy Modulation (10 mins)**: Step away, hydrate, and recalibrate.\n3. **Sprint Phase (30 mins)**: Execute secondary tasks in rapid batch sequence.\n\n*Tip: Every completed block advances your NEXORA rank and protects your streak!*`,
        suggestedTasks: [
          {
            title: `Deep Focus Sprint for: ${message.slice(0, 30)}`,
            category: 'Work',
            difficulty: 'Medium',
            estimatedDuration: 45,
            notes: 'Created via AI Coach tactical advice',
          },
          {
            title: 'Review and Synthesize Key Learnings',
            category: 'Study',
            difficulty: 'Easy',
            estimatedDuration: 15,
            notes: 'Consolidate progress to solidify retention',
          },
        ],
      };
    }
  }

  /**
   * Generates "My Day" optimized daily plan
   */
  public async generateDailyPlan(params: {
    tasks: Task[];
    goals: Goal[];
    dailyTarget?: number;
    availableHours?: number;
    focusTheme?: string;
  }): Promise<AIDailyPlanResponse> {
    try {
      const res = await fetch('/api/ai/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: params.tasks.filter((t) => !t.completed).map((t) => ({
            title: t.title,
            category: t.category,
            difficulty: t.difficulty,
            estimatedDuration: t.estimatedDuration,
          })),
          goals: params.goals.filter((g) => g.status === 'in_progress').map((g) => ({
            title: g.title,
            progress: g.progress,
          })),
          dailyTarget: params.dailyTarget || 4,
          availableHours: params.availableHours || 8,
          focusTheme: params.focusTheme || 'High Momentum',
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('AI Daily Plan server request failed, generating intelligent fallback:', err);
      return {
        summary: 'Your optimized tactical day designed for peak cognitive stamina and maximum XP velocity.',
        focusMotto: 'Focus. Execute. Ascend.',
        totalEstimatedHours: 6.5,
        potentialXP: 320,
        blocks: [
          {
            time: '09:00 AM - 10:30 AM',
            activity: params.tasks[0]?.title || 'Core Priority Deep Work Sprint',
            type: 'deep_work',
            difficulty: 'Hard',
            xp: 100,
            energyLevel: 'High',
            tips: 'Silence all notifications and set a 90-minute immersion cycle.',
          },
          {
            time: '10:45 AM - 11:45 AM',
            activity: params.tasks[1]?.title || 'Rapid Execution & Communication',
            type: 'quick_win',
            difficulty: 'Medium',
            xp: 50,
            energyLevel: 'Medium',
            tips: 'Batch small tasks together to minimize context switching.',
          },
          {
            time: '01:30 PM - 02:30 PM',
            activity: 'Strategic Goal Milestone Review',
            type: 'deep_work',
            difficulty: 'Medium',
            xp: 50,
            energyLevel: 'High',
            tips: 'Align your output directly with your long-term goal benchmarks.',
          },
          {
            time: '04:00 PM - 04:45 PM',
            activity: 'Physical Wellness & Reboot',
            type: 'wellness',
            difficulty: 'Easy',
            xp: 20,
            energyLevel: 'Low',
            tips: 'Movement resets dopamine levels and cognitive fatigue.',
            isNewTask: true,
            taskData: {
              title: '30-minute Cardio or Stretch Recovery',
              category: 'Fitness',
              difficulty: 'Easy',
              estimatedDuration: 30,
            },
          },
        ],
      };
    }
  }

  /**
   * Breaks down a long-term goal into structured sub-tasks
   */
  public async breakdownGoal(params: {
    goalTitle: string;
    goalDescription?: string;
    deadline?: string;
  }): Promise<AIGoalBreakdownResponse> {
    try {
      const res = await fetch('/api/ai/breakdown-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('AI Goal Breakdown failed, generating fallback breakdown:', err);
      return {
        strategyOverview: `A phased execution path to conquer "${params.goalTitle}" through progressive difficulty increments.`,
        milestones: [
          {
            title: `Phase 1: Research & Scope ${params.goalTitle}`,
            category: 'Work',
            difficulty: 'Easy',
            estimatedDuration: 30,
            xpReward: 20,
            order: 1,
            description: 'Define exact boundaries, required resources, and target milestones.',
          },
          {
            title: `Phase 2: Prototype Architecture / Outline`,
            category: 'Work',
            difficulty: 'Medium',
            estimatedDuration: 45,
            xpReward: 50,
            order: 2,
            description: 'Draft the foundational structure and establish initial working proof.',
          },
          {
            title: `Phase 3: Core Implementation Sprint`,
            category: 'Work',
            difficulty: 'Hard',
            estimatedDuration: 90,
            xpReward: 100,
            order: 3,
            description: 'Intense deep work block executing the primary heavy lifting.',
          },
          {
            title: `Phase 4: Review, Polish & Final Deliverable`,
            category: 'Personal',
            difficulty: 'Medium',
            estimatedDuration: 40,
            xpReward: 50,
            order: 4,
            description: 'Verify quality standards and mark milestone as completed.',
          },
        ],
      };
    }
  }
}

export const aiService = new AIService();
