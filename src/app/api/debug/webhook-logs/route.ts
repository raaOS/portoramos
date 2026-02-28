import { NextRequest, NextResponse } from 'next/server';
import { validateConfig } from '@/lib/telegram';
import { chatStore } from '@/lib/chatStore';

export const dynamic = 'force-dynamic';

// Simple in-memory log storage (resets on cold start)
const recentLogs: any[] = [];
const MAX_LOGS = 50;

export function addLog(data: any) {
  recentLogs.unshift({
    timestamp: new Date().toISOString(),
    ...data
  });
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.pop();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkWebhook = searchParams.get('check') === 'true';
    
    // Get Telegram config
    const validation = validateConfig();
    if (!validation.valid) {
      return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
    }

    const { botToken } = validation.config;
    
    let webhookInfo = null;
    if (checkWebhook) {
      // Check webhook status from Telegram
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      webhookInfo = await res.json();
    }

    // Get recent pending updates count from webhook info
    const pendingUpdates = webhookInfo?.result?.pending_update_count || 0;

    return NextResponse.json({
      success: true,
      recentLogs: recentLogs.slice(0, 20),
      webhookInfo: webhookInfo?.result,
      pendingUpdates,
      logCount: recentLogs.length
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to get logs',
      details: error.message
    }, { status: 500 });
  }
}

// POST to check thread mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threadId, visitorId } = body;

    if (threadId) {
      const foundVisitor = await chatStore.getVisitorByThreadId(Number(threadId));
      return NextResponse.json({
        success: true,
        query: { threadId },
        result: { visitorId: foundVisitor }
      });
    }

    if (visitorId) {
      const session = await chatStore.getSession(visitorId);
      return NextResponse.json({
        success: true,
        query: { visitorId },
        result: { session }
      });
    }

    return NextResponse.json({
      error: 'Need threadId or visitorId'
    }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
