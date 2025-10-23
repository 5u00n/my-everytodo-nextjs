export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
  lastLoginAt: number;
}

export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: number;
}

export interface RepeatPattern {
  type: 'once' | 'daily' | 'weekdays' | 'custom';
  days?: number[]; // For custom patterns (0 = Sunday, 1 = Monday, etc.)
  endDate?: number; // Optional end date for recurring patterns
}

export interface AlarmSettings {
  enabled: boolean;
  vibrate: boolean;
  notification: boolean;
  sound?: string;
  volume?: number;
}

export interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  scheduledTime: number;
  tasks: Task[];
  repeatPattern: RepeatPattern;
  alarmSettings: AlarmSettings;
  isCompleted: boolean;
  isActive: boolean; // For persistent alarms
  snoozeUntil?: number; // When snoozed until
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface ActivityReport {
  id: string;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: number;
  endDate: number;
  totalTodos: number;
  completedTodos: number;
  completionRate: number;
  averageResponseTime: number; // in minutes
  mostProductiveHour: number;
  mostProductiveDay: string;
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    type: 'todo' | 'alarm';
    todoId: string;
    isCompleted: boolean;
    priority: 'low' | 'medium' | 'high';
  };
}

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  desktop: boolean;
  mobile: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  defaultAlarmSound: string;
  defaultSnoozeDuration: number; // in minutes
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  timeFormat: '12h' | '24h';
}
