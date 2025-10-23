'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { database } from '@/lib/firebase';
import { ref, push, set, onValue, off, update, remove } from 'firebase/database';
import { Todo } from '@/types';
import TaskDetailModal from './TaskDetailModal';
import TodoModal from './TodoModal';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Bell, 
  BellOff, 
  Vibrate, 
  Volume2, 
  VolumeX,
  Calendar,
  Trash2,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

export default function TodoList() {
  const { user } = useAuth();
  const { requestPermission, scheduleNotification, cancelNotification, permission } = useNotification();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Todo | null>(null);
  const [expandedTodo, setExpandedTodo] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [notificationTimeouts, setNotificationTimeouts] = useState<Map<string, number>>(new Map());

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

  // Request notification permission on component mount
  useEffect(() => {
    if (permission === 'default') {
      requestPermission().then((newPermission) => {
        if (newPermission === 'granted') {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission denied');
        }
      });
    }
  }, [permission, requestPermission]);

  const openTaskDetail = (todo: Todo) => {
    setSelectedTask(todo);
    setShowTaskDetailModal(true);
  };

  const closeTaskDetail = () => {
    setSelectedTask(null);
    setShowTaskDetailModal(false);
  };

  const getCurrentTimestamp = useCallback(() => Date.now(), []);


  const createTodo = async (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user || !database) return;

    const newTodo: Todo = {
      ...todoData,
      id: '',
      userId: user.id,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      tasks: todoData.tasks || [],
    };

    const todosRef = ref(database, `todos/${user.id}`);
    const newTodoRef = push(todosRef);
    await set(newTodoRef, { ...newTodo, id: newTodoRef.key });

    // Schedule notification if alarm is enabled
    if (newTodo.alarmSettings.enabled) {
      const timeoutId = await scheduleNotification(
        newTodo.title,
        newTodo.scheduledTime,
        {
          body: newTodo.description || 'Time to get things done!',
          vibrate: newTodo.alarmSettings.vibrate ? [200, 100, 200] : undefined,
          requireInteraction: true,
          duration: newTodo.alarmSettings.duration || 5,
          repeatCount: newTodo.alarmSettings.repeatCount || 3,
          snoozeMinutes: newTodo.alarmSettings.snoozeMinutes || 1,
          data: { todoId: newTodoRef.key, action: 'alarm' },
          actions: [
            { action: 'snooze', title: `Snooze ${newTodo.alarmSettings.snoozeMinutes || 1}min`, icon: '/icon-192.svg' },
            { action: 'complete', title: 'Mark Done', icon: '/icon-192.svg' },
            { action: 'stop', title: 'Stop Alarm', icon: '/icon-192.svg' }
          ]
        }
      );
      
      if (timeoutId) {
        setNotificationTimeouts(prev => new Map(prev).set(newTodoRef.key!, timeoutId));
      }
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
    const now = getCurrentTimestamp();
    const updatedFields: Partial<Todo> = {
      tasks: updatedTasks,
      isCompleted: allTasksCompleted,
      updatedAt: now,
    };

    // Only set completedAt if completing the todo, remove it if uncompleting
    if (allTasksCompleted) {
      updatedFields.completedAt = now;
    } else {
      updatedFields.completedAt = undefined;
    }

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await update(todoRef, updatedFields);

    // Cancel notification if all tasks are completed
    if (allTasksCompleted) {
      const timeoutId = notificationTimeouts.get(todoId);
      if (timeoutId) {
        cancelNotification(timeoutId);
        setNotificationTimeouts(prev => {
          const newMap = new Map(prev);
          newMap.delete(todoId);
          return newMap;
        });
      }
    }
  };

  const deleteTodo = async (todoId: string) => {
    if (!user || !database) return;

    // Cancel notification if exists
    const timeoutId = notificationTimeouts.get(todoId);
    if (timeoutId) {
      cancelNotification(timeoutId);
      setNotificationTimeouts(prev => {
        const newMap = new Map(prev);
        newMap.delete(todoId);
        return newMap;
      });
    }

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await remove(todoRef);
  };

  const updateTodo = async (todoId: string, updatedFields: Partial<Todo>) => {
    if (!user || !database) return;

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await update(todoRef, { ...updatedFields, updatedAt: Date.now() });
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

    const nowTimestamp = getCurrentTimestamp();
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

  const getFilteredTodos = () => {
    switch (filter) {
      case 'today':
        return todos.filter(todo => isToday(new Date(todo.scheduledTime)));
      case 'upcoming':
        return todos.filter(todo => !isToday(new Date(todo.scheduledTime)) && !isPast(new Date(todo.scheduledTime)));
      case 'completed':
        return todos.filter(todo => todo.isCompleted);
      default:
        return todos;
    }
  };

  const [formData, setFormData] = useState(() => {
    const now = getCurrentTimestamp();
    return {
      title: '',
      description: '',
      scheduledTime: new Date().toISOString().slice(0, 16),
      tasks: [{ id: now.toString(), text: '', isCompleted: false, createdAt: now }],
      repeatPattern: { type: 'none' as 'none' | 'daily' | 'weekly' | 'monthly', days: [], interval: 1 },
      alarmSettings: {
        enabled: true,
        vibrate: true,
        sound: true,
        notification: true,
        snoozeMinutes: 1,
        duration: 5,
        repeatCount: 3
      }
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    const todoData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      scheduledTime: new Date(formData.scheduledTime).getTime(),
      tasks: formData.tasks.filter(task => task.text.trim()),
      repeatPattern: formData.repeatPattern,
      alarmSettings: formData.alarmSettings,
      isCompleted: false,
      isActive: true,
      userId: user?.id || ''
    };

    await createTodo(todoData);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      scheduledTime: new Date().toISOString().slice(0, 16),
      tasks: [{ id: getCurrentTimestamp().toString(), text: '', isCompleted: false, createdAt: getCurrentTimestamp() }],
      repeatPattern: { type: 'none' as 'none' | 'daily' | 'weekly' | 'monthly', days: [], interval: 1 },
      alarmSettings: {
        enabled: true,
        vibrate: true,
        sound: true,
        notification: true,
        snoozeMinutes: 1,
        duration: 5,
        repeatCount: 3
      }
    });
    
    setShowCreateModal(false);
  };

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id: getCurrentTimestamp().toString(), text: '', isCompleted: false, createdAt: getCurrentTimestamp() }]
    }));
  };

  const removeTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }));
  };

  const updateTask = (taskId: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === taskId ? { ...task, text } : task
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredTodos = getFilteredTodos();

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="bg-background shadow-sm border-b border-border px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">My Todos</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mobile-button bg-primary text-primary-foreground hover:bg-primary/90 focus-ring"
          >
            <Plus className="w-5 h-5 mr-2" />
            New
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          {[
            { key: 'all', label: 'All', count: todos.length },
            { key: 'today', label: 'Today', count: todos.filter(t => isToday(new Date(t.scheduledTime))).length },
            { key: 'upcoming', label: 'Upcoming', count: todos.filter(t => !isToday(new Date(t.scheduledTime)) && !isPast(new Date(t.scheduledTime))).length },
            { key: 'completed', label: 'Done', count: todos.filter(t => t.isCompleted).length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as 'all' | 'today' | 'upcoming' | 'completed')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Todo List */}
      <div className="px-4 py-4 space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {filter === 'completed' ? 'No completed todos' : 'No todos yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'completed' 
                ? 'Complete some tasks to see them here!' 
                : 'Create your first todo to get started!'
              }
            </p>
            {filter !== 'completed' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mobile-button bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Todo
              </button>
            )}
          </div>
        ) : (
          filteredTodos.map(todo => (
            <div key={todo.id} className="macos-card p-4 cursor-pointer hover:bg-accent transition-colors" onClick={() => openTaskDetail(todo)}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const now = new Date();
                        const todoDate = new Date(todo.scheduledTime);
                        if (todoDate <= now) {
                          toggleTodo(todo.id);
                        }
                      }}
                      className={`flex-shrink-0 mt-1 ${
                        new Date(todo.scheduledTime) > new Date() 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'cursor-pointer'
                      }`}
                      disabled={new Date(todo.scheduledTime) > new Date()}
                    >
                      {todo.isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className={`w-6 h-6 ${
                          new Date(todo.scheduledTime) > new Date() 
                            ? 'text-muted-foreground/50' 
                            : 'text-muted-foreground'
                        }`} />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-semibold ${todo.isCompleted ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                        {todo.title}
                      </h3>
                      
                      {todo.description && (
                        <p className={`text-muted-foreground mt-1 ${todo.isCompleted ? 'line-through' : ''}`}>
                          {todo.description}
                        </p>
                      )}

                      <div className="flex items-center text-sm text-muted-foreground mt-2">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{format(new Date(todo.scheduledTime), 'MMM d, h:mm a')}</span>
                        {isToday(new Date(todo.scheduledTime)) && (
                          <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">Today</span>
                        )}
                        {isTomorrow(new Date(todo.scheduledTime)) && (
                          <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">Tomorrow</span>
                        )}
                        {new Date(todo.scheduledTime) > new Date() && !isToday(new Date(todo.scheduledTime)) && !isTomorrow(new Date(todo.scheduledTime)) && (
                          <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs">Future</span>
                        )}
                      </div>

                      {/* Tasks Preview */}
                      {todo.tasks && todo.tasks.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTodo(expandedTodo === todo.id ? null : todo.id);
                            }}
                            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                          >
                            <span className="mr-1">
                              {todo.tasks.filter(task => !task.isCompleted).length} of {todo.tasks.length} tasks remaining
                            </span>
                            {expandedTodo === todo.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {expandedTodo === todo.id && (
                            <div className="mt-3 space-y-2">
                              {todo.tasks.map((task) => (
                                <div key={task.id} className="flex items-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTask(todo.id, task.id);
                                    }}
                                    className="mr-3 text-muted-foreground hover:text-foreground"
                                  >
                                    {task.isCompleted ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Circle className="w-4 h-4" />
                                    )}
                                  </button>
                                  <span className={`text-sm ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                                    {task.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Alarm Settings */}
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              if (!database || !user) return;
                              const updatedFields = {
                                alarmSettings: { ...todo.alarmSettings, enabled: !todo.alarmSettings.enabled },
                                updatedAt: getCurrentTimestamp()
                              };
                              const todoRef = ref(database, `todos/${user.id}/${todo.id}`);
                              update(todoRef, updatedFields);
                            }}
                            className="mr-2"
                          >
                            {todo.alarmSettings.enabled ? (
                              <Bell className="w-4 h-4 text-primary" />
                            ) : (
                              <BellOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          <span className={`text-xs ${todo.alarmSettings.enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                            Alarm {todo.alarmSettings.enabled ? 'On' : 'Off'}
                          </span>
                        </div>

                        {todo.alarmSettings.enabled && (
                          <>
                            {todo.alarmSettings.vibrate && (
                              <Vibrate className="w-4 h-4 text-primary" />
                            )}
                            {todo.alarmSettings.sound ? (
                              <Volume2 className="w-4 h-4 text-primary" />
                            ) : (
                              <VolumeX className="w-4 h-4 text-muted-foreground" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTodo(todo.id);
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Todo Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
          <div className="bg-background rounded-t-2xl md:rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto slide-up">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Create New Todo</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                  placeholder="Enter todo title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                  placeholder="Enter description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Scheduled Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tasks
                </label>
                <div className="space-y-2">
                  {formData.tasks.map((task, index) => (
                    <div key={task.id} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={task.text}
                        onChange={(e) => updateTask(task.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder={`Task ${index + 1}`}
                      />
                      {formData.tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTask}
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Task
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Repeat Pattern
                </label>
                <select
                  value={formData.repeatPattern.type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    repeatPattern: { ...prev.repeatPattern, type: e.target.value as 'none' | 'daily' | 'weekly' | 'monthly' }
                  }))}
                  className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="none">No Repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays Only</option>
                  <option value="weekends">Weekends Only</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Alarm Settings</h4>
                
                <div className="flex items-center justify-between">
                  <label htmlFor="alarmEnabled" className="text-sm text-foreground">
                    Enable Alarm
                  </label>
                  <input
                    type="checkbox"
                    id="alarmEnabled"
                    checked={formData.alarmSettings.enabled}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      alarmSettings: { ...prev.alarmSettings, enabled: e.target.checked }
                    }))}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-ring"
                  />
                </div>

                {formData.alarmSettings.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <label htmlFor="vibrate" className="text-sm text-foreground">
                        Vibrate
                      </label>
                      <input
                        type="checkbox"
                        id="vibrate"
                        checked={formData.alarmSettings.vibrate}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          alarmSettings: { ...prev.alarmSettings, vibrate: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-ring"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="sound" className="text-sm text-foreground">
                        Sound
                      </label>
                      <input
                        type="checkbox"
                        id="sound"
                        checked={formData.alarmSettings.sound}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          alarmSettings: { ...prev.alarmSettings, sound: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-ring"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="notification" className="text-sm text-foreground">
                        Notification
                      </label>
                      <input
                        type="checkbox"
                        id="notification"
                        checked={formData.alarmSettings.notification}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          alarmSettings: { ...prev.alarmSettings, notification: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-ring"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex space-x-3 pt-4 pb-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 mobile-button bg-muted text-foreground hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 mobile-button bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Create Todo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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