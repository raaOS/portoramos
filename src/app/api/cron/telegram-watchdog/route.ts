import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { buildJobBotWebhookSecret } from '@/lib/jobBot/config';
import { cleanEnvVar } from '@/lib/utils/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JOB_BOT_LOCAL_LEASE_KEY = 'telegramJobBotLocalLease';
const WATCHDOG_STATUS_KEY = 'telegramWatchdogStatus';

interface JobBotLocalLease {
  mode?: string;
  ownerId?: string;
  heartbeatAt?: number;
  expiresAt?: number;
  restoreWebhookUrl?: string;
  previousWebhookUrl?: string;
}

interface TelegramWebhookInfo {
  url?: string;
  pending_update_count?: number;
  last_error_message?: string;
}

async function writeWatchdogStatus(status: Record<string, unknown>) {
  try {
    await db.ref(WATCHDOG_STATUS_KEY).set({
      ...status,
      checkedAt: Date.now(),
    });
  } catch (error) {
    console.error('[Telegram Watchdog] Failed to write status:', error);
  }
}

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function resolveExpectedWebhookUrl() {
  const baseUrl = (
    cleanEnvVar('JOB_BOT_WEBHOOK_BASE_URL') ||
    cleanEnvVar('NEXT_PUBLIC_SITE_URL') ||
    ''
  ).replace(/\/+$/, '');

  if (!baseUrl || !isHttpsUrl(baseUrl)) return '';
  return `${baseUrl}/api/webhook/job-telegram`;
}

function getActiveLease(lease: JobBotLocalLease | null, now = Date.now()) {
  if (!lease || lease.mode !== 'local-polling') return null;
  if (typeof lease.expiresAt !== 'number' || lease.expiresAt <= now) return null;
  return lease;
}

async function telegramRequest<T>(
  token: string,
  method: 'getWebhookInfo' | 'setWebhook',
  body?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    body
      ? {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }
      : undefined
  );

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    description?: string;
    result?: T;
  } | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.description || `Telegram ${method} failed`);
  }

  return payload.result as T;
}

function assertCronAuthorized(request: Request) {
  const secret = cleanEnvVar('CRON_SECRET');
  if (!secret) {
    return json({ ok: false, error: 'CRON_SECRET is missing' }, 503);
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  return null;
}

export async function GET(request: Request) {
  const unauthorizedResponse = assertCronAuthorized(request);
  if (unauthorizedResponse) return unauthorizedResponse;

  const botToken = cleanEnvVar('JOB_BOT_TELEGRAM_TOKEN') || '';
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(botToken)) {
    return json({ ok: false, error: 'JOB_BOT_TELEGRAM_TOKEN is missing or invalid' }, 503);
  }

  const expectedWebhookUrl = resolveExpectedWebhookUrl();
  if (!expectedWebhookUrl) {
    return json(
      {
        ok: false,
        error: 'JOB_BOT_WEBHOOK_BASE_URL or NEXT_PUBLIC_SITE_URL must be a HTTPS URL',
      },
      503
    );
  }

  const leaseSnap = await db.ref(JOB_BOT_LOCAL_LEASE_KEY).once('value');
  const lease = leaseSnap.val() as JobBotLocalLease | null;
  const activeLease = getActiveLease(lease);

  if (activeLease) {
    await writeWatchdogStatus({
      ok: true,
      action: 'skipped',
      reason: 'local-dev-lease-active',
      leaseExpiresAt: activeLease.expiresAt,
      leaseHeartbeatAt: activeLease.heartbeatAt,
    });

    return json({
      ok: true,
      action: 'skipped',
      reason: 'local-dev-lease-active',
      leaseExpiresAt: activeLease.expiresAt,
      leaseHeartbeatAt: activeLease.heartbeatAt,
    });
  }

  const info = await telegramRequest<TelegramWebhookInfo>(botToken, 'getWebhookInfo');
  const currentWebhookUrl = info.url || '';

  if (currentWebhookUrl === expectedWebhookUrl) {
    if (lease) {
      await db.ref(JOB_BOT_LOCAL_LEASE_KEY).remove();
    }

    await writeWatchdogStatus({
      ok: true,
      action: 'healthy',
      webhookUrl: currentWebhookUrl,
      pendingUpdates: Number(info.pending_update_count ?? 0),
    });

    return json({
      ok: true,
      action: 'healthy',
      webhookUrl: currentWebhookUrl,
      pendingUpdates: Number(info.pending_update_count ?? 0),
    });
  }

  await telegramRequest<boolean>(botToken, 'setWebhook', {
    url: expectedWebhookUrl,
    secret_token: buildJobBotWebhookSecret(botToken),
    allowed_updates: ['message', 'callback_query'],
    max_connections: 40,
    drop_pending_updates: true,
  });

  if (lease) {
    await db.ref(JOB_BOT_LOCAL_LEASE_KEY).remove();
  }

  await writeWatchdogStatus({
    ok: true,
    action: 'restored',
    previousWebhookUrl: currentWebhookUrl || null,
    webhookUrl: expectedWebhookUrl,
    droppedPendingUpdates: true,
    previousPendingUpdates: Number(info.pending_update_count ?? 0),
  });

  return json({
    ok: true,
    action: 'restored',
    previousWebhookUrl: currentWebhookUrl || null,
    webhookUrl: expectedWebhookUrl,
    droppedPendingUpdates: true,
    previousPendingUpdates: Number(info.pending_update_count ?? 0),
  });
}
