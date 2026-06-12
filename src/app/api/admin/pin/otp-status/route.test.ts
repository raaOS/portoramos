import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

const { validateAdminRequestMock, dbRefMock, dbRemoveMock } = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  dbRefMock: vi.fn(),
  dbRemoveMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminRequestMock,
}));

vi.mock('@/lib/database', () => ({
  db: { ref: dbRefMock },
}));

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/admin/pin/otp-status');
}

describe('GET /api/admin/pin/otp-status', () => {
  let dbOnceMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    dbOnceMock = vi.fn();
    dbRefMock.mockReturnValue({ once: dbOnceMock, remove: dbRemoveMock });
  });

  it('returns 401 when validateAdminRequest fails', async () => {
    validateAdminRequestMock.mockResolvedValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns expired when OTP session is not found', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    dbOnceMock.mockResolvedValue({ val: () => null });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(dbRefMock).toHaveBeenCalledWith('settings/adminPinOtp');
    const body = await res.json();
    expect(body.status).toBe('expired');
  });

  it('returns expired and removes data when session is expired', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    dbOnceMock.mockResolvedValue({
      val: () => ({ status: 'pending', purpose: 'pin', expiresAt: Date.now() - 1000 }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('expired');
    expect(dbRemoveMock).toHaveBeenCalled();
  });

  it('returns pending when status is pending and not expired', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    dbOnceMock.mockResolvedValue({
      val: () => ({ status: 'pending', purpose: 'pin', expiresAt: Date.now() + 100000 }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('pending');
  });

  it('returns expired for a password OTP session', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    dbOnceMock.mockResolvedValue({
      val: () => ({ status: 'approved', purpose: 'password', expiresAt: Date.now() + 100000 }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('expired');
  });
});
