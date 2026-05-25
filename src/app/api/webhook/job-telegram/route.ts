import { NextResponse } from 'next/server';
import { getJobBotConfig, isValidJobBotWebhookSecret } from '@/lib/jobBot/config';
import { handleJobBotUpdate, type JobBotUpdate } from '@/lib/jobBot/handler';

export async function POST(request: Request) {
  let config;

  try {
    config = getJobBotConfig();
  } catch (error) {
    console.error('[JobBot Webhook] Config error:', error);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const providedSecret = request.headers.get('x-telegram-bot-api-secret-token');
  if (!isValidJobBotWebhookSecret(config.botToken, providedSecret)) {
    return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
  }

  let body: JobBotUpdate;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  await handleJobBotUpdate(body, config);
  return NextResponse.json({ ok: true });
}
