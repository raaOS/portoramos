import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  buildJobBotWebhookSecret: vi.fn(),
  refMock: vi.fn(),
}));

vi.mock('@/lib/jobBot/config', () => ({
  buildJobBotWebhookSecret: mocks.buildJobBotWebhookSecret,
}));

vi.mock('@/lib/database', () => ({
  db: {
    ref: mocks.refMock,
  },
}));

import { GET } from './route';

function makeRefData(data: unknown = null, exists = true) {
  const ref = {
    once: vi.fn().mockResolvedValue({ exists: () => exists, val: () => data }),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  };
  return ref;
}

describe('GET /api/cron/telegram-watchdog', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('CRON_SECRET', 'my-cron-secret');
    vi.stubEnv('JOB_BOT_TELEGRAM_TOKEN', '123:abc');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com');
    vi.stubEnv('JOB_BOT_WEBHOOK_BASE_URL', '');
    mocks.refMock.mockReturnValue(makeRefData(null, false));
    mocks.buildJobBotWebhookSecret.mockReturnValue('hashed-secret');
  });

  function makeRequest(secret = 'my-cron-secret') {
    const headers: Record<string, string> = {};
    if (secret) {
      headers['authorization'] = `Bearer ${secret}`;
    }
    return new Request('http://localhost/api/cron/telegram-watchdog', { headers });
  }

  it('returns 503 when CRON_SECRET env var is missing', async () => {
    vi.stubEnv('CRON_SECRET', '');

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.error).toBe('CRON_SECRET is missing');
  });

  it('returns 401 when authorization header is missing', async () => {
    const response = await GET(new Request('http://localhost/api/cron/telegram-watchdog'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when authorization header has wrong secret', async () => {
    const request = new Request('http://localhost/api/cron/telegram-watchdog', {
      headers: { authorization: 'Bearer wrong-secret' },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 503 when JOB_BOT_TELEGRAM_TOKEN is missing', async () => {
    vi.stubEnv('JOB_BOT_TELEGRAM_TOKEN', '');

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.error).toBe('JOB_BOT_TELEGRAM_TOKEN is missing or invalid');
  });

  it('returns 503 when webhook base URL cannot be resolved', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.error).toContain('must be a HTTPS URL');
  });

  it('skips when active local lease exists', async () => {
    const now = Date.now();
    mocks.refMock.mockReturnValue(
      makeRefData({
        mode: 'local-polling',
        expiresAt: now + 60000,
        heartbeatAt: now,
      })
    );

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.action).toBe('skipped');
    expect(body.reason).toBe('local-dev-lease-active');
  });

  it('reports healthy when webhook URL matches expected URL', async () => {
    const statusRef = makeRefData(null, false);
    const leaseRef = makeRefData(null, false);

    mocks.refMock.mockImplementation((path: string) => {
      if (path === 'telegramJobBotLocalLease') return leaseRef;
      if (path === 'telegramWatchdogStatus') return statusRef;
      throw new Error(`Unexpected ref path: ${path}`);
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            result: {
              url: 'https://example.com/api/webhook/job-telegram',
              pending_update_count: 0,
            },
          }),
      })
    );

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.action).toBe('healthy');
  });

  it('restores webhook when URL is incorrect', async () => {
    const statusRef = makeRefData(null, false);
    const leaseRef = makeRefData(null, false);

    mocks.refMock.mockImplementation((path: string) => {
      if (path === 'telegramJobBotLocalLease') return leaseRef;
      if (path === 'telegramWatchdogStatus') return statusRef;
      throw new Error(`Unexpected ref path: ${path}`);
    });

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              ok: true,
              result: {
                url: 'https://different-url.com/webhook',
                pending_update_count: 5,
              },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, result: true }),
        })
    );

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.action).toBe('restored');
    expect(body.previousWebhookUrl).toBe('https://different-url.com/webhook');
    expect(body.droppedPendingUpdates).toBe(true);
    expect(body.previousPendingUpdates).toBe(5);
  });
});
