import { NextRequest } from 'next/server'

const ALLOWED_HOSTS = new Set(['picsum.photos', 'res.cloudinary.com'])

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u')
  if (!u) return new Response('Missing u', { status: 400 })
  let url: URL
  try { url = new URL(u) } catch { return new Response('Bad url', { status: 400 }) }
  if (!ALLOWED_HOSTS.has(url.hostname)) return new Response('Host not allowed', { status: 400 })

  const fetchHeaders: Record<string, string> = {}
  const rangeHeader = req.headers.get('range')
  if (rangeHeader) fetchHeaders['Range'] = rangeHeader
  
  const res = await fetch(url.toString(), { 
    cache: 'no-store',
    headers: fetchHeaders
  }).catch(() => null as any)
  if (!res || !res.ok || !res.body) return new Response('Upstream error', { status: 502 })
  
  const ct = res.headers.get('content-type') || 'image/jpeg'
  const contentLength = res.headers.get('content-length')
  const acceptRanges = res.headers.get('accept-ranges')
  const contentRange = res.headers.get('content-range')
  
  const headers: Record<string, string> = {
    'content-type': ct,
    'cache-control': 'public, max-age=86400, immutable',
  }
  
  if (contentLength) headers['content-length'] = contentLength
  if (acceptRanges) headers['accept-ranges'] = acceptRanges
  if (contentRange) headers['content-range'] = contentRange
  
  return new Response(res.body, {
    status: res.status,
    headers,
  })
}
