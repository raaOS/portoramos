import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Validasi Auth & CSRF (Untuk GET tidak wajib CSRF, tapi validateAdminRequest mengecek sesi)
    const isValid = await validateAdminRequest(request, { checkCsrf: false });
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Baca dari D1
    const otpSnap = await db.ref('settings/adminOtp').once('value');
    const otpData = otpSnap.val();

    if (!otpData || typeof otpData !== 'object' || !otpData.status || !otpData.expiresAt) {
      return NextResponse.json({ status: 'expired' });
    }

    // Cek kadaluarsa
    if (Date.now() > otpData.expiresAt) {
      // Jika status 'rejected', biarkan expired juga tapi kita mungkin mau kasih lihat layarnya bentar
      // Tapi karena expired akan mereset form, lebih baik hapus
      await db.ref('settings/adminOtp').remove();
      return NextResponse.json({ status: 'expired' });
    }

    return NextResponse.json({ status: otpData.status });
  } catch (error) {
    console.error('[API/Admin/Password/OTP-Status] Check failed:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
