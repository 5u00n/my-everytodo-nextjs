'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { ref, push, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Todo, Task, RepeatPattern, AlarmSettings } from '@/types';
import { X, Plus, Clock, Bell, BellOff, Repeat } from 'lucide-react';
import { format, addDays, addWeeks } from 'date-fns';

interface CreateTodoModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTodoModal: React.FC<CreateTodoModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const { scheduleAlarm } = useNotification();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [scheduledTime, setScheduledTime] = useState(format(new Date(), 'HH:mm'));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>({ type: 'once' });
  const [alarmSettings, setAlarmSettings] = useState<AlarmSettings>({
    enabled: true,
    vibrate: true,
    notification: true,
    sound: 'default',
    volume: 0.8
  });

  const handleAddTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        text: newTask.trim(),
        isCompleted: false,
        createdAt: Date.now()
      };
      setTasks([...tasks, task]);
      setNewTask('');
    }
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !database || !title.trim()) return;

    setLoading(true);

    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const scheduledTimestamp = scheduledDateTime.getTime();

      const todoData: Omit<Todo, 'id'> = {
        userId: user.uid,
        title: title.trim(),
        description: description.trim() || undefined,
        scheduledTime: scheduledTimestamp,
        tasks,
        repeatPattern,
        alarmSettings,
        isCompleted: false,
        isActive: alarmSettings.enabled && scheduledTimestamp > Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Add to Firebase
      const todosRef = ref(database, `todos/${user.uid}`);
      const newTodoRef = await push(todosRef, todoData);
      
      // Get the generated ID
      const todoId = newTodoRef.key;
      if (todoId) {
        // Update with the ID
        await update(ref(database, `todos/${user.uid}/${todoId}`), { id: todoId });
        
        // Schedule alarm if enabled and in the future
        if (alarmSettings.enabled && scheduledTimestamp > Date.now()) {
          const todoWithId: Todo = { ...todoData, id: todoId };
          scheduleAlarm(todoWithId);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating todo:', error);
      alert('Failed to create todo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRepeatOptions = () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const nextWeek = addWeeks(today, 1);

    return [
      { value: 'once', label: 'Once', description: 'Today only' },
      { value: 'daily', label: 'Daily', description: 'Every day' },
      { value: 'weekdays', label: 'Weekdays', description: 'Monday to Friday' },
      { value: 'custom', label: 'Custom', description: 'Select specific days' }
    ];
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Todo</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter todo title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter description (optional)"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                  Time *
                </label>
                <input
                  type="time"
                  id="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* Tasks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasks
              </label>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <span className="flex-1 text-sm text-gray-700">{task.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a task..."
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Repeat Pattern */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repeat
              </label>
              <div className="grid grid-cols-2 gap-2">
                {getRepeatOptions().map((option) => (
                  <label key={option.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="repeat"
                      value={option.value}
                      checked={repeatPattern.type === option.value}
                      onChange={(e) => setRepeatPattern({ type: e.target.value as any })}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Alarm Settings */}
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Alarm Settings
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">Enable Alarm</label>
                  <button
                    type="button"
                    onClick={() => setAlarmSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      alarmSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        alarmSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {alarmSettings.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Vibration</label>
                      <button
                        type="button"
                        onClick={() => setAlarmSettings(prev => ({ ...prev, vibrate: !prev.vibrate }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          alarmSettings.vibrate ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            alarmSettings.vibrate ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Notification</label>
                      <button
                        type="button"
                        onClick={() => setAlarmSettings(prev => ({ ...prev, notification: !prev.notification }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          alarmSettings.notification ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            alarmSettings.notification ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Todo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTodoModal;
