'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import notificationService from '@/lib/notificationService';

interface NotificationContextType {
  isSupported: boolean;
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (title: string, options?: Record<string, unknown>) => Promise<Notification | null>;
  scheduleNotification: (title: string, scheduledTime: number, options?: Record<string, unknown>) => Promise<number>;
  cancelNotification: (timeoutId: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setIsSupported(notificationService.isNotificationSupported);
        setPermission(notificationService.permissionStatus);
      }, 0);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    const newPermission = await notificationService.requestPermission();
    setPermission(newPermission);
    setIsSupported(notificationService.isNotificationSupported);
    return newPermission;
  };

  const showNotification = async (title: string, options?: Record<string, unknown>): Promise<Notification | null> => {
    return await notificationService.showNotification(title, options);
  };

  const scheduleNotification = async (title: string, scheduledTime: number, options?: Record<string, unknown>): Promise<number> => {
    return await notificationService.scheduleNotification(title, scheduledTime, options);
  };

  const cancelNotification = (timeoutId: number): void => {
    notificationService.cancelNotification(timeoutId);
  };

  return (
    <NotificationContext.Provider
      value={{
        isSupported,
        permission,
        requestPermission,
        showNotification,
        scheduleNotification,
        cancelNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
