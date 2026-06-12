import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  validateAdminRequestMock,
  verifyAdminPasswordMock,
  dbSetMock,
  dbRefMock,
  sendTelegramAlertMock,
  sendSecurityAlertMock,
  getClientIdentifierMock,
  logAdminActivityMock,
} = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  verifyAdminPasswordMock: vi.fn(),
  dbSetMock: vi.fn(),
  dbRefMock: vi.fn(),
  sendTelegramAlertMock: vi.fn(),
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
  sendTelegramAlert: sendTelegramAlertMock,
  sendSecurityAlert: sendSecurityAlertMock,
}));

vi.mock('@/lib/security/request', () => ({
  getClientIdentifier: getClientIdentifierMock,
}));

vi.mock('@/lib/services/auditLogger', () => ({
  logAdminActivity: logAdminActivityMock,
}));

import { POST } from './route';
import { NextRequest } from 'next/server';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/admin/password/otp-request', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(64),
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/password/otp-request', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dbRefMock.mockReturnValue({ set: dbSetMock });
    getClientIdentifierMock.mockReturnValue('1.2.3.4|TestBrowser');
    sendTelegramAlertMock.mockResolvedValue({ success: true });
    sendSecurityAlertMock.mockResolvedValue({ success: true });
    dbSetMock.mockResolvedValue(undefined);
    logAdminActivityMock.mockResolvedValue(undefined);
  });

  it('returns 401 when validateAdminRequest fails', async () => {
    validateAdminRequestMock.mockResolvedValue(false);
    const res = await POST(makeRequest({ oldPassword: 'x', newPassword: 'x' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized or invalid CSRF token');
  });

  it('returns 400 when oldPassword is missing', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(makeRequest({ newPassword: '12345678' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Sandi lama wajib diisi');
  });

  it('returns 400 when newPassword is missing', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(makeRequest({ oldPassword: 'old1234' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when newPassword is shorter than 8 characters', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(makeRequest({ oldPassword: 'old1234', newPassword: 'short' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Sandi baru wajib diisi dan minimal 8 karakter');
  });

  it('returns 401 when old password is wrong', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(false);
    const res = await POST(makeRequest({ oldPassword: 'wrongold', newPassword: 'newpassword123' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Sandi lama tidak sesuai');
  });

  it('returns 500 when verifyAdminPassword throws', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockRejectedValue(new Error('scrypt crash'));
    const res = await POST(makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Kesalahan layanan autentikasi');
  });

  it('returns 500 when Telegram send fails', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    sendSecurityAlertMock.mockResolvedValue({ success: false, error: 'Bot blocked' });
    const res = await POST(makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Gagal mengirim peringatan ke Telegram');
  });

  it('returns 200 success on valid OTP request', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    sendSecurityAlertMock.mockResolvedValue({ success: true });

    const res = await POST(makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('berhasil dikirim ke Telegram');

    expect(dbRefMock).toHaveBeenCalledWith('settings/adminPasswordOtp');
    expect(dbSetMock).toHaveBeenCalledTimes(1);
    const otpPayload = dbSetMock.mock.calls[0][0];
    expect(otpPayload.status).toBe('pending');
    expect(otpPayload.purpose).toBe('password');
    expect(otpPayload.requestId).toBeDefined();
    expect(otpPayload.expiresAt).toBeGreaterThan(Date.now());

    expect(sendSecurityAlertMock).toHaveBeenCalledTimes(1);
    expect(sendSecurityAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('UBAH SANDI'),
        buttons: expect.arrayContaining([
          [
            expect.objectContaining({
              callback_data: expect.stringMatching(/^otp_approve:password:/),
            }),
          ],
        ]),
      })
    );
    expect(logAdminActivityMock).toHaveBeenCalledTimes(1);
  });

  it('returns 200 even when audit log fails (non-blocking)', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    sendSecurityAlertMock.mockResolvedValue({ success: true });
    logAdminActivityMock.mockRejectedValue(new Error('audit db down'));

    const res = await POST(makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 500 on generic catch error', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    sendSecurityAlertMock.mockRejectedValue(new Error('network failure'));
    const res = await POST(makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123' }));
    expect(res.status).toBe(500);
  });
});
