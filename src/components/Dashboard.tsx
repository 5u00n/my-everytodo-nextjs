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
import notificationService from '@/lib/notificationService';
import { database } from '@/lib/firebase';
import { ref, onValue, off, update, remove, push, set } from 'firebase/database';
import { Todo } from '@/types';
import AnimatedHero from './AnimatedHero';
import TodoList from './TodoList';
import CalendarView from './CalendarView';
import ReportsView from './ReportsView';
import ProfileModal from './ProfileModal';
import UserAvatar from './UserAvatar';
import VersionDisplay from './VersionDisplay';
import AlarmPopup from './AlarmPopup';
import { 
  Home, 
  Calendar, 
  BarChart3, 
  User, 
  LogOut,
  Bell,
  CheckCircle2,
  Circle,
  Download,
  Volume2,
  VolumeX
} from 'lucide-react';

type View = 'home' | 'todos' | 'calendar' | 'reports';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { showNotification } = useNotification();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [showAlarmPopup, setShowAlarmPopup] = useState(false);
  const [alarmData, setAlarmData] = useState<{title: string, body?: string, todoId?: string} | null>(null);
  const [alarmSoundType, setAlarmSoundType] = useState<'normal' | 'extreme'>('normal');

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

  // Load alarm sound type from localStorage
  useEffect(() => {
    const savedSoundType = localStorage.getItem('alarmSoundType');
    if (savedSoundType === 'normal' || savedSoundType === 'extreme') {
      setAlarmSoundType(savedSoundType);
      notificationService.setAlarmSoundType(savedSoundType);
    }
  }, []);

  // Load todos from Firebase
  useEffect(() => {
    if (!user || !database) {
      return;
    }

    const initializeAndLoadTodos = async () => {
      // Request notification permission for alarms
      if (alarmManager.isNotificationSupported()) {
        alarmManager.requestPermission();
      }

      // Initialize push notifications
      await initializePushNotifications();
    };

    initializeAndLoadTodos();

    const todosRef = ref(database, `todos/${user.id}`);
    
    const unsubscribe = onValue(todosRef, (snapshot) => {
      if (snapshot.exists()) {
        const todosData = snapshot.val();
        const todosArray = Object.keys(todosData).map(key => ({
          id: key,
          ...todosData[key]
        }));
        setTodos(todosArray);
        
        // Schedule alarms for todos with alarm settings
        scheduleAlarmsForTodos(todosArray);
      } else {
        setTodos([]);
      }
    }, (error) => {
      console.error("Error fetching todos:", error);
    });

    return () => {
      off(todosRef, 'value', unsubscribe);
    };
  }, [user]);

  // Schedule alarms for todos
  const scheduleAlarmsForTodos = (todosList: Todo[]) => {
    // Clear existing alarms
    alarmManager.clearAllAlarms();
    
    todosList.forEach(todo => {
      if (todo.alarmSettings?.enabled && !todo.isCompleted) {
        // Use scheduledTime for alarm timing
        const alarmTime = todo.scheduledTime;
        const now = Date.now();
        
        // Only schedule if alarm time is in the future
        if (alarmTime > now) {
          alarmManager.scheduleAlarm(
            todo.id,
            todo.title,
            alarmTime,
            todo.description,
            (alarm) => {
              // Show alarm popup for all platforms (desktop, mobile, PWA)
              setAlarmData({
                title: alarm.title,
                body: alarm.body,
                todoId: alarm.todoId
              });
              setShowAlarmPopup(true);
              
              // Always show notification as backup
              showNotification(`🔔 ${alarm.title}`, { 
                type: 'info',
                duration: 0 // Don't auto-dismiss alarm notifications
              });
            }
          );
        }
      }
    });
  };

  // Initialize push notifications
  const initializePushNotifications = async () => {
    try {
      const isSupported = pushNotificationService.isSupported();
      if (!isSupported) {
        console.log('Push notifications not supported');
        return;
      }

      await pushNotificationService.initialize();
      
      // Request permission
      const permission = await pushNotificationService.requestPermission();
      if (permission === 'granted') {
        // Subscribe to push notifications
        await pushNotificationService.subscribe();
        console.log('Push notifications enabled');
      } else {
        console.log('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

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

  // Toggle alarm sound type
  const toggleAlarmSoundType = () => {
    const newType = alarmSoundType === 'normal' ? 'extreme' : 'normal';
    setAlarmSoundType(newType);
    notificationService.setAlarmSoundType(newType);
  };

  // Alarm popup handlers
  const handleAlarmDismiss = () => {
    // Cancel all alarms for this todo to stop alarm completely
    if (alarmData?.todoId) {
      alarmManager.cancelAlarmsForTodo(alarmData.todoId);
    }
    setShowAlarmPopup(false);
    setAlarmData(null);
  };

  const handleAlarmComplete = (todoId: string) => {
    // Cancel all alarms for this todo to stop alarm completely
    alarmManager.cancelAlarmsForTodo(todoId);
    // Mark todo as completed
    toggleTodo(todoId);
    setShowAlarmPopup(false);
    setAlarmData(null);
  };

  const handleAlarmSnooze = (todoId: string, minutes: number) => {
    // Cancel current alarm first
    alarmManager.cancelAlarmsForTodo(todoId);
    
    // Reschedule alarm for snooze time
    const snoozeTime = Date.now() + (minutes * 60 * 1000);
    const todo = todos.find(t => t.id === todoId);
    if (todo) {
      alarmManager.scheduleAlarm(
        todoId,
        todo.title,
        snoozeTime,
        todo.description,
        (alarm) => {
          setAlarmData({
            title: alarm.title,
            body: alarm.body,
            todoId: alarm.todoId
          });
          setShowAlarmPopup(true);
        }
      );
      showNotification(`Alarm snoozed for ${minutes} minutes`, { type: 'info' });
    }
    setShowAlarmPopup(false);
    setAlarmData(null);
  };

  // Create todo
  const createTodo = async (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'userId'> | Partial<Todo>) => {
    if (!user || !database) return;

    // Ensure required fields are present
    if (!todoData.title) {
      showNotification('Title is required', { type: 'error' });
      return;
    }

    try {
      const newTodo: Todo = {
        title: todoData.title,
        description: todoData.description || '',
        tasks: todoData.tasks || [],
        scheduledTime: todoData.scheduledTime || Date.now() + 60 * 60 * 1000, // Default to 1 hour from now
        repeatPattern: todoData.repeatPattern || { type: 'none' },
        alarmSettings: todoData.alarmSettings || {
          enabled: true,
          vibrate: true,
          sound: true,
          notification: true,
          snoozeMinutes: 1,
          duration: 5,
          repeatCount: 3
        },
        isCompleted: todoData.isCompleted || false,
        isActive: todoData.isActive !== undefined ? todoData.isActive : true,
        id: '',
        userId: user.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const todosRef = ref(database, `todos/${user.id}`);
      const newTodoRef = push(todosRef);
      await set(newTodoRef, { ...newTodo, id: newTodoRef.key });

      showNotification('Task created successfully!', { type: 'success' });
      closeTodoModal();
    } catch (error) {
      console.error('Error creating todo:', error);
      showNotification('Failed to create task', { type: 'error' });
    }
  };

  // Toggle todo completion
  const toggleTodo = async (todoId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    try {
      if (!database) return;
      const todoRef = ref(database, `todos/${user?.id}/${todoId}`);
      await update(todoRef, {
        isCompleted: !todo.isCompleted,
        completedAt: !todo.isCompleted ? Date.now() : null
      } as Record<string, unknown>);
      
      // Cancel alarms when completing, reschedule when uncompleting
      if (!todo.isCompleted) {
        // Completing - cancel alarms
        alarmManager.cancelAlarmsForTodo(todoId);
        showNotification('Task completed!', { type: 'success' });
      } else {
        // Uncompleting - reschedule alarms if enabled
      if (todo.alarmSettings?.enabled) {
        const alarmTime = todo.scheduledTime;
        const now = Date.now();
        if (alarmTime > now) {
          alarmManager.scheduleAlarm(
            todo.id,
            todo.title,
            alarmTime,
            todo.description,
            (alarm) => {
                showNotification(`🔔 ${alarm.title}`, { 
                  type: 'info',
                  duration: 0
                });
            }
          );
        }
      }
        showNotification('Task marked as incomplete', { type: 'info' });
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      showNotification('Failed to update task', { type: 'error' });
    }
  };

  // Delete todo
  const deleteTodo = async (todoId: string) => {
    try {
      if (!database) return;
      
      // Cancel any alarms for this todo before deleting
      alarmManager.cancelAlarmsForTodo(todoId);
      
      const todoRef = ref(database, `todos/${user?.id}/${todoId}`);
      await remove(todoRef);
      showNotification('Task deleted successfully', { type: 'success' });
    } catch (error) {
      console.error('Error deleting todo:', error);
      showNotification('Failed to delete task', { type: 'error' });
    }
  };

  // Listen for notification actions from service worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_ACTION') {
        const { action, todoId, minutes } = event.data;
        
        console.log('Received notification action:', action, 'for todo:', todoId);
        
        if (action === 'complete' && todoId) {
          // Mark todo as completed
          toggleTodo(todoId);
          showNotification('Task completed!', { type: 'success' });
        } else if (action === 'snooze' && todoId) {
          // Reschedule alarm for snooze time
          const snoozeTime = Date.now() + ((minutes || 5) * 60 * 1000);
          const todo = todos.find(t => t.id === todoId);
          if (todo) {
            alarmManager.scheduleAlarm(
              todoId,
              todo.title,
              snoozeTime,
              todo.description,
              (alarm) => {
                showNotification(`🔔 ${alarm.title}`, { 
                  type: 'info',
                  duration: 0
                });
              }
            );
            showNotification(`Alarm snoozed for ${minutes || 5} minutes`, { type: 'info' });
          }
        } else if (action === 'dismiss') {
          // Just dismiss - no action needed
          showNotification('Alarm dismissed', { type: 'info' });
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [todos, toggleTodo, showNotification]);

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
      const now = new Date();
      // Show todos that are scheduled for future times (including today if in the future)
      return todoDate > now;
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
                      onClick={openTodoModal}
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
                    onClick={openTodoModal}
                    className="macos-card p-6 text-center hover:scale-105 transition-transform"
                  >
                    <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-foreground">Create Task</h4>
                    <p className="text-sm text-muted-foreground">Add new todos</p>
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
            <button
              onClick={toggleAlarmSoundType}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title={`Alarm Sound: ${alarmSoundType === 'normal' ? 'Normal' : 'Extreme'}`}
            >
              {alarmSoundType === 'normal' ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5 text-red-500" />
              )}
            </button>
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
        onSubmit={createTodo}
        title="Create Todo"
      />
      
      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Alarm Popup */}
      <AlarmPopup
        isVisible={showAlarmPopup}
        title={alarmData?.title || ''}
        body={alarmData?.body}
        todoId={alarmData?.todoId}
        duration={5}
        repeatCount={3}
        alarmSoundType={alarmData?.todoId ? todos.find(t => t.id === alarmData.todoId)?.alarmSettings?.soundType || 'normal' : alarmSoundType}
        onDismiss={handleAlarmDismiss}
        onComplete={handleAlarmComplete}
        onSnooze={handleAlarmSnooze}
      />
    </div>
  );
}