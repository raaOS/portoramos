import { NextRequest } from 'next/server';

const ALLOWED_HOSTS = new Set(['picsum.photos']);

function stripCloudinaryTransform(_u: URL) {
  return null;
}

async function fetchPassthrough(target: URL, headers: Record<string, string>) {
  try {
    const res = await fetch(target.toString(), {
      cache: 'no-store',
      headers,
    });
    if (!res.ok || !res.body) return null;
    return res;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u');
  if (!u) return new Response('Missing u', { status: 400 });
  let url: URL;
  try {
    url = new URL(u);
  } catch {
    return new Response('Bad url', { status: 400 });
  }
  if (!ALLOWED_HOSTS.has(url.hostname)) return new Response('Host not allowed', { status: 400 });

  const fetchHeaders: Record<string, string> = {};
  const rangeHeader = req.headers.get('range');
  if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

  let res = await fetchPassthrough(url, fetchHeaders);
  if (!res) {
    const fallbackUrl = stripCloudinaryTransform(url);
    if (fallbackUrl) {
      const retry = await fetchPassthrough(fallbackUrl, fetchHeaders);
      if (retry) {
        url = fallbackUrl;
        res = retry;
      }
    }
  }

  if (!res) {
    // As a last resort, let the client fetch directly (avoids server-side fetch blockers)
    const redirectTarget = stripCloudinaryTransform(url) || url;
    return Response.redirect(redirectTarget.toString(), 302);
  }

  const ct = res.headers.get('content-type') || 'image/jpeg';
  const contentLength = res.headers.get('content-length');
  const acceptRanges = res.headers.get('accept-ranges');
  const contentRange = res.headers.get('content-range');

  const headers: Record<string, string> = {
    'content-type': ct,
    'cache-control': 'public, max-age=86400, immutable',
  };

  if (contentLength) headers['content-length'] = contentLength;
  if (acceptRanges) headers['accept-ranges'] = acceptRanges;
  if (contentRange) headers['content-range'] = contentRange;

  return new Response(res.body, {
    status: res.status,
    headers,
  });
}
