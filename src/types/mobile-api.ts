// Mobile API Types for EveryTodo App
// These types define the API contracts for mobile app integration

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication Types
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    createdAt: number;
  };
  token: string;
}

export interface LoginRequest {
  idToken: string; // Firebase ID token from mobile app
}

// Todo Types
export interface TodoRequest {
  title: string;
  description?: string;
  scheduledTime: number;
  tasks: TaskRequest[];
  repeatPattern: RepeatPatternRequest;
  alarmSettings: AlarmSettingsRequest;
  isActive?: boolean;
}

export interface TaskRequest {
  text: string;
  isCompleted?: boolean;
}

export interface RepeatPatternRequest {
  type: 'none' | 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'monthly';
  days?: number[]; // For weekly: 0-6 (Sunday-Saturday)
  interval?: number; // For weekly/monthly intervals
}

export interface AlarmSettingsRequest {
  enabled: boolean;
  vibrate: boolean;
  sound: boolean;
  notification: boolean;
  snoozeMinutes?: number;
  duration?: number; // Alarm duration in minutes
  repeatCount?: number; // How many times to repeat
}

export interface TodoResponse {
  id: string;
  title: string;
  description?: string;
  tasks: TaskResponse[];
  scheduledTime: number;
  repeatPattern: RepeatPatternRequest;
  alarmSettings: AlarmSettingsRequest;
  isCompleted: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  userId: string;
}

export interface TaskResponse {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: number;
}

// Alarm Types
export interface AlarmResponse {
  id: string;
  todoId: string;
  title: string;
  body?: string;
  scheduledTime: number;
  isActive: boolean;
  createdAt: number;
}

export interface AlarmRequest {
  todoId: string;
  title: string;
  body?: string;
  scheduledTime: number;
}

// Notification Types
export interface PushSubscriptionRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationRequest {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Reports Types
export interface ReportRequest {
  startDate: number;
  endDate: number;
  type: 'productivity' | 'completion' | 'alarms' | 'tasks';
}

export interface ProductivityReport {
  totalTodos: number;
  completedTodos: number;
  completionRate: number;
  averageCompletionTime: number;
  mostProductiveHour: number;
  mostProductiveDay: string;
  tasksCompleted: number;
  totalTasks: number;
  taskCompletionRate: number;
}

export interface CompletionReport {
  dailyCompletions: Array<{
    date: string;
    completed: number;
    total: number;
  }>;
  weeklyCompletions: Array<{
    week: string;
    completed: number;
    total: number;
  }>;
  monthlyCompletions: Array<{
    month: string;
    completed: number;
    total: number;
  }>;
}

export interface AlarmReport {
  totalAlarms: number;
  triggeredAlarms: number;
  snoozedAlarms: number;
  dismissedAlarms: number;
  averageSnoozeCount: number;
  mostFrequentAlarmTime: number;
}

export interface TaskReport {
  totalTasks: number;
  completedTasks: number;
  averageTasksPerTodo: number;
  mostCommonTaskTypes: Array<{
    text: string;
    count: number;
  }>;
}

// Calendar Types
export interface CalendarRequest {
  startDate: number;
  endDate: number;
  view: 'month' | 'week' | 'day';
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: number;
  end: number;
  type: 'todo' | 'alarm';
  todoId?: string;
  alarmId?: string;
  isCompleted?: boolean;
  isActive?: boolean;
}

// User Profile Types
export interface UserProfileRequest {
  displayName?: string;
  photoURL?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibrate: boolean;
    quietHours?: {
      start: string; // HH:MM format
      end: string; // HH:MM format
    };
  };
  alarms: {
    defaultSnoozeMinutes: number;
    defaultDuration: number;
    defaultRepeatCount: number;
  };
}

export interface UserProfileResponse {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  preferences: UserPreferences;
  createdAt: number;
  updatedAt: number;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Webhook Types (for future integrations)
export interface WebhookRequest {
  event: 'todo.created' | 'todo.updated' | 'todo.completed' | 'alarm.triggered';
  data: any;
  timestamp: number;
}

// Sync Types (for offline support)
export interface SyncRequest {
  lastSyncTime: number;
  changes: Array<{
    type: 'create' | 'update' | 'delete';
    entity: 'todo' | 'task' | 'alarm';
    id: string;
    data?: any;
    timestamp: number;
  }>;
}

export interface SyncResponse {
  serverTime: number;
  changes: Array<{
    type: 'create' | 'update' | 'delete';
    entity: 'todo' | 'task' | 'alarm';
    id: string;
    data?: any;
    timestamp: number;
  }>;
  conflicts?: Array<{
    entity: 'todo' | 'task' | 'alarm';
    id: string;
    localData: any;
    serverData: any;
  }>;
}
