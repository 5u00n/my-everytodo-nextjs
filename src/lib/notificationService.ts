class NotificationService {
  private static instance: NotificationService;
  private activeAlarms: Map<string, NodeJS.Timeout> = new Map();
  private notificationPermission: NotificationPermission = 'default';
  private isInitialized = false;

  private constructor() {
    // Don't initialize anything in constructor to avoid SSR issues
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.isInitialized = true;
    await this.requestPermission();
    this.setupServiceWorker();
  }

  private async requestPermission(): Promise<void> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.notificationPermission = await Notification.requestPermission();
    }
  }

  private setupServiceWorker(): void {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  async showNotification(
    title: string,
    options: any
  ): Promise<void> {
    await this.initialize();
    
    if (typeof window === 'undefined' || this.notificationPermission !== 'granted') {
      console.warn('Notification permission not granted or not in browser');
      return;
    }

    const notificationOptions: any = {
      ...options,
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      requireInteraction: options.persistent || false,
      actions: options.actions || [
        {
          action: 'complete',
          title: 'Mark Complete',
          icon: '/icon-192x192.svg'
        },
        {
          action: 'snooze',
          title: 'Snooze 1 min',
          icon: '/icon-192x192.svg'
        }
      ]
    };

    const notification = new Notification(title, notificationOptions);

    // Handle notification click
    notification.onclick = (event: any) => {
      event.preventDefault();
      window.focus();
      // Handle different actions
      if (event.action === 'complete') {
        this.handleCompleteAction(options.todoId);
      } else if (event.action === 'snooze') {
        this.handleSnoozeAction(options.todoId);
      } else {
        // Default click behavior - focus the app
        window.focus();
      }
      notification.close();
    };

    // Auto-close after 10 seconds if not persistent
    if (!options.persistent) {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  }

  private handleCompleteAction(todoId: string): void {
    // This will be connected to the todo completion logic
    window.dispatchEvent(new CustomEvent('todo-complete', { detail: { todoId } }));
  }

  private handleSnoozeAction(todoId: string): void {
    // This will be connected to the snooze logic
    window.dispatchEvent(new CustomEvent('todo-snooze', { detail: { todoId } }));
  }

  scheduleAlarm(todoId: string, scheduledTime: number, todo: any): void {
    const now = Date.now();
    const delay = scheduledTime - now;

    if (delay <= 0) {
      // Alarm is due now
      this.triggerAlarm(todoId, todo);
      return;
    }

    // Clear existing alarm for this todo
    this.cancelAlarm(todoId);

    // Schedule new alarm
    const timeoutId = setTimeout(() => {
      this.triggerAlarm(todoId, todo);
    }, delay);

    this.activeAlarms.set(todoId, timeoutId);
  }

  private async triggerAlarm(todoId: string, todo: any): Promise<void> {
    // Show persistent notification
    await this.showNotification(
      `⏰ ${todo.title}`,
      {
        body: todo.description || 'Time to complete your tasks!',
        todoId,
        persistent: true,
        tag: `alarm-${todoId}`,
        renotify: true,
        vibrate: todo.alarmSettings?.vibrate ? [200, 100, 200] : undefined,
      }
    );

    // Play sound if enabled
    if (todo.alarmSettings?.sound) {
      this.playAlarmSound(todo.alarmSettings.sound);
    }

    // Set up recurring notification for persistent alarms
    if (todo.alarmSettings?.enabled && !todo.isCompleted) {
      // Show notification every 30 seconds until completed
      const intervalId = setInterval(() => {
        if (todo.isCompleted) {
          clearInterval(intervalId);
          return;
        }
        
        this.showNotification(
          `⏰ ${todo.title} - Still Pending`,
          {
            body: 'Complete your tasks to stop this alarm!',
            todoId,
            persistent: true,
            tag: `alarm-${todoId}`,
            renotify: true,
            vibrate: todo.alarmSettings?.vibrate ? [200, 100, 200] : undefined,
          }
        );
      }, 30000);

      // Store interval ID for cleanup
      this.activeAlarms.set(`${todoId}-interval`, intervalId as any);
    }
  }

  private playAlarmSound(soundName: string): void {
    try {
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.volume = 0.8;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  }

  cancelAlarm(todoId: string): void {
    const timeoutId = this.activeAlarms.get(todoId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activeAlarms.delete(todoId);
    }

    // Clear interval if exists
    const intervalId = this.activeAlarms.get(`${todoId}-interval`);
    if (intervalId) {
      clearInterval(intervalId as any);
      this.activeAlarms.delete(`${todoId}-interval`);
    }

    // Close any existing notifications for this todo
    if ('serviceWorker' in navigator && 'getRegistrations' in navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          if (registration.active) {
            registration.active.postMessage({
              action: 'closeNotification',
              tag: `alarm-${todoId}`
            });
          }
        });
      });
    }
  }

  cancelAllAlarms(): void {
    this.activeAlarms.forEach((timeoutId, todoId) => {
      if (todoId.includes('-interval')) {
        clearInterval(timeoutId as any);
      } else {
        clearTimeout(timeoutId);
      }
    });
    this.activeAlarms.clear();
  }

  // Vibrate device if supported
  vibrate(pattern: number | number[] = [200, 100, 200]): void {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // Check if notifications are supported and permitted
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && this.notificationPermission === 'granted';
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return this.notificationPermission;
  }
}

export default NotificationService;
