import { beforeEach, describe, expect, it, vi } from 'vitest';

const { validateAdminRequestMock, dbOnceFn, dbRemoveFn, dbRefMock } = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  dbOnceFn: vi.fn(),
  dbRemoveFn: vi.fn(),
  dbRefMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminRequestMock,
}));

vi.mock('@/lib/database', () => ({
  db: { ref: dbRefMock },
}));

import { GET } from './route';
import { NextRequest } from 'next/server';

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/admin/password/otp-status');
}

describe('GET /api/admin/password/otp-status', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dbRefMock.mockReturnValue({ once: dbOnceFn, remove: dbRemoveFn });
  });

  it('returns 401 when validateAdminRequest fails', async () => {
    validateAdminRequestMock.mockResolvedValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns status expired when no OTP data exists', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    dbOnceFn.mockResolvedValue({ val: () => null });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('expired');
  });

  it('returns status expired when OTP data lacks required fields', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    dbOnceFn.mockResolvedValue({ val: () => ({ status: 'pending' }) });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('expired');
  });

  it('returns pending status', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    dbOnceFn.mockResolvedValue({
      val: () => ({ status: 'pending', expiresAt: Date.now() + 300000 }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('pending');
  });

  it('returns approved status', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    dbOnceFn.mockResolvedValue({
      val: () => ({ status: 'approved', expiresAt: Date.now() + 300000 }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('approved');
  });

  it('returns rejected status', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    dbOnceFn.mockResolvedValue({
      val: () => ({ status: 'rejected', expiresAt: Date.now() + 300000 }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('rejected');
  });

  it('clears OTP data and returns expired when timestamp expired', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    dbOnceFn.mockResolvedValue({
      val: () => ({
        status: 'approved',
        expiresAt: Date.now() - 1000,
      }),
    });
    dbRemoveFn.mockResolvedValue(undefined);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('expired');
    expect(dbRemoveFn).toHaveBeenCalled();
  });

  it('returns 500 on internal error', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    dbOnceFn.mockRejectedValue(new Error('D1 failure'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Terjadi kesalahan sistem');
  });
});
