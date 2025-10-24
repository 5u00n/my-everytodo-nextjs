import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb, isBuildTime } from '@/lib/api-helpers';
import { AuthResponse, LoginRequest } from '@/types/mobile-api';

// POST /api/mobile/auth/login
export async function POST(request: NextRequest) {
  try {
    if (isBuildTime()) {
      return createApiResponse({ message: 'API not available during build' });
    }
    
    const body: LoginRequest = await request.json();
    
    if (!body.idToken) {
      return createErrorResponse('ID token is required', 400);
    }

    // Verify the Firebase ID token
    const authHeader = `Bearer ${body.idToken}`;
    const authRequest = new NextRequest(request.url, {
      headers: { ...request.headers, authorization: authHeader }
    });
    
    const tokenResult = await verifyToken(authRequest);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult; // Return error response
    }

    const { uid, email } = tokenResult;

    // Get or create user profile
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    let userData;
    if (userDoc.exists) {
      userData = userDoc.data();
    } else {
      // Create new user profile
      userData = {
        id: uid,
        email: email,
        displayName: email?.split('@')[0] || 'User',
        photoURL: null,
        preferences: {
          theme: 'system',
          notifications: {
            enabled: true,
            sound: true,
            vibrate: true,
          },
          alarms: {
            defaultSnoozeMinutes: 5,
            defaultDuration: 5,
            defaultRepeatCount: 3,
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await userRef.set(userData);
    }

    if (!userData) {
      return createErrorResponse('Failed to retrieve user data', 500);
    }

    const response: AuthResponse = {
      user: {
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        createdAt: userData.createdAt,
      },
      token: body.idToken, // Return the same token for mobile app to use
    };

    return createApiResponse(response);
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Authentication failed', 401);
  }
}

// GET /api/mobile/auth/profile
export async function GET(request: NextRequest) {
  try {
    if (isBuildTime()) {
      return createApiResponse({ message: 'API not available during build' });
    }
    
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return createErrorResponse('User not found', 404);
    }

    const userData = userDoc.data();
    
    if (!userData) {
      return createErrorResponse('User not found', 404);
    }
    
    return createApiResponse({
      id: userData.id,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      preferences: userData.preferences,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return createErrorResponse('Failed to get user profile', 500);
  }
}

// PUT /api/mobile/auth/profile
export async function PUT(request: NextRequest) {
  try {
    if (isBuildTime()) {
      return createApiResponse({ message: 'API not available during build' });
    }
    
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    const updateData = await request.json();
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return createErrorResponse('User not found', 404);
    }

    const updateFields = {
      ...updateData,
      updatedAt: Date.now(),
    };

    await userRef.update(updateFields);
    
    // Get updated user data
    const updatedDoc = await userRef.get();
    const userData = updatedDoc.data();
    
    if (!userData) {
      return createErrorResponse('Failed to retrieve updated user data', 500);
    }
    
    return createApiResponse({
      id: userData.id,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      preferences: userData.preferences,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return createErrorResponse('Failed to update user profile', 500);
  }
}

// DELETE /api/mobile/auth/account
export async function DELETE(request: NextRequest) {
  try {
    if (isBuildTime()) {
      return createApiResponse({ message: 'API not available during build' });
    }
    
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    // Delete user data from Firestore
    const batch = db.batch();
    
    // Delete user profile
    const userRef = db.collection('users').doc(uid);
    batch.delete(userRef);
    
    // Delete all user todos
    const todosSnapshot = await db.collection('todos')
      .where('userId', '==', uid)
      .get();
    
    todosSnapshot.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    
    // Delete all user alarms
    const alarmsSnapshot = await db.collection('alarms')
      .where('userId', '==', uid)
      .get();
    
    alarmsSnapshot.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return createApiResponse({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return createErrorResponse('Failed to delete account', 500);
  }
}
