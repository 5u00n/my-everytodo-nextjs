'use client';

import React, { useState, useEffect } from 'react';
import { Todo, Task, RepeatPattern, AlarmSettings } from '@/types';
import { 
  X, 
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
  Repeat,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'userId'> | Partial<Todo>) => void;
  title: string;
  initialData?: Todo | null;
}

export default function TodoModal({ isOpen, onClose, onSubmit, title, initialData }: TodoModalProps) {
  const [formData, setFormData] = useState<Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>(
    initialData ? {
      title: initialData.title,
      description: initialData.description || '',
      tasks: initialData.tasks || [],
      scheduledTime: initialData.scheduledTime,
      repeatPattern: initialData.repeatPattern,
      alarmSettings: initialData.alarmSettings,
      isCompleted: initialData.isCompleted,
      isActive: initialData.isActive,
    } : {
      title: '',
      description: '',
      tasks: [],
      scheduledTime: Date.now() + 60 * 60 * 1000, // 1 hour from now
      repeatPattern: { type: 'none' as 'none' | 'daily' | 'weekly' | 'monthly' },
      alarmSettings: { enabled: true, vibrate: true, sound: true, notification: true, snoozeMinutes: 1, duration: 5, repeatCount: 3 },
      isCompleted: false,
      isActive: true,
    }
  );
  const [newTaskText, setNewTaskText] = useState('');

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        tasks: initialData.tasks || [],
        scheduledTime: initialData.scheduledTime,
        repeatPattern: initialData.repeatPattern,
        alarmSettings: initialData.alarmSettings,
        isCompleted: initialData.isCompleted,
        isActive: initialData.isActive,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        tasks: [],
        scheduledTime: Date.now() + 60 * 60 * 1000, // 1 hour from now
        repeatPattern: { type: 'none' as 'none' | 'daily' | 'weekly' | 'monthly' },
        alarmSettings: { enabled: true, vibrate: true, sound: true, notification: true, snoozeMinutes: 1, duration: 5, repeatCount: 3 },
        isCompleted: false,
        isActive: true,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (name === 'scheduledTime') {
      setFormData(prev => ({ ...prev, [name]: new Date(value).getTime() }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAlarmSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setFormData(prev => ({
      ...prev,
      alarmSettings: {
        ...prev.alarmSettings,
        [name]: type === 'checkbox' ? checked : parseInt(value) || 0,
      },
    }));
  };

  const handleRepeatPatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as RepeatPattern['type'];
    setFormData(prev => ({
      ...prev,
      repeatPattern: { type },
    }));
  };

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      setFormData(prev => ({
        ...prev,
        tasks: [...prev.tasks, { 
          id: Date.now().toString(), 
          text: newTaskText.trim(), 
          isCompleted: false, 
          createdAt: Date.now() 
        }],
      }));
      setNewTaskText('');
    }
  };

  const handleRemoveTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId),
    }));
  };

  const handleToggleTaskCompletion = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-background rounded-t-2xl md:rounded-xl p-6 w-full max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto shadow-lg transform translate-y-0 md:scale-100 transition-all duration-300 ease-out">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-input rounded-md shadow-sm p-2 bg-background text-foreground focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-input rounded-md shadow-sm p-2 bg-background text-foreground focus:ring-ring"
            ></textarea>
          </div>
          <div>
            <label htmlFor="scheduledTime" className="block text-sm font-medium text-foreground">Scheduled Time</label>
            <input
              type="datetime-local"
              id="scheduledTime"
              name="scheduledTime"
              value={format(new Date(formData.scheduledTime), "yyyy-MM-dd'T'HH:mm")}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-input rounded-md shadow-sm p-2 bg-background text-foreground focus:ring-ring"
            />
          </div>

          {/* Tasks */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tasks</label>
            <div className="space-y-2">
              {formData.tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      onChange={() => handleToggleTaskCompletion(task.id)}
                      className="h-4 w-4 text-primary border-input rounded mr-2"
                    />
                    <span className={task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}>
                      {task.text}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTask(task.id)}
                    className="text-destructive hover:text-destructive/80 p-1 rounded-full hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex mt-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new task"
                className="flex-1 border border-input rounded-l-md shadow-sm p-2 bg-background text-foreground focus:ring-ring"
              />
              <button
                type="button"
                onClick={handleAddTask}
                className="bg-primary text-primary-foreground p-2 rounded-r-md hover:bg-primary/90"
              >
                Add Task
              </button>
            </div>
          </div>

          {/* Repeat Pattern */}
          <div>
            <label htmlFor="repeatPattern" className="block text-sm font-medium text-foreground">Repeat</label>
            <select
              id="repeatPattern"
              name="repeatPattern"
              value={formData.repeatPattern.type}
              onChange={handleRepeatPatternChange}
              className="mt-1 block w-full border border-input rounded-md shadow-sm p-2 bg-background text-foreground focus:ring-ring"
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Alarm Settings */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Alarm Settings</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="alarmEnabled"
                name="enabled"
                checked={formData.alarmSettings.enabled}
                onChange={handleAlarmSettingChange}
                className="h-4 w-4 text-primary border-input rounded mr-2"
              />
              <label htmlFor="alarmEnabled" className="text-sm text-foreground">Enable Alarm</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="alarmVibrate"
                name="vibrate"
                checked={formData.alarmSettings.vibrate}
                onChange={handleAlarmSettingChange}
                className="h-4 w-4 text-primary border-input rounded mr-2"
              />
              <label htmlFor="alarmVibrate" className="text-sm text-foreground">Vibrate</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="alarmSound"
                name="sound"
                checked={formData.alarmSettings.sound}
                onChange={handleAlarmSettingChange}
                className="h-4 w-4 text-primary border-input rounded mr-2"
              />
              <label htmlFor="alarmSound" className="text-sm text-foreground">Play Sound</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="alarmNotification"
                name="notification"
                checked={formData.alarmSettings.notification}
                onChange={handleAlarmSettingChange}
                className="h-4 w-4 text-primary border-input rounded mr-2"
              />
              <label htmlFor="alarmNotification" className="text-sm text-foreground">Show Notification</label>
            </div>
            
            {/* Alarm Duration */}
            <div className="mt-3">
              <label htmlFor="alarmDuration" className="block text-sm font-medium text-foreground mb-1">
                Alarm Duration (minutes)
              </label>
              <input
                type="number"
                id="alarmDuration"
                name="duration"
                min="1"
                max="60"
                value={formData.alarmSettings.duration}
                onChange={handleAlarmSettingChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            {/* Repeat Count */}
            <div className="mt-3">
              <label htmlFor="alarmRepeatCount" className="block text-sm font-medium text-foreground mb-1">
                Repeat Count
              </label>
              <input
                type="number"
                id="alarmRepeatCount"
                name="repeatCount"
                min="1"
                max="10"
                value={formData.alarmSettings.repeatCount}
                onChange={handleAlarmSettingChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            {/* Snooze Minutes */}
            <div className="mt-3">
              <label htmlFor="snoozeMinutes" className="block text-sm font-medium text-foreground mb-1">
                Snooze Duration (minutes)
              </label>
              <input
                type="number"
                id="snoozeMinutes"
                name="snoozeMinutes"
                min="1"
                max="30"
                value={formData.alarmSettings.snoozeMinutes}
                onChange={handleAlarmSettingChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 mobile-button bg-muted text-foreground hover:bg-muted/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 mobile-button bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {initialData ? 'Update Todo' : 'Create Todo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
