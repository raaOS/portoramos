import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getJobBotConfig: vi.fn(),
  isValidJobBotWebhookSecret: vi.fn(),
  handleJobBotUpdate: vi.fn(),
}));

vi.mock('@/lib/jobBot/config', () => ({
  getJobBotConfig: mocks.getJobBotConfig,
  isValidJobBotWebhookSecret: mocks.isValidJobBotWebhookSecret,
}));

vi.mock('@/lib/jobBot/handler', () => ({
  handleJobBotUpdate: mocks.handleJobBotUpdate,
}));

import { POST } from './route';

describe('POST /api/webhook/job-telegram', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getJobBotConfig.mockReturnValue({ botToken: '123:abc', adminChatId: '456' });
    mocks.isValidJobBotWebhookSecret.mockReturnValue(true);
    mocks.handleJobBotUpdate.mockResolvedValue(undefined);
  });

  it('returns 503 when config throws an error', async () => {
    mocks.getJobBotConfig.mockImplementation(() => {
      throw new Error('JOB_BOT_TELEGRAM_TOKEN is missing or invalid');
    });

    const response = await POST(
      new Request('http://localhost/api/webhook/job-telegram', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-bot-api-secret-token': 'some-secret',
        },
        body: JSON.stringify({ update_id: 1 }),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toBe('Service unavailable');
  });

  it('returns 401 when secret token header is missing', async () => {
    mocks.isValidJobBotWebhookSecret.mockReturnValue(false);

    const response = await POST(
      new Request('http://localhost/api/webhook/job-telegram', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ update_id: 1 }),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized webhook request');
  });

  it('returns 401 when secret token is invalid', async () => {
    mocks.isValidJobBotWebhookSecret.mockReturnValue(false);

    const response = await POST(
      new Request('http://localhost/api/webhook/job-telegram', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-bot-api-secret-token': 'wrong-secret',
        },
        body: JSON.stringify({ update_id: 1 }),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized webhook request');
  });

  it('returns 400 when body is not valid JSON', async () => {
    const response = await POST(
      new Request('http://localhost/api/webhook/job-telegram', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-bot-api-secret-token': 'valid-secret',
        },
        body: 'not-json',
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid JSON');
  });

  it('returns 200 ok on successful update processing', async () => {
    const update = {
      update_id: 123,
      message: { message_id: 1, text: '/scan devops', chat: { id: 789 } },
    };

    const response = await POST(
      new Request('http://localhost/api/webhook/job-telegram', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-bot-api-secret-token': 'valid-secret',
        },
        body: JSON.stringify(update),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mocks.handleJobBotUpdate).toHaveBeenCalledWith(update, {
      botToken: '123:abc',
      adminChatId: '456',
    });
  });
});
