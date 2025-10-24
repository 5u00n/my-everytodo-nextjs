'use client';

import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { user, loading } = useAuth();

  // Show login page immediately, let Dashboard handle its own loading
  if (loading) {
    return <LoginPage />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <Dashboard />;
}