/**
 * CSRF Middleware — Validasi token CSRF pada setiap request mutasi data.
 *
 * Memeriksa header `X-CSRF-Token` terhadap cookie `csrf_token` untuk semua
 * endpoint API dengan method POST/PUT/DELETE/PATCH. Endpoint publik yang
 * diproteksi oleh rate-limit (bukan CSRF) didaftarkan di allowlist.
 *
 * @module middleware/csrf
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateCSRFToken } from '@/lib/security';
import { isAPIRoute } from './utils';
import { CSRF_TOKEN_COOKIE, CSRF_TOKEN_HEADER } from '@/lib/security/constants';

export function checkCSRF(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const mutationMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

  if (isAPIRoute(pathname) && mutationMethods.includes(request.method)) {
    const allowlistPaths = [
      '/api/admin/login',
      '/api/admin/logout',
      '/api/chat/send',
      '/api/chat/voice',
      '/api/webhook/telegram',
      '/api/webhook/job-telegram',
      '/api/translate',
      '/api/admin/pin/verify',
      // Visitor-reachable mutation endpoints yang tidak memerlukan sesi admin.
      // Endpoint ini diproteksi oleh rate-limit dan Zod validation, bukan CSRF.
      // Tanpa allowlist ini, visitor fresh tanpa cookie csrf_token akan 403.
      '/api/metrics',
      '/api/comments',
      '/api/analytics',
      '/api/feedback',
    ];
    if (!allowlistPaths.includes(pathname)) {
      const csrfToken = request.headers.get(CSRF_TOKEN_HEADER);
      const sessionCsrfToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;

      if (!csrfToken || !sessionCsrfToken || !validateCSRFToken(csrfToken, sessionCsrfToken)) {
        console.warn(`[Security] CSRF Validation Failed for ${pathname}.`);

        if (process.env.NODE_ENV === 'development') {
          console.debug('CSRF Debug:', {
            headerToken: csrfToken,
            cookieToken: sessionCsrfToken,
            allCookies: request.cookies.getAll().map((c) => c.name),
          });
        }

        return {
          isValid: false,
          response: NextResponse.json(
            {
              error: 'Invalid or missing CSRF token',
              details:
                'CSRF (Cross-Site Request Forgery) validation failed. Ensure cookies are enabled.',
            },
            { status: 403 }
          ),
        };
      }
    }
  }

  return { isValid: true };
}
