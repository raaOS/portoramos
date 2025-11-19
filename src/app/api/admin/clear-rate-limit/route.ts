import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Clear rate limits (for development only)
    // In production, this should be protected or removed
    if (process.env.NODE_ENV === 'development') {
      // Clear rate limit map
      const rateLimitMap = (global as any).rateLimitMap;
      if (rateLimitMap) {
        rateLimitMap.clear();
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Rate limits cleared successfully' 
      });
    } else {
      return NextResponse.json({ 
        error: 'This endpoint is only available in development' 
      }, { status: 403 });
    }
  } catch (error) {
    console.error('Error clearing rate limits:', error);
    return NextResponse.json({ 
      error: 'Failed to clear rate limits' 
    }, { status: 500 });
  }
}
