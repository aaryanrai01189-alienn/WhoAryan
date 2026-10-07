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
import { Task } from '../types';
import { calculateEarnedXP } from './xpService';

class TaskService {
  /**
   * Subscribes to realtime tasks updates for a user
   */
  public subscribeTasks(uid: string, onUpdate: (tasks: Task[]) => void): () => void {
    if (!uid) {
      onUpdate([]);
      return () => {};
    }

    const path = `users/${uid}/tasks`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));

    try {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const tasks: Task[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Task, 'id'>),
          }));
          this.cacheTasks(uid, tasks);
          onUpdate(tasks);
        },
        (error) => {
          console.warn('Tasks snapshot listener failed, using local cache:', error);
          const cached = this.getCachedTasks(uid);
          onUpdate(cached);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.warn('Realtime subscription error:', error);
      const cached = this.getCachedTasks(uid);
      onUpdate(cached);
      return () => {};
    }
  }

  /**
   * Fetches tasks once
   */
  public async getTasks(uid: string): Promise<Task[]> {
    if (!uid) return [];
    const path = `users/${uid}/tasks`;
    try {
      const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc')));
      const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
      this.cacheTasks(uid, tasks);
      return tasks;
    } catch (error) {
      console.warn('getTasks failed, returning cached:', error);
      return this.getCachedTasks(uid);
    }
  }

  /**
   * Creates a new task
   */
  public async createTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completed' | 'xpAwarded'> & {
      completed?: boolean;
      xpAwarded?: boolean;
    }
  ): Promise<Task> {
    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newTask: Task = {
      completed: false,
      xpAwarded: false,
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const path = `users/${task.userId}/tasks/${id}`;
    try {
      await setDoc(doc(db, `users/${task.userId}/tasks`, id), newTask);
    } catch (error) {
      console.warn('Task create failed remotely, caching locally:', error);
      this.updateLocalTask(task.userId, newTask);
    }

    return newTask;
  }

  /**
   * Updates an existing task
   */
  public async updateTask(uid: string, taskId: string, updates: Partial<Task>): Promise<void> {
    const path = `users/${uid}/tasks/${taskId}`;
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, `users/${uid}/tasks`, taskId), payload);
    } catch (error) {
      console.warn('Task update failed remotely, updating locally:', error);
      const cached = this.getCachedTasks(uid);
      const updated = cached.map((t) => (t.id === taskId ? { ...t, ...payload } : t));
      this.cacheTasks(uid, updated);
    }
  }

  /**
   * Deletes a task
   */
  public async deleteTask(uid: string, taskId: string): Promise<void> {
    const path = `users/${uid}/tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, `users/${uid}/tasks`, taskId));
    } catch (error) {
      console.warn('Task delete failed remotely, deleting locally:', error);
      const cached = this.getCachedTasks(uid);
      this.cacheTasks(uid, cached.filter((t) => t.id !== taskId));
    }
  }

  /**
   * Completes or uncompletes a task.
   * ANTI-FARMING GUARANTEE:
   * Only awards XP if `xpAwarded` was not previously set!
   * Returns earnedXP and whether XP was newly awarded.
   */
  public async toggleTaskCompletion(
    uid: string,
    task: Task,
    activeFocusedMinutes: number = 0
  ): Promise<{ task: Task; newlyEarnedXP: number; isFirstCompletion: boolean }> {
    const willBeCompleted = !task.completed;
    let earnedXP = task.earnedXP || 0;
    let isFirstCompletion = false;
    let newlyEarnedXP = 0;

    if (willBeCompleted) {
      if (!task.xpAwarded) {
        // Calculate XP: Base + capped time bonus
        earnedXP = calculateEarnedXP(task.difficulty, activeFocusedMinutes || task.actualDuration || 0);
        newlyEarnedXP = earnedXP;
        isFirstCompletion = true;
      }
    }

    const updatedTask: Task = {
      ...task,
      completed: willBeCompleted,
      completedAt: willBeCompleted ? new Date().toISOString() : undefined,
      actualDuration: activeFocusedMinutes > 0 ? activeFocusedMinutes : task.actualDuration,
      earnedXP,
      xpAwarded: task.xpAwarded || isFirstCompletion,
      updatedAt: new Date().toISOString(),
    };

    await this.updateTask(uid, task.id, updatedTask);

    return {
      task: updatedTask,
      newlyEarnedXP,
      isFirstCompletion,
    };
  }

  private cacheTasks(uid: string, tasks: Task[]): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`nexora_tasks_${uid}`, JSON.stringify(tasks));
      }
    } catch {
      // Ignore
    }
  }

  private getCachedTasks(uid: string): Task[] {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(`nexora_tasks_${uid}`);
        return raw ? JSON.parse(raw) : [];
      }
    } catch {
      // Ignore
    }
    return [];
  }

  private updateLocalTask(uid: string, task: Task): void {
    const list = this.getCachedTasks(uid);
    const existingIndex = list.findIndex((t) => t.id === task.id);
    if (existingIndex >= 0) {
      list[existingIndex] = task;
    } else {
      list.unshift(task);
    }
    this.cacheTasks(uid, list);
  }
}

export const taskService = new TaskService();
