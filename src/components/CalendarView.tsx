'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { Todo } from '@/types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Bell,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from 'date-fns';

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarView() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  const getTodosForDate = (date: Date) => {
    return todos.filter(todo => isSameDay(new Date(todo.scheduledTime), date));
  };

  const getTodosForWeek = (startDate: Date) => {
    const endDate = addDays(startDate, 6);
    return todos.filter(todo => {
      const todoDate = new Date(todo.scheduledTime);
      return todoDate >= startDate && todoDate <= endDate;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? addDays(prev, -7) : addDays(prev, 7));
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1));
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Month Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map(day => {
              const dayTodos = getTodosForDate(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[100px] p-2 border border-gray-200 cursor-pointer transition-colors
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                    ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                    ${isSelected ? 'bg-blue-100 border-blue-400' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayTodos.slice(0, 3).map(todo => (
                      <div
                        key={todo.id}
                        className={`text-xs p-1 rounded truncate ${
                          todo.isCompleted 
                            ? 'bg-green-100 text-green-800' 
                            : todo.alarmSettings.enabled 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {todo.title}
                      </div>
                    ))}
                    {dayTodos.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayTodos.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekTodos = getTodosForWeek(weekStart);

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Week Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                This Week
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Week Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-4">
            {days.map(day => {
              const dayTodos = getTodosForDate(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div key={day.toISOString()} className="min-h-[400px]">
                  <div className={`text-center font-medium mb-4 p-2 rounded-lg ${
                    isToday ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                  }`}>
                    <div className="text-sm">{format(day, 'EEE')}</div>
                    <div className="text-lg">{format(day, 'd')}</div>
                  </div>
                  
                  <div className="space-y-2">
                    {dayTodos.map(todo => (
                      <div
                        key={todo.id}
                        className={`p-3 rounded-lg border-l-4 ${
                          todo.isCompleted 
                            ? 'bg-green-50 border-green-400' 
                            : todo.alarmSettings.enabled 
                              ? 'bg-red-50 border-red-400' 
                              : 'bg-blue-50 border-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">{todo.title}</h4>
                          {todo.alarmSettings.enabled && !todo.isCompleted && (
                            <Bell className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(todo.scheduledTime), 'h:mm a')}
                        </div>
                        <div className="mt-2">
                          {todo.tasks.slice(0, 2).map(task => (
                            <div key={task.id} className="flex items-center text-xs">
                              {task.isCompleted ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500 mr-1" />
                              ) : (
                                <Circle className="w-3 h-3 text-gray-400 mr-1" />
                              )}
                              <span className={task.isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}>
                                {task.text}
                              </span>
                            </div>
                          ))}
                          {todo.tasks.length > 2 && (
                            <div className="text-xs text-gray-500 mt-1">
                              +{todo.tasks.length - 2} more tasks
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayTodos = getTodosForDate(currentDate);
    const isToday = isSameDay(currentDate, new Date());

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Day Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDay('prev')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateDay('next')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Day Content */}
        <div className="p-6">
          {dayTodos.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No todos scheduled</h3>
              <p className="text-gray-500">You have no todos scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayTodos.map(todo => (
                <div
                  key={todo.id}
                  className={`p-6 rounded-xl border-2 ${
                    todo.isCompleted 
                      ? 'bg-green-50 border-green-200' 
                      : todo.alarmSettings.enabled 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className={`text-xl font-semibold ${
                        todo.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className="text-gray-600 mt-1">{todo.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {todo.alarmSettings.enabled && !todo.isCompleted && (
                        <Bell className="w-5 h-5 text-red-500 animate-pulse" />
                      )}
                      <div className="text-sm text-gray-500">
                        {format(new Date(todo.scheduledTime), 'h:mm a')}
                      </div>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    {todo.tasks.map(task => (
                      <div key={task.id} className="flex items-center">
                        <button className="mr-3 text-gray-400 hover:text-gray-600">
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
                    ))}
                  </div>

                  {/* Alarm Settings */}
                  <div className="flex items-center space-x-4 mt-4 text-sm">
                    <div className={`flex items-center ${
                      todo.alarmSettings.enabled ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      <Bell className="w-4 h-4 mr-1" />
                      <span>{todo.alarmSettings.enabled ? 'Alarm On' : 'Alarm Off'}</span>
                    </div>
                    {todo.alarmSettings.vibrate && (
                      <div className="flex items-center text-gray-500">
                        <span>Vibrate</span>
                      </div>
                    )}
                    {todo.alarmSettings.sound && (
                      <div className="flex items-center text-gray-500">
                        <span>Sound</span>
                      </div>
                    )}
                    {todo.alarmSettings.notification && (
                      <div className="flex items-center text-gray-500">
                        <span>Notification</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-2">View your todos and alarms in calendar format</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'month' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'week' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'day' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
}
