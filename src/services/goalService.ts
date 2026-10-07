import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import { Goal } from '../types';

class GoalService {
  /**
   * Subscribes to realtime goals for user
   */
  public subscribeGoals(uid: string, onUpdate: (goals: Goal[]) => void): () => void {
    if (!uid) {
      onUpdate([]);
      return () => {};
    }

    const path = `users/${uid}/goals`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));

    try {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const goals: Goal[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Goal, 'id'>),
          }));
          this.cacheGoals(uid, goals);
          onUpdate(goals);
        },
        (error) => {
          console.warn('Goals snapshot listener failed, using local cache:', error);
          const cached = this.getCachedGoals(uid);
          onUpdate(cached);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.warn('Realtime goals subscription error:', error);
      const cached = this.getCachedGoals(uid);
      onUpdate(cached);
      return () => {};
    }
  }

  /**
   * Creates a new goal
   */
  public async createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goal,
      id,
      progress: goal.progress || 0,
      status: goal.status || 'in_progress',
      createdAt: now,
      updatedAt: now,
    };

    const path = `users/${goal.userId}/goals/${id}`;
    try {
      await setDoc(doc(db, `users/${goal.userId}/goals`, id), newGoal);
    } catch (error) {
      console.warn('Goal creation failed remotely, saving locally:', error);
      this.updateLocalGoal(goal.userId, newGoal);
    }

    return newGoal;
  }

  /**
   * Updates an existing goal
   */
  public async updateGoal(uid: string, goalId: string, updates: Partial<Goal>): Promise<void> {
    const path = `users/${uid}/goals/${goalId}`;
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, `users/${uid}/goals`, goalId), payload);
    } catch (error) {
      console.warn('Goal update failed remotely, saving locally:', error);
      const cached = this.getCachedGoals(uid);
      const updated = cached.map((g) => (g.id === goalId ? { ...g, ...payload } : g));
      this.cacheGoals(uid, updated);
    }
  }

  /**
   * Deletes a goal
   */
  public async deleteGoal(uid: string, goalId: string): Promise<void> {
    const path = `users/${uid}/goals/${goalId}`;
    try {
      await deleteDoc(doc(db, `users/${uid}/goals`, goalId));
    } catch (error) {
      console.warn('Goal delete failed remotely, deleting locally:', error);
      const cached = this.getCachedGoals(uid);
      this.cacheGoals(uid, cached.filter((g) => g.id !== goalId));
    }
  }

  private cacheGoals(uid: string, goals: Goal[]): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`nexora_goals_${uid}`, JSON.stringify(goals));
      }
    } catch {
      // Ignore
    }
  }

  private getCachedGoals(uid: string): Goal[] {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(`nexora_goals_${uid}`);
        return raw ? JSON.parse(raw) : [];
      }
    } catch {
      // Ignore
    }
    return [];
  }

  private updateLocalGoal(uid: string, goal: Goal): void {
    const list = this.getCachedGoals(uid);
    const idx = list.findIndex((g) => g.id === goal.id);
    if (idx >= 0) {
      list[idx] = goal;
    } else {
      list.unshift(goal);
    }
    this.cacheGoals(uid, list);
  }
}

export const goalService = new GoalService();
