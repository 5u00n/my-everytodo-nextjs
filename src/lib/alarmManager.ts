'use client';

import notificationService from './notificationService';
import pushNotificationService from './pushNotificationService';

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
    
    // Show push notification (works even when app is closed)
    try {
      await pushNotificationService.showLocalNotification(`🔔 ${alarm.title}`, {
        body: alarm.body || 'Your todo alarm is ringing!',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        tag: alarm.id,
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
    } catch (error) {
      console.error('Error showing push notification:', error);
      
      // Fallback to regular notification
      await notificationService.showNotification(alarm.title, {
        body: alarm.body || 'Your todo alarm is ringing!',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        tag: alarm.id,
        actions: [
          { action: 'complete', title: 'Mark Done', icon: '/icon-192.svg' },
          { action: 'snooze', title: 'Snooze 5min', icon: '/icon-192.svg' }
        ],
        data: {
          todoId: alarm.todoId,
          alarmId: alarm.id,
          action: 'alarm'
        }
      });
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
