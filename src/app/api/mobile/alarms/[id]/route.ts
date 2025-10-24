import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';
import { AlarmRequest, AlarmResponse } from '@/types/mobile-api';

// GET /api/mobile/alarms/[id]
export async function GET(
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
    
    const response: AlarmResponse = {
      id: alarmDoc.id,
      todoId: alarmData.todoId,
      title: alarmData.title,
      body: alarmData.body,
      scheduledTime: alarmData.scheduledTime,
      isActive: alarmData.isActive,
      createdAt: alarmData.createdAt,
    };
    
    return createApiResponse(response);
  } catch (error) {
    console.error('Get alarm error:', error);
    return createErrorResponse('Failed to fetch alarm', 500);
  }
}

// PUT /api/mobile/alarms/[id]
export async function PUT(
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
    const updateData: Partial<AlarmRequest> = await request.json();
    
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
    
    // Prepare update fields
    const updateFields: any = {};
    
    if (updateData.title !== undefined) {
      updateFields.title = updateData.title.trim();
    }
    
    if (updateData.body !== undefined) {
      updateFields.body = updateData.body.trim();
    }
    
    if (updateData.scheduledTime !== undefined) {
      updateFields.scheduledTime = updateData.scheduledTime;
    }
    
    await alarmRef.update(updateFields);
    
    // Get updated alarm
    const updatedDoc = await alarmRef.get();
    const updatedData = updatedDoc.data();
    
    if (!updatedData) {
      return createErrorResponse('Failed to retrieve updated alarm', 500);
    }
    
    const response: AlarmResponse = {
      id: updatedDoc.id,
      todoId: updatedData.todoId,
      title: updatedData.title,
      body: updatedData.body,
      scheduledTime: updatedData.scheduledTime,
      isActive: updatedData.isActive,
      createdAt: updatedData.createdAt,
    };
    
    return createApiResponse(response);
  } catch (error) {
    console.error('Update alarm error:', error);
    return createErrorResponse('Failed to update alarm', 500);
  }
}

// DELETE /api/mobile/alarms/[id]
export async function DELETE(
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
    
    await alarmRef.delete();
    
    return createApiResponse({ message: 'Alarm deleted successfully' });
  } catch (error) {
    console.error('Delete alarm error:', error);
    return createErrorResponse('Failed to delete alarm', 500);
  }
}

