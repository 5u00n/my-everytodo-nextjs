'use client';

import React from 'react';
import { Todo } from '@/types';
import { 
  X, 
  Clock, 
  Bell, 
  BellOff, 
  Vibrate, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Circle,
  Edit3,
  Trash2
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Todo | null;
  onToggleTask: (taskId: string) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  onEditTask: (task: Todo) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  onToggleTask,
  onToggleSubTask,
  onEditTask,
  onDeleteTask
}: TaskDetailModalProps) {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-foreground">Task Details</h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Task Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-card-foreground mb-2">{task.title}</h4>
              {task.description && (
                <p className="text-muted-foreground">{task.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {task.alarmSettings.enabled && (
                <Bell className="w-5 h-5 text-primary" />
              )}
              <button
                onClick={() => onToggleTask(task.id)}
                className="p-2 rounded-full hover:bg-muted"
              >
                {task.isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Schedule Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <Clock className="w-4 h-4 mr-2" />
              <span>Scheduled for {format(new Date(task.scheduledTime), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="text-lg font-semibold text-foreground">
              {format(new Date(task.scheduledTime), 'h:mm a')}
            </div>
            {isToday(new Date(task.scheduledTime)) && (
              <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">Today</span>
            )}
            {isTomorrow(new Date(task.scheduledTime)) && (
              <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">Tomorrow</span>
            )}
          </div>

          {/* Tasks List */}
          {task.tasks && task.tasks.length > 0 && (
            <div>
              <h5 className="text-lg font-semibold text-foreground mb-3">Tasks</h5>
              <div className="space-y-3">
                {task.tasks.map((subTask) => (
                  <div key={subTask.id} className="flex items-center p-3 bg-muted/30 rounded-lg">
                    <button
                      onClick={() => onToggleSubTask(task.id, subTask.id)}
                      className="mr-3 text-muted-foreground hover:text-foreground"
                    >
                      {subTask.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <span className={`flex-1 ${subTask.isCompleted ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                      {subTask.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alarm Settings */}
          <div>
            <h5 className="text-lg font-semibold text-foreground mb-3">Alarm Settings</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-foreground">Alarm</span>
                <div className="flex items-center">
                  {task.alarmSettings.enabled ? (
                    <Bell className="w-4 h-4 text-primary" />
                  ) : (
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {task.alarmSettings.enabled ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-foreground">Vibrate</span>
                <div className="flex items-center">
                  <Vibrate className={`w-4 h-4 ${task.alarmSettings.vibrate ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {task.alarmSettings.vibrate ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-foreground">Sound</span>
                <div className="flex items-center">
                  {task.alarmSettings.sound ? (
                    <Volume2 className="w-4 h-4 text-primary" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {task.alarmSettings.sound ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-foreground">Notification</span>
                <div className="flex items-center">
                  <Bell className={`w-4 h-4 ${task.alarmSettings.notification ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {task.alarmSettings.notification ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-border">
            <button
              onClick={() => {
                onEditTask(task);
                onClose();
              }}
              className="flex-1 mobile-button bg-muted text-foreground hover:bg-muted/80"
            >
              <Edit3 className="w-4 h-4 mr-2 inline" />
              Edit Task
            </button>
            <button
              onClick={() => {
                onDeleteTask(task.id);
                onClose();
              }}
              className="flex-1 mobile-button bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2 inline" />
              Delete Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
