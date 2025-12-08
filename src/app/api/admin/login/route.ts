import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, getAdminToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type Attempt = { count: number; resetTime: number; blockedUntil?: number };

const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 menit
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_MS = 10 * 60 * 1000; // 10 menit blokir setelah gagal maksimal

const globalForLogin = globalThis as typeof globalThis & {
  __adminLoginAttempts?: Map<string, Attempt>;
};

const loginAttempts =
  globalForLogin.__adminLoginAttempts ||
  new Map<string, Attempt>();

globalForLogin.__adminLoginAttempts = loginAttempts;

function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  // Safely access .ip which might be missing in some Next.js type definitions but exists at runtime
  const requestIp = (request as unknown as { ip?: string }).ip;
  const ip = forwarded ? forwarded.split(',')[0] : requestIp || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${ua}`;
}

function checkLoginAllowed(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (record?.blockedUntil && now < record.blockedUntil) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
    };
  }

  if (!record || now > record.resetTime) {
    loginAttempts.set(key, { count: 0, resetTime: now + LOGIN_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= LOGIN_MAX_ATTEMPTS) {
    record.blockedUntil = now + LOGIN_BLOCK_MS;
    return {
      allowed: false,
      retryAfter: Math.ceil(LOGIN_BLOCK_MS / 1000),
    };
  }

  return { allowed: true };
}

function registerLoginFailure(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key) || {
    count: 0,
    resetTime: now + LOGIN_WINDOW_MS,
  };
  record.count += 1;

  if (record.count >= LOGIN_MAX_ATTEMPTS) {
    record.blockedUntil = now + LOGIN_BLOCK_MS;
  }

  loginAttempts.set(key, record);
}

function registerLoginSuccess(key: string) {
  loginAttempts.delete(key);
}

export async function POST(request: NextRequest) {
  try {
    const clientKey = getClientKey(request);
    const loginAllowed = checkLoginAllowed(clientKey);

    if (!loginAllowed.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        {
          status: 429,
          headers: loginAllowed.retryAfter
            ? { 'Retry-After': loginAllowed.retryAfter.toString() }
            : undefined,
        }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    if (!verifyAdminPassword(password)) {
      registerLoginFailure(clientKey);
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    registerLoginSuccess(clientKey);

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
