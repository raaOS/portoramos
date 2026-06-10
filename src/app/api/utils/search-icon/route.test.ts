import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { validateAdminRequestMock, enforceRateLimitMock } = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminRequestMock,
}));

vi.mock('@/lib/security/request', () => ({
  enforceRequestRateLimit: enforceRateLimitMock,
}));

import { POST } from './route';

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/utils/search-icon', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/utils/search-icon', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('blocks unauthenticated requests', async () => {
    validateAdminRequestMock.mockResolvedValue(false);

    const response = await POST(buildRequest({ query: 'react' }) as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('blocks rate-limited requests', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    enforceRateLimitMock.mockResolvedValue({ allowed: false, retryAfter: 30 });

    const response = await POST(buildRequest({ query: 'react' }) as never);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toContain('Too many requests');
    expect(response.headers.get('Retry-After')).toBe('30');
  });

  it('returns 400 when query is missing', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    enforceRateLimitMock.mockResolvedValue({ allowed: true, retryAfter: 0 });

    const response = await POST(buildRequest({}) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Query is required');
  });

  it('returns 400 when query is not a string', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    enforceRateLimitMock.mockResolvedValue({ allowed: true, retryAfter: 0 });

    const response = await POST(buildRequest({ query: 123 }) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Query is required');
  });

  it('returns icon URL when found via HEAD check', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    enforceRateLimitMock.mockResolvedValue({ allowed: true, retryAfter: 0 });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/svg+xml' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(buildRequest({ query: 'react' }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.iconUrl).toContain('react');
    expect(body.iconUrl).toContain('.svg');

    vi.unstubAllGlobals();
  });

  it('returns 404 when icon is not found', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    enforceRateLimitMock.mockResolvedValue({ allowed: true, retryAfter: 0 });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      headers: new Headers(),
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(buildRequest({ query: 'nonexistent-icon-xyz' }) as never);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Icon not found');
    expect(body.slug).toBeDefined();

    vi.unstubAllGlobals();
  });

  it('normalizes known mappings like C++ to cplusplus', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    enforceRateLimitMock.mockResolvedValue({ allowed: true, retryAfter: 0 });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/svg+xml' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(buildRequest({ query: 'C++' }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.iconUrl).toContain('cplusplus');

    vi.unstubAllGlobals();
  });

  it('returns 500 on unexpected error', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    enforceRateLimitMock.mockRejectedValue(new Error('Internal failure'));

    const response = await POST(buildRequest({ query: 'react' }) as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal failure');
  });
});
