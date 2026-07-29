import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const { validateAdminRequestMock, generateViralMetricsMock } = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  generateViralMetricsMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminRequestMock,
}));

vi.mock('@/lib/magic', () => ({
  generateViralMetrics: generateViralMetricsMock,
  generateGenZComments: vi.fn().mockReturnValue([]),
}));

import { POST } from './route';

function buildPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/projects/magic-complete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const mockMetrics = { likes: 20, shares: 3 };
const mockComments = [{ text: 'Visualnya luar biasa clean!', name: 'Budi Test', likes: 5, replies: [] }];

describe('POST /api/admin/projects/magic-complete', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-gemini-key' };
    validateAdminRequestMock.mockResolvedValue(true);
    generateViralMetricsMock.mockReturnValue(mockMetrics);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(mockComments) }],
            },
          },
        ],
      }),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects unauthenticated requests', async () => {
    validateAdminRequestMock.mockResolvedValue(false);
    const res = await POST(buildPostRequest({ slug: 'my-project' }));
    expect(res.status).toBe(401);
  });

  it('performs real LLM AI generation with generated metrics and parsed comments', async () => {
    const res = await POST(buildPostRequest({ slug: 'my-project' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.metrics).toEqual(mockMetrics);
    expect(body.commentCount).toBe(1);
    expect(body.comments[0].text).toBe('Visualnya luar biasa clean!');

    expect(generateViralMetricsMock).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('fails with 500 when no API keys are configured and no fallback is allowed', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    const res = await POST(buildPostRequest({ slug: 'my-project' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to complete magic operation');
  });

  it('uses passed metrics (likes and shares) instead of generating random ones', async () => {
    const customLikes = 150;
    const customShares = 45;
    const res = await POST(
      buildPostRequest({
        slug: 'my-project',
        likes: customLikes,
        shares: customShares,
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.metrics).toEqual({ likes: customLikes, shares: customShares });
  });

  it('catches internal errors and returns 500 without leaking details', async () => {
    generateViralMetricsMock.mockImplementation(() => {
      throw new Error('Simulation failed');
    });
    const res = await POST(buildPostRequest({ slug: 'my-project' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to complete magic operation');
  });
});
