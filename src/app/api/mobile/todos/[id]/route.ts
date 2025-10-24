import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';
import { TodoRequest, TodoResponse } from '@/types/mobile-api';

// GET /api/mobile/todos/[id]
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
    
    const todoRef = db.collection('todos').doc(id);
    const todoDoc = await todoRef.get();
    
    if (!todoDoc.exists) {
      return createErrorResponse('Todo not found', 404);
    }
    
    const todoData = todoDoc.data();
    
    // Check if user owns this todo
    if (!todoData || todoData.userId !== uid) {
      return createErrorResponse('Unauthorized access', 403);
    }
    
    const response: TodoResponse = {
      id: todoDoc.id,
      title: todoData.title,
      description: todoData.description,
      tasks: todoData.tasks || [],
      scheduledTime: todoData.scheduledTime,
      repeatPattern: todoData.repeatPattern,
      alarmSettings: todoData.alarmSettings,
      isCompleted: todoData.isCompleted,
      isActive: todoData.isActive,
      createdAt: todoData.createdAt,
      updatedAt: todoData.updatedAt,
      completedAt: todoData.completedAt,
      userId: todoData.userId,
    };
    
    return createApiResponse(response);
  } catch (error) {
    console.error('Get todo error:', error);
    return createErrorResponse('Failed to fetch todo', 500);
  }
}

// PUT /api/mobile/todos/[id]
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
    const updateData: Partial<TodoRequest> = await request.json();
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    const todoRef = db.collection('todos').doc(id);
    const todoDoc = await todoRef.get();
    
    if (!todoDoc.exists) {
      return createErrorResponse('Todo not found', 404);
    }
    
    const todoData = todoDoc.data();
    
    // Check if user owns this todo
    if (!todoData || todoData.userId !== uid) {
      return createErrorResponse('Unauthorized access', 403);
    }
    
    // Prepare update fields
    const updateFields: any = {
      updatedAt: Date.now(),
    };
    
    if (updateData.title !== undefined) {
      updateFields.title = updateData.title.trim();
    }
    
    if (updateData.description !== undefined) {
      updateFields.description = updateData.description.trim();
    }
    
    if (updateData.scheduledTime !== undefined) {
      updateFields.scheduledTime = updateData.scheduledTime;
    }
    
    if (updateData.tasks !== undefined) {
      updateFields.tasks = updateData.tasks.map((task: any) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: task.text.trim(),
        isCompleted: task.isCompleted || false,
        createdAt: Date.now(),
      }));
    }
    
    if (updateData.repeatPattern !== undefined) {
      updateFields.repeatPattern = updateData.repeatPattern;
    }
    
    if (updateData.alarmSettings !== undefined) {
      updateFields.alarmSettings = updateData.alarmSettings;
    }
    
    if (updateData.isActive !== undefined) {
      updateFields.isActive = updateData.isActive;
    }
    
    await todoRef.update(updateFields);
    
    // Get updated todo
    const updatedDoc = await todoRef.get();
    const updatedData = updatedDoc.data();
    
    if (!updatedData) {
      return createErrorResponse('Failed to retrieve updated todo', 500);
    }
    
    const response: TodoResponse = {
      id: updatedDoc.id,
      title: updatedData.title,
      description: updatedData.description,
      tasks: updatedData.tasks || [],
      scheduledTime: updatedData.scheduledTime,
      repeatPattern: updatedData.repeatPattern,
      alarmSettings: updatedData.alarmSettings,
      isCompleted: updatedData.isCompleted,
      isActive: updatedData.isActive,
      createdAt: updatedData.createdAt,
      updatedAt: updatedData.updatedAt,
      completedAt: updatedData.completedAt,
      userId: updatedData.userId,
    };
    
    return createApiResponse(response);
  } catch (error) {
    console.error('Update todo error:', error);
    return createErrorResponse('Failed to update todo', 500);
  }
}

// DELETE /api/mobile/todos/[id]
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
    
    const todoRef = db.collection('todos').doc(id);
    const todoDoc = await todoRef.get();
    
    if (!todoDoc.exists) {
      return createErrorResponse('Todo not found', 404);
    }
    
    const todoData = todoDoc.data();
    
    // Check if user owns this todo
    if (!todoData || todoData.userId !== uid) {
      return createErrorResponse('Unauthorized access', 403);
    }
    
    // Delete associated alarms
    const alarmsSnapshot = await db.collection('alarms')
      .where('todoId', '==', id)
      .get();
    
    const batch = db.batch();
    alarmsSnapshot.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    
    // Delete the todo
    batch.delete(todoRef);
    
    await batch.commit();
    
    return createApiResponse({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Delete todo error:', error);
    return createErrorResponse('Failed to delete todo', 500);
  }
}
