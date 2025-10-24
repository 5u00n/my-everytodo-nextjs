import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';
import { TaskRequest, TaskResponse } from '@/types/mobile-api';

// PUT /api/mobile/todos/[todoId]/tasks/[taskId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string; taskId: string }> }
) {
  try {
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    const { todoId, taskId } = await params;
    const updateData: Partial<TaskRequest> = await request.json();
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    const todoRef = db.collection('todos').doc(todoId);
    const todoDoc = await todoRef.get();
    
    if (!todoDoc.exists) {
      return createErrorResponse('Todo not found', 404);
    }
    
    const todoData = todoDoc.data();
    
    // Check if user owns this todo
    if (!todoData || todoData.userId !== uid) {
      return createErrorResponse('Unauthorized access', 403);
    }
    
    const tasks = todoData.tasks || [];
    const taskIndex = tasks.findIndex((task: any) => task.id === taskId);
    
    if (taskIndex === -1) {
      return createErrorResponse('Task not found', 404);
    }
    
    // Update task
    const updatedTask = {
      ...tasks[taskIndex],
      text: updateData.text !== undefined ? updateData.text.trim() : tasks[taskIndex].text,
      isCompleted: updateData.isCompleted !== undefined ? updateData.isCompleted : tasks[taskIndex].isCompleted,
    };
    
    tasks[taskIndex] = updatedTask;
    
    await todoRef.update({
      tasks: tasks,
      updatedAt: Date.now(),
    });
    
    const response: TaskResponse = updatedTask;
    
    return createApiResponse(response);
  } catch (error) {
    console.error('Update task error:', error);
    return createErrorResponse('Failed to update task', 500);
  }
}

// DELETE /api/mobile/todos/[todoId]/tasks/[taskId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string; taskId: string }> }
) {
  try {
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    const { todoId, taskId } = await params;
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    const todoRef = db.collection('todos').doc(todoId);
    const todoDoc = await todoRef.get();
    
    if (!todoDoc.exists) {
      return createErrorResponse('Todo not found', 404);
    }
    
    const todoData = todoDoc.data();
    
    // Check if user owns this todo
    if (!todoData || todoData.userId !== uid) {
      return createErrorResponse('Unauthorized access', 403);
    }
    
    const tasks = todoData.tasks || [];
    const taskIndex = tasks.findIndex((task: any) => task.id === taskId);
    
    if (taskIndex === -1) {
      return createErrorResponse('Task not found', 404);
    }
    
    // Remove task
    tasks.splice(taskIndex, 1);
    
    await todoRef.update({
      tasks: tasks,
      updatedAt: Date.now(),
    });
    
    return createApiResponse({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return createErrorResponse('Failed to delete task', 500);
  }
}
