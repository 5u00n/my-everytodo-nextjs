import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';
import { TaskRequest, TaskResponse } from '@/types/mobile-api';

// POST /api/mobile/todos/[id]/tasks
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
    const taskData: TaskRequest = await request.json();
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    if (!taskData.text?.trim()) {
      return createErrorResponse('Task text is required', 400);
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
    
    // Create new task
    const newTask = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: taskData.text.trim(),
      isCompleted: taskData.isCompleted || false,
      createdAt: Date.now(),
    };
    
    // Add task to todo
    const updatedTasks = [...(todoData.tasks || []), newTask];
    
    await todoRef.update({
      tasks: updatedTasks,
      updatedAt: Date.now(),
    });
    
    const response: TaskResponse = newTask;
    
    return createApiResponse(response, 201);
  } catch (error) {
    console.error('Create task error:', error);
    return createErrorResponse('Failed to create task', 500);
  }
}
