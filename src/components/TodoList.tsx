'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, push, set, onValue, off } from 'firebase/database';
import { Todo, Task, RepeatPattern, AlarmSettings } from '@/types';
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
  RotateCcw,
  Calendar,
  Repeat,
  Trash2,
  Edit3
} from 'lucide-react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';

export default function TodoList() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!user || !database) {
      setLoading(false);
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
    });

    return () => off(todosRef, 'value', unsubscribe);
  }, [user]);

  const createTodo = async (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user || !database) return;

    const newTodo: Todo = {
      ...todoData,
      id: '',
      userId: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tasks: todoData.tasks || [],
    };

    const todosRef = ref(database, `todos/${user.id}`);
    const newTodoRef = push(todosRef);
    await set(newTodoRef, { ...newTodo, id: newTodoRef.key });
  };

  const toggleTask = async (todoId: string, taskId: string) => {
    if (!user || !database) return;

    const todo = todos.find(t => t.id === todoId);
    if (!todo || !todo.tasks) return;

    const updatedTasks = todo.tasks.map(task =>
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );

    const allTasksCompleted = updatedTasks.every(task => task.isCompleted);
    const updatedTodo = {
      ...todo,
      tasks: updatedTasks,
      isCompleted: allTasksCompleted,
      updatedAt: Date.now(),
      completedAt: allTasksCompleted ? Date.now() : undefined,
    };

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await set(todoRef, updatedTodo);
  };

  const toggleAlarm = async (todoId: string) => {
    if (!user || !database) return;

    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const updatedTodo = {
      ...todo,
      alarmSettings: {
        ...todo.alarmSettings,
        enabled: !todo.alarmSettings.enabled
      },
      updatedAt: Date.now(),
    };

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await set(todoRef, updatedTodo);
  };

  const snoozeAlarm = async (todoId: string) => {
    // Implement snooze logic
    console.log('Snoozing alarm for todo:', todoId);
  };

  const deleteTodo = async (todoId: string) => {
    if (!user || !database) return;

    const todoRef = ref(database, `todos/${user.id}/${todoId}`);
    await set(todoRef, null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Todos</h1>
          <p className="text-gray-600 mt-2">Manage your tasks and alarms</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Todo
        </button>
      </div>

      {/* Todo List */}
      <div className="space-y-4">
        {todos.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No todos yet</h3>
            <p className="text-gray-500 mb-4">Create your first todo with alarm to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Todo
            </button>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`bg-white rounded-xl shadow-lg border-2 p-6 transition-all duration-300 ${
                todo.isCompleted ? 'opacity-60' : 'hover:shadow-xl'
              } ${todo.alarmSettings.enabled && !todo.isCompleted ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <h3 className={`text-xl font-semibold ${todo.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {todo.title}
                    </h3>
                    {todo.alarmSettings.enabled && !todo.isCompleted && (
                      <Bell className="w-5 h-5 text-red-500 ml-2 animate-pulse" />
                    )}
                  </div>
                  
                  {todo.description && (
                    <p className="text-gray-600 mb-4">{todo.description}</p>
                  )}

                  {/* Scheduled Time */}
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock className="w-4 h-4 mr-2" />
                    {format(new Date(todo.scheduledTime), 'MMM dd, yyyy - h:mm a')}
                    {isToday(new Date(todo.scheduledTime)) && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Today</span>
                    )}
                    {isTomorrow(new Date(todo.scheduledTime)) && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Tomorrow</span>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2 mb-4">
                    {todo.tasks && todo.tasks.length > 0 ? todo.tasks.map((task) => (
                      <div key={task.id} className="flex items-center">
                        <button
                          onClick={() => toggleTask(todo.id, task.id)}
                          className="mr-3 text-gray-400 hover:text-gray-600"
                        >
                          {task.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <span className={`${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                          {task.text}
                        </span>
                      </div>
                    )) : (
                      <div className="text-sm text-gray-500 italic">No tasks yet</div>
                    )}
                  </div>

                  {/* Alarm Settings */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleAlarm(todo.id)}
                        className={`mr-2 ${todo.alarmSettings.enabled ? 'text-red-500' : 'text-gray-400'}`}
                      >
                        {todo.alarmSettings.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                      <span className={todo.alarmSettings.enabled ? 'text-red-600' : 'text-gray-500'}>
                        {todo.alarmSettings.enabled ? 'Alarm On' : 'Alarm Off'}
                      </span>
                    </div>

                    {todo.alarmSettings.vibrate && (
                      <div className="flex items-center text-gray-500">
                        <Vibrate className="w-4 h-4 mr-1" />
                        <span>Vibrate</span>
                      </div>
                    )}

                    {todo.alarmSettings.sound && (
                      <div className="flex items-center text-gray-500">
                        <Volume2 className="w-4 h-4 mr-1" />
                        <span>Sound</span>
                      </div>
                    )}

                    {todo.alarmSettings.notification && (
                      <div className="flex items-center text-gray-500">
                        <Bell className="w-4 h-4 mr-1" />
                        <span>Notification</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {todo.alarmSettings.enabled && !todo.isCompleted && (
                    <button
                      onClick={() => snoozeAlarm(todo.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Snooze 1 minute"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete todo"
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
        <CreateTodoModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createTodo}
        />
      )}
    </div>
  );
}

// Create Todo Modal Component
function CreateTodoModal({ 
  onClose, 
  onCreate 
}: { 
  onClose: () => void; 
  onCreate: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledTime: new Date().toISOString().slice(0, 16),
    tasks: [{ id: Date.now().toString(), text: '', isCompleted: false, createdAt: Date.now() }],
    repeatPattern: { type: 'none' as const, days: [], interval: 1 },
    alarmSettings: {
      enabled: true,
      vibrate: true,
      sound: true,
      notification: true,
      snoozeMinutes: 1
    }
  });

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { 
        id: Date.now().toString(), 
        text: '', 
        isCompleted: false, 
        createdAt: Date.now() 
      }]
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

  const removeTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      scheduledTime: new Date(formData.scheduledTime).getTime(),
      isCompleted: false,
      isActive: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Todo</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter todo title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter description (optional)"
              />
            </div>

            {/* Scheduled Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.scheduledTime}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tasks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasks
              </label>
              <div className="space-y-2">
                {formData.tasks.map((task, index) => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={task.text}
                      onChange={(e) => updateTask(task.id, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </button>
              </div>
            </div>

            {/* Alarm Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Alarm Settings
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="alarmEnabled"
                    checked={formData.alarmSettings.enabled}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      alarmSettings: { ...prev.alarmSettings, enabled: e.target.checked }
                    }))}
                    className="mr-3"
                  />
                  <label htmlFor="alarmEnabled" className="text-sm text-gray-700">
                    Enable Alarm
                  </label>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="vibrate"
                      checked={formData.alarmSettings.vibrate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        alarmSettings: { ...prev.alarmSettings, vibrate: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <label htmlFor="vibrate" className="text-sm text-gray-700">Vibrate</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sound"
                      checked={formData.alarmSettings.sound}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        alarmSettings: { ...prev.alarmSettings, sound: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <label htmlFor="sound" className="text-sm text-gray-700">Sound</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notification"
                      checked={formData.alarmSettings.notification}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        alarmSettings: { ...prev.alarmSettings, notification: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <label htmlFor="notification" className="text-sm text-gray-700">Notification</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Todo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
