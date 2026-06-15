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
    const { oldPassword, newPin } = body;

    if (!oldPassword || typeof oldPassword !== 'string') {
      return NextResponse.json({ error: 'Sandi lama wajib diisi' }, { status: 400 });
    }

    if (!newPin || typeof newPin !== 'string' || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json({ error: 'PIN baru wajib 4 digit angka' }, { status: 400 });
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

    await db.ref('settings/adminPinOtp').set({
      status: 'pending',
      purpose: 'pin',
      requestId,
      expiresAt,
      createdAt: Date.now(),
    });

    const clientId = getClientIdentifier(request);
    const pipeIdx = clientId.indexOf('|');
    const ip = pipeIdx > -1 ? clientId.substring(0, pipeIdx) : clientId;
    const userAgent = pipeIdx > -1 ? clientId.substring(pipeIdx + 1) : 'unknown';

    const telegramRes = await sendSecurityAlert({
      title: '**PERINGATAN KEAMANAN: UBAH PIN**',
      description:
        'Ada upaya penggantian PIN Admin dari perangkat yang berhasil memasukkan sandi lama dengan benar.',
      device: userAgent,
      ip,
      extraInfo:
        '*Ini adalah OTP untuk UBAH PIN. Jika ini Anda, klik persetujuan untuk mendapatkan kode OTP PIN.*',
      buttons: [
        [{ text: 'Setujui OTP PIN', callback_data: `otp_approve:pin:${requestId}` }],
        [{ text: 'Tolak Ubah PIN', callback_data: `otp_reject:pin:${requestId}` }],
      ],
    });

    if (!telegramRes.success) {
      console.error('[PIN OTP Request] Failed to send Telegram alert:', telegramRes.error);
      return NextResponse.json({ error: 'Gagal mengirim peringatan ke Telegram' }, { status: 500 });
    }

    await logAdminActivity(request, 'Admin PIN OTP approval requested', {
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
    console.error('[API/Admin/Pin/OTP] Request failed:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
