'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ClientApp() {
  const { user, loading } = useAuth();
  const { isSupported } = useNotification();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <Dashboard />;
}
