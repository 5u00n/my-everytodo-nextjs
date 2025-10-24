'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, off, update, remove } from 'firebase/database';
import { Todo } from '@/types';
import { 
  LogOut, 
  Plus, 
  Calendar, 
  BarChart3, 
  List, 
  Home,
  Clock,
  Bell,
  CheckCircle2,
  Circle,
  Download
} from 'lucide-react';
import { CustomFloatingDock } from '@/components/CustomFloatingDock';
import { ThemeToggle } from '@/components/theme-toggle';
import TaskDetailModal from './TaskDetailModal';
import TodoModal from './TodoModal';
import { format, isToday, isTomorrow, addDays, isWithinInterval, isPast } from 'date-fns';
import alarmManager from '@/lib/alarmManager';
import pushNotificationService from '@/lib/pushNotificationService';
import TodoList from './TodoList';
import CalendarView from './CalendarView';
import ReportsView from './ReportsView';
import PWAInstallPrompt from './PWAInstallPrompt';
import UpdateNotification from './UpdateNotification';
import AlarmPopup from './AlarmPopup';
import PushNotificationTest from './PushNotificationTest';
import ProfileModal from './ProfileModal';
import VersionDisplay from './VersionDisplay';
import UserAvatar from './UserAvatar';
import AnimatedHero from './AnimatedHero';

type View = 'home' | 'todos' | 'calendar' | 'reports';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Todo | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  
  // Alarm states
  const [activeAlarm, setActiveAlarm] = useState<{
    id: string;
    title: string;
    body?: string;
    todoId: string;
    duration?: number;
    repeatCount?: number;
  } | null>(null);
  const [showAlarmPopup, setShowAlarmPopup] = useState(false);
  
  // PWA detection state
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Detect if app is running as PWA
  useEffect(() => {
    const checkPWAInstallation = () => {
      // Check if running in standalone mode (PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check if running in fullscreen mode (PWA on some devices)
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      // Check if running in minimal-ui mode (PWA on some devices)
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      const isPWA = isStandalone || isFullscreen || isMinimalUI;
      setIsPWAInstalled(isPWA);
    };

    checkPWAInstallation();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWAInstallation);
    
    return () => {
      mediaQuery.removeEventListener('change', checkPWAInstallation);
    };
  }, []);

  useEffect(() => {
    if (!user || !database) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setLoading(false), 0);
      return;
    }

    // Request notification permission for alarms
    if (alarmManager.isNotificationSupported()) {
      alarmManager.requestPermission();
    }

    // Initialize push notifications
    initializePushNotifications();

    const todosRef = ref(database, `todos/${user.id}`);
    const unsubscribe = onValue(todosRef, (snapshot) => {
      if (snapshot.exists()) {
        const todosData = snapshot.val();
        const todosList = Object.keys(todosData).map(key => ({
          id: key,
          ...todosData[key]
        }));
        setTodos(todosList);
        
        // Schedule alarms for todos with alarm settings
        scheduleAlarmsForTodos(todosList);
      } else {
        setTodos([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching todos:", error);
      setLoading(false);
    });

    return () => off(todosRef, 'value', unsubscribe);
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
              // Find the todo to get alarm settings
              const todo = todos.find(t => t.id === alarm.todoId);
              const alarmSettings = todo?.alarmSettings;
              
              // Show alarm popup when triggered
              setActiveAlarm({
                id: alarm.id,
                title: alarm.title,
                body: alarm.body,
                todoId: alarm.todoId,
                duration: alarmSettings?.duration || 5,
                repeatCount: alarmSettings?.repeatCount || 3
              });
              setShowAlarmPopup(true);
            }
          );
        }
      }
    });
  };

  const openTaskDetail = (todo: Todo) => {
    setSelectedTask(todo);
    setShowTaskDetailModal(true);
  };

  const closeTaskDetail = () => {
    setSelectedTask(null);
    setShowTaskDetailModal(false);
  };

  // Alarm handling functions
  const handleAlarmComplete = async (todoId: string) => {
    if (!user || !database) return;
    
    try {
      const todoRef = ref(database, `todos/${user.id}/${todoId}`);
      await update(todoRef, { isCompleted: true, completedAt: Date.now() });
      
      // Cancel any remaining alarms for this todo
      alarmManager.cancelAlarmsForTodo(todoId);
      
      console.log('Todo marked as complete from alarm');
    } catch (error) {
      console.error('Error completing todo from alarm:', error);
    }
  };

  const handleAlarmSnooze = (todoId: string, minutes: number) => {
    // Find the todo and reschedule its alarm
    const todo = todos.find(t => t.id === todoId);
    if (todo && todo.alarmSettings?.enabled) {
      const newAlarmTime = Date.now() + (minutes * 60 * 1000);
      
      alarmManager.scheduleAlarm(
        todoId,
        todo.title,
        newAlarmTime,
        todo.description,
        (alarm) => {
          // Find the todo to get alarm settings
          const todo = todos.find(t => t.id === alarm.todoId);
          const alarmSettings = todo?.alarmSettings;
          
          setActiveAlarm({
            id: alarm.id,
            title: alarm.title,
            body: alarm.body,
            todoId: alarm.todoId,
            duration: alarmSettings?.duration || 5,
            repeatCount: alarmSettings?.repeatCount || 3
          });
          setShowAlarmPopup(true);
        }
      );
      
      console.log(`Alarm snoozed for ${minutes} minutes`);
    }
  };

  const handleAlarmDismiss = () => {
    setShowAlarmPopup(false);
    setActiveAlarm(null);
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

  // Handle messages from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_ACTION') {
        const { action, todoId, minutes } = event.data;
        
        if (action === 'complete' && todoId) {
          handleAlarmComplete(todoId);
        } else if (action === 'snooze' && todoId) {
          handleAlarmSnooze(todoId, minutes || 5);
        } else if (action === 'dismiss' && todoId) {
          handleAlarmDismiss();
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const toggleTodo = async (todoId: string) => {
    if (!user || !database) return;

    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    // Allow completing todos regardless of their scheduled time
    // This enables completing upcoming todos from the home page

    const nowTimestamp = Date.now();
    const updatedFields: Partial<Todo> = {
      isCompleted: !todo.isCompleted,
      updatedAt: nowTimestamp,
    };

    // Only set completedAt if completing the todo
    if (!todo.isCompleted) {
      updatedFields.completedAt = nowTimestamp;
    }

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    
    if (todo.isCompleted) {
      // When uncompleting, we need to remove the completedAt field
      const { completedAt, ...fieldsToUpdate } = updatedFields;
      await update(todoRef, fieldsToUpdate);
      // Remove the completedAt field from the database
      const completedAtRef = ref(database, `todos/${user.id}/${todoId}/completedAt`);
      await remove(completedAtRef);
      
      // Reschedule alarms when uncompleting
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
              setActiveAlarm({
                id: alarm.id,
                title: alarm.title,
                body: alarm.body,
                todoId: alarm.todoId
              });
              setShowAlarmPopup(true);
            }
          );
        }
      }
    } else {
      // When completing, just update normally
      await update(todoRef, updatedFields);
      
      // Cancel alarms when completing
      alarmManager.cancelAlarmsForTodo(todoId);
    }
  };

  const toggleTask = async (todoId: string, taskId: string) => {
    if (!user || !database) return;

    const todo = todos.find(t => t.id === todoId);
    if (!todo || !todo.tasks) return;

    const updatedTasks = todo.tasks.map(task =>
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );

    const allTasksCompleted = updatedTasks.every(task => task.isCompleted);
    const now = Date.now();
    const updatedTodo = {
      ...todo,
      tasks: updatedTasks,
      isCompleted: allTasksCompleted,
      updatedAt: now,
      completedAt: allTasksCompleted ? now : undefined,
    };

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await update(todoRef, updatedTodo);
  };

  const deleteTodo = async (todoId: string) => {
    if (!user || !database) return;

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await remove(todoRef);
  };

  const updateTodo = async (todoId: string, updatedFields: Partial<Todo>) => {
    if (!user || !database) return;

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await update(todoRef, { ...updatedFields, updatedAt: Date.now() });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getTodaysTodos = () => {
    return todos.filter(todo => {
      const todoDate = new Date(todo.scheduledTime);
      const isTodayTodo = isToday(todoDate);
      const isPastTodo = isPast(todoDate) && !isToday(todoDate);
      return (isTodayTodo || (isPastTodo && !todo.isCompleted));
    }).sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  };

  const getUpcomingTodos = () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const dayAfterTomorrow = addDays(today, 2);
    
    return todos.filter(todo => {
      const todoDate = new Date(todo.scheduledTime);
      return isWithinInterval(todoDate, { start: tomorrow, end: dayAfterTomorrow }) && !todo.isCompleted;
    }).sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  };

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
                return <HomeView 
                  onNavigate={setCurrentView} 
                  todaysTodos={getTodaysTodos()}
                  upcomingTodos={getUpcomingTodos()}
                  completedToday={getCompletedToday()}
                  totalTodos={todos.length}
                  onTaskClick={openTaskDetail}
                  onToggleTodo={toggleTodo}
                />;
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
      icon: <List className="w-5 h-5" />,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
      <main className={`flex-1 ${currentView === 'calendar' ? 'pb-4' : 'pb-24'}`}>
        {renderCurrentView()}
      </main>

      {/* Floating Dock - macOS style */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <CustomFloatingDock 
          items={dockItems}
          desktopClassName="bg-card/80 backdrop-blur-md border border-border shadow-lg"
          mobileClassName="bg-card/90 backdrop-blur-md border border-border shadow-lg px-4 py-2"
        />
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={showTaskDetailModal}
        onClose={closeTaskDetail}
        task={selectedTask}
        onToggleTask={toggleTodo}
        onToggleSubTask={toggleTask}
        onEditTask={(task) => {
          setEditingTodo(task);
          setShowEditModal(true);
          closeTaskDetail();
        }}
        onDeleteTask={deleteTodo}
      />

      {/* Edit Todo Modal */}
      <TodoModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTodo(null);
        }}
        onSubmit={(updatedFields) => {
          if (editingTodo) {
            updateTodo(editingTodo.id, updatedFields);
          }
        }}
        title="Edit Todo"
        initialData={editingTodo}
      />
      
      {/* Alarm Popup */}
      {activeAlarm && (
        <AlarmPopup
          isVisible={showAlarmPopup}
          title={activeAlarm.title}
          body={activeAlarm.body}
          todoId={activeAlarm.todoId}
          duration={activeAlarm.duration}
          repeatCount={activeAlarm.repeatCount}
          onDismiss={handleAlarmDismiss}
          onComplete={handleAlarmComplete}
          onSnooze={handleAlarmSnooze}
        />
      )}
      
      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}

// Home View Component with Upcoming Focus
function HomeView({ 
  onNavigate, 
  todaysTodos,
  upcomingTodos,
  completedToday,
  totalTodos,
  onTaskClick,
  onToggleTodo
}: { 
  onNavigate: (view: View) => void; 
  todaysTodos: Todo[];
  upcomingTodos: Todo[];
  completedToday: number;
  totalTodos: number;
  onTaskClick: (todo: Todo) => void;
  onToggleTodo: (todoId: string) => void;
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute to keep greeting current
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  const getGreeting = () => {
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Early Morning greetings (4 AM - 7:59 AM)
    if (hour >= 4 && hour < 8) {
      const earlyMorningGreetings = [
        '🌅 Early Bird',
        '🌄 Dawn Breaker',
        '☀️ First Light',
        '🚀 Early Start',
        '✨ Pre-Dawn Energy',
        '🌟 Morning Warrior',
        '💪 Early Riser',
        '🎯 Beat the Sun',
        '⭐ Dawn Patrol',
        '🏆 Early Champion'
      ];
      return earlyMorningGreetings[Math.floor(Math.random() * earlyMorningGreetings.length)];
    }
    
    // Morning greetings (8 AM - 10:59 AM)
    else if (hour >= 8 && hour < 11) {
      const morningGreetings = [
        '🌅 Good Morning',
        '☀️ Rise and Shine',
        '🌞 Morning Sunshine',
        '🚀 Start Your Day Right',
        '✨ Fresh Start',
        '🌟 New Day, New Possibilities',
        '💪 Ready to Conquer Today?',
        '🎯 Let\'s Make Today Amazing',
        '⭐ Time to Shine',
        '🏆 Good Morning, Champion'
      ];
      return morningGreetings[Math.floor(Math.random() * morningGreetings.length)];
    }
    
    // Late Morning greetings (11 AM - 12:59 PM)
    else if (hour >= 11 && hour < 13) {
      const lateMorningGreetings = [
        '🌤️ Late Morning',
        '☀️ Almost Noon',
        '🚀 Mid-Morning Push',
        '💪 Morning Momentum',
        '🎯 Pre-Lunch Focus',
        '⚡ Late Morning Energy',
        '🔥 Morning Flow',
        '📈 Building Momentum',
        '🌟 Morning Glow',
        '💎 Morning Excellence'
      ];
      return lateMorningGreetings[Math.floor(Math.random() * lateMorningGreetings.length)];
    }
    
    // Afternoon greetings (1 PM - 3:59 PM)
    else if (hour >= 13 && hour < 16) {
      const afternoonGreetings = [
        '☀️ Good Afternoon',
        '😊 Hope Your Day is Going Well',
        '⚡ Afternoon Productivity',
        '🔥 Keep the Momentum Going',
        '💪 You\'re Doing Great',
        '🎯 Stay Focused',
        '🚀 Power Through the Afternoon',
        '📈 Making Progress?',
        '⚡ Afternoon Energy',
        '💥 Keep Crushing It'
      ];
      return afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)];
    }
    
    // Late Afternoon greetings (4 PM - 5:59 PM)
    else if (hour >= 16 && hour < 18) {
      const lateAfternoonGreetings = [
        '🌤️ Late Afternoon',
        '☀️ Almost Evening',
        '🚀 Afternoon Sprint',
        '💪 Power Hour',
        '🎯 Late Day Focus',
        '⚡ Afternoon Surge',
        '🔥 End of Day Push',
        '📈 Afternoon Peak',
        '🌟 Golden Hour',
        '💎 Afternoon Excellence'
      ];
      return lateAfternoonGreetings[Math.floor(Math.random() * lateAfternoonGreetings.length)];
    }
    
    // Evening greetings (6 PM - 8:59 PM)
    else if (hour >= 18 && hour < 21) {
      const eveningGreetings = [
        '🌆 Good Evening',
        '🌅 Wind Down Time',
        '🤔 Evening Reflection',
        '🏁 Almost There',
        '💪 Finish Strong',
        '⚡ Evening Productivity',
        '📋 Wrap Up the Day',
        '🎯 Evening Focus',
        '🔥 Last Push',
        '💪 You\'ve Got This'
      ];
      return eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)];
    }
    
    // Late Evening greetings (9 PM - 11:59 PM)
    else if (hour >= 21 && hour < 24) {
      const lateEveningGreetings = [
        '🌙 Late Evening',
        '🌃 Evening Wind Down',
        '🦉 Night Owl Mode',
        '🌆 Evening Reflection',
        '💪 Evening Focus',
        '🎯 Night Productivity',
        '🔥 Evening Energy',
        '📋 Evening Wrap Up',
        '🌟 Evening Glow',
        '💎 Evening Excellence'
      ];
      return lateEveningGreetings[Math.floor(Math.random() * lateEveningGreetings.length)];
    }
    
    // Night greetings (12 AM - 3:59 AM)
    else {
      const nightGreetings = [
        '🌙 Good Night',
        '😴 Time to Rest',
        '🦉 Night Owl Mode',
        '🌃 Late Night Productivity',
        '🕯️ Burning the Midnight Oil',
        '🎯 Night Focus',
        '🤫 Quiet Hours',
        '🧠 Deep Work Time',
        '🌙 Night Session',
        '💪 Still Going Strong?'
      ];
      return nightGreetings[Math.floor(Math.random() * nightGreetings.length)];
    }
  };
  
  const getMotivationalMessage = () => {
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Early Morning motivation (4 AM - 7:59 AM)
    if (hour >= 4 && hour < 8) {
      const earlyMorningMessages = [
        "🌅 Early bird gets the worm!",
        "🌄 Beat the sunrise to success",
        "☀️ First light, first opportunity",
        "🚀 Early start, big results",
        "✨ Pre-dawn productivity",
        "🌟 Morning warrior mode",
        "💪 Early riser advantage",
        "🎯 Dawn of achievement"
      ];
      return earlyMorningMessages[Math.floor(Math.random() * earlyMorningMessages.length)];
    }
    
    // Morning motivation (8 AM - 10:59 AM)
    else if (hour >= 8 && hour < 11) {
      const morningMessages = [
        "🚀 Let's make today productive!",
        "📋 Every great day starts with a plan",
        "🙏 Your future self will thank you",
        "👣 Small steps lead to big achievements",
        "✨ Today is full of possibilities",
        "💪 Start strong, finish stronger",
        "🎯 Make today count!",
        "🏆 Your goals are waiting"
      ];
      return morningMessages[Math.floor(Math.random() * morningMessages.length)];
    }
    
    // Late Morning motivation (11 AM - 12:59 PM)
    else if (hour >= 11 && hour < 13) {
      const lateMorningMessages = [
        "🌤️ Mid-morning momentum!",
        "☀️ Almost noon, keep going!",
        "🚀 Pre-lunch productivity",
        "💪 Morning flow continues",
        "🎯 Late morning focus",
        "⚡ Building morning energy",
        "🔥 Morning momentum building",
        "📈 Pre-noon progress"
      ];
      return lateMorningMessages[Math.floor(Math.random() * lateMorningMessages.length)];
    }
    
    // Afternoon motivation (1 PM - 3:59 PM)
    else if (hour >= 13 && hour < 16) {
      const afternoonMessages = [
        "🔥 Keep the momentum going!",
        "🏁 You're halfway there",
        "🎯 Stay focused and productive",
        "📈 Every task completed is progress",
        "💪 Push through the afternoon",
        "⭐ Your dedication shows",
        "👏 Keep up the great work",
        "🔍 Success is in the details"
      ];
      return afternoonMessages[Math.floor(Math.random() * afternoonMessages.length)];
    }
    
    // Late Afternoon motivation (4 PM - 5:59 PM)
    else if (hour >= 16 && hour < 18) {
      const lateAfternoonMessages = [
        "🌤️ Late afternoon push!",
        "☀️ Almost evening, finish strong!",
        "🚀 Afternoon sprint time",
        "💪 Power hour activated",
        "🎯 Late day focus",
        "⚡ Afternoon surge energy",
        "🔥 End of day push",
        "📈 Afternoon peak performance"
      ];
      return lateAfternoonMessages[Math.floor(Math.random() * lateAfternoonMessages.length)];
    }
    
    // Evening motivation (6 PM - 8:59 PM)
    else if (hour >= 18 && hour < 21) {
      const eveningMessages = [
        "💪 Finish the day strong!",
        "🏁 Almost at the finish line",
        "⚡ Evening productivity mode",
        "🎯 Wrap up with purpose",
        "🌟 End on a high note",
        "💎 Your hard work pays off",
        "🔥 One more push",
        "🎯 Evening focus time"
      ];
      return eveningMessages[Math.floor(Math.random() * eveningMessages.length)];
    }
    
    // Late Evening motivation (9 PM - 11:59 PM)
    else if (hour >= 21 && hour < 24) {
      const lateEveningMessages = [
        "🌙 Late evening focus!",
        "🌃 Evening wind down time",
        "🦉 Night owl productivity",
        "🌆 Evening reflection mode",
        "💪 Evening focus power",
        "🎯 Night productivity session",
        "🔥 Evening energy surge",
        "📋 Evening wrap up time"
      ];
      return lateEveningMessages[Math.floor(Math.random() * lateEveningMessages.length)];
    }
    
    // Night motivation (12 AM - 3:59 AM)
    else {
      const nightMessages = [
        "🧠 Time for some deep work",
        "🦉 Night owl productivity",
        "🤫 Quiet hours, big results",
        "🌃 Late night focus",
        "💪 Your dedication is inspiring",
        "🌙 Night session activated",
        "🕯️ Burning the midnight oil",
        "💪 Still going strong!"
      ];
      return nightMessages[Math.floor(Math.random() * nightMessages.length)];
    }
  };
  
  const greeting = getGreeting();
  const motivationalMessage = getMotivationalMessage();

  return (
    <div className="min-h-full bg-background">
      {/* Animated Hero Section */}
      <AnimatedHero
        greeting={greeting}
        motivationalMessage={motivationalMessage}
        todaysTodos={todaysTodos.length}
        completedToday={completedToday}
        totalTodos={totalTodos}
        onNavigate={onNavigate}
      />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Upcoming Tasks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Upcoming Tasks
            </h3>
            <span className="text-sm text-muted-foreground">{upcomingTodos.length} tasks</span>
          </div>
          
          {upcomingTodos.length > 0 ? (
            <div className="space-y-3">
              {upcomingTodos.slice(0, 5).map(todo => (
                <div key={todo.id} className="macos-card p-4 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => onTaskClick(todo)}>
                      <h4 className={`font-medium mb-1 ${todo.isCompleted ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                        {todo.title}
                      </h4>
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4 mr-1" />
                        {isTomorrow(new Date(todo.scheduledTime)) ? 'Tomorrow' : format(new Date(todo.scheduledTime), 'MMM d')} at {format(new Date(todo.scheduledTime), 'h:mm a')}
                      </div>
                      {todo.tasks && todo.tasks.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {todo.tasks.filter(task => !task.isCompleted).length} tasks remaining
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {todo.alarmSettings.enabled && (
                        <Bell className="w-4 h-4 text-primary" />
                      )}
                      <button 
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTodo(todo.id);
                        }}
                        title={todo.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {todo.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {upcomingTodos.length > 5 && (
                <button 
                  onClick={() => onNavigate('todos')}
                  className="w-full macos-card p-4 text-center text-primary hover:bg-accent transition-colors"
                >
                  View {upcomingTodos.length - 5} more tasks
                </button>
              )}
            </div>
          ) : (
            <div className="macos-card p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-card-foreground mb-2">No upcoming tasks!</h4>
              <p className="text-muted-foreground mb-4">You're all caught up with your upcoming tasks.</p>
              <button 
                onClick={() => onNavigate('todos')}
                className="mobile-button bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create New Todo
              </button>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate('calendar')}
              className="macos-card p-6 text-center hover:bg-accent transition-colors"
            >
              <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="font-medium text-card-foreground">Calendar</div>
              <div className="text-sm text-muted-foreground">View schedule</div>
            </button>
            
            <button 
              onClick={() => onNavigate('reports')}
              className="macos-card p-6 text-center hover:bg-accent transition-colors"
            >
              <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium text-card-foreground">Reports</div>
              <div className="text-sm text-muted-foreground">View progress</div>
            </button>
          </div>
        </section>
      </div>
      
      {/* Update Notification */}
      <UpdateNotification />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Push Notification Test - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-[60] max-w-sm">
          <PushNotificationTest />
        </div>
      )}
    </div>
  );
}