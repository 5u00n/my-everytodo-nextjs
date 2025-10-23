'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { ref, onValue, off, update, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Todo, Task } from '@/types';
import { Clock, CheckCircle, Circle, Bell, BellOff, RotateCcw, Trash2, Edit } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, addMinutes } from 'date-fns';

const TodoList: React.FC = () => {
  const { user } = useAuth();
  const { scheduleAlarm, cancelAlarm } = useNotification();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (!user || !database) return;

    const todosRef = ref(database, `todos/${user.uid}`);
    
    const unsubscribe = onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const todosArray = Object.entries(data).map(([id, todo]) => ({
          id,
          ...(todo as Omit<Todo, 'id'>)
        }));
        setTodos(todosArray);
        
        // Schedule alarms for active todos
        todosArray.forEach(todo => {
          if (todo.alarmSettings.enabled && !todo.isCompleted && todo.scheduledTime > Date.now()) {
            scheduleAlarm(todo);
          }
        });
      } else {
        setTodos([]);
      }
      setLoading(false);
    });

    return () => {
      off(todosRef, 'value', unsubscribe);
    };
  }, [user, scheduleAlarm]);

  const handleTaskToggle = async (todoId: string, taskId: string) => {
    if (!user || !database) return;

    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const updatedTasks = todo.tasks.map(task =>
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );

    const allTasksCompleted = updatedTasks.every(task => task.isCompleted);
    const isCompleted = allTasksCompleted;

    const updates: any = {};
    updates[`todos/${user.uid}/${todoId}/tasks`] = updatedTasks;
    updates[`todos/${user.uid}/${todoId}/isCompleted`] = isCompleted;
    updates[`todos/${user.uid}/${todoId}/updatedAt`] = Date.now();

    if (isCompleted) {
      updates[`todos/${user.uid}/${todoId}/completedAt`] = Date.now();
      updates[`todos/${user.uid}/${todoId}/isActive`] = false;
      cancelAlarm(todoId);
    }

    try {
      await update(ref(database), updates);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTodoToggle = async (todoId: string) => {
    if (!user || !database) return;

    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const updates: any = {};
    updates[`todos/${user.uid}/${todoId}/isCompleted`] = !todo.isCompleted;
    updates[`todos/${user.uid}/${todoId}/updatedAt`] = Date.now();

    if (!todo.isCompleted) {
      updates[`todos/${user.uid}/${todoId}/completedAt`] = Date.now();
      updates[`todos/${user.uid}/${todoId}/isActive`] = false;
      cancelAlarm(todoId);
    } else {
      updates[`todos/${user.uid}/${todoId}/completedAt`] = null;
      if (todo.alarmSettings.enabled && todo.scheduledTime > Date.now()) {
        updates[`todos/${user.uid}/${todoId}/isActive`] = true;
        scheduleAlarm(todo);
      }
    }

    try {
      await update(ref(database), updates);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleSnooze = async (todoId: string) => {
    if (!user || !database) return;

    const snoozeUntil = addMinutes(new Date(), 1).getTime();
    const updates: any = {};
    updates[`todos/${user.uid}/${todoId}/snoozeUntil`] = snoozeUntil;
    updates[`todos/${user.uid}/${todoId}/updatedAt`] = Date.now();

    try {
      await update(ref(database), updates);
    } catch (error) {
      console.error('Error snoozing todo:', error);
    }
  };

  const handleDelete = async (todoId: string) => {
    if (!user || !database) return;

    try {
      await remove(ref(database, `todos/${user.uid}/${todoId}`));
      cancelAlarm(todoId);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.isCompleted;
      case 'completed':
        return todo.isCompleted;
      default:
        return true;
    }
  });

  const formatScheduledTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    } else if (isPast(date)) {
      return `Overdue - ${format(date, 'MMM d, h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Todos</h1>
          <p className="text-gray-600">Manage your tasks and alarms</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All ({todos.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'active'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active ({todos.filter(t => !t.isCompleted).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'completed'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed ({todos.filter(t => t.isCompleted).length})
          </button>
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-4">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No todos</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'Get started by creating a new todo.'
                : `No ${filter} todos found.`
              }
            </p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`bg-white rounded-lg shadow-sm border p-6 ${
                todo.isCompleted ? 'opacity-75' : ''
              } ${
                isPast(new Date(todo.scheduledTime)) && !todo.isCompleted
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleTodoToggle(todo.id)}
                      className="flex-shrink-0"
                    >
                      {todo.isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-medium ${
                        todo.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {todo.title}
                      </h3>
                      
                      {todo.description && (
                        <p className={`mt-1 text-sm ${
                          todo.isCompleted ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {todo.description}
                        </p>
                      )}
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatScheduledTime(todo.scheduledTime)}
                        </div>
                        
                        <div className="flex items-center">
                          {todo.alarmSettings.enabled ? (
                            <Bell className="h-4 w-4 mr-1 text-blue-600" />
                          ) : (
                            <BellOff className="h-4 w-4 mr-1 text-gray-400" />
                          )}
                          {todo.alarmSettings.enabled ? 'Alarm on' : 'Alarm off'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tasks */}
                  {todo.tasks.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {todo.tasks.map((task) => (
                        <div key={task.id} className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTaskToggle(todo.id, task.id)}
                            className="flex-shrink-0"
                          >
                            {task.isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                          <span className={`text-sm ${
                            task.isCompleted ? 'line-through text-gray-500' : 'text-gray-700'
                          }`}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Snooze and Actions */}
                  {!todo.isCompleted && todo.alarmSettings.enabled && (
                    <div className="mt-4 flex items-center space-x-2">
                      <button
                        onClick={() => handleSnooze(todo.id)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Snooze 1 min
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TodoList;
