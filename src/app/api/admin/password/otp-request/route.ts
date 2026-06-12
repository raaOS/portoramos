import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest, verifyAdminPassword } from '@/lib/auth';
import { db } from '@/lib/database';
import { sendSecurityAlert } from '@/lib/telegram';
import { getClientIdentifier } from '@/lib/security/request';
import { randomUUID } from 'node:crypto';
import { logAdminActivity } from '@/lib/services/auditLogger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const isValid = await validateAdminRequest(request, { checkCsrf: true });
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || typeof oldPassword !== 'string') {
      return NextResponse.json({ error: 'Sandi lama wajib diisi' }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Sandi baru wajib diisi dan minimal 8 karakter' },
        { status: 400 }
      );
    }

    let isOldValid = false;
    try {
      isOldValid = await verifyAdminPassword(oldPassword);
    } catch {
      return NextResponse.json({ error: 'Kesalahan layanan autentikasi' }, { status: 500 });
    }

    if (!isOldValid) {
      return NextResponse.json({ error: 'Sandi lama tidak sesuai' }, { status: 401 });
    }

    const expiresAt = Date.now() + 5 * 60 * 1000;
    const requestId = randomUUID();

    await db.ref('settings/adminPasswordOtp').set({
      status: 'pending',
      purpose: 'password',
      requestId,
      expiresAt,
      createdAt: Date.now(),
    });

    const clientId = getClientIdentifier(request);
    const pipeIdx = clientId.indexOf('|');
    const ip = pipeIdx > -1 ? clientId.substring(0, pipeIdx) : clientId;
    const userAgent = pipeIdx > -1 ? clientId.substring(pipeIdx + 1) : 'unknown';

    const telegramRes = await sendSecurityAlert({
      title: '**PERINGATAN KEAMANAN: UBAH SANDI**',
      description:
        'Ada upaya penggantian sandi Admin dari perangkat yang berhasil memasukkan sandi lama dengan benar.',
      device: userAgent,
      ip,
      extraInfo:
        '*Ini adalah OTP untuk UBAH SANDI. Jika ini Anda, klik persetujuan untuk mendapatkan kode OTP sandi.*',
      buttons: [
        [{ text: 'Setujui OTP Sandi', callback_data: `otp_approve:password:${requestId}` }],
        [{ text: 'Tolak Ubah Sandi', callback_data: `otp_reject:password:${requestId}` }],
      ],
    });

    if (!telegramRes.success) {
      console.error('[OTP Request] Failed to send Telegram alert:', telegramRes.error);
      return NextResponse.json({ error: 'Gagal mengirim peringatan ke Telegram' }, { status: 500 });
    }

    await logAdminActivity(request, 'Admin password OTP approval requested', {
      requestId,
      ip,
    }).catch((error) => {
      console.error('[Audit] Failed to log OTP request:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Peringatan persetujuan berhasil dikirim ke Telegram',
    });
  } catch (error) {
    console.error('[API/Admin/Password/OTP] Request failed:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
