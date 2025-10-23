'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, get, remove } from 'firebase/database';
import { 
  X, 
  User, 
  Mail, 
  Calendar, 
  Database, 
  Trash2, 
  RefreshCw, 
  Download,
  Settings,
  Info,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { VERSION_INFO } from '@/lib/version';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppStats {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  totalTasks: number;
  completedTasks: number;
  accountCreated: string;
  lastActive: string;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, firebaseUser } = useAuth();
  const [appStats, setAppStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetType, setResetType] = useState<'data' | 'cache' | 'all' | null>(null);
  const [resetProgress, setResetProgress] = useState<string>('');

  // App version info
  const appVersion = VERSION_INFO.appVersion;
  const buildDate = VERSION_INFO.buildTimestamp;
  const nodeVersion = VERSION_INFO.nodeVersion;
  const buildNumber = VERSION_INFO.buildNumber;
  const pwaVersion = VERSION_INFO.pwaVersion;

  useEffect(() => {
    if (isOpen && user) {
      loadAppStats();
    }
  }, [isOpen, user]);

  const loadAppStats = async () => {
    if (!user || !database) return;

    setLoading(true);
    try {
      const todosRef = ref(database, `todos/${user.id}`);
      const snapshot = await get(todosRef);
      
      if (snapshot.exists()) {
        const todosData = snapshot.val();
        const todos = Object.values(todosData) as any[];
        
        const totalTodos = todos.length;
        const completedTodos = todos.filter(todo => todo.isCompleted).length;
        const pendingTodos = totalTodos - completedTodos;
        
        const totalTasks = todos.reduce((sum, todo) => sum + (todo.tasks?.length || 0), 0);
        const completedTasks = todos.reduce((sum, todo) => 
          sum + (todo.tasks?.filter((task: any) => task.isCompleted).length || 0), 0
        );

        setAppStats({
          totalTodos,
          completedTodos,
          pendingTodos,
          totalTasks,
          completedTasks,
          accountCreated: user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'Unknown',
          lastActive: format(new Date(), 'MMM d, yyyy h:mm a')
        });
      } else {
        setAppStats({
          totalTodos: 0,
          completedTodos: 0,
          pendingTodos: 0,
          totalTasks: 0,
          completedTasks: 0,
          accountCreated: user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'Unknown',
          lastActive: format(new Date(), 'MMM d, yyyy h:mm a')
        });
      }
    } catch (error) {
      console.error('Error loading app stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    if (!user || !database) return;

    setResetProgress('Deleting all todos...');
    try {
      const todosRef = ref(database, `todos/${user.id}`);
      await remove(todosRef);
      
      setResetProgress('Clearing local storage...');
      localStorage.clear();
      sessionStorage.clear();
      
      setResetProgress('Resetting service worker...');
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
      
      setResetProgress('Complete! Refreshing page...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error resetting data:', error);
      setResetProgress('Error occurred. Please try again.');
    }
  };

  const handleResetCache = async () => {
    setResetProgress('Clearing cache...');
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      setResetProgress('Resetting service worker...');
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
      
      setResetProgress('Complete! Refreshing page...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error resetting cache:', error);
      setResetProgress('Error occurred. Please try again.');
    }
  };

  const handleResetAll = async () => {
    setResetProgress('Resetting everything...');
    try {
      // Reset data
      await handleResetData();
      // Reset cache
      await handleResetCache();
    } catch (error) {
      console.error('Error resetting all:', error);
      setResetProgress('Error occurred. Please try again.');
    }
  };

  const exportData = async () => {
    if (!user || !database) return;

    try {
      const todosRef = ref(database, `todos/${user.id}`);
      const snapshot = await get(todosRef);
      
      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          createdAt: user.createdAt
        },
        todos: snapshot.exists() ? snapshot.val() : {},
        exportDate: new Date().toISOString(),
        appVersion
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `everytodo-backup-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Profile & Settings</h2>
              <p className="text-sm text-muted-foreground">Manage your account and app data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="macos-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{user?.displayName}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Member since {appStats?.accountCreated || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* App Stats */}
          {loading ? (
            <div className="macos-card p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-muted-foreground">Loading statistics...</p>
            </div>
          ) : (
            <div className="macos-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Your Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{appStats?.totalTodos || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Todos</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{appStats?.completedTodos || 0}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{appStats?.pendingTodos || 0}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{appStats?.totalTasks || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                </div>
              </div>
            </div>
          )}

          {/* App Version */}
          <div className="macos-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              App Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">App Version:</span>
                <span className="text-foreground font-mono">{appVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Build Number:</span>
                <span className="text-foreground font-mono">{buildNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PWA Version:</span>
                <span className="text-foreground font-mono">{pwaVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Build Date:</span>
                <span className="text-foreground font-mono">{format(new Date(buildDate), 'MMM d, yyyy HH:mm')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Node Version:</span>
                <span className="text-foreground font-mono">{nodeVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Active:</span>
                <span className="text-foreground font-mono">{appStats?.lastActive || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="macos-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Data Management
            </h3>
            <div className="space-y-3">
              <button
                onClick={exportData}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
              
              <button
                onClick={() => {
                  setResetType('data');
                  setShowResetConfirm(true);
                }}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset All Data</span>
              </button>
              
              <button
                onClick={() => {
                  setResetType('cache');
                  setShowResetConfirm(true);
                }}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Clear Cache & Service Worker</span>
              </button>
            </div>
          </div>

          {/* Reset Progress */}
          {resetProgress && (
            <div className="macos-card p-4 bg-blue-50 border border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 text-sm">{resetProgress}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-card rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Confirm Reset</h3>
                  <p className="text-sm text-muted-foreground">
                    {resetType === 'data' && 'This will permanently delete all your todos and data.'}
                    {resetType === 'cache' && 'This will clear all cached data and reset the service worker.'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowResetConfirm(false);
                    setResetType(null);
                  }}
                  className="flex-1 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowResetConfirm(false);
                    if (resetType === 'data') {
                      handleResetData();
                    } else if (resetType === 'cache') {
                      handleResetCache();
                    }
                    setResetType(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
