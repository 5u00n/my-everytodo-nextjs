import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';
import { NotificationRequest } from '@/types/mobile-api';
import webpush from 'web-push';

// Configure web-push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// POST /api/mobile/notifications/test
export async function POST(request: NextRequest) {
  try {
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    const notificationData: NotificationRequest = await request.json();
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    // Get user's push subscription
    const subscriptionRef = db.collection('pushSubscriptions').doc(uid);
    const subscriptionDoc = await subscriptionRef.get();
    
    if (!subscriptionDoc.exists) {
      return createErrorResponse('No push subscription found', 404);
    }
    
    const subscriptionData = subscriptionDoc.data();
    
    if (!subscriptionData) {
      return createErrorResponse('No push subscription found', 404);
    }
    
    // Send test notification
    const payload = JSON.stringify({
      title: notificationData.title || 'Test Notification',
      body: notificationData.body || 'This is a test notification from EveryTodo',
      icon: notificationData.icon || '/icon-192.svg',
      badge: notificationData.badge || '/icon-192.svg',
      data: notificationData.data || {},
      actions: notificationData.actions || [],
    });
    
    await webpush.sendNotification(
      {
        endpoint: subscriptionData.endpoint,
        keys: subscriptionData.keys,
      },
      payload
    );
    
    return createApiResponse({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Send test notification error:', error);
    return createErrorResponse('Failed to send test notification', 500);
  }
}
