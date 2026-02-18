import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const cookieStore = await cookies();

    const response = NextResponse.json({ message: 'Logged out successfully' });

    // 1. Clear via cookieStore (Next.js server-side)
    cookieStore.delete('admin_token');
    cookieStore.delete('admin-token');
    cookieStore.delete('csrf_token');

    // 2. Aggressively clear via Set-Cookie headers for multiple variations
    const cookieOptions = {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const
    };

    response.cookies.set('admin_token', '', cookieOptions);
    response.cookies.set('admin-token', '', cookieOptions);
    response.cookies.set('csrf_token', '', cookieOptions);

    // Also try without path specified just in case
    response.cookies.set('admin_token', '', { ...cookieOptions, path: '' });
    response.cookies.set('admin-token', '', { ...cookieOptions, path: '' });

    // Prevent any caching of the logout response
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Logout failed' }, { status: 500 });
  }
}
