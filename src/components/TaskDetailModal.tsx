'use client';

import React from 'react';
import { Todo } from '@/types';
import { 
  X, 
  Clock, 
  Bell, 
  CheckCircle2, 
  Circle, 
  Edit3, 
  Trash2,
  Calendar
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Todo | null;
  onToggleTask: (todoId: string) => void;
  onToggleSubTask: (todoId: string, taskId: string) => void;
  onEditTask: (task: Todo) => void;
  onDeleteTask: (todoId: string) => void;
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

  const handleToggleTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleTask(task.id);
  };

  const handleToggleSubTask = (taskId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSubTask(task.id, taskId);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditTask(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteTask(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Status */}
          <div className="flex items-start justify-between">
            <h3 className={`text-2xl font-bold ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </h3>
            <button
              onClick={handleToggleTask}
              className="flex-shrink-0 ml-4"
            >
              {task.isCompleted ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <Circle className="w-8 h-8 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-muted-foreground text-lg">{task.description}</p>
          )}

          {/* Time and Date */}
          <div className="flex items-center text-muted-foreground">
            <Clock className="w-5 h-5 mr-2" />
            <span className="text-lg">
              {format(new Date(task.scheduledTime), 'MMM d, yyyy h:mm a')}
            </span>
            {isToday(new Date(task.scheduledTime)) && (
              <span className="ml-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Today</span>
            )}
            {isTomorrow(new Date(task.scheduledTime)) && (
              <span className="ml-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Tomorrow</span>
            )}
          </div>

          {/* Alarm Settings */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-muted-foreground">
              <Bell className="w-5 h-5 mr-2" />
              <span>Alarm: {task.alarmSettings.enabled ? 'On' : 'Off'}</span>
            </div>
            {task.alarmSettings.vibrate && (
              <div className="flex items-center text-muted-foreground">
                <span className="text-sm">Vibrate</span>
              </div>
            )}
          </div>

          {/* Tasks */}
          {task.tasks && task.tasks.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-3">Subtasks</h4>
              <div className="space-y-3">
                {task.tasks.map((subTask) => (
                  <div key={subTask.id} className="flex items-center">
                    <button
                      onClick={handleToggleSubTask(subTask.id)}
                      className="mr-3 text-muted-foreground hover:text-foreground"
                    >
                      {subTask.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <span className={`${subTask.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {subTask.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-border">
            <button
              onClick={handleEdit}
              className="flex-1 bg-primary text-primary-foreground py-3 px-4 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 bg-destructive text-destructive-foreground py-3 px-4 rounded-xl font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}