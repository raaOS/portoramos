import { NextResponse } from 'next/server';

export function isAPIRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

export function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    /\.(ico|png|jpg|jpeg|gif|svg|webp|avif|css|js|woff2?|ttf|eot|mp4|webm|wav|mp3|json|xml|txt|map)$/i.test(
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
      isProd
        ? "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live"
        : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss: http://localhost:* ws://localhost:* https://va.vercel-scripts.com blob:",
      "media-src 'self' https: data: blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-src 'self' https://vercel.live",
      "frame-ancestors 'self'",
    ].join('; ') + ';';

  response.headers.set('Content-Security-Policy', cspBase);

  if (isProd) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}
