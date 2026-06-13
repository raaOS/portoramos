import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '@/types/projects';
import { useProjectDetail } from './useProjectDetail';

const project: Project = {
  id: 'project-1',
  title: 'Demo Project',
  slug: 'demo-project',
  client: 'Demo Client',
  year: 2026,
  tags: [],
  cover: '/demo.jpg',
  autoplay: false,
  muted: true,
  loop: true,
  playsInline: true,
  coverWidth: 1200,
  coverHeight: 800,
  description: 'Demo description',
  order: 1,
  status: 'published',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe('useProjectDetail optimistic like', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('updates immediately, blocks duplicate clicks, and reconciles with server metrics', async () => {
    const mutation = deferred<Response>();
    const fetchMock = vi.fn(() => mutation.promise);
    vi.stubGlobal('fetch', fetchMock);
    const { result, unmount } = renderHook(() => useProjectDetail({ project }));

    let firstRequest!: Promise<void>;
    await act(async () => {
      firstRequest = result.current.handleProjectLike();
      void result.current.handleProjectLike();
      await Promise.resolve();
    });

    expect(result.current.isProjectLiked).toBe(true);
    expect(result.current.metrics.likes).toBe(1);
    expect(result.current.isLikePending).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('like-demo-project')).toBeNull();

    mutation.resolve(
      new Response(
        JSON.stringify({ success: true, metrics: { likes: 12, shares: 3 } }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );

    await act(async () => {
      await firstRequest;
    });

    expect(result.current.isProjectLiked).toBe(true);
    expect(result.current.metrics).toEqual({ likes: 12, shares: 3 });
    expect(result.current.isLikePending).toBe(false);
    expect(localStorage.getItem('like-demo-project')).toBe('true');
    unmount();
  });

  it('rolls back the optimistic state when the server rejects the mutation', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mutation = deferred<Response>();
    vi.stubGlobal('fetch', vi.fn(() => mutation.promise));
    const { result, unmount } = renderHook(() => useProjectDetail({ project }));

    let request!: Promise<void>;
    await act(async () => {
      request = result.current.handleProjectLike();
      await Promise.resolve();
    });

    expect(result.current.isProjectLiked).toBe(true);
    expect(result.current.metrics.likes).toBe(1);

    mutation.resolve(
      new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      })
    );

    await act(async () => {
      await request;
    });

    expect(result.current.isProjectLiked).toBe(false);
    expect(result.current.metrics.likes).toBe(0);
    expect(result.current.isLikePending).toBe(false);
    expect(localStorage.getItem('like-demo-project')).toBeNull();
    expect(errorSpy).toHaveBeenCalledOnce();
    unmount();
  });
});
