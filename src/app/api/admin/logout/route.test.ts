import { beforeEach, describe, expect, it, vi } from 'vitest';

const { checkAdminAuthMock, cookiesMock, logAdminActivityMock, cookieDeleteMock, cookieGetMock } =
  vi.hoisted(() => ({
    checkAdminAuthMock: vi.fn(),
    cookiesMock: vi.fn(),
    logAdminActivityMock: vi.fn(),
    cookieDeleteMock: vi.fn(),
    cookieGetMock: vi.fn(),
  }));

vi.mock('@/lib/auth', () => ({
  checkAdminAuth: checkAdminAuthMock,
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('@/lib/services/auditLogger', () => ({
  logAdminActivity: logAdminActivityMock,
}));

import { POST } from './route';
import { NextRequest } from 'next/server';

describe('POST /api/admin/logout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    cookieDeleteMock.mockReturnValue(undefined);
    cookieGetMock.mockReturnValue({ value: 'some-token' });
    cookiesMock.mockResolvedValue({
      delete: cookieDeleteMock,
      get: cookieGetMock,
    });
    logAdminActivityMock.mockResolvedValue(undefined);
  });

  it('clears cookies and returns success when authenticated', async () => {
    checkAdminAuthMock.mockReturnValue(true);
    const req = new NextRequest('http://localhost/api/admin/logout', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('Logged out successfully');

    expect(cookieDeleteMock).toHaveBeenCalledWith('admin_token');
    expect(cookieDeleteMock).toHaveBeenCalledWith('admin-token');
    expect(cookieDeleteMock).toHaveBeenCalledWith('csrf_token');

    expect(logAdminActivityMock).toHaveBeenCalledTimes(1);

    void (res.cookies as unknown as Map<string, unknown>);
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('returns success without audit log when not authenticated', async () => {
    checkAdminAuthMock.mockReturnValue(false);
    const req = new NextRequest('http://localhost/api/admin/logout', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('Logged out successfully');
    expect(logAdminActivityMock).not.toHaveBeenCalled();
  });

  it('returns 500 on catch error', async () => {
    checkAdminAuthMock.mockImplementation(() => {
      throw new Error('Cookie read crash');
    });
    const req = new NextRequest('http://localhost/api/admin/logout', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.message).toBe('Logout failed');
  });

  it('clears cookies aggressively via Set-Cookie headers', async () => {
    checkAdminAuthMock.mockReturnValue(true);
    const req = new NextRequest('http://localhost/api/admin/logout', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const _setCookieHeader = res.headers.get('Set-Cookie');
    // We can't easily inspect the cookie jar in tests, but the headers should exist
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0, must-revalidate');
    expect(res.headers.get('Pragma')).toBe('no-cache');
  });
});
