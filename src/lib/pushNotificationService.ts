'use client';

class PushNotificationService {
  private vapidPublicKey: string;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    // VAPID public key - in production, this should come from environment variables
    this.vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0FyHpQz4Sw7nQj8ryQPTQsKpL2zJmU3BjcHuW4hdBDiF6LfMFQ7XGp9dE';
  }

  // Initialize push notifications
  async initialize(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications are not supported');
        return false;
      }

      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;
      
      // Check if push is supported
      if (!this.registration.pushManager) {
        console.log('Push messaging is not supported');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  // Request permission for push notifications
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.registration) {
      throw new Error('Push service not initialized');
    }

    // Check current permission
    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Push service not initialized');
    }

    try {
      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
      }

      // Store subscription in localStorage
      localStorage.setItem('pushSubscription', JSON.stringify(subscription));
      
      console.log('Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        localStorage.removeItem('pushSubscription');
        console.log('Push subscription removed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  // Send push notification (for testing)
  async sendTestNotification(): Promise<void> {
    if (!this.registration) {
      throw new Error('Push service not initialized');
    }

    const subscription = await this.registration.pushManager.getSubscription();
    if (!subscription) {
      throw new Error('No push subscription found');
    }

    // In a real app, you would send this to your server
    // For now, we'll show a local notification
    await this.showLocalNotification('Test Push Notification', {
      body: 'This is a test push notification from EveryTodo!',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: 'test-notification',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View App', icon: '/icon-192.svg' }
      ]
    });
  }

  // Show local notification
  async showLocalNotification(title: string, options: any = {}): Promise<void> {
    if (!this.registration) {
      throw new Error('Push service not initialized');
    }

    const defaultOptions: any = {
      body: '',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: 'everytodo-notification',
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      ...options
    };

    await this.registration.showNotification(title, defaultOptions);
  }

  // Schedule push notification for alarm
  async scheduleAlarmNotification(
    todoId: string,
    title: string,
    scheduledTime: number,
    body?: string
  ): Promise<void> {
    const now = Date.now();
    const delay = scheduledTime - now;

    if (delay <= 0) {
      // Show immediately if time has passed
      await this.showAlarmNotification(todoId, title, body);
      return;
    }

    // Schedule for later
    setTimeout(async () => {
      await this.showAlarmNotification(todoId, title, body);
    }, delay);
  }

  // Show alarm notification
  private async showAlarmNotification(
    todoId: string,
    title: string,
    body?: string
  ): Promise<void> {
    await this.showLocalNotification(`🔔 ${title}`, {
      body: body || 'Your todo alarm is ringing!',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: `alarm-${todoId}`,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      actions: [
        { action: 'complete', title: 'Mark Done', icon: '/icon-192.svg' },
        { action: 'snooze', title: 'Snooze 5min', icon: '/icon-192.svg' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icon-192.svg' }
      ],
      data: {
        todoId,
        type: 'alarm',
        timestamp: Date.now()
      }
    });
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  // Check if user has granted permission
  hasPermission(): boolean {
    return Notification.permission === 'granted';
  }

  // Get current subscription
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }
    return await this.registration.pushManager.getSubscription();
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  }

  // Handle notification click
  static handleNotificationClick(event: any): void {
    event.notification.close();

    const data = event.notification.data;
    const action = event.action;

    if (action === 'complete' && data?.todoId) {
      // Handle complete action
      window.focus();
      // Send message to main app
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'NOTIFICATION_ACTION',
          action: 'complete',
          todoId: data.todoId
        });
      }
    } else if (action === 'snooze' && data?.todoId) {
      // Handle snooze action
      window.focus();
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'NOTIFICATION_ACTION',
          action: 'snooze',
          todoId: data.todoId,
          minutes: 5
        });
      }
    } else if (action === 'dismiss' && data?.todoId) {
      // Handle dismiss action
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'NOTIFICATION_ACTION',
          action: 'dismiss',
          todoId: data.todoId
        });
      }
    } else {
      // Default click - open app
      window.focus();
    }
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
