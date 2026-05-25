import { NextRequest, NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';
import { checkDataRateLimit } from '@/lib/dataRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');

    if (!visitorId) {
      return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
    }

    // Rate limit: 40 requests per minute, block for 1 minute
    // Keeps headroom above the client polling cadence and focus refetches.
    const rateLimit = await checkDataRateLimit(`chat_sync_${visitorId}`, 40, 60000, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Fetch all messages and typing status
    const [messages, isAdminTyping] = await Promise.all([
      chatStore.getAllMessages(visitorId),
      chatStore.getTypingStatus(visitorId),
    ]);

    return NextResponse.json({ success: true, messages, isAdminTyping });
  } catch (error: unknown) {
    console.error('[Web Chat Sync Error]:', error);
    // Log full error server-side only - do not expose to client
    return NextResponse.json(
      {
        error: 'Failed to sync messages',
      },
      { status: 500 }
    );
  }
}
