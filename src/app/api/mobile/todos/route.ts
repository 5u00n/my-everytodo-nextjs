import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';
import { TodoRequest, TodoResponse, PaginationParams, PaginatedResponse } from '@/types/mobile-api';

// GET /api/mobile/todos
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
    
    // Parse pagination and filter parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const filter = searchParams.get('filter') || 'all'; // all, today, upcoming, completed
    const sortBy = searchParams.get('sortBy') || 'scheduledTime';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    let query = db.collection('todos').where('userId', '==', uid);
    
    // Apply filters
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    switch (filter) {
      case 'today':
        query = query.where('scheduledTime', '>=', todayStart.getTime())
                    .where('scheduledTime', '<=', todayEnd.getTime());
        break;
      case 'upcoming':
        query = query.where('scheduledTime', '>', now);
        break;
      case 'completed':
        query = query.where('isCompleted', '==', true);
        break;
      case 'active':
        query = query.where('isActive', '==', true);
        break;
    }
    
    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const todosSnapshot = await query
      .orderBy(sortBy, sortOrder as 'asc' | 'desc')
      .offset(offset)
      .limit(limit)
      .get();
    
    const todos: TodoResponse[] = todosSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        tasks: data.tasks || [],
        scheduledTime: data.scheduledTime,
        repeatPattern: data.repeatPattern,
        alarmSettings: data.alarmSettings,
        isCompleted: data.isCompleted,
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        completedAt: data.completedAt,
        userId: data.userId,
      };
    });
    
    const response: PaginatedResponse<TodoResponse> = {
      success: true,
      data: todos,
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
    console.error('Get todos error:', error);
    return createErrorResponse('Failed to fetch todos', 500);
  }
}

// POST /api/mobile/todos
export async function POST(request: NextRequest) {
  try {
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    const todoData: TodoRequest = await request.json();
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    // Validate required fields
    if (!todoData.title?.trim()) {
      return createErrorResponse('Title is required', 400);
    }
    
    if (!todoData.scheduledTime) {
      return createErrorResponse('Scheduled time is required', 400);
    }
    
    // Create todo document
    const todoRef = db.collection('todos').doc();
    const now = Date.now();
    
    const newTodo = {
      title: todoData.title.trim(),
      description: todoData.description?.trim() || '',
      scheduledTime: todoData.scheduledTime,
      tasks: todoData.tasks.map((task: any) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: task.text.trim(),
        isCompleted: task.isCompleted || false,
        createdAt: now,
      })),
      repeatPattern: todoData.repeatPattern,
      alarmSettings: todoData.alarmSettings,
      isCompleted: false,
      isActive: todoData.isActive !== false,
      createdAt: now,
      updatedAt: now,
      userId: uid,
    };
    
    await todoRef.set(newTodo);
    
    const response: TodoResponse = {
      id: todoRef.id,
      ...newTodo,
    };
    
    return createApiResponse(response, 201);
  } catch (error) {
    console.error('Create todo error:', error);
    return createErrorResponse('Failed to create todo', 500);
  }
}
