'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { CustomFloatingDock } from '@/components/CustomFloatingDock';
import { ThemeToggle } from '@/components/theme-toggle';
import { HomeViewSkeleton, CalendarSkeleton, ReportsSkeleton } from '@/components/Skeleton';
import TaskDetailModal from './TaskDetailModal';
import TodoModal from './TodoModal';
import { format, isToday, isTomorrow, addDays, isWithinInterval, isPast } from 'date-fns';
import alarmManager from '@/lib/alarmManager';
import pushNotificationService from '@/lib/pushNotificationService';
import { database } from '@/lib/firebase';
import { ref, onValue, off, update, remove } from 'firebase/database';
import { Todo } from '@/types';
import AnimatedHero from './AnimatedHero';
import TodoList from './TodoList';
import CalendarView from './CalendarView';
import ReportsView from './ReportsView';
import ProfileModal from './ProfileModal';
import UserAvatar from './UserAvatar';
import VersionDisplay from './VersionDisplay';
import { 
  Home, 
  Calendar, 
  BarChart3, 
  User, 
  LogOut,
  Bell,
  CheckCircle2,
  Circle,
  Download
} from 'lucide-react';

type View = 'home' | 'todos' | 'calendar' | 'reports';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { showNotification } = useNotification();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('home');
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  // Check if PWA is installed
  useEffect(() => {
    const checkPWAInstallation = () => {
      // Check if running in standalone mode (PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check if installed via beforeinstallprompt
      const isInstalled = localStorage.getItem('pwa-installed') === 'true';
      setIsPWAInstalled(isStandalone || isInstalled);
    };

    checkPWAInstallation();
    
    // Listen for PWA installation
    window.addEventListener('beforeinstallprompt', () => {
      setIsPWAInstalled(false);
    });
    
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwa-installed', 'true');
      setIsPWAInstalled(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  // Load todos from Firebase
  useEffect(() => {
    if (!user || !database) return;

    const todosRef = ref(database, `users/${user.id}/todos`);
    
    const unsubscribe = onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const todosArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setTodos(todosArray);
      } else {
        setTodos([]);
      }
      setLoading(false);
    });

    return () => {
      off(todosRef, 'value', unsubscribe);
    };
  }, [user]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      showNotification('Signed out successfully', { type: 'success' });
    } catch (error) {
      console.error('Sign out error:', error);
      showNotification('Failed to sign out', { type: 'error' });
    }
  };

  // Open task detail modal
  const openTaskDetail = (todo: Todo) => {
    setSelectedTodo(todo);
    setShowTaskDetailModal(true);
  };

  // Close task detail modal
  const closeTaskDetail = () => {
    setShowTaskDetailModal(false);
    setSelectedTodo(null);
  };

  // Open todo modal
  const openTodoModal = () => {
    setShowTodoModal(true);
  };

  // Close todo modal
  const closeTodoModal = () => {
    setShowTodoModal(false);
  };

  // Toggle todo completion
  const toggleTodo = async (todoId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    try {
      if (!database) return;
      const todoRef = ref(database, `users/${user?.id}/todos/${todoId}`);
      await update(todoRef, {
        isCompleted: !todo.isCompleted,
        completedAt: !todo.isCompleted ? Date.now() : null
      } as Record<string, unknown>);
      
      showNotification(
        todo.isCompleted ? 'Task marked as incomplete' : 'Task completed!',
        { type: 'success' }
      );
    } catch (error) {
      console.error('Error updating todo:', error);
      showNotification('Failed to update task', { type: 'error' });
    }
  };

  // Delete todo
  const deleteTodo = async (todoId: string) => {
    try {
      if (!database) return;
      const todoRef = ref(database, `users/${user?.id}/todos/${todoId}`);
      await remove(todoRef);
      showNotification('Task deleted successfully', { type: 'success' });
    } catch (error) {
      console.error('Error deleting todo:', error);
      showNotification('Failed to delete task', { type: 'error' });
    }
  };

  // Get today's todos
  const getTodaysTodos = () => {
    return todos.filter(todo => {
      const todoDate = new Date(todo.scheduledTime);
      return isToday(todoDate);
    });
  };

  // Get upcoming todos
  const getUpcomingTodos = () => {
    return todos.filter(todo => {
      const todoDate = new Date(todo.scheduledTime);
      return !isToday(todoDate) && !isPast(todoDate);
    }).sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  };

  // Get completed today count
  const getCompletedToday = () => {
    return todos.filter(todo => {
      const todoDate = new Date(todo.scheduledTime);
      const isTodayTodo = isToday(todoDate);
      const isPastTodo = isPast(todoDate) && !isToday(todoDate);
      return (isTodayTodo || isPastTodo) && todo.isCompleted;
    }).length;
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'todos':
        return <TodoList />;
      case 'calendar':
        return <CalendarView />;
      case 'reports':
        return <ReportsView />;
      default:
        return (
          <div className="min-h-full bg-background">
            {/* Animated Hero Section */}
            <AnimatedHero 
              todaysTodos={getTodaysTodos().length}
              completedToday={getCompletedToday()}
              totalTodos={todos.length}
              onNavigate={setCurrentView}
            />

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
              {/* Upcoming Tasks */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-foreground flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-green-600" />
                    Upcoming Tasks
                  </h3>
                  <span className="text-sm text-muted-foreground">{getUpcomingTodos().length} tasks</span>
                </div>
                
                {getUpcomingTodos().length > 0 ? (
                  <div className="space-y-3">
                    {getUpcomingTodos().slice(0, 3).map((todo) => (
                      <div key={todo.id} className="macos-card p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">{todo.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {format(new Date(todo.scheduledTime), 'MMM d, h:mm a')}
                            </p>
                            {todo.description && (
                              <p className="text-sm text-muted-foreground">{todo.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => toggleTodo(todo.id)}
                            className="ml-3 p-1 hover:bg-muted rounded-full transition-colors"
                          >
                            {todo.isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    {getUpcomingTodos().length > 3 && (
                      <button
                        onClick={() => setCurrentView('todos')}
                        className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        View all {getUpcomingTodos().length} upcoming tasks
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="macos-card p-6 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h4 className="font-medium text-foreground mb-1">No upcoming tasks</h4>
                    <p className="text-sm text-muted-foreground mb-4">You're all caught up!</p>
                    <button
                      onClick={() => setCurrentView('todos')}
                      className="mobile-button bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Create New Task
                    </button>
                  </div>
                )}
              </section>

              {/* Quick Actions */}
              <section>
                <h3 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setCurrentView('todos')}
                    className="macos-card p-6 text-center hover:scale-105 transition-transform"
                  >
                    <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-foreground">Manage Tasks</h4>
                    <p className="text-sm text-muted-foreground">View and edit todos</p>
                  </button>
                  <button
                    onClick={() => setCurrentView('calendar')}
                    className="macos-card p-6 text-center hover:scale-105 transition-transform"
                  >
                    <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-foreground">Calendar View</h4>
                    <p className="text-sm text-muted-foreground">See your schedule</p>
                  </button>
                </div>
              </section>
            </div>
          </div>
        );
    }
  };

  const dockItems = [
    {
      title: 'Home',
      icon: <Home className="w-5 h-5" />,
      onClick: () => setCurrentView('home'),
      isActive: currentView === 'home'
    },
    {
      title: 'Todos',
      icon: <Calendar className="w-5 h-5" />,
      onClick: () => setCurrentView('todos'),
      isActive: currentView === 'todos'
    },
    {
      title: 'Calendar',
      icon: <Calendar className="w-5 h-5" />,
      onClick: () => setCurrentView('calendar'),
      isActive: currentView === 'calendar'
    },
    {
      title: 'Reports',
      icon: <BarChart3 className="w-5 h-5" />,
      onClick: () => setCurrentView('reports'),
      isActive: currentView === 'reports'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-border shadow-sm safe-top">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">EveryTodo</h1>
            <VersionDisplay showDetails={false} />
          </div>
          <div className="flex items-center space-x-3">
            <UserAvatar
              name={user?.displayName || 'User'}
              size="md"
              onClick={() => setShowProfileModal(true)}
              className="hover:scale-105 transition-transform"
            />
            <span className="text-sm text-muted-foreground hidden md:inline">
              Welcome, {user?.displayName}
            </span>
            {!isPWAInstalled && (
              <button
                onClick={() => {
                  if ('serviceWorker' in navigator && 'PushManager' in window) {
                    // Show install instructions
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                    const isAndroid = /Android/.test(navigator.userAgent);
                    
                    if (isIOS) {
                      alert('Install EveryTodo as an App on iOS:\n\n1. Tap the Share button at the bottom\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to install as a native app\n\nThis will install EveryTodo as a proper app with its own icon!');
                    } else if (isAndroid) {
                      alert('Install EveryTodo as an App on Android:\n\n1. Tap the menu (three dots) in your browser\n2. Look for "Install app" or "Add to Home screen"\n3. Tap it to install as a PWA app\n\nNote: Even though it says "Add to Home screen", it installs as a full native app with its own icon!');
                    } else {
                      alert('Install EveryTodo as an App on your computer:\n\n1. Look for the install icon in your browser\'s address bar\n2. Click it and select "Install" to install as a PWA app\n\nThis will install EveryTodo as a native desktop application!');
                    }
                  } else {
                    alert('Your browser doesn\'t support PWA installation. Please use a modern browser like Chrome, Edge, or Safari.');
                  }
                }}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Install App"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 ${currentView === 'calendar' ? 'pb-4' : 'pb-20'}`}>
        {renderCurrentView()}
      </main>

      {/* Floating Dock - macOS style */}
      <div className="fixed bottom-2 left-0 right-0 z-50 px-3 md:bottom-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:px-0">
        <CustomFloatingDock 
          items={dockItems}
          desktopClassName="bg-card/80 backdrop-blur-md border border-border shadow-lg"
          mobileClassName="bg-card/90 backdrop-blur-md border border-border shadow-lg py-2 w-full"
        />
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={showTaskDetailModal}
        onClose={closeTaskDetail}
        task={selectedTodo}
        onToggleTask={toggleTodo}
        onToggleSubTask={() => {}}
        onEditTask={() => {}}
        onDeleteTask={deleteTodo}
      />

      {/* Todo Modal */}
      <TodoModal
        isOpen={showTodoModal}
        onClose={closeTodoModal}
        onSubmit={() => {}}
        title="Create Todo"
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}