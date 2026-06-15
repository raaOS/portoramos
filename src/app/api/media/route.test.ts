import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { GET } from './route';

describe('GET /api/media', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 when no url param is provided', async () => {
    const request = new NextRequest('http://localhost/api/media');
    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('URL required');
  });

  it('returns 403 for non-r2 and non-assets URLs', async () => {
    const request = new NextRequest('http://localhost/api/media?url=http://evil.com/malware');
    const response = await GET(request);
    expect(response.status).toBe(403);
    expect(await response.text()).toBe('Invalid media source');
  });

  it('returns 404 when upstream fetch fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest('http://localhost/api/media?url=/assets/media/test.jpg');
    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Media not found');

    vi.unstubAllGlobals();
  });

  it('proxies media successfully with cache headers', async () => {
    const arrayBuffer = new Uint8Array([1, 2, 3]).buffer;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(arrayBuffer),
      headers: new Headers({ 'content-type': 'image/png' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest('http://localhost/api/media?url=/r2/assets/projects/cover.png');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');

    vi.unstubAllGlobals();
  });

  it('handles relative URL without leading slash', async () => {
    const arrayBuffer = new Uint8Array([1, 2, 3]).buffer;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(arrayBuffer),
      headers: new Headers({ 'content-type': 'image/webp' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest('http://localhost/api/media?url=assets/media/file.webp');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/webp');

    vi.unstubAllGlobals();
  });
});
