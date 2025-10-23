'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { Todo } from '@/types';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Bell, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

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
  mostProductiveDay: string;
  todosByDay: { [key: string]: number };
  todosByHour: { [key: string]: number };
  completionTrend: { [key: string]: number };
}

export default function ReportsView() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [reportData, setReportData] = useState<ReportData | null>(null);

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

  useEffect(() => {
    if (todos.length > 0) {
      generateReport();
    }
  }, [todos, timeRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: subMonths(now, 3), end: now };
      case 'year':
        return { start: subMonths(now, 12), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const generateReport = () => {
    const { start, end } = getDateRange();
    
    const filteredTodos = todos.filter(todo => {
      const todoDate = new Date(todo.createdAt);
      return todoDate >= start && todoDate <= end;
    });

    const totalTodos = filteredTodos.length;
    const completedTodos = filteredTodos.filter(todo => todo.isCompleted).length;
    const pendingTodos = totalTodos - completedTodos;
    
    const totalTasks = filteredTodos.reduce((sum, todo) => sum + todo.tasks.length, 0);
    const completedTasks = filteredTodos.reduce((sum, todo) => 
      sum + todo.tasks.filter(task => task.isCompleted).length, 0
    );
    
    const alarmEnabledTodos = filteredTodos.filter(todo => todo.alarmSettings.enabled).length;
    const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const averageTasksPerTodo = totalTodos > 0 ? totalTasks / totalTodos : 0;

    // Analyze todos by day of week
    const todosByDay: { [key: string]: number } = {};
    const todosByHour: { [key: string]: number } = {};
    const completionTrend: { [key: string]: number } = {};

    filteredTodos.forEach(todo => {
      const todoDate = new Date(todo.scheduledTime);
      const dayOfWeek = format(todoDate, 'EEEE');
      const hour = format(todoDate, 'HH');
      const dateKey = format(todoDate, 'yyyy-MM-dd');

      todosByDay[dayOfWeek] = (todosByDay[dayOfWeek] || 0) + 1;
      todosByHour[hour] = (todosByHour[hour] || 0) + 1;
      
      if (todo.isCompleted) {
        completionTrend[dateKey] = (completionTrend[dateKey] || 0) + 1;
      }
    });

    // Find most productive day
    const mostProductiveDay = Object.keys(todosByDay).reduce((a, b) => 
      todosByDay[a] > todosByDay[b] ? a : b, 'Monday'
    );

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
      mostProductiveDay,
      todosByDay,
      todosByHour,
      completionTrend
    });
  };

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Todos', reportData.totalTodos],
      ['Completed Todos', reportData.completedTodos],
      ['Pending Todos', reportData.pendingTodos],
      ['Total Tasks', reportData.totalTasks],
      ['Completed Tasks', reportData.completedTasks],
      ['Alarm Enabled Todos', reportData.alarmEnabledTodos],
      ['Completion Rate (%)', reportData.completionRate.toFixed(2)],
      ['Task Completion Rate (%)', reportData.taskCompletionRate.toFixed(2)],
      ['Average Tasks per Todo', reportData.averageTasksPerTodo.toFixed(2)],
      ['Most Productive Day', reportData.mostProductiveDay]
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-500">Create some todos to see your activity reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Reports</h1>
          <p className="text-gray-600 mt-2">Track your productivity and task completion</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Filter */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['week', 'month', 'quarter', 'year'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                  timeRange === range 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <button
            onClick={exportReport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Todos</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.totalTodos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.completedTodos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.pendingTodos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Task Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Task Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Tasks</span>
              <span className="font-semibold">{reportData.totalTasks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed Tasks</span>
              <span className="font-semibold text-green-600">{reportData.completedTasks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Task Completion Rate</span>
              <span className="font-semibold">{reportData.taskCompletionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Tasks per Todo</span>
              <span className="font-semibold">{reportData.averageTasksPerTodo.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Alarm Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Alarm Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Alarm Enabled Todos</span>
              <span className="font-semibold">{reportData.alarmEnabledTodos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Alarm Usage Rate</span>
              <span className="font-semibold">
                {reportData.totalTodos > 0 ? ((reportData.alarmEnabledTodos / reportData.totalTodos) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Most Productive Day</span>
              <span className="font-semibold">{reportData.mostProductiveDay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Todos by Day of Week */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Todos by Day of Week</h3>
          <div className="space-y-3">
            {Object.entries(reportData.todosByDay)
              .sort(([,a], [,b]) => b - a)
              .map(([day, count]) => (
                <div key={day} className="flex items-center">
                  <div className="w-20 text-sm text-gray-600">{day}</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(count / Math.max(...Object.values(reportData.todosByDay))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-8 text-sm font-semibold text-gray-900">{count}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Todos by Hour */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Todos by Hour</h3>
          <div className="space-y-3">
            {Object.entries(reportData.todosByHour)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .slice(0, 8)
              .map(([hour, count]) => (
                <div key={hour} className="flex items-center">
                  <div className="w-12 text-sm text-gray-600">{hour}:00</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(count / Math.max(...Object.values(reportData.todosByHour))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-8 text-sm font-semibold text-gray-900">{count}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
