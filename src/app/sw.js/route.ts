import { NextResponse } from 'next/server'

// Return 410 Gone for legacy service worker requests to force unregistration
export async function GET() {
  return new NextResponse('Service worker disabled', {
    status: 410,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}

