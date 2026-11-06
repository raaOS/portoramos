import { NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';
import { verifyVisitorSession } from '@/lib/chatSession';
import { enforceRequestRateLimit } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

interface ClearRequestBody {
  visitorId: string;
  signature?: string;
}

export async function POST(request: Request) {
  try {
    const ipLimit = await enforceRequestRateLimit(request as never, 'chat_clear', 10, 60_000, 60_000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: ipLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter ?? 60) } }
      );
    }

    const body = (await request.json()) as ClearRequestBody;
    const { visitorId, signature } = body;

    if (!visitorId) {
      return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
    }

    if (!verifyVisitorSession(visitorId, signature)) {
      return NextResponse.json({ error: 'Invalid chat session' }, { status: 403 });
    }

    await chatStore.clearMessages(visitorId);

    return NextResponse.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('[Chat Clear Error]', error);
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 });
  }
}
