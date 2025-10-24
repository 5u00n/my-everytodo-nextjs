'use client';

import notificationService from './notificationService';
import pushNotificationService from './pushNotificationService';

// Extended notification options with vibrate and actions support
interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  renotify?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface Alarm {
  id: string;
  todoId: string;
  title: string;
  body?: string;
  scheduledTime: number;
  timeoutId?: number;
  isActive: boolean;
}

class AlarmManager {
  private alarms: Map<string, Alarm> = new Map();
  private alarmCallbacks: Map<string, (alarm: Alarm) => void> = new Map();

  // Schedule an alarm
  scheduleAlarm(
    todoId: string,
    title: string,
    scheduledTime: number,
    body?: string,
    onTrigger?: (alarm: Alarm) => void
  ): string {
    const alarmId = `alarm-${todoId}-${Date.now()}`;
    
    const alarm: Alarm = {
      id: alarmId,
      todoId,
      title,
      body,
      scheduledTime,
      isActive: true
    };

    // Store callback if provided
    if (onTrigger) {
      this.alarmCallbacks.set(alarmId, onTrigger);
    }

    // Calculate delay
    const now = Date.now();
    const delay = scheduledTime - now;

    if (delay <= 0) {
      // Trigger immediately if time has passed
      this.triggerAlarm(alarm);
    } else {
      // Schedule timeout
      const timeoutId = setTimeout(() => {
        this.triggerAlarm(alarm);
      }, delay) as unknown as number;
      
      alarm.timeoutId = timeoutId;
    }

    this.alarms.set(alarmId, alarm);
    console.log(`Alarm scheduled: ${title} at ${new Date(scheduledTime).toLocaleString()}`);
    
    return alarmId;
  }

  // Trigger an alarm
  private async triggerAlarm(alarm: Alarm) {
    if (!alarm.isActive) return;

    console.log(`Alarm triggered: ${alarm.title}`);
    
    // Check if we're in PWA mode or mobile
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true ||
                  document.referrer.includes('android-app://');
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log(`Alarm context - PWA: ${isPWA}, Mobile: ${isMobile}`);
    
    try {
      if (isPWA || isMobile) {
        // Check if push service is initialized before using it
        const isPushServiceReady = await pushNotificationService.isInitialized();
        
        if (isPushServiceReady) {
          // Use Service Worker notifications with actions for mobile/PWA
          console.log('Using Service Worker notification for mobile/PWA');
          await pushNotificationService.showLocalNotification(`🔔 ${alarm.title}`, {
            body: alarm.body || 'Your todo alarm is ringing!',
            icon: '/icon-192.svg',
            badge: '/icon-192.svg',
            tag: alarm.id,
            requireInteraction: true,
            vibrate: [300, 200, 300, 200, 300, 200, 300, 200, 300],
            silent: false,
            renotify: true,
            actions: [
              { action: 'complete', title: 'Mark Done', icon: '/icon-192.svg' },
              { action: 'snooze', title: 'Snooze 5min', icon: '/icon-192.svg' },
              { action: 'dismiss', title: 'Dismiss', icon: '/icon-192.svg' }
            ],
            data: {
              todoId: alarm.todoId,
              alarmId: alarm.id,
              type: 'alarm',
              timestamp: Date.now()
            }
          });
        } else {
          // Push service not ready, fall back to regular notification
          console.log('Push service not ready, falling back to regular notification');
          throw new Error('Push service not initialized');
        }
      } else {
        // Use regular notifications for desktop
        console.log('Using regular notification for desktop');
        await notificationService.showNotification(alarm.title, {
          body: alarm.body || 'Your todo alarm is ringing!',
          requireInteraction: true,
          vibrate: [300, 200, 300, 200, 300, 200, 300, 200, 300],
          tag: alarm.id,
          silent: false,
          renotify: true,
          data: {
            todoId: alarm.todoId,
            alarmId: alarm.id,
            action: 'alarm'
          }
        });
      }
    } catch (error) {
      console.error('Error showing alarm notification:', error);
      
      // Fallback to regular notification if Service Worker fails
      try {
        console.log('Falling back to regular notification');
        await notificationService.showNotification(alarm.title, {
          body: alarm.body || 'Your todo alarm is ringing!',
          requireInteraction: true,
          vibrate: [300, 200, 300, 200, 300, 200, 300, 200, 300],
          tag: alarm.id,
          silent: false,
          renotify: true,
          data: {
            todoId: alarm.todoId,
            alarmId: alarm.id,
            action: 'alarm'
          }
        });
      } catch (fallbackError) {
        console.error('Fallback notification also failed:', fallbackError);
      }
    }

    // Trigger callback if registered
    const callback = this.alarmCallbacks.get(alarm.id);
    if (callback) {
      callback(alarm);
    }

    // Remove alarm after triggering
    this.cancelAlarm(alarm.id);
  }

  // Cancel an alarm
  cancelAlarm(alarmId: string): boolean {
    const alarm = this.alarms.get(alarmId);
    if (!alarm) return false;

    if (alarm.timeoutId) {
      clearTimeout(alarm.timeoutId as unknown as NodeJS.Timeout);
    }

    alarm.isActive = false;
    this.alarms.delete(alarmId);
    this.alarmCallbacks.delete(alarmId);
    
    console.log(`Alarm cancelled: ${alarmId}`);
    return true;
  }

  // Cancel all alarms for a specific todo
  cancelAlarmsForTodo(todoId: string): number {
    let cancelledCount = 0;
    
    for (const [alarmId, alarm] of this.alarms.entries()) {
      if (alarm.todoId === todoId) {
        this.cancelAlarm(alarmId);
        cancelledCount++;
      }
    }
    
    return cancelledCount;
  }

  // Get all active alarms
  getActiveAlarms(): Alarm[] {
    return Array.from(this.alarms.values()).filter(alarm => alarm.isActive);
  }

  // Get alarms for a specific todo
  getAlarmsForTodo(todoId: string): Alarm[] {
    return Array.from(this.alarms.values()).filter(
      alarm => alarm.todoId === todoId && alarm.isActive
    );
  }

  // Snooze an alarm
  snoozeAlarm(alarmId: string, minutes: number): string | null {
    const alarm = this.alarms.get(alarmId);
    if (!alarm || !alarm.isActive) return null;

    // Cancel current alarm
    this.cancelAlarm(alarmId);

    // Schedule new alarm
    const newScheduledTime = Date.now() + (minutes * 60 * 1000);
    const callback = this.alarmCallbacks.get(alarmId);
    
    return this.scheduleAlarm(
      alarm.todoId,
      alarm.title,
      newScheduledTime,
      alarm.body,
      callback
    );
  }

  // Clear all alarms
  clearAllAlarms(): void {
    for (const alarmId of this.alarms.keys()) {
      this.cancelAlarm(alarmId);
    }
  }

  // Check if browser supports notifications
  isNotificationSupported(): boolean {
    return notificationService.isNotificationSupported;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    return await notificationService.requestPermission();
  }
}

// Create singleton instance
const alarmManager = new AlarmManager();

export default alarmManager;
