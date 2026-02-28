import { NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const visitorId = searchParams.get('visitorId');

        if (!visitorId) {
            return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
        }

        // Fetch all messages for this visitor
        const messages = await chatStore.getAllMessages(visitorId);

        return NextResponse.json({ success: true, messages });

    } catch (error: unknown) {
        console.error('[Web Chat Sync Error]:', error);
        const errMsg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
            error: 'Failed to sync messages',
            details: errMsg
        }, { status: 500 });
    }
}
