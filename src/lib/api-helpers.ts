import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let adminApp: any = null;
let adminAuth: any = null;
let db: any = null;

function initializeFirebaseAdmin() {
  if (!adminApp && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      adminAuth = getAuth(adminApp);
      db = getFirestore(adminApp);
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
    }
  }
  return { adminApp, adminAuth, db };
}

// Middleware to verify Firebase ID token
export async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    );
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    const { adminAuth } = initializeFirebaseAdmin();
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}

// API Response helper
export function createApiResponse(data: any, status: number = 200) {
  return NextResponse.json({
    success: status >= 200 && status < 300,
    data,
    timestamp: new Date().toISOString(),
  }, { status });
}

// Error response helper
export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  }, { status });
}

// Check if we're in build mode
export function isBuildTime() {
  return process.env.NODE_ENV === 'production' && !process.env.FIREBASE_PROJECT_ID;
}

// Get database instance
export function getDb() {
  if (isBuildTime()) {
    return null;
  }
  
  const { db } = initializeFirebaseAdmin();
  return db;
}
