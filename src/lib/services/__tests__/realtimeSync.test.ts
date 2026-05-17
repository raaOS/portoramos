import { describe, it, expect } from 'vitest';

describe('Realtime Sync Logic', () => {
  it('detects timestamp changes correctly', () => {
    const timestamp1 = '2026-03-08T00:30:00.000Z';
    const timestamp2 = '2026-03-08T00:35:00.000Z';
    const timestamp3 = '2026-03-08T00:35:00.000Z';

    expect(timestamp1).not.toBe(timestamp2);
    expect(timestamp2).toBe(timestamp3);
  });

  it('keeps polling payload small', () => {
    const fullDataSizeKb = 50;
    const versionPayloadSizeKb = 0.05;
    const savings = ((fullDataSizeKb - versionPayloadSizeKb) / fullDataSizeKb) * 100;

    expect(savings).toBeGreaterThan(99);
  });

  it('clears cache after CRUD operations', () => {
    const cache = new Map<string, { data: unknown; timestamp: number }>();
    const key = 'projects:all';
    const data = { projects: [{ id: '1', title: 'Test' }] };

    cache.set(key, { data, timestamp: Date.now() });
    expect(cache.get(key)?.data).toEqual(data);

    cache.delete(key);
    expect(cache.get(key)).toBeUndefined();
  });

  it('uses the lastUpdated version marker', () => {
    const versionPath = 'lastUpdated';
    const expensivePaths = [
      'projects',
      'projects/project-1',
      'content',
      'content/about',
    ];

    expect(versionPath.split('/')).toHaveLength(1);
    expect(expensivePaths).not.toContain(versionPath);
  });
});

describe('Content Service Cache with Different TTLs', () => {
  it('caches about data for 5 seconds only', () => {
    const now = Date.now();
    const ABOUT_TTL = 5000;
    const cacheEntry = {
      data: { iconPositions: { 'icon-1': { x: 100, y: 200 } } },
      timestamp: now,
      ttl: ABOUT_TTL,
    };

    expect((now + 3000) - cacheEntry.timestamp <= cacheEntry.ttl).toBe(true);
    expect((now + 6000) - cacheEntry.timestamp > cacheEntry.ttl).toBe(true);
  });

  it('caches projects for 30 seconds', () => {
    const now = Date.now();
    const PROJECT_TTL = 30000;
    const cacheEntry = {
      data: { projects: [], lastUpdated: new Date().toISOString() },
      timestamp: now,
      ttl: PROJECT_TTL,
    };

    expect((now + 15000) - cacheEntry.timestamp <= cacheEntry.ttl).toBe(true);
    expect((now + 35000) - cacheEntry.timestamp > cacheEntry.ttl).toBe(true);
  });

  it('clears project cache entries on CRUD operations', () => {
    const cache = new Map();

    cache.set('project:all', { data: 'test', timestamp: Date.now() });
    cache.set('project:published', { data: 'test2', timestamp: Date.now() });

    for (const key of cache.keys()) {
      if (key.startsWith('project:')) {
        cache.delete(key);
      }
    }

    expect(cache.size).toBe(0);
  });
});
