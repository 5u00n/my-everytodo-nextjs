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
import { format, isToday, isTomorrow, addDays, isWithinInterval } from 'date-fns';
import TodoList from './TodoList';
import CalendarView from './CalendarView';
import ReportsView from './ReportsView';
import PWAInstallPrompt from './PWAInstallPrompt';
import UpdateNotification from './UpdateNotification';

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

  useEffect(() => {
    if (!user || !database) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setLoading(false), 0);
      return;
    }

    const todosRef = ref(database, `todos/${user.id}`);
    const unsubscribe = onValue(todosRef, (snapshot) => {
      if (snapshot.exists()) {
        const todosData = snapshot.val();
        const todosList = Object.keys(todosData).map(key => ({
          id: key,
          ...todosData[key]
        }));
        setTodos(todosList);
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

  const openTaskDetail = (todo: Todo) => {
    setSelectedTask(todo);
    setShowTaskDetailModal(true);
  };

  const closeTaskDetail = () => {
    setSelectedTask(null);
    setShowTaskDetailModal(false);
  };

  const toggleTodo = async (todoId: string) => {
    if (!user || !database) return;

    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    // Check if todo is in the future
    const now = new Date();
    const todoDate = new Date(todo.scheduledTime);
    if (todoDate > now) {
      // Don't allow completing future todos
      return;
    }

    const nowTimestamp = Date.now();
    const updatedFields: Partial<Todo> = {
      isCompleted: !todo.isCompleted,
      updatedAt: nowTimestamp,
    };

    // Only set completedAt if completing the todo, remove it if uncompleting
    if (!todo.isCompleted) {
      updatedFields.completedAt = nowTimestamp;
    } else {
      // When uncompleting, we need to remove the completedAt field
      updatedFields.completedAt = undefined;
    }

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await update(todoRef, updatedFields);
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
      return isToday(todoDate) && !todo.isCompleted;
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
      return isToday(todoDate) && todo.isCompleted;
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
          <h1 className="text-xl md:text-2xl font-bold text-foreground">EveryTodo</h1>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-muted-foreground hidden md:inline">Welcome, {user?.displayName}</span>
            <span className="text-sm text-muted-foreground md:hidden">{user?.displayName}</span>
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
    </div>
  );
}

// Home View Component with Today's Focus
function HomeView({ 
  onNavigate, 
  todaysTodos,
  upcomingTodos,
  completedToday,
  totalTodos,
  onTaskClick
}: { 
  onNavigate: (view: View) => void; 
  todaysTodos: Todo[];
  upcomingTodos: Todo[];
  completedToday: number;
  totalTodos: number;
  onTaskClick: (todo: Todo) => void;
}) {
  const currentTime = new Date();
  const greeting = currentTime.getHours() < 12 ? 'Good Morning' : 
                   currentTime.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="min-h-full bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">{greeting}</h2>
          <p className="text-primary-foreground/80 text-lg mb-6">Let&apos;s make today productive!</p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{todaysTodos.length}</div>
              <div className="text-sm text-primary-foreground/80">Today&apos;s Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{completedToday}</div>
              <div className="text-sm text-primary-foreground/80">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalTodos}</div>
              <div className="text-sm text-primary-foreground/80">Total Todos</div>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('todos')}
            className="mobile-button bg-primary-foreground text-primary hover:bg-primary-foreground/90 focus-ring"
          >
            <Plus className="w-5 h-5 mr-2 inline" />
            Add New Todo
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Today's Focus */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              Today&apos;s Focus
            </h3>
            <span className="text-sm text-muted-foreground">{format(new Date(), 'MMM d, yyyy')}</span>
          </div>
          
          {todaysTodos.length > 0 ? (
                    <div className="space-y-3">
                      {todaysTodos.slice(0, 3).map(todo => (
                        <div key={todo.id} className="macos-card p-4 cursor-pointer hover:bg-accent transition-colors" onClick={() => onTaskClick(todo)}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-card-foreground mb-1">{todo.title}</h4>
                              <div className="flex items-center text-sm text-muted-foreground mb-2">
                                <Clock className="w-4 h-4 mr-1" />
                                {format(new Date(todo.scheduledTime), 'h:mm a')}
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
                                className="p-1 text-muted-foreground hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement toggle functionality
                                }}
                              >
                                <Circle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
              {todaysTodos.length > 3 && (
                <button 
                  onClick={() => onNavigate('todos')}
                  className="w-full macos-card p-4 text-center text-primary hover:bg-accent transition-colors"
                >
                  View {todaysTodos.length - 3} more tasks
                </button>
              )}
            </div>
          ) : (
            <div className="macos-card p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-card-foreground mb-2">All caught up!</h4>
              <p className="text-muted-foreground mb-4">No tasks scheduled for today.</p>
              <button 
                onClick={() => onNavigate('todos')}
                className="mobile-button bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create New Todo
              </button>
            </div>
          )}
        </section>

        {/* Upcoming Tasks */}
        {upcomingTodos.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Upcoming
            </h3>
                    <div className="space-y-3">
                      {upcomingTodos.slice(0, 2).map(todo => (
                        <div key={todo.id} className="macos-card p-4 cursor-pointer hover:bg-accent transition-colors" onClick={() => onTaskClick(todo)}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-card-foreground mb-1">{todo.title}</h4>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4 mr-1" />
                                {isTomorrow(new Date(todo.scheduledTime)) ? 'Tomorrow' : format(new Date(todo.scheduledTime), 'MMM d')} at {format(new Date(todo.scheduledTime), 'h:mm a')}
                              </div>
                            </div>
                            {todo.alarmSettings.enabled && (
                              <Bell className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </div>
                      ))}
            </div>
          </section>
        )}

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
    </div>
  );
}