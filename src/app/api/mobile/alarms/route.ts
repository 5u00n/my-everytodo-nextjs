import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';
import { AlarmRequest, AlarmResponse, PaginationParams, PaginatedResponse } from '@/types/mobile-api';

// GET /api/mobile/alarms
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
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const filter = searchParams.get('filter') || 'all'; // all, active, triggered, upcoming
    const sortBy = searchParams.get('sortBy') || 'scheduledTime';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    let query = db.collection('alarms').where('userId', '==', uid);
    
    // Apply filters
    const now = Date.now();
    
    switch (filter) {
      case 'active':
        query = query.where('isActive', '==', true);
        break;
      case 'triggered':
        query = query.where('isActive', '==', false);
        break;
      case 'upcoming':
        query = query.where('scheduledTime', '>', now)
                    .where('isActive', '==', true);
        break;
      case 'past':
        query = query.where('scheduledTime', '<=', now);
        break;
    }
    
    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const alarmsSnapshot = await query
      .orderBy(sortBy, sortOrder as 'asc' | 'desc')
      .offset(offset)
      .limit(limit)
      .get();
    
    const alarms: AlarmResponse[] = alarmsSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        todoId: data.todoId,
        title: data.title,
        body: data.body,
        scheduledTime: data.scheduledTime,
        isActive: data.isActive,
        createdAt: data.createdAt,
      };
    });
    
    const response: PaginatedResponse<AlarmResponse> = {
      success: true,
      data: alarms,
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Get alarms error:', error);
    return createErrorResponse('Failed to fetch alarms', 500);
  }
}

// POST /api/mobile/alarms
export async function POST(request: NextRequest) {
  try {
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    const alarmData: AlarmRequest = await request.json();
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    // Validate required fields
    if (!alarmData.todoId) {
      return createErrorResponse('Todo ID is required', 400);
    }
    
    if (!alarmData.title?.trim()) {
      return createErrorResponse('Title is required', 400);
    }
    
    if (!alarmData.scheduledTime) {
      return createErrorResponse('Scheduled time is required', 400);
    }
    
    // Verify todo exists and user owns it
    const todoRef = db.collection('todos').doc(alarmData.todoId);
    const todoDoc = await todoRef.get();
    
    if (!todoDoc.exists) {
      return createErrorResponse('Todo not found', 404);
    }
    
    const todoData = todoDoc.data();
    if (!todoData || todoData.userId !== uid) {
      return createErrorResponse('Unauthorized access to todo', 403);
    }
    
    // Create alarm document
    const alarmRef = db.collection('alarms').doc();
    const now = Date.now();
    
    const newAlarm = {
      todoId: alarmData.todoId,
      title: alarmData.title.trim(),
      body: alarmData.body?.trim() || '',
      scheduledTime: alarmData.scheduledTime,
      isActive: true,
      createdAt: now,
      userId: uid,
    };
    
    await alarmRef.set(newAlarm);
    
    const response: AlarmResponse = {
      id: alarmRef.id,
      ...newAlarm,
    };
    
    return createApiResponse(response, 201);
  } catch (error) {
    console.error('Create alarm error:', error);
    return createErrorResponse('Failed to create alarm', 500);
  }
}
