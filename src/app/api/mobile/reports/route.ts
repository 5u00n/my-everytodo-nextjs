import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';
import { 
  ReportRequest, 
  ProductivityReport, 
  CompletionReport, 
  AlarmReport, 
  TaskReport 
} from '@/types/mobile-api';

// GET /api/mobile/reports/productivity
export async function GET(request: NextRequest) {
  try {
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    const { searchParams } = new URL(request.url);
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    const startDate = parseInt(searchParams.get('startDate') || '0');
    const endDate = parseInt(searchParams.get('endDate') || Date.now().toString());
    const type = searchParams.get('type') || 'productivity';
    
    switch (type) {
      case 'productivity':
        return await getProductivityReport(uid, startDate, endDate, db);
      case 'completion':
        return await getCompletionReport(uid, startDate, endDate, db);
      case 'alarms':
        return await getAlarmReport(uid, startDate, endDate, db);
      case 'tasks':
        return await getTaskReport(uid, startDate, endDate, db);
      default:
        return createErrorResponse('Invalid report type', 400);
    }
  } catch (error) {
    console.error('Get reports error:', error);
    return createErrorResponse('Failed to generate report', 500);
  }
}

async function getProductivityReport(uid: string, startDate: number, endDate: number, db: any) {
  // Get all todos in date range
  const todosSnapshot = await db.collection('todos')
    .where('userId', '==', uid)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  const todos = todosSnapshot.docs.map((doc: any) => doc.data());
  
  const totalTodos = todos.length;
  const completedTodos = todos.filter((todo: any) => todo.isCompleted).length;
  const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
  
  // Calculate average completion time
  const completedTodosWithTime = todos.filter((todo: any) => 
    todo.isCompleted && todo.completedAt && todo.createdAt
  );
  
  const averageCompletionTime = completedTodosWithTime.length > 0
    ? completedTodosWithTime.reduce((sum: number, todo: any) => 
        sum + (todo.completedAt - todo.createdAt), 0
      ) / completedTodosWithTime.length
    : 0;
  
  // Find most productive hour
  const hourCounts: { [key: number]: number } = {};
  todos.forEach((todo: any) => {
    const hour = new Date(todo.createdAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const mostProductiveHour = Object.keys(hourCounts).reduce((a: string, b: string) => 
    hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b, '0'
  );
  
  // Find most productive day
  const dayCounts: { [key: string]: number } = {};
  todos.forEach((todo: any) => {
    const day = new Date(todo.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  
  const mostProductiveDay = Object.keys(dayCounts).reduce((a: string, b: string) => 
    dayCounts[a] > dayCounts[b] ? a : b, 'Monday'
  );
  
  // Calculate task statistics
  const allTasks = todos.flatMap((todo: any) => todo.tasks || []);
  const tasksCompleted = allTasks.filter((task: any) => task.isCompleted).length;
  const totalTasks = allTasks.length;
  const taskCompletionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
  
  const report: ProductivityReport = {
    totalTodos,
    completedTodos,
    completionRate,
    averageCompletionTime,
    mostProductiveHour: parseInt(mostProductiveHour),
    mostProductiveDay,
    tasksCompleted,
    totalTasks,
    taskCompletionRate,
  };
  
  return createApiResponse(report);
}

async function getCompletionReport(uid: string, startDate: number, endDate: number, db: any) {
  // Get all todos in date range
  const todosSnapshot = await db.collection('todos')
    .where('userId', '==', uid)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  const todos = todosSnapshot.docs.map((doc: any) => doc.data());
  
  // Group by day
  const dailyCompletions: { [key: string]: { completed: number; total: number } } = {};
  todos.forEach((todo: any) => {
    const date = new Date(todo.createdAt).toISOString().split('T')[0];
    if (!dailyCompletions[date]) {
      dailyCompletions[date] = { completed: 0, total: 0 };
    }
    dailyCompletions[date].total++;
    if (todo.isCompleted) {
      dailyCompletions[date].completed++;
    }
  });
  
  // Group by week
  const weeklyCompletions: { [key: string]: { completed: number; total: number } } = {};
  todos.forEach((todo: any) => {
    const date = new Date(todo.createdAt);
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyCompletions[weekKey]) {
      weeklyCompletions[weekKey] = { completed: 0, total: 0 };
    }
    weeklyCompletions[weekKey].total++;
    if (todo.isCompleted) {
      weeklyCompletions[weekKey].completed++;
    }
  });
  
  // Group by month
  const monthlyCompletions: { [key: string]: { completed: number; total: number } } = {};
  todos.forEach((todo: any) => {
    const date = new Date(todo.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyCompletions[monthKey]) {
      monthlyCompletions[monthKey] = { completed: 0, total: 0 };
    }
    monthlyCompletions[monthKey].total++;
    if (todo.isCompleted) {
      monthlyCompletions[monthKey].completed++;
    }
  });
  
  const report: CompletionReport = {
    dailyCompletions: Object.entries(dailyCompletions).map(([date, data]: [string, any]) => ({
      date,
      completed: data.completed,
      total: data.total,
    })),
    weeklyCompletions: Object.entries(weeklyCompletions).map(([week, data]: [string, any]) => ({
      week,
      completed: data.completed,
      total: data.total,
    })),
    monthlyCompletions: Object.entries(monthlyCompletions).map(([month, data]: [string, any]) => ({
      month,
      completed: data.completed,
      total: data.total,
    })),
  };
  
  return createApiResponse(report);
}

async function getAlarmReport(uid: string, startDate: number, endDate: number, db: any) {
  // Get all alarms in date range
  const alarmsSnapshot = await db.collection('alarms')
    .where('userId', '==', uid)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  const alarms = alarmsSnapshot.docs.map((doc: any) => doc.data());
  
  const totalAlarms = alarms.length;
  const triggeredAlarms = alarms.filter((alarm: any) => !alarm.isActive).length;
  const activeAlarms = alarms.filter((alarm: any) => alarm.isActive).length;
  
  // Calculate snooze statistics (this would need additional tracking)
  const snoozedAlarms = 0; // Placeholder - would need snooze tracking
  const dismissedAlarms = triggeredAlarms - snoozedAlarms;
  const averageSnoozeCount = 0; // Placeholder
  
  // Find most frequent alarm time
  const timeCounts: { [key: number]: number } = {};
  alarms.forEach((alarm: any) => {
    const hour = new Date(alarm.scheduledTime).getHours();
    timeCounts[hour] = (timeCounts[hour] || 0) + 1;
  });
  
  const mostFrequentAlarmTime = Object.keys(timeCounts).reduce((a: string, b: string) => 
    timeCounts[parseInt(a)] > timeCounts[parseInt(b)] ? a : b, '0'
  );
  
  const report: AlarmReport = {
    totalAlarms,
    triggeredAlarms,
    snoozedAlarms,
    dismissedAlarms,
    averageSnoozeCount,
    mostFrequentAlarmTime: parseInt(mostFrequentAlarmTime),
  };
  
  return createApiResponse(report);
}

async function getTaskReport(uid: string, startDate: number, endDate: number, db: any) {
  // Get all todos in date range
  const todosSnapshot = await db.collection('todos')
    .where('userId', '==', uid)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  const todos = todosSnapshot.docs.map((doc: any) => doc.data());
  
  const allTasks = todos.flatMap((todo: any) => todo.tasks || []);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((task: any) => task.isCompleted).length;
  const averageTasksPerTodo = todos.length > 0 ? totalTasks / todos.length : 0;
  
  // Find most common task types (by text similarity)
  const taskTexts = allTasks.map((task: any) => task.text.toLowerCase().trim());
  const taskCounts: { [key: string]: number } = {};
  
  taskTexts.forEach((text: string) => {
    if (text) {
      taskCounts[text] = (taskCounts[text] || 0) + 1;
    }
  });
  
  const mostCommonTaskTypes = Object.entries(taskCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([text, count]: [string, number]) => ({ text, count }));
  
  const report: TaskReport = {
    totalTasks,
    completedTasks,
    averageTasksPerTodo,
    mostCommonTaskTypes,
  };
  
  return createApiResponse(report);
}
