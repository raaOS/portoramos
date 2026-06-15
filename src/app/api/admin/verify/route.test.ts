import { beforeEach, describe, expect, it, vi } from 'vitest';

const { verifyAdminTokenMock } = vi.hoisted(() => ({
  verifyAdminTokenMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  verifyAdminToken: verifyAdminTokenMock,
}));

import { GET } from './route';
import { NextRequest } from 'next/server';

function makeRequest(token?: string): NextRequest {
  const headers = new Headers();
  if (token !== undefined) {
    headers.set('cookie', `admin_token=${token}`);
  }
  return new NextRequest('http://localhost/api/admin/verify', { headers });
}

describe('GET /api/admin/verify', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 when no token cookie is present', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.authenticated).toBe(false);
    expect(body.error).toBe('No token provided');
    expect(verifyAdminTokenMock).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    verifyAdminTokenMock.mockReturnValue(false);
    const res = await GET(makeRequest('some-invalid-token'));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.authenticated).toBe(false);
    expect(body.error).toBe('Invalid token');
    expect(verifyAdminTokenMock).toHaveBeenCalledWith('some-invalid-token');
  });

  it('returns 200 authenticated when token is valid', async () => {
    verifyAdminTokenMock.mockReturnValue(true);
    const res = await GET(makeRequest('valid-token'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.authenticated).toBe(true);
    expect(verifyAdminTokenMock).toHaveBeenCalledWith('valid-token');
  });

  it('returns 500 on internal error', async () => {
    verifyAdminTokenMock.mockImplementation(() => {
      throw new Error('JWT verify crash');
    });
    const res = await GET(makeRequest('crash-token'));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.authenticated).toBe(false);
    expect(body.error).toBe('Internal server error');
  });

  it('also reads admin-token cookie as fallback', async () => {
    verifyAdminTokenMock.mockReturnValue(true);
    const headers = new Headers();
    headers.set('cookie', 'admin-token=fallback-token');
    const req = new NextRequest('http://localhost/api/admin/verify', { headers });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.authenticated).toBe(true);
    expect(verifyAdminTokenMock).toHaveBeenCalledWith('fallback-token');
  });
});
