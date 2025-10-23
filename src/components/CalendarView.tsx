'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Todo, CalendarView as ViewType, CalendarEvent } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, Bell, CheckCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';

const CalendarView: React.FC = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !database) {
      setLoading(false);
      return;
    }

    const todosRef = ref(database, `todos/${user.uid}`);
    
    const unsubscribe = onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const todosArray = Object.entries(data).map(([id, todo]) => ({
          id,
          ...(todo as Omit<Todo, 'id'>)
        }));
        setTodos(todosArray);
      } else {
        setTodos([]);
      }
      setLoading(false);
    });

    return () => {
      off(todosRef, 'value', unsubscribe);
    };
  }, [user]);

  const calendarEvents = useMemo(() => {
    return todos.map((todo): CalendarEvent => ({
      id: todo.id,
      title: todo.title,
      start: new Date(todo.scheduledTime),
      end: new Date(todo.scheduledTime + 60 * 60 * 1000), // 1 hour duration
      allDay: false,
      resource: {
        type: 'todo',
        todoId: todo.id,
        isCompleted: todo.isCompleted,
        priority: todo.isCompleted ? 'low' : (todo.scheduledTime < Date.now() ? 'high' : 'medium')
      }
    }));
  }, [todos]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const getEventsForDay = (date: Date) => {
    return calendarEvents.filter(event => 
      isSameDay(event.start, date)
    );
  };

  const getWeekDays = () => {
    const days = [];
    const startDate = startOfWeek(currentDate);
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startDate, i));
    }
    
    return days;
  };

  const renderMonthView = () => {
    const days = getDaysInMonth();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const events = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border-r border-b ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate ${
                        event.resource.isCompleted
                          ? 'bg-green-100 text-green-800'
                          : event.resource.priority === 'high'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <div className="flex items-center">
                        {event.resource.isCompleted ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Bell className="h-3 w-3 mr-1" />
                        )}
                        {event.title}
                      </div>
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    const events = calendarEvents.filter(event => 
      weekDays.some(day => isSameDay(event.start, day))
    );

    return (
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentDate(prev => subMonths(prev, 1))}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
            >
              This Week
            </button>
            <button
              onClick={() => setCurrentDate(prev => addMonths(prev, 1))}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Week view */}
        <div className="grid grid-cols-7">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div key={index} className="border-r last:border-r-0">
                <div className={`p-2 text-center text-sm font-medium ${
                  isToday ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                }`}>
                  {format(day, 'EEE d')}
                </div>
                <div className="p-2 space-y-1 min-h-[200px]">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-2 rounded ${
                        event.resource.isCompleted
                          ? 'bg-green-100 text-green-800'
                          : event.resource.priority === 'high'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <div className="flex items-center">
                        {event.resource.isCompleted ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Bell className="h-3 w-3 mr-1" />
                        )}
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-xs opacity-75">
                            {format(event.start, 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const today = new Date();
    const dayEvents = getEventsForDay(today);

    return (
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
          >
            Today
          </button>
        </div>

        {/* Day events */}
        <div className="p-4">
          {dayEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No events scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border ${
                    event.resource.isCompleted
                      ? 'bg-green-50 border-green-200'
                      : event.resource.priority === 'high'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {event.resource.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Bell className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {format(event.start, 'h:mm a')}
                      </p>
                    </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View your todos and alarms</p>
        </div>
        
        {/* View Toggle */}
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setViewType('month')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewType === 'month'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewType('week')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewType === 'week'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewType('day')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewType === 'day'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* Calendar */}
      {viewType === 'month' && renderMonthView()}
      {viewType === 'week' && renderWeekView()}
      {viewType === 'day' && renderDayView()}
    </div>
  );
};

export default CalendarView;
