import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';

// POST /api/mobile/alarms/[id]/dismiss
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
    
    // Deactivate alarm
    await alarmRef.update({
      isActive: false,
    });
    
    return createApiResponse({ message: 'Alarm dismissed successfully' });
  } catch (error) {
    console.error('Dismiss alarm error:', error);
    return createErrorResponse('Failed to dismiss alarm', 500);
  }
}
