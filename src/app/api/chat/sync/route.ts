import { NextRequest, NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';
import { verifyVisitorSession } from '@/lib/chatSession';
import { checkDataRateLimit } from '@/lib/dataRateLimit';
import { enforceRequestRateLimit } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');
    const signature = searchParams.get('sig');

    if (!visitorId) {
      return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
    }

    if (!verifyVisitorSession(visitorId, signature)) {
      return NextResponse.json({ error: 'Invalid chat session' }, { status: 403 });
    }

    const ipLimit = await enforceRequestRateLimit(request, 'chat_sync', 80, 60_000, 60_000);
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const rateLimit = await checkDataRateLimit(`chat_sync_${visitorId}`, 40, 60000, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const [messages, isAdminTyping] = await Promise.all([
      chatStore.getAllMessages(visitorId),
      chatStore.getTypingStatus(visitorId),
    ]);

    return NextResponse.json({ success: true, messages, isAdminTyping });
  } catch (error: unknown) {
    console.error('[Web Chat Sync Error]:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync messages',
      },
      { status: 500 }
    );
  }
}
