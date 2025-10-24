'use client';

import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';
import { HomeViewSkeleton } from '@/components/Skeleton';

export default function Home() {
  const { user, loading } = useAuth();

  // Show skeleton during initial auth loading, not login page
  if (loading) {
    return <HomeViewSkeleton />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <Dashboard />;
}