import { NextResponse } from 'next/server';

/**
 * Legacy service worker handler.
 *
 * Returns 410 Gone untuk memaksa browser unregister SW yang lama.
 * Edge runtime karena trivial dan dipanggil setiap visit (warm path).
 */
export const runtime = 'edge';

export async function GET() {
  return new NextResponse('Service worker disabled', {
    status: 410,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
