import { NextRequest, NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';
import { validateConfig } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/**
 * Simulasi admin reply dari Telegram untuk testing lokal
 * POST /api/debug/simulate-reply
 * Body: { visitorId: string, text: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, text } = body;

    if (!visitorId || !text) {
      return NextResponse.json({ 
        error: 'Missing visitorId or text',
        required: { visitorId: 'string', text: 'string' }
      }, { status: 400 });
    }

    console.log('[Simulate Reply] Testing admin reply for visitor:', visitorId);

    // Check if visitor exists
    const session = await chatStore.getSession(visitorId);
    if (!session) {
      return NextResponse.json({
        error: 'Visitor session not found',
        visitorId,
        tip: 'Send a message from web contact first'
      }, { status: 404 });
    }

    console.log('[Simulate Reply] Session found:', {
      visitorId: session.visitorId,
      telegramThreadId: session.telegramThreadId,
      aiMode: session.aiMode
    });

    // Try to add admin reply (same logic as webhook)
    const result = await chatStore.addAdminReply(visitorId, text);
    console.log('[Simulate Reply] addAdminReply result:', result);

    // Get updated messages
    const messages = await chatStore.getAllMessages(visitorId);
    const adminMessages = messages.filter(m => m.sender === 'admin');

    // Also try to send to Telegram (optional)
    const validation = validateConfig();
    let telegramResult = null;
    
    if (validation.valid && session.telegramThreadId) {
      const { botToken, groupId, chatId: adminChatId } = validation.config;
      const targetChatId = groupId || adminChatId;
      
      try {
        const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            message_thread_id: session.telegramThreadId,
            text: `✅ *Admin Reply (Test):*\n"${text}"`,
            parse_mode: 'Markdown'
          })
        });
        telegramResult = await tgResponse.json();
      } catch (e) {
        telegramResult = { error: (e as Error).message };
      }
    }

    return NextResponse.json({
      success: result,
      visitorId,
      session: {
        telegramThreadId: session.telegramThreadId,
        aiMode: session.aiMode
      },
      adminReplyAdded: result,
      totalAdminMessages: adminMessages.length,
      allMessages: messages,
      telegramNotification: telegramResult
    });

  } catch (error: unknown) {
    console.error('[Simulate Reply Error]:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      error: 'Failed to simulate reply',
      details: errorMessage
    }, { status: 500 });
  }
}

/**
 * GET - List active sessions
 */
export async function GET() {
  try {
    // This would require listing all sessions from Firebase
    // For now just return instructions
    return NextResponse.json({
      message: 'Use POST to simulate admin reply',
      example: {
        method: 'POST',
        body: {
          visitorId: 'your-visitor-id',
          text: 'Hello from admin'
        }
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
