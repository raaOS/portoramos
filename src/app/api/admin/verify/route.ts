import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { ADMIN_TOKEN_COOKIE, ADMIN_TOKEN_COOKIE_LEGACY } from '@/lib/security/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get(ADMIN_TOKEN_COOKIE)?.value ||
      request.cookies.get(ADMIN_TOKEN_COOKIE_LEGACY)?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const valid = verifyAdminToken(token);

    if (!valid) {
      return NextResponse.json({ authenticated: false, error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
