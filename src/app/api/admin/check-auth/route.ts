import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { generateCSRFToken } from '@/lib/security';

export async function GET(request: NextRequest) {
  const isAuthenticated = checkAdminAuth(request);
  const csrfToken = generateCSRFToken();

  const response = NextResponse.json({
    authenticated: isAuthenticated,
    csrfToken: csrfToken
  });

  // Set CSRF token cookie for validation in subsequent POST/PUT/DELETE requests
  response.cookies.set('csrf_token', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600, // 1 hour
    path: '/'
  });

  return response;
}
