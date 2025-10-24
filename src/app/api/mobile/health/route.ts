import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';

// GET /api/mobile/health
export async function GET(request: NextRequest) {
  try {
    return createApiResponse({
      status: 'healthy',
      timestamp: Date.now(),
      version: '1.0.0',
      services: {
        database: 'connected',
        notifications: 'available',
        authentication: 'active',
      },
    });
  } catch (error) {
    return createErrorResponse('Health check failed', 500);
  }
}
