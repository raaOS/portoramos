import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

const {
  validateAdminRequestMock,
  verifyAdminPasswordMock,
  dbSetMock,
  dbRefMock,
  sendSecurityAlertMock,
  getClientIdentifierMock,
  logAdminActivityMock,
} = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  verifyAdminPasswordMock: vi.fn(),
  dbSetMock: vi.fn(),
  dbRefMock: vi.fn(),
  sendSecurityAlertMock: vi.fn(),
  getClientIdentifierMock: vi.fn(),
  logAdminActivityMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminRequestMock,
  verifyAdminPassword: verifyAdminPasswordMock,
}));

vi.mock('@/lib/database', () => ({
  db: { ref: dbRefMock },
}));

vi.mock('@/lib/telegram', () => ({
  sendSecurityAlert: sendSecurityAlertMock,
}));

vi.mock('@/lib/security/request', () => ({
  getClientIdentifier: getClientIdentifierMock,
}));

vi.mock('@/lib/services/auditLogger', () => ({
  logAdminActivity: logAdminActivityMock,
}));

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/admin/pin/otp-request', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(64),
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/pin/otp-request', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dbRefMock.mockReturnValue({ set: dbSetMock });
    getClientIdentifierMock.mockReturnValue('1.2.3.4|TestBrowser');
    sendSecurityAlertMock.mockResolvedValue({ success: true });
    dbSetMock.mockResolvedValue(undefined);
    logAdminActivityMock.mockResolvedValue(undefined);
  });

  it('returns 401 when validateAdminRequest fails', async () => {
    validateAdminRequestMock.mockResolvedValue(false);
    const res = await POST(makeRequest({ oldPassword: 'x', newPin: '1234' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when oldPassword is missing', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(makeRequest({ newPin: '1234' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Sandi lama wajib diisi');
  });

  it('returns 400 when newPin is missing', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(makeRequest({ oldPassword: 'oldpassword' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when newPin is not exactly 4 digits', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(makeRequest({ oldPassword: 'oldpassword', newPin: '12' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('PIN baru wajib 4 digit angka');
  });

  it('returns 400 when newPin is non-numeric', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(makeRequest({ oldPassword: 'oldpassword', newPin: '123a' }));
    expect(res.status).toBe(400);
  });

  it('returns 401 when old password is wrong', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(false);
    const res = await POST(makeRequest({ oldPassword: 'wrongold', newPin: '1234' }));
    expect(res.status).toBe(401);
  });

  it('returns 200 on valid OTP request', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);

    const res = await POST(makeRequest({ oldPassword: 'correctold', newPin: '1234' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(dbRefMock).toHaveBeenCalledWith('settings/adminPinOtp');
    expect(dbSetMock).toHaveBeenCalledTimes(1);
    expect(dbSetMock.mock.calls[0][0].purpose).toBe('pin');
    expect(sendSecurityAlertMock).toHaveBeenCalledTimes(1);
    expect(sendSecurityAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('UBAH PIN'),
        buttons: expect.arrayContaining([
          [expect.objectContaining({ callback_data: expect.stringMatching(/^otp_approve:pin:/) })],
        ]),
      })
    );
  });
});
