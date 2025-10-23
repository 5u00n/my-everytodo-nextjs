'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import NotificationService from '@/lib/notificationService';
import { Todo } from '@/types';

interface NotificationContextType {
  notificationService: NotificationService;
  scheduleAlarm: (todo: Todo) => void;
  cancelAlarm: (todoId: string) => void;
  cancelAllAlarms: () => void;
  isSupported: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificationService] = useState(() => NotificationService.getInstance());
  const [isSupported, setIsSupported] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark as client-side
    setIsClient(true);
    
    // Check if notifications are supported
    setIsSupported(notificationService.isSupported());

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { action, todoId } = event.data;
        
        if (action === 'complete-todo') {
          // Handle todo completion
          window.dispatchEvent(new CustomEvent('todo-complete', { detail: { todoId } }));
        } else if (action === 'snooze-todo') {
          // Handle todo snooze
          window.dispatchEvent(new CustomEvent('todo-snooze', { detail: { todoId } }));
        }
      });
    }

    // Listen for custom events from notification service
    const handleTodoComplete = (event: CustomEvent) => {
      console.log('Todo complete event:', event.detail);
      // This will be connected to the todo completion logic
    };

    const handleTodoSnooze = (event: CustomEvent) => {
      console.log('Todo snooze event:', event.detail);
      // This will be connected to the snooze logic
    };

    window.addEventListener('todo-complete', handleTodoComplete as EventListener);
    window.addEventListener('todo-snooze', handleTodoSnooze as EventListener);

    return () => {
      window.removeEventListener('todo-complete', handleTodoComplete as EventListener);
      window.removeEventListener('todo-snooze', handleTodoSnooze as EventListener);
    };
  }, [notificationService]);

  const scheduleAlarm = (todo: Todo) => {
    if (todo.alarmSettings.enabled && !todo.isCompleted) {
      notificationService.scheduleAlarm(todo.id, todo.scheduledTime, todo);
    }
  };

  const cancelAlarm = (todoId: string) => {
    notificationService.cancelAlarm(todoId);
  };

  const cancelAllAlarms = () => {
    notificationService.cancelAllAlarms();
  };

  const value: NotificationContextType = {
    notificationService,
    scheduleAlarm,
    cancelAlarm,
    cancelAllAlarms,
    isSupported,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
