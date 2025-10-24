import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';
import { AlarmResponse } from '@/types/mobile-api';

// POST /api/mobile/alarms/[id]/snooze
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    const { id } = await params;
    const { minutes = 5 } = await request.json();
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    const alarmRef = db.collection('alarms').doc(id);
    const alarmDoc = await alarmRef.get();
    
    if (!alarmDoc.exists) {
      return createErrorResponse('Alarm not found', 404);
    }
    
    const alarmData = alarmDoc.data();
    
    // Check if user owns this alarm
    if (!alarmData || alarmData.userId !== uid) {
      return createErrorResponse('Unauthorized access', 403);
    }
    
    // Calculate new scheduled time
    const newScheduledTime = Date.now() + (minutes * 60 * 1000);
    
    await alarmRef.update({
      scheduledTime: newScheduledTime,
      isActive: true,
    });
    
    const response: AlarmResponse = {
      id: alarmDoc.id,
      todoId: alarmData.todoId,
      title: alarmData.title,
      body: alarmData.body,
      scheduledTime: newScheduledTime,
      isActive: true,
      createdAt: alarmData.createdAt,
    };
    
    return createApiResponse(response);
  } catch (error) {
    console.error('Snooze alarm error:', error);
    return createErrorResponse('Failed to snooze alarm', 500);
  }
}
