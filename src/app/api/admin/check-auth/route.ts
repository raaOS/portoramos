import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { generateCSRFToken } from '@/lib/security';

export async function GET(request: NextRequest) {
  const isAuthenticated = checkAdminAuth(request);

  // Use existing CSRF token if present, otherwise generate new one
  let csrfToken = request.cookies.get('csrf_token')?.value;
  let isNewToken = false;

  if (!csrfToken || csrfToken.length !== 64) {
    csrfToken = generateCSRFToken();
    isNewToken = true;
  }

  const response = NextResponse.json({
    authenticated: isAuthenticated,
    csrfToken: csrfToken
  });

  // Only set cookie if it's new or missing to avoid unnecessary cookie churn
  if (isNewToken) {
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/'
    });
  }

  // Prevent browser caching of the auth status
  response.headers.set('Cache-Control', 'no-store, max-age=0');

  return response;
}
