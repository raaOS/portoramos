import { NextResponse } from 'next/server';

export async function POST() {
  try {
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        success: true, 
        message: 'Proxy no longer uses in-memory rate limits. Use route-level CLOUDFLARE_D1-backed limits instead.' 
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
