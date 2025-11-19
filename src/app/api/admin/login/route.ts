import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, getAdminToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = getAdminToken();

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    };

    // Canonical cookie name for admin session
    response.cookies.set('admin_token', token, cookieOptions);
    // Backwards compatibility with old name (can be removed later)
    response.cookies.set('admin-token', token, cookieOptions);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
