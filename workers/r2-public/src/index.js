const PUBLIC_PREFIXES = ['assets/', 'temp/'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: {
          ...corsHeaders(),
          allow: 'GET, HEAD, OPTIONS',
        },
      });
    }

    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    if (!isAllowedKey(key)) {
      return new Response('Not Found', { status: 404, headers: corsHeaders() });
    }

    const object = await env.MEDIA_BUCKET.get(key, {
      onlyIf: request.headers,
      range: request.headers,
    });

    if (object === null) {
      return new Response('Not Found', { status: 404, headers: corsHeaders() });
    }

    const headers = new Headers(corsHeaders());
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('accept-ranges', 'bytes');
    headers.set('cache-control', headers.get('cache-control') || 'public, max-age=31536000, immutable');

    if (!headers.get('content-type')) {
      headers.set('content-type', contentTypeForKey(key));
    }

    const range = object.range;
    if (range) {
      const start = range.offset ?? object.size - range.length;
      const end = start + range.length - 1;
      headers.set('content-range', `bytes ${start}-${end}/${object.size}`);
    }

    return new Response(request.method === 'HEAD' ? null : object.body, {
      status: range ? 206 : 200,
      headers,
    });
  },
};

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, HEAD, OPTIONS',
    'access-control-allow-headers': 'range, if-none-match, if-modified-since',
    'access-control-expose-headers': 'accept-ranges, content-length, content-range, etag',
  };
}

function isAllowedKey(key) {
  if (!key || key.includes('..') || key.includes('\\')) return false;
  return PUBLIC_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function contentTypeForKey(key) {
  const ext = key.split('.').pop()?.toLowerCase();
  const types = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    pdf: 'application/pdf',
    txt: 'text/plain; charset=utf-8',
  };

  return types[ext] || 'application/octet-stream';
}
