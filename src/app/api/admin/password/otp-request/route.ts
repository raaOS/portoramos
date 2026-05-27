import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest, verifyAdminPassword } from '@/lib/auth';
import { db } from '@/lib/database';
import { sendTelegramAlert } from '@/lib/telegram';
import { getClientIdentifier } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Validasi Auth & CSRF
    const isValid = await validateAdminRequest(request, { checkCsrf: true });
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    // 2. Parse Body
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

    // 3. Verifikasi Sandi Lama
    let isOldValid = false;
    try {
      isOldValid = await verifyAdminPassword(oldPassword);
    } catch {
      return NextResponse.json({ error: 'Kesalahan layanan autentikasi' }, { status: 500 });
    }

    if (!isOldValid) {
      return NextResponse.json({ error: 'Sandi lama tidak sesuai' }, { status: 401 });
    }

    // 4. Inisialisasi Status Pre-OTP di D1
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 menit

    await db.ref('settings/adminOtp').set({
      status: 'pending',
      expiresAt,
    });

    // 5. Kirim ke Telegram (Meminta Persetujuan)
    const clientId = getClientIdentifier(request);
    const [ip, userAgent] = clientId.split('|');
    
    const message = `🚨 **PERINGATAN KEAMANAN!**

Ada upaya penggantian sandi Admin dari perangkat yang berhasil memasukkan sandi lama dengan benar.

💻 **Device:** ${userAgent}
📡 **IP:** \`${ip}\`

⚠️ *Apakah ini Anda? Jika YA, klik persetujuan untuk mendapatkan OTP.*`;

    const telegramRes = await sendTelegramAlert(message, { 
      priority: 'high',
      buttons: [
        [
          { text: '✅ Iya, Ini Saya', callback_data: 'otp_approve' }
        ],
        [
          { text: '🚨 Bukan! Ini Hacker', callback_data: 'otp_reject' }
        ]
      ]
    });

    if (!telegramRes.success) {
      console.error('[OTP Request] Failed to send Telegram alert:', telegramRes.error);
      return NextResponse.json({ error: 'Gagal mengirim peringatan ke Telegram' }, { status: 500 });
    }

    // 6. Response Sukses
    return NextResponse.json({
      success: true,
      message: 'Peringatan persetujuan berhasil dikirim ke Telegram',
    });
  } catch (error) {
    console.error('[API/Admin/Password/OTP] Request failed:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
