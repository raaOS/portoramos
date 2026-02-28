import { NextRequest, NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';
import { validateConfig } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint untuk test webhook telegram
 * POST /api/debug/webhook-test
 * Body: { threadId: number, text: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threadId, text, simulateChatId } = body;

    if (!threadId || !text) {
      return NextResponse.json({ error: 'Missing threadId or text' }, { status: 400 });
    }

    // Get config
    const validation = validateConfig();
    if (!validation.valid) {
      return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
    }
    
    const { chatId: adminChatId, groupId } = validation.config;
    const testChatId = simulateChatId || groupId || adminChatId;

    console.log('[Webhook Test] Testing with:', { threadId, text, testChatId });

    // Simulate webhook data structure
    const mockWebhookBody = {
      message: {
        message_id: Date.now(),
        chat: { id: Number(testChatId) },
        message_thread_id: Number(threadId),
        text: text,
        from: { id: Number(adminChatId) }
      }
    };

    // Check admin
    const incomingChatId = mockWebhookBody.message.chat.id.toString();
    const isAdmin = incomingChatId === adminChatId || (groupId && incomingChatId === groupId);

    // Find visitor
    const msgThreadId = mockWebhookBody.message.message_thread_id;
    let currentVisitorId: string | null = null;
    
    if (msgThreadId) {
      currentVisitorId = await chatStore.getVisitorByThreadId(Number(msgThreadId));
    }

    // Try to add admin reply
    let addResult = null;
    if (currentVisitorId) {
      addResult = await chatStore.addAdminReply(currentVisitorId, text);
    }

    // Get session data
    const session = currentVisitorId ? await chatStore.getSession(currentVisitorId) : null;
    const messages = currentVisitorId ? await chatStore.getAllMessages(currentVisitorId) : [];

    return NextResponse.json({
      success: true,
      debug: {
        incomingChatId,
        isAdmin,
        threadId: msgThreadId,
        visitorId: currentVisitorId,
        addReplyResult: addResult,
        sessionExists: !!session,
        messageCount: messages.length,
        lastMessages: messages.slice(-3)
      }
    });

  } catch (error: any) {
    console.error('[Webhook Test Error]:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error.message || String(error)
    }, { status: 500 });
  }
}

/**
 * GET - Check thread mapping
 * GET /api/debug/webhook-test?threadId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json({ error: 'Missing threadId' }, { status: 400 });
    }

    const visitorId = await chatStore.getVisitorByThreadId(Number(threadId));
    
    return NextResponse.json({
      success: true,
      threadId: Number(threadId),
      visitorId,
      found: !!visitorId
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Check failed',
      details: error.message
    }, { status: 500 });
  }
}
