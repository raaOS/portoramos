/**
 * 🚨 ATURAN EMAS - JANGAN DIHAPUS / JANGAN DIGANTI NAMA 🚨
 *
 * JANGAN PERNAH mengganti nama file ini menjadi 'middleware.ts'.
 * Project ini menggunakan Next.js 16/Kustom yang mewajibkan konvensi 'proxy.ts'.
 * Mengubahnya ke 'middleware.ts' akan merusak sistem dan memicu peringatan deprecation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isStaticAsset, addSecurityHeaders } from './middleware/utils';
import { checkAdminAuth } from './middleware/auth';
import { checkCSRF } from './middleware/csrf';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // 0. CSRF Protection for Mutations
  const csrfResult = checkCSRF(request);
  if (!csrfResult.isValid && csrfResult.response) {
    return csrfResult.response;
  }

  // 1. Authentication Check
  const authResult = await checkAdminAuth(request);
  if (!authResult.authenticated && authResult.response) {
    return authResult.response;
  }

  // 1b. Sliding-window token refresh: kalau auth memutuskan token harus
  // di-refresh (sisa < 30 menit), kembalikan response dengan Set-Cookie
  // baru. Tanpa ini, admin yang lagi upload wallpaper besar (compress
  // 5-15 menit) bisa ke-logout di tengah jalan.
  if (authResult.refreshResponse) {
    return addSecurityHeaders(authResult.refreshResponse);
  }

  // 2. Route-level persistent rate limiting is enforced inside mutating handlers.
  // Keep proxy focused on auth, CSRF, and security headers so behavior stays consistent in serverless.
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/|admin\\.html).*)'],
};
