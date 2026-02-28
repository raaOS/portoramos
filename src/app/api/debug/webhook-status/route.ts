import { NextRequest, NextResponse } from 'next/server';
import { validateConfig } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const validation = validateConfig();
    if (!validation.valid) {
      return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
    }

    const { botToken } = validation.config;
    
    // Get current webhook info
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await res.json();

    // Get current URL from request
    const currentUrl = new URL(request.url);
    const expectedWebhookUrl = `${currentUrl.protocol}//${currentUrl.host}/api/webhook/telegram`;

    return NextResponse.json({
      success: true,
      telegram: data.ok ? data.result : { error: data.description },
      currentConfig: {
        expectedWebhookUrl,
        botTokenConfigured: !!botToken,
        botTokenPreview: botToken ? botToken.substring(0, 10) + '...' : null
      },
      isCorrect: data.ok && data.result.url === expectedWebhookUrl
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const validation = validateConfig();
    if (!validation.valid) {
      return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
    }

    const { botToken } = validation.config;
    
    // Get current URL for webhook
    const currentUrl = new URL(request.url);
    const webhookUrl = `${currentUrl.protocol}//${currentUrl.host}/api/webhook/telegram`;

    // Set webhook
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message']
      })
    });

    const data = await res.json();

    return NextResponse.json({
      success: data.ok,
      webhookUrl,
      telegramResponse: data
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
}
