'use client';

class NotificationService {
  private permission: NotificationPermission = 'default';
  private isSupported: boolean = false;
  private userHasInteracted: boolean = false;
  private alarmSoundType: 'normal' | 'extreme' = 'normal';

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSupported = 'Notification' in window;
      this.permission = Notification.permission;
      
      // Track user interaction for vibration
      this.setupUserInteractionTracking();
    }
  }

  private setupUserInteractionTracking() {
    const trackInteraction = () => {
      this.userHasInteracted = true;
    };

    // Listen for any user interaction
    document.addEventListener('click', trackInteraction, { once: true });
    document.addEventListener('touchstart', trackInteraction, { once: true });
    document.addEventListener('keydown', trackInteraction, { once: true });
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
      data?: Record<string, unknown>;
      requireInteraction?: boolean;
      silent?: boolean;
      vibrate?: number[];
      renotify?: boolean;
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
      const notificationOptions: NotificationOptions & { actions?: any[]; vibrate?: number[]; renotify?: boolean } = {
        body: options.body,
        icon: options.icon || '/icon-192.svg',
        badge: options.badge || '/icon-192.svg',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        renotify: options.renotify || false,
        actions: options.actions || []
      };

      // Add vibrate only if supported
      if (options.vibrate) {
        notificationOptions.vibrate = options.vibrate;
      }

      const notification = new Notification(title, notificationOptions);

      // Play appropriate sound based on notification type
      if (options.data?.action === 'alarm') {
        // Use alarm sound for alarm notifications
        this.playAlarmSound();
      } else {
        // Use regular notification sound for other notifications
        this.playNotificationSound();
      }

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // Handle different actions
        if (options.data?.action && typeof options.data.action === 'string') {
          this.handleNotificationAction(options.data.action, options.data.todoId as string);
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
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
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
    options: Record<string, unknown> = {}
  ): Promise<number> {
    const now = Date.now();
    const delay = scheduledTime - now;

    if (delay <= 0) {
      // If the time has already passed, show immediately
      const notification = await this.showNotification(title, options);
      return notification ? 1 : 0;
    }

    const timeoutId = setTimeout(() => {
      this.startPersistentAlarm(title, options);
    }, delay);

    return timeoutId as unknown as number;
  }

  private async startPersistentAlarm(title: string, options: Record<string, unknown>) {
    const duration = (options.duration as number) || 5; // Default 5 minutes
    const repeatCount = (options.repeatCount as number) || 3; // Default 3 repeats
    const snoozeMinutes = (options.snoozeMinutes as number) || 1;
    
    let currentRepeat = 0;
    const intervalTime = (duration * 60 * 1000) / repeatCount; // Distribute repeats over duration

    const alarmInterval = setInterval(async () => {
      if (currentRepeat >= repeatCount) {
        clearInterval(alarmInterval);
        return;
      }

      // Show persistent notification
      const notification = await this.showNotification(title, {
        ...options,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        tag: `alarm-${Date.now()}`, // Unique tag to prevent stacking
        actions: [
          { action: 'snooze', title: `Snooze ${snoozeMinutes}min`, icon: '/icon-192.svg' },
          { action: 'complete', title: 'Mark Done', icon: '/icon-192.svg' },
          { action: 'stop', title: 'Stop Alarm', icon: '/icon-192.svg' }
        ],
        data: {
          ...(options.data || {}),
          action: 'alarm',
          snoozeMinutes,
          alarmId: `alarm-${Date.now()}`
        }
      });

      // Play longer alarm sound
      this.playAlarmSound();

      currentRepeat++;
    }, intervalTime);

    // Store interval ID for potential cancellation
    return alarmInterval;
  }

  private playAlarmSound() {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // Play alarm sound based on type
      if (this.alarmSoundType === 'extreme') {
        this.playAggressiveAlarmSound(audioContext);
      } else {
        this.playNormalAlarmSound(audioContext);
      }
      
      // Use enhanced vibration for locked screen scenarios
      this.playLockedScreenVibration();
    } catch (error) {
      console.log('Audio alarm not supported:', error);
    }
  }

  private playNormalAlarmSound(audioContext: AudioContext) {
    const duration = 3; // 3 seconds for normal alarm
    
    // Create traditional alarm sound pattern (beep-beep-beep)
    const beepDuration = 0.3; // 300ms beep
    const pauseDuration = 0.2; // 200ms pause
    const cycleDuration = beepDuration + pauseDuration; // 500ms total cycle
    const cycles = Math.floor(duration / cycleDuration);
    
    // Traditional alarm frequencies (pleasant but noticeable)
    const lowFreq = 440; // A4 note
    const highFreq = 523; // C5 note
    
    for (let i = 0; i < cycles; i++) {
      const cycleStart = audioContext.currentTime + (i * cycleDuration);
      
      // Create oscillator for first beep (low tone)
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      
      oscillator1.type = 'sine'; // Gentle sine wave
      oscillator1.frequency.setValueAtTime(lowFreq, cycleStart);
      gainNode1.gain.setValueAtTime(0.3, cycleStart);
      gainNode1.gain.setValueAtTime(0.3, cycleStart + beepDuration);
      gainNode1.gain.setValueAtTime(0.01, cycleStart + beepDuration + 0.01);
      
      oscillator1.start(cycleStart);
      oscillator1.stop(cycleStart + beepDuration);
      
      // Create oscillator for second beep (high tone) - start after pause
      const secondBeepStart = cycleStart + beepDuration + pauseDuration;
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.type = 'sine'; // Gentle sine wave
      oscillator2.frequency.setValueAtTime(highFreq, secondBeepStart);
      gainNode2.gain.setValueAtTime(0.3, secondBeepStart);
      gainNode2.gain.setValueAtTime(0.3, secondBeepStart + beepDuration);
      gainNode2.gain.setValueAtTime(0.01, secondBeepStart + beepDuration + 0.01);
      
      oscillator2.start(secondBeepStart);
      oscillator2.stop(secondBeepStart + beepDuration);
    }
  }

  private playAggressiveAlarmSound(audioContext: AudioContext) {
    const duration = 5; // 5 seconds of aggressive sound
    
    // Create multiple oscillators for a chaotic, wake-up inducing sound
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    
    // Create 4 oscillators with different frequencies for chaos
    for (let i = 0; i < 4; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillators.push(oscillator);
      gainNodes.push(gainNode);
    }
    
    // Set up chaotic frequency patterns
    const frequencies = [200, 400, 800, 1200]; // Low to high frequencies
    const startTime = audioContext.currentTime;
    
    oscillators.forEach((oscillator, index) => {
      oscillator.type = 'sawtooth'; // More aggressive than sine wave
      oscillator.frequency.setValueAtTime(frequencies[index], startTime);
      
      // Create chaotic frequency modulation
      for (let t = 0; t < duration; t += 0.1) {
        const randomFreq = frequencies[index] + (Math.random() - 0.5) * 200;
        oscillator.frequency.setValueAtTime(randomFreq, startTime + t);
      }
      
      // Aggressive volume envelope
      gainNodes[index].gain.setValueAtTime(0, startTime);
      gainNodes[index].gain.linearRampToValueAtTime(0.4, startTime + 0.1); // Quick attack
      gainNodes[index].gain.setValueAtTime(0.4, startTime + duration - 0.1);
      gainNodes[index].gain.linearRampToValueAtTime(0, startTime + duration); // Quick release
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
    
    // Add additional chaotic elements
    setTimeout(() => {
      this.playFireAlarmSound(audioContext);
    }, 2000);
  }

  private playFireAlarmSound(audioContext: AudioContext) {
    const duration = 3;
    const startTime = audioContext.currentTime;
    
    // Create fire alarm pattern (rapid beeping)
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'square'; // Harsh square wave
    oscillator.frequency.setValueAtTime(1000, startTime); // High frequency
    
    // Rapid on/off pattern like fire alarm
    const beepDuration = 0.1; // 100ms beeps
    const pauseDuration = 0.1; // 100ms pauses
    const cycleDuration = beepDuration + pauseDuration;
    const cycles = Math.floor(duration / cycleDuration);
    
    for (let i = 0; i < cycles; i++) {
      const cycleStart = startTime + (i * cycleDuration);
      
      // Beep on
      gainNode.gain.setValueAtTime(0.5, cycleStart);
      gainNode.gain.setValueAtTime(0.5, cycleStart + beepDuration);
      
      // Beep off
      gainNode.gain.setValueAtTime(0.01, cycleStart + beepDuration + 0.01);
      gainNode.gain.setValueAtTime(0.01, cycleStart + cycleDuration);
    }
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  cancelNotification(timeoutId: number) {
    clearTimeout(timeoutId as unknown as NodeJS.Timeout);
  }

  // Enhanced vibration for locked screen scenarios
  private playLockedScreenVibration() {
    if ('vibrate' in navigator && this.userHasInteracted) {
      try {
        // More aggressive vibration pattern for locked screens
        const lockedScreenPattern = [
          500, 200, 500, 200, 500, 200,  // Long vibrations
          200, 100, 200, 100, 200, 100,  // Short vibrations
          500, 200, 500, 200, 500, 200   // Long vibrations again
        ];
        
        navigator.vibrate(lockedScreenPattern);
        
        // Schedule additional vibration cycles for persistent effect
        setTimeout(() => {
          if (this.userHasInteracted) {
            navigator.vibrate([300, 150, 300, 150, 300]);
          }
        }, 3000);
        
        setTimeout(() => {
          if (this.userHasInteracted) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        }, 6000);
      } catch (error) {
        // Ignore vibration errors
      }
    }
  }

  // Check if notifications are supported and permitted
  get isNotificationSupported(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  get permissionStatus(): NotificationPermission {
    return this.permission;
  }

  // Alarm sound type methods
  setAlarmSoundType(type: 'normal' | 'extreme') {
    this.alarmSoundType = type;
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('alarmSoundType', type);
    }
  }

  getAlarmSoundType(): 'normal' | 'extreme' {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('alarmSoundType');
      if (saved === 'normal' || saved === 'extreme') {
        this.alarmSoundType = saved;
      }
    }
    return this.alarmSoundType;
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

export default notificationService;
