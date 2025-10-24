// Simple build-time check for mobile API routes
export function withBuildCheck(handler: Function) {
  return async (request: any, context: any) => {
    // During build time, return a simple response
    if (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_PROJECT_ID) {
      return new Response(JSON.stringify({
        success: true,
        message: 'API not available during build',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return handler(request, context);
  };
}
