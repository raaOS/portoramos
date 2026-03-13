import { NextRequest, NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';
import { checkFirebaseRateLimit } from '@/lib/firebaseRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const visitorId = searchParams.get('visitorId');

        if (!visitorId) {
            return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
        }

        // Rate limit: 20 requests per minute, block for 1 minute
        const rateLimit = await checkFirebaseRateLimit(`chat_sync_${visitorId}`, 20, 60000, 60000);
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
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
