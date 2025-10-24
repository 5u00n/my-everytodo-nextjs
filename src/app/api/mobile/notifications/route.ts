import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';
import { PushSubscriptionRequest, NotificationRequest } from '@/types/mobile-api';
import webpush from 'web-push';

// Configure web-push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// POST /api/mobile/notifications/subscribe
export async function POST(request: NextRequest) {
  try {
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    const subscriptionData: PushSubscriptionRequest = await request.json();
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    if (!subscriptionData.endpoint || !subscriptionData.keys) {
      return createErrorResponse('Invalid subscription data', 400);
    }
    
    // Store subscription in database
    const subscriptionRef = db.collection('pushSubscriptions').doc(uid);
    
    const subscription = {
      userId: uid,
      endpoint: subscriptionData.endpoint,
      keys: subscriptionData.keys,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await subscriptionRef.set(subscription);
    
    return createApiResponse({ 
      message: 'Push subscription saved successfully',
      subscriptionId: subscriptionRef.id 
    });
  } catch (error) {
    console.error('Subscribe to notifications error:', error);
    return createErrorResponse('Failed to save push subscription', 500);
  }
}

// DELETE /api/mobile/notifications/unsubscribe
export async function DELETE(request: NextRequest) {
  try {
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    // Remove subscription from database
    const subscriptionRef = db.collection('pushSubscriptions').doc(uid);
    const subscriptionDoc = await subscriptionRef.get();
    
    if (subscriptionDoc.exists) {
      await subscriptionRef.delete();
    }
    
    return createApiResponse({ message: 'Push subscription removed successfully' });
  } catch (error) {
    console.error('Unsubscribe from notifications error:', error);
    return createErrorResponse('Failed to remove push subscription', 500);
  }
}

// GET /api/mobile/notifications/subscription
export async function GET(request: NextRequest) {
  try {
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    const subscriptionRef = db.collection('pushSubscriptions').doc(uid);
    const subscriptionDoc = await subscriptionRef.get();
    
    if (!subscriptionDoc.exists) {
      return createApiResponse({ subscribed: false });
    }
    
    const subscriptionData = subscriptionDoc.data();
    
    if (!subscriptionData) {
      return createApiResponse({ subscribed: false });
    }
    
    return createApiResponse({
      subscribed: true,
      subscription: {
        endpoint: subscriptionData.endpoint,
        keys: subscriptionData.keys,
        createdAt: subscriptionData.createdAt,
        updatedAt: subscriptionData.updatedAt,
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return createErrorResponse('Failed to get push subscription', 500);
  }
}

