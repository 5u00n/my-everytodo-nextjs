'use client';

class NotificationService {
  private permission: NotificationPermission = 'default';
  private isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSupported = 'Notification' in window;
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Notifications are not supported in this browser');
    }

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    return this.permission;
  }

  async showNotification(
    title: string, 
    options: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      requireInteraction?: boolean;
      silent?: boolean;
      vibrate?: number[];
      actions?: Array<{
        action: string;
        title: string;
        icon?: string;
      }>;
    } = {}
  ): Promise<Notification | null> {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Notifications not supported or permission not granted');
      return null;
    }

    try {
      const notificationOptions: any = {
        body: options.body,
        icon: options.icon || '/icon-192.svg',
        badge: options.badge || '/icon-192.svg',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        actions: options.actions || []
      };

      // Add vibrate only if supported
      if (options.vibrate) {
        notificationOptions.vibrate = options.vibrate;
      }

      const notification = new Notification(title, notificationOptions);

      // Play audio notification for PC
      this.playNotificationSound();

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // Handle different actions
        if (options.data?.action) {
          this.handleNotificationAction(options.data.action, options.data.todoId);
        }
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  private playNotificationSound() {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a simple beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio notification not supported:', error);
    }
  }

  private handleNotificationAction(action: string, todoId: string) {
    // This would typically communicate with the main app
    // For now, we'll just log the action
    console.log(`Notification action: ${action} for todo: ${todoId}`);
    
    // In a real implementation, you might:
    // - Send a message to the main app via postMessage
    // - Update the todo status in the database
    // - Show a confirmation dialog
  }

  async scheduleNotification(
    title: string,
    scheduledTime: number,
    options: any = {}
  ): Promise<number> {
    const now = Date.now();
    const delay = scheduledTime - now;

    if (delay <= 0) {
      // If the time has already passed, show immediately
      const notification = await this.showNotification(title, options);
      return notification ? 1 : 0;
    }

    const timeoutId = setTimeout(() => {
      this.showNotification(title, {
        ...options,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200]
      });
    }, delay);

    return timeoutId as unknown as number;
  }

  cancelNotification(timeoutId: number) {
    clearTimeout(timeoutId as unknown as NodeJS.Timeout);
  }

  // Check if notifications are supported and permitted
  get isNotificationSupported(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  get permissionStatus(): NotificationPermission {
    return this.permission;
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

export default notificationService;
