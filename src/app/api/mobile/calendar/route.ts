import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';
import { CalendarRequest, CalendarEvent, SyncRequest, SyncResponse } from '@/types/mobile-api';

// GET /api/mobile/calendar
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
    const view = searchParams.get('view') || 'month';
    
    // Get todos in date range
    const todosSnapshot = await db.collection('todos')
      .where('userId', '==', uid)
      .where('scheduledTime', '>=', startDate)
      .where('scheduledTime', '<=', endDate)
      .get();
    
    // Get alarms in date range
    const alarmsSnapshot = await db.collection('alarms')
      .where('userId', '==', uid)
      .where('scheduledTime', '>=', startDate)
      .where('scheduledTime', '<=', endDate)
      .get();
    
    const events: CalendarEvent[] = [];
    
    // Add todos as events
    todosSnapshot.docs.forEach((doc: any) => {
      const todo = doc.data();
      events.push({
        id: doc.id,
        title: todo.title,
        start: todo.scheduledTime,
        end: todo.scheduledTime + (60 * 60 * 1000), // 1 hour duration
        type: 'todo',
        todoId: doc.id,
        isCompleted: todo.isCompleted,
        isActive: todo.isActive,
      });
    });
    
    // Add alarms as events
    alarmsSnapshot.docs.forEach((doc: any) => {
      const alarm = doc.data();
      events.push({
        id: doc.id,
        title: alarm.title,
        start: alarm.scheduledTime,
        end: alarm.scheduledTime + (30 * 60 * 1000), // 30 minutes duration
        type: 'alarm',
        alarmId: doc.id,
        isActive: alarm.isActive,
      });
    });
    
    // Sort events by start time
    events.sort((a, b) => a.start - b.start);
    
    return createApiResponse({
      events,
      view,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('Get calendar error:', error);
    return createErrorResponse('Failed to fetch calendar data', 500);
  }
}


