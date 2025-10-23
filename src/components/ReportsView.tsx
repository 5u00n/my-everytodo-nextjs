'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { Todo } from '@/types';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Calendar,
  Bell,
  Target,
  Award,
  Activity,
  Download
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

type TimeFilter = 'week' | 'month' | 'all';

interface ReportData {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  totalTasks: number;
  completedTasks: number;
  alarmEnabledTodos: number;
  completionRate: number;
  taskCompletionRate: number;
  averageTasksPerTodo: number;
  todosByDay: { date: string; count: number; completed: number }[];
  todosByHour: { hour: number; count: number }[];
  mostProductiveDay: string;
  mostProductiveHour: number;
}

export default function ReportsView() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!user || !database) {
      setLoading(false);
      return;
    }

    const todosRef = ref(database, `todos/${user.id}`);
    const unsubscribe = onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      const loadedTodos: Todo[] = [];
      if (data) {
        for (const todoId in data) {
          loadedTodos.push({ id: todoId, ...data[todoId] });
        }
      }
      setTodos(loadedTodos);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching todos:", error);
      setLoading(false);
    });

    return () => off(todosRef, 'value', unsubscribe);
  }, [user]);

  const getFilteredTodos = useCallback(() => {
    const now = new Date();
    switch (timeFilter) {
      case 'week':
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        return todos.filter(todo => {
          const todoDate = new Date(todo.scheduledTime);
          return isWithinInterval(todoDate, { start: weekStart, end: weekEnd });
        });
      case 'month':
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        return todos.filter(todo => {
          const todoDate = new Date(todo.scheduledTime);
          return isWithinInterval(todoDate, { start: monthStart, end: monthEnd });
        });
      default:
        return todos;
    }
  }, [todos, timeFilter]);

  const generateReport = useCallback(() => {
    const filteredTodos = getFilteredTodos();
    
    const totalTodos = filteredTodos.length;
    const completedTodos = filteredTodos.filter(todo => todo.isCompleted).length;
    const pendingTodos = totalTodos - completedTodos;
    
    const totalTasks = filteredTodos.reduce((sum, todo) => sum + (todo.tasks?.length || 0), 0);
    const completedTasks = filteredTodos.reduce((sum, todo) => 
      sum + (todo.tasks?.filter(task => task.isCompleted).length || 0), 0
    );
    
    const alarmEnabledTodos = filteredTodos.filter(todo => todo.alarmSettings.enabled).length;
    const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const averageTasksPerTodo = totalTodos > 0 ? totalTasks / totalTodos : 0;

    // Generate todos by day data
    const todosByDay = [];
    const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 365;
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayTodos = filteredTodos.filter(todo => {
        const todoDate = new Date(todo.scheduledTime);
        return todoDate.toDateString() === date.toDateString();
      });
      todosByDay.push({
        date: format(date, 'MMM d'),
        count: dayTodos.length,
        completed: dayTodos.filter(todo => todo.isCompleted).length
      });
    }

    // Generate todos by hour data
    const todosByHour = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourTodos = filteredTodos.filter(todo => {
        const todoDate = new Date(todo.scheduledTime);
        return todoDate.getHours() === hour;
      });
      todosByHour.push({
        hour,
        count: hourTodos.length
      });
    }

    // Find most productive day and hour
    const mostProductiveDay = todosByDay.reduce((max, day) => 
      day.count > max.count ? day : max, todosByDay[0] || { date: 'N/A', count: 0 }
    ).date;

    const mostProductiveHour = todosByHour.reduce((max, hour) => 
      hour.count > max.count ? hour : max, todosByHour[0] || { hour: 0, count: 0 }
    ).hour;

    setReportData({
      totalTodos,
      completedTodos,
      pendingTodos,
      totalTasks,
      completedTasks,
      alarmEnabledTodos,
      completionRate,
      taskCompletionRate,
      averageTasksPerTodo,
      todosByDay,
      todosByHour,
      mostProductiveDay,
      mostProductiveHour
    });
  }, [getFilteredTodos, timeFilter]);

  useEffect(() => {
    if (todos.length > 0) {
      generateReport();
    }
  }, [todos, timeFilter, generateReport]);

  const exportReport = () => {
    if (!reportData) return;
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Todos', reportData.totalTodos],
      ['Completed Todos', reportData.completedTodos],
      ['Pending Todos', reportData.pendingTodos],
      ['Total Tasks', reportData.totalTasks],
      ['Completed Tasks', reportData.completedTasks],
      ['Completion Rate', `${reportData.completionRate.toFixed(1)}%`],
      ['Task Completion Rate', `${reportData.taskCompletionRate.toFixed(1)}%`],
      ['Average Tasks per Todo', reportData.averageTasksPerTodo.toFixed(1)],
      ['Most Productive Day', reportData.mostProductiveDay],
      ['Most Productive Hour', `${reportData.mostProductiveHour}:00`]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `everytodo-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No data available</h3>
        <p className="text-muted-foreground">Create some todos to see your reports!</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="bg-background shadow-sm border-b border-border px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Reports</h2>
          <button
            onClick={exportReport}
            className="mobile-button bg-primary text-primary-foreground hover:bg-primary/90 focus-ring"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>

        {/* Time Filter */}
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          {[
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'all', label: 'All Time' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setTimeFilter(filter.key as TimeFilter)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                timeFilter === filter.key
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="macos-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">{reportData.totalTodos}</span>
            </div>
            <div className="text-sm text-muted-foreground">Total Todos</div>
          </div>

          <div className="macos-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-foreground">{reportData.completedTodos}</span>
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>

          <div className="macos-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-foreground">{reportData.pendingTodos}</span>
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>

          <div className="macos-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-foreground">{reportData.alarmEnabledTodos}</span>
            </div>
            <div className="text-sm text-muted-foreground">With Alarms</div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="macos-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            Progress Overview
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">Todo Completion</span>
                <span className="text-sm text-muted-foreground">{reportData.completionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${reportData.completionRate}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">Task Completion</span>
                <span className="text-sm text-muted-foreground">{reportData.taskCompletionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${reportData.taskCompletionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="macos-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-600" />
            Daily Activity
          </h3>
          
          <div className="space-y-3">
            {reportData.todosByDay.slice(-7).map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground w-12">{day.date}</span>
                <div className="flex-1 mx-3">
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.max(day.count, 1) }, (_, i) => (
                      <div
                        key={i}
                        className={`h-2 rounded ${
                          i < day.completed 
                            ? 'bg-green-500' 
                            : day.count > 0 
                              ? 'bg-gray-300' 
                              : 'bg-muted'
                        }`}
                        style={{ width: `${100 / Math.max(day.count, 1)}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground w-8 text-right">
                  {day.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="macos-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-600" />
            Insights
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-blue-900">Most Productive Day</div>
                <div className="text-sm text-blue-700">{reportData.mostProductiveDay}</div>
              </div>
              <Calendar className="w-5 h-5 text-primary" />
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-green-900">Most Productive Hour</div>
                <div className="text-sm text-green-700">{reportData.mostProductiveHour}:00</div>
              </div>
              <Clock className="w-5 h-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-purple-900">Average Tasks per Todo</div>
                <div className="text-sm text-purple-700">{reportData.averageTasksPerTodo.toFixed(1)}</div>
              </div>
              <Target className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Task Breakdown */}
        <div className="macos-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Task Breakdown</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-foreground">{reportData.totalTasks}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-foreground">{reportData.completedTasks}</div>
              <div className="text-sm text-muted-foreground">Completed Tasks</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}