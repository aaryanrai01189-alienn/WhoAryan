import { NotificationPreferences } from '../types';

export type NotificationPermissionState = 'default' | 'granted' | 'denied';

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  triggerTime: number; // timestamp
  type: keyof NotificationPreferences;
  data?: Record<string, any>;
}

class NotificationService {
  private inMemoryQueue: ScheduledNotification[] = [];
  private activeTimers: Map<string, number> = new Map();
  private fcmToken: string | null = null;
  private onNotificationListeners: ((notif: { title: string; body: string; type: string }) => void)[] = [];

  constructor() {
    this.restoreScheduledQueue();
  }

  /**
   * Current notification permission state
   */
  public getPermissionState(): NotificationPermissionState {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission as NotificationPermissionState;
  }

  /**
   * Requests browser or device permission
   */
  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
      return false;
    }
  }

  /**
   * Device or Browser Push Token Registration abstraction.
   * On future Android wrapping, the native bridge or FCM SDK populates this.
   */
  public async registerDeviceToken(): Promise<string | null> {
    try {
      // If running inside Android WebView with JavaScript Interface
      if (typeof window !== 'undefined' && (window as any).AndroidNotificationBridge?.getFcmToken) {
        this.fcmToken = (window as any).AndroidNotificationBridge.getFcmToken();
        return this.fcmToken;
      }

      // Web Push Token Placeholder ready for Service Worker FCM
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        // Simulated or native web registration token
        this.fcmToken = `web-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return this.fcmToken;
      }

      return null;
    } catch (e) {
      console.warn('Error registering push token:', e);
      return null;
    }
  }

  public getDeviceToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Dispatches an immediate notification (via Web Notification if permitted, or in-app listener)
   */
  public sendImmediateNotification(
    title: string,
    body: string,
    type: keyof NotificationPreferences = 'taskReminders',
    icon: string = '/favicon.ico'
  ): void {
    // Notify in-app subscribers (Toasts, Sound, App banners)
    this.onNotificationListeners.forEach((listener) => {
      try {
        listener({ title, body, type });
      } catch (e) {
        console.error('Notification listener error:', e);
      }
    });

    // Native browser notification if permission is granted
    if (this.getPermissionState() === 'granted' && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        new Notification(title, {
          body,
          icon,
          badge: icon,
        });
      } catch (err) {
        console.warn('Could not display system notification:', err);
      }
    }
  }

  /**
   * Schedules a future notification (for task due dates, streak reminders, etc.)
   */
  public scheduleNotification(
    id: string,
    title: string,
    body: string,
    triggerTime: number,
    type: keyof NotificationPreferences
  ): void {
    const delay = triggerTime - Date.now();
    if (delay <= 0) {
      this.sendImmediateNotification(title, body, type);
      return;
    }

    // Cancel existing timer with same id if any
    if (this.activeTimers.has(id)) {
      clearTimeout(this.activeTimers.get(id));
      this.activeTimers.delete(id);
    }

    // Schedule local timer
    const timer = window.setTimeout(() => {
      this.sendImmediateNotification(title, body, type);
      this.activeTimers.delete(id);
      this.removeFromQueue(id);
    }, delay);

    this.activeTimers.set(id, timer);

    // Persist to queue
    this.inMemoryQueue.push({ id, title, body, triggerTime, type });
    this.saveScheduledQueue();
  }

  public cancelScheduledNotification(id: string): void {
    if (this.activeTimers.has(id)) {
      clearTimeout(this.activeTimers.get(id));
      this.activeTimers.delete(id);
    }
    this.removeFromQueue(id);
  }

  public subscribe(callback: (notif: { title: string; body: string; type: string }) => void): () => void {
    this.onNotificationListeners.push(callback);
    return () => {
      this.onNotificationListeners = this.onNotificationListeners.filter((cb) => cb !== callback);
    };
  }

  private removeFromQueue(id: string) {
    this.inMemoryQueue = this.inMemoryQueue.filter((item) => item.id !== id);
    this.saveScheduledQueue();
  }

  private saveScheduledQueue() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexora_scheduled_notifications', JSON.stringify(this.inMemoryQueue));
      }
    } catch {
      // Ignore storage limitations
    }
  }

  private restoreScheduledQueue() {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem('nexora_scheduled_notifications');
        if (data) {
          const list: ScheduledNotification[] = JSON.parse(data);
          const now = Date.now();
          list.forEach((item) => {
            if (item.triggerTime > now) {
              this.scheduleNotification(item.id, item.title, item.body, item.triggerTime, item.type);
            }
          });
        }
      }
    } catch {
      // Ignore
    }
  }
}

export const notificationService = new NotificationService();
