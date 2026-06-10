import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { checkAdminAuthMock, dbRefOnceLeaseMock, dbRefOnceWatchdogMock, cleanEnvVarMock } =
  vi.hoisted(() => ({
    checkAdminAuthMock: vi.fn(),
    dbRefOnceLeaseMock: vi.fn(),
    dbRefOnceWatchdogMock: vi.fn(),
    cleanEnvVarMock: vi.fn(),
  }));

vi.mock('@/lib/auth', () => ({
  checkAdminAuth: checkAdminAuthMock,
}));

vi.mock('@/lib/database', () => ({
  db: {
    ref: vi.fn((path: string) => {
      if (path === 'telegramJobBotLocalLease') {
        return { once: dbRefOnceLeaseMock };
      }
      if (path === 'telegramWatchdogStatus') {
        return { once: dbRefOnceWatchdogMock };
      }
      return { once: vi.fn().mockResolvedValue({ val: () => null }) };
    }),
  },
}));

vi.mock('@/lib/utils/env', () => ({
  cleanEnvVar: cleanEnvVarMock,
}));

const telegramFetch = vi.fn();

vi.stubGlobal('fetch', telegramFetch);

import { GET } from './route';

function buildGetRequest(): NextRequest {
  return new NextRequest('http://localhost/api/admin/telegram-watchdog-status', { method: 'GET' });
}

function defaultEnvImpl(name: string) {
  if (name === 'JOB_BOT_TELEGRAM_TOKEN') return '123456:ABCdefGHIjklMNOpqrsTUVwxyz';
  if (name === 'JOB_BOT_WEBHOOK_BASE_URL') return 'https://mysite.vercel.app';
  if (name === 'NEXT_PUBLIC_SITE_URL') return 'https://mysite.vercel.app';
  if (name === 'CRON_SECRET') return 'test-secret';
  return undefined;
}

describe('GET /api/admin/telegram-watchdog-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkAdminAuthMock.mockReturnValue(true);
    cleanEnvVarMock.mockImplementation(defaultEnvImpl);

    dbRefOnceLeaseMock.mockResolvedValue({ val: () => null });
    dbRefOnceWatchdogMock.mockResolvedValue({ val: () => null });

    telegramFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          url: 'https://mysite.vercel.app/api/webhook/job-telegram',
          pending_update_count: 0,
        },
      }),
    });
  });

  it('rejects unauthenticated requests', async () => {
    checkAdminAuthMock.mockReturnValue(false);
    const res = await GET(buildGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns 503 when bot token is missing', async () => {
    cleanEnvVarMock.mockImplementation((name: string) => {
      if (name === 'JOB_BOT_TELEGRAM_TOKEN') return '';
      if (name === 'NEXT_PUBLIC_SITE_URL') return 'https://mysite.vercel.app';
      return undefined;
    });

    const res = await GET(buildGetRequest());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe('error');
    expect(body.message).toContain('JOB_BOT_TELEGRAM_TOKEN');
  });

  it('returns 503 when expected webhook URL is not HTTPS', async () => {
    cleanEnvVarMock.mockImplementation((name: string) => {
      if (name === 'JOB_BOT_TELEGRAM_TOKEN') return '123456:ABCdefGHIjklMNOpqrsTUVwxyz';
      if (name === 'NEXT_PUBLIC_SITE_URL') return '';
      if (name === 'JOB_BOT_WEBHOOK_BASE_URL') return '';
      return undefined;
    });

    const res = await GET(buildGetRequest());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.message).toContain('HTTPS');
  });

  it('returns healthy status when webhook matches and watchdog is recent', async () => {
    const now = Date.now();
    dbRefOnceLeaseMock.mockResolvedValue({ val: () => null });
    dbRefOnceWatchdogMock.mockResolvedValue({
      val: () => ({ ok: true, checkedAt: now - 60_000 }),
    });

    telegramFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          url: 'https://mysite.vercel.app/api/webhook/job-telegram',
          pending_update_count: 2,
        },
      }),
    });

    const res = await GET(buildGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.webhook.state).toBe('ok');
    expect(body.webhook.pendingUpdates).toBe(2);
    expect(body.watchdog.recent).toBe(true);
    expect(body.lease.active).toBe(false);
  });

  it('detects webhook mismatch', async () => {
    const now = Date.now();
    dbRefOnceLeaseMock.mockResolvedValue({ val: () => null });
    dbRefOnceWatchdogMock.mockResolvedValue({
      val: () => ({ ok: true, checkedAt: now - 60_000 }),
    });

    telegramFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          url: 'https://other-site.vercel.app/api/webhook/job-telegram',
          pending_update_count: 0,
        },
      }),
    });

    const res = await GET(buildGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.webhook.state).toBe('mismatch');
    expect(body.status).toBe('needs-restore');
  });

  it('reports local-polling when active lease exists', async () => {
    const now = Date.now();
    dbRefOnceLeaseMock.mockResolvedValue({
      val: () => ({
        mode: 'local-polling',
        heartbeatAt: now,
        expiresAt: now + 300_000,
        restoreWebhookUrl: 'https://mysite.vercel.app/api/webhook/job-telegram',
      }),
    });
    dbRefOnceWatchdogMock.mockResolvedValue({
      val: () => ({ ok: true, checkedAt: now - 60_000 }),
    });

    const res = await GET(buildGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('local-polling');
    expect(body.lease.active).toBe(true);
    expect(body.lease.expiresAt).not.toBeNull();
  });

  it('returns watchdog-stale when webhook is ok but watchdog last run is old', async () => {
    const now = Date.now();
    dbRefOnceLeaseMock.mockResolvedValue({ val: () => null });
    dbRefOnceWatchdogMock.mockResolvedValue({
      val: () => ({ ok: true, checkedAt: now - 13 * 60_000 }),
    });

    telegramFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          url: 'https://mysite.vercel.app/api/webhook/job-telegram',
          pending_update_count: 0,
        },
      }),
    });

    const res = await GET(buildGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('watchdog-stale');
    expect(body.watchdog.recent).toBe(false);
  });

  it('handles Telegram API errors gracefully', async () => {
    telegramFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ ok: false, description: 'Bad Gateway' }),
    });

    const res = await GET(buildGetRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.message).toContain('Bad Gateway');
  });
});
