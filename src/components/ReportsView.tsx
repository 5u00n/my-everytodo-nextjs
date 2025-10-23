'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Todo, ActivityReport } from '@/types';
import { BarChart3, Download, Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, isWithinInterval } from 'date-fns';

const ReportsView: React.FC = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

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

  const reportData = useMemo(() => {
    const now = new Date();
    const startDate = period === 'week' 
      ? startOfWeek(now) 
      : startOfMonth(now);
    const endDate = period === 'week' 
      ? endOfWeek(now) 
      : endOfMonth(now);

    const periodTodos = todos.filter(todo => 
      isWithinInterval(new Date(todo.createdAt), { start: startDate, end: endDate })
    );

    const completedTodos = periodTodos.filter(todo => todo.isCompleted);
    const totalTodos = periodTodos.length;
    const completionRate = totalTodos > 0 ? (completedTodos.length / totalTodos) * 100 : 0;

    // Calculate average response time (time from scheduled to completion)
    const responseTimes = completedTodos
      .filter(todo => todo.completedAt)
      .map(todo => {
        const scheduledTime = new Date(todo.scheduledTime);
        const completedTime = new Date(todo.completedAt!);
        return (completedTime.getTime() - scheduledTime.getTime()) / (1000 * 60); // in minutes
      });

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Find most productive hour
    const hourCounts = new Array(24).fill(0);
    completedTodos.forEach(todo => {
      if (todo.completedAt) {
        const hour = new Date(todo.completedAt).getHours();
        hourCounts[hour]++;
      }
    });
    const mostProductiveHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Find most productive day
    const dayCounts = new Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    completedTodos.forEach(todo => {
      if (todo.completedAt) {
        const day = new Date(todo.completedAt).getDay();
        dayCounts[day]++;
      }
    });
    const mostProductiveDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))];

    return {
      period,
      startDate,
      endDate,
      totalTodos,
      completedTodos: completedTodos.length,
      completionRate,
      averageResponseTime,
      mostProductiveHour,
      mostProductiveDay,
      todos: periodTodos
    };
  }, [todos, period]);

  const generateReport = () => {
    const report = {
      period: reportData.period,
      startDate: reportData.startDate.toISOString(),
      endDate: reportData.endDate.toISOString(),
      totalTodos: reportData.totalTodos,
      completedTodos: reportData.completedTodos,
      completionRate: Math.round(reportData.completionRate * 100) / 100,
      averageResponseTime: Math.round(reportData.averageResponseTime * 100) / 100,
      mostProductiveHour: reportData.mostProductiveHour,
      mostProductiveDay: reportData.mostProductiveDay,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `everytodo-report-${period}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
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
          <h1 className="text-2xl font-bold text-gray-900">Activity Reports</h1>
          <p className="text-gray-600">Track your productivity and progress</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              period === 'week'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              period === 'month'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            This Month
          </button>
          <button
            onClick={generateReport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Todos</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData.totalTodos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData.completedTodos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(reportData.completionRate)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatTime(reportData.averageResponseTime)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Productivity Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Most Productive Hour</span>
              <span className="text-sm font-medium text-gray-900">
                {formatHour(reportData.mostProductiveHour)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Most Productive Day</span>
              <span className="text-sm font-medium text-gray-900">
                {reportData.mostProductiveDay}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Period</span>
              <span className="text-sm font-medium text-gray-900">
                {format(reportData.startDate, 'MMM d')} - {format(reportData.endDate, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Overview</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completion Progress</span>
                <span className="text-sm font-medium text-gray-900">
                  {reportData.completedTodos}/{reportData.totalTodos}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${reportData.completionRate}%` }}
                ></div>
              </div>
            </div>
            
            {reportData.totalTodos > 0 && (
              <div className="text-sm text-gray-600">
                {reportData.completionRate >= 80 ? (
                  <span className="text-green-600 font-medium">Excellent progress! 🎉</span>
                ) : reportData.completionRate >= 60 ? (
                  <span className="text-blue-600 font-medium">Good progress! Keep it up! 💪</span>
                ) : (
                  <span className="text-orange-600 font-medium">Room for improvement. You've got this! 🔥</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          {reportData.todos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No activity for this {period}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportData.todos.slice(0, 10).map((todo) => (
                <div key={todo.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    {todo.isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400 mr-3" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{todo.title}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(todo.scheduledTime), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {todo.isCompleted && todo.completedAt
                      ? `Completed ${format(new Date(todo.completedAt), 'MMM d')}`
                      : 'Pending'
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
