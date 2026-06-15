import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from './route';

describe('GET /api/img', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 when u param is missing', async () => {
    const request = new NextRequest('http://localhost/api/img');
    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Missing u');
  });

  it('returns 400 for malformed URL', async () => {
    const request = new NextRequest('http://localhost/api/img?u=not-a-valid-url');
    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Bad url');
  });

  it('returns 400 for disallowed host', async () => {
    const request = new NextRequest('http://localhost/api/img?u=https://evil.com/image.jpg');
    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Host not allowed');
  });

  it('proxies image from allowed host successfully', async () => {
    const body = new ReadableStream({
      start(c) {
        c.close();
      },
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body,
      status: 200,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'content-length': '12345',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest('http://localhost/api/img?u=https://picsum.photos/200/300');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');

    vi.unstubAllGlobals();
  });

  it('redirects when upstream is unreachable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest('http://localhost/api/img?u=https://picsum.photos/200/300');
    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://picsum.photos/200/300');

    vi.unstubAllGlobals();
  });

  it('proxies range headers to upstream', async () => {
    const body = new ReadableStream({
      start(c) {
        c.close();
      },
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body,
      status: 206,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'accept-ranges': 'bytes',
        'content-range': 'bytes 0-1023/2048',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest('http://localhost/api/img?u=https://picsum.photos/200/300', {
      headers: { range: 'bytes=0-1023' },
    });
    const response = await GET(request);

    expect(response.status).toBe(206);
    expect(response.headers.get('content-range')).toBe('bytes 0-1023/2048');

    vi.unstubAllGlobals();
  });
});
