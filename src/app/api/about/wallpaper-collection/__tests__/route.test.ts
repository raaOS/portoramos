import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

import type { AboutData } from '@/types/about';

// ── Mocks ────────────────────────────────────────────────────────────
//
// The route depends on:
//   - `validateAdminRequest` (auth check)
//   - `aboutService.getAboutData` / `updateAboutData`  (D1)
//   - `revalidatePath`  (Next ISR)
//   - `invalidateAboutCache`  (in-memory cache helper)
//
// We mock all four so the test exercises the route's branching and
// validation logic without touching the network or D1. Module-level
// `vi.mock` calls are hoisted by Vitest, so they apply before the
// route file is loaded below.

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/about', () => ({
  invalidateAboutCache: vi.fn(),
}));

const getAboutData = vi.fn();
const updateAboutData = vi.fn();

vi.mock('@/lib/services/aboutService', () => ({
  aboutService: {
    getAboutData: (...args: unknown[]) => getAboutData(...args),
    updateAboutData: (...args: unknown[]) => updateAboutData(...args),
  },
}));

// Imported AFTER mocks are defined so the route picks up the mocked
// modules.
import { POST } from '../route';
import { validateAdminRequest } from '@/lib/auth';

function buildPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/about/wallpaper-collection', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeAboutData(overrides: Partial<AboutData['wallpaperConfig']> = {}): AboutData {
  // Minimal AboutData stub — only the fields the route reads.
  return {
    wallpaperConfig: {
      activeWallpaperId: '',
      collection: [],
      ...overrides,
    },
  } as unknown as AboutData;
}

describe('POST /api/about/wallpaper-collection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (validateAdminRequest as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  it('rejects requests when admin validation fails', async () => {
    (validateAdminRequest as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await POST(
      buildPostRequest({
        action: 'add',
        wallpaper: { id: 'w-1', url: '/r2/foo.mp4' },
      })
    );

    expect(res.status).toBe(401);
    expect(updateAboutData).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/about/wallpaper-collection', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json{',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects unknown action via discriminated union validation', async () => {
    const res = await POST(
      buildPostRequest({
        action: 'reorder',
        wallpaper: { id: 'w-1', url: '/r2/foo.mp4' },
      })
    );
    // Zod failure surfaces through `validationError` → 400.
    expect(res.status).toBe(400);
  });

  describe('action = add', () => {
    it('appends to an empty collection and makes the new entry active', async () => {
      getAboutData.mockResolvedValue(makeAboutData());
      updateAboutData.mockImplementation(async (updates) => updates);

      const res = await POST(
        buildPostRequest({
          action: 'add',
          wallpaper: { id: 'w-new', url: '/r2/assets/wallpapers/x.mp4' },
        })
      );

      expect(res.status).toBe(200);
      expect(updateAboutData).toHaveBeenCalledTimes(1);
      const payload = updateAboutData.mock.calls[0][0];
      expect(payload.wallpaperConfig.collection).toEqual([
        { id: 'w-new', url: '/r2/assets/wallpapers/x.mp4' },
      ]);
      expect(payload.wallpaperConfig.activeWallpaperId).toBe('w-new');
    });

    it('preserves existing entries when appending', async () => {
      getAboutData.mockResolvedValue(
        makeAboutData({
          activeWallpaperId: 'w-old',
          collection: [{ id: 'w-old', url: '/r2/old.mp4' }],
        })
      );
      updateAboutData.mockImplementation(async (updates) => updates);

      const res = await POST(
        buildPostRequest({
          action: 'add',
          wallpaper: { id: 'w-new', url: '/r2/new.mp4' },
        })
      );

      expect(res.status).toBe(200);
      const payload = updateAboutData.mock.calls[0][0];
      expect(payload.wallpaperConfig.collection.map((w: { id: string }) => w.id)).toEqual([
        'w-old',
        'w-new',
      ]);
      expect(payload.wallpaperConfig.activeWallpaperId).toBe('w-new');
    });

    it('respects makeActive=false and keeps the previous active id', async () => {
      getAboutData.mockResolvedValue(
        makeAboutData({
          activeWallpaperId: 'w-old',
          collection: [{ id: 'w-old', url: '/r2/old.mp4' }],
        })
      );
      updateAboutData.mockImplementation(async (updates) => updates);

      const res = await POST(
        buildPostRequest({
          action: 'add',
          wallpaper: { id: 'w-new', url: '/r2/new.mp4' },
          makeActive: false,
        })
      );

      expect(res.status).toBe(200);
      const payload = updateAboutData.mock.calls[0][0];
      expect(payload.wallpaperConfig.activeWallpaperId).toBe('w-old');
    });

    it('returns 409 when the id already exists in the collection', async () => {
      getAboutData.mockResolvedValue(
        makeAboutData({
          collection: [{ id: 'w-dup', url: '/r2/x.mp4' }],
        })
      );

      const res = await POST(
        buildPostRequest({
          action: 'add',
          wallpaper: { id: 'w-dup', url: '/r2/x-2.mp4' },
        })
      );

      expect(res.status).toBe(409);
      expect(updateAboutData).not.toHaveBeenCalled();
    });
  });

  describe('action = remove', () => {
    it('removes the matching entry and falls back to the first remaining as active', async () => {
      getAboutData.mockResolvedValue(
        makeAboutData({
          activeWallpaperId: 'w-2',
          collection: [
            { id: 'w-1', url: '/r2/1.mp4' },
            { id: 'w-2', url: '/r2/2.mp4' },
            { id: 'w-3', url: '/r2/3.mp4' },
          ],
        })
      );
      updateAboutData.mockImplementation(async (updates) => updates);

      const res = await POST(buildPostRequest({ action: 'remove', id: 'w-2' }));
      expect(res.status).toBe(200);

      const payload = updateAboutData.mock.calls[0][0];
      expect(payload.wallpaperConfig.collection.map((w: { id: string }) => w.id)).toEqual([
        'w-1',
        'w-3',
      ]);
      // w-2 was active → falls back to first remaining (w-1).
      expect(payload.wallpaperConfig.activeWallpaperId).toBe('w-1');
    });

    it('keeps activeWallpaperId unchanged when removing a non-active entry', async () => {
      getAboutData.mockResolvedValue(
        makeAboutData({
          activeWallpaperId: 'w-1',
          collection: [
            { id: 'w-1', url: '/r2/1.mp4' },
            { id: 'w-2', url: '/r2/2.mp4' },
          ],
        })
      );
      updateAboutData.mockImplementation(async (updates) => updates);

      const res = await POST(buildPostRequest({ action: 'remove', id: 'w-2' }));
      expect(res.status).toBe(200);

      const payload = updateAboutData.mock.calls[0][0];
      expect(payload.wallpaperConfig.activeWallpaperId).toBe('w-1');
    });

    it('clears activeWallpaperId when removing the last entry', async () => {
      getAboutData.mockResolvedValue(
        makeAboutData({
          activeWallpaperId: 'w-1',
          collection: [{ id: 'w-1', url: '/r2/1.mp4' }],
        })
      );
      updateAboutData.mockImplementation(async (updates) => updates);

      const res = await POST(buildPostRequest({ action: 'remove', id: 'w-1' }));
      expect(res.status).toBe(200);

      const payload = updateAboutData.mock.calls[0][0];
      expect(payload.wallpaperConfig.collection).toEqual([]);
      expect(payload.wallpaperConfig.activeWallpaperId).toBe('');
    });

    it('returns 404 when removing an unknown id', async () => {
      getAboutData.mockResolvedValue(makeAboutData());

      const res = await POST(buildPostRequest({ action: 'remove', id: 'missing' }));
      expect(res.status).toBe(404);
      expect(updateAboutData).not.toHaveBeenCalled();
    });
  });

  describe('action = setActive', () => {
    it('updates only activeWallpaperId, leaving collection untouched', async () => {
      const collection = [
        { id: 'w-1', url: '/r2/1.mp4' },
        { id: 'w-2', url: '/r2/2.mp4' },
      ];
      getAboutData.mockResolvedValue(
        makeAboutData({ activeWallpaperId: 'w-1', collection })
      );
      updateAboutData.mockImplementation(async (updates) => updates);

      const res = await POST(buildPostRequest({ action: 'setActive', id: 'w-2' }));
      expect(res.status).toBe(200);

      const payload = updateAboutData.mock.calls[0][0];
      expect(payload.wallpaperConfig.collection).toEqual(collection);
      expect(payload.wallpaperConfig.activeWallpaperId).toBe('w-2');
    });

    it('returns 404 when setting active to an unknown id', async () => {
      getAboutData.mockResolvedValue(
        makeAboutData({
          activeWallpaperId: 'w-1',
          collection: [{ id: 'w-1', url: '/r2/1.mp4' }],
        })
      );

      const res = await POST(buildPostRequest({ action: 'setActive', id: 'ghost' }));
      expect(res.status).toBe(404);
      expect(updateAboutData).not.toHaveBeenCalled();
    });
  });
});
