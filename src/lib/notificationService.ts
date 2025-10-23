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
