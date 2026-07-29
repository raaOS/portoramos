import { NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';

export const dynamic = 'force-dynamic';

interface ClearRequestBody {
  visitorId: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ClearRequestBody;
    const { visitorId } = body;

    if (!visitorId) {
      return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
    }

    await chatStore.clearMessages(visitorId);

    return NextResponse.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('[Chat Clear Error]', error);
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 });
  }
}
