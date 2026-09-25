/**
 * Middleware Utilities — Helper functions untuk middleware pipeline.
 *
 * Menyediakan deteksi route (`isAPIRoute`, `isStaticAsset`) dan injeksi
 * security headers (CSP, HSTS, X-Frame-Options, dll.) pada response.
 *
 * @module middleware/utils
 */
import { NextResponse } from 'next/server';

export function isAPIRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

export function isStaticAsset(pathname: string): boolean {
  // SECURITY: .svg is intentionally NOT treated as a static skip so
  // addSecurityHeaders (CSP, nosniff) still runs for vector documents.
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    /\.(ico|png|jpg|jpeg|gif|webp|avif|css|js|woff2?|ttf|eot|mp4|webm|wav|mp3|json|xml|txt|map)$/i.test(
      pathname
    )
  );
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  const isProd = process.env.NODE_ENV === 'production';

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  const cspBase =
    [
      "default-src 'self'",
      // NOTE: Next.js App Router injects inline bootstrap/hydration scripts
      // without a framework-level nonce hook in this setup, so 'unsafe-inline'
      // is retained for script-src. Removing it breaks hydration in production.
      // Style inline is lower risk (CSS injection ≠ script execution).
      isProd
        ? "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live https://www.youtube.com https://s.ytimg.com"
        : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com blob: https://www.youtube.com https://s.ytimg.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss: http://localhost:* ws://localhost:* https://va.vercel-scripts.com blob:",
      "media-src 'self' https: data: blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-src 'self' https://vercel.live https://www.youtube.com",
      "frame-ancestors 'self'",
    ].join('; ') + ';';

  response.headers.set('Content-Security-Policy', cspBase);

  if (isProd) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  return response;
}
