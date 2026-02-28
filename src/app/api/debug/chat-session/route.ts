import { NextRequest, NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');

    if (!visitorId) {
      return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
    }

    const session = await chatStore.getSession(visitorId);
    const messages = await chatStore.getAllMessages(visitorId);

    return NextResponse.json({
      success: true,
      visitorId,
      session,
      messages
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
