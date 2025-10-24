export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
}

export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: number;
}

export interface RepeatPattern {
  type: 'none' | 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'monthly';
  days?: number[];
  interval?: number;
}

export interface AlarmSettings {
  enabled: boolean;
  vibrate: boolean;
  sound: boolean;
  notification: boolean;
  snoozeMinutes: number;
  duration: number; // Duration in minutes (default 5 minutes)
  repeatCount: number; // How many times to repeat the alarm (default 3)
  soundType?: 'normal' | 'extreme'; // Alarm sound type (default 'normal')
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
  scheduledTime: number;
  repeatPattern: RepeatPattern;
  alarmSettings: AlarmSettings;
  isCompleted: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  userId: string;
}
