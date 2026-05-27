import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { db } from '@/lib/database';
import { cleanEnvVar } from '@/lib/utils/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JOB_BOT_LOCAL_LEASE_KEY = 'telegramJobBotLocalLease';
const WATCHDOG_STATUS_KEY = 'telegramWatchdogStatus';
const WATCHDOG_RECENT_THRESHOLD_MS = 12 * 60 * 1000;

interface JobBotLocalLease {
  mode?: string;
  ownerId?: string;
  heartbeatAt?: number;
  expiresAt?: number;
  restoreWebhookUrl?: string;
  previousWebhookUrl?: string;
}

interface WatchdogStatus {
  ok?: boolean;
  action?: string;
  reason?: string;
  checkedAt?: number;
  webhookUrl?: string;
  previousWebhookUrl?: string | null;
  pendingUpdates?: number;
  previousPendingUpdates?: number;
}

interface TelegramWebhookInfo {
  url?: string;
  pending_update_count?: number;
  last_error_message?: string;
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

async function telegramGetWebhookInfo(token: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, {
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    description?: string;
    result?: TelegramWebhookInfo;
  } | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.description || `Telegram getWebhookInfo failed (${response.status})`);
  }

  return payload.result || {};
}

function resolveWebhookState(currentWebhookUrl: string, expectedWebhookUrl: string) {
  if (!currentWebhookUrl) return 'not-set';
  if (currentWebhookUrl !== expectedWebhookUrl) return 'mismatch';
  return 'ok';
}

function resolveOverallStatus(params: {
  activeLease: JobBotLocalLease | null;
  webhookState: 'ok' | 'not-set' | 'mismatch';
  watchdogRecent: boolean;
}) {
  if (params.activeLease) return 'local-polling';
  if (params.webhookState === 'ok' && params.watchdogRecent) return 'healthy';
  if (params.webhookState === 'ok') return 'watchdog-stale';
  return 'needs-restore';
}

export async function GET(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const botToken = cleanEnvVar('JOB_BOT_TELEGRAM_TOKEN') || '';
    if (!/^\d+:[A-Za-z0-9_-]+$/.test(botToken)) {
      return NextResponse.json(
        { status: 'error', message: 'JOB_BOT_TELEGRAM_TOKEN is missing or invalid' },
        { status: 503 }
      );
    }

    const expectedWebhookUrl = resolveExpectedWebhookUrl();
    if (!expectedWebhookUrl) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'JOB_BOT_WEBHOOK_BASE_URL or NEXT_PUBLIC_SITE_URL must be HTTPS',
        },
        { status: 503 }
      );
    }

    const [leaseSnap, watchdogSnap, telegramInfo] = await Promise.all([
      db.ref(JOB_BOT_LOCAL_LEASE_KEY).once('value'),
      db.ref(WATCHDOG_STATUS_KEY).once('value'),
      telegramGetWebhookInfo(botToken),
    ]);

    const lease = leaseSnap.val() as JobBotLocalLease | null;
    const watchdog = watchdogSnap.val() as WatchdogStatus | null;
    const activeLease = getActiveLease(lease);
    const now = Date.now();
    const watchdogAgeMs =
      typeof watchdog?.checkedAt === 'number' ? Math.max(0, now - watchdog.checkedAt) : null;
    const watchdogRecent =
      typeof watchdogAgeMs === 'number' && watchdogAgeMs <= WATCHDOG_RECENT_THRESHOLD_MS;

    const currentWebhookUrl = telegramInfo.url || '';
    const webhookState = resolveWebhookState(currentWebhookUrl, expectedWebhookUrl);
    const status = resolveOverallStatus({
      activeLease,
      webhookState,
      watchdogRecent,
    });

    return NextResponse.json({
      status,
      webhook: {
        state: webhookState,
        currentUrl: currentWebhookUrl,
        expectedUrl: expectedWebhookUrl,
        pendingUpdates: Number(telegramInfo.pending_update_count ?? 0),
        lastErrorMessage: telegramInfo.last_error_message || null,
      },
      lease: activeLease
        ? {
            active: true,
            heartbeatAt: activeLease.heartbeatAt ?? null,
            expiresAt: activeLease.expiresAt ?? null,
            restoreWebhookUrl: activeLease.restoreWebhookUrl ?? null,
            previousWebhookUrl: activeLease.previousWebhookUrl ?? null,
          }
        : {
            active: false,
            expiredAt: typeof lease?.expiresAt === 'number' ? lease.expiresAt : null,
          },
      watchdog: {
        configured: !!cleanEnvVar('CRON_SECRET'),
        lastRunAt: watchdog?.checkedAt ?? null,
        lastAction: watchdog?.action ?? null,
        lastReason: watchdog?.reason ?? null,
        lastOk: watchdog?.ok ?? null,
        ageMs: watchdogAgeMs,
        recent: watchdogRecent,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown watchdog status error';
    console.error('[Admin Watchdog Status] Error:', error);
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
