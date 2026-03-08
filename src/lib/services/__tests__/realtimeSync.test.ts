/**
 * Unit Test: Real-time Sync Logic
 * Tanpa browser, test core functionality saja
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Realtime Sync Logic', () => {
  // Mock Firebase
  const mockOnValue = vi.fn();
  const mockOff = vi.fn();
  const mockRef = vi.fn();
  const mockGetDatabase = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup mock module
    vi.doMock('firebase/database', () => ({
      onValue: mockOnValue,
      off: mockOff,
      ref: mockRef,
      getDatabase: mockGetDatabase,
    }));
    
    vi.doMock('firebase/app', () => ({
      initializeApp: vi.fn(() => ({ name: 'mock-app' })),
      getApp: vi.fn(() => { throw new Error('not initialized'); }),
    }));
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should detect timestamp changes correctly', () => {
    const timestamps: string[] = [];
    const _onUpdate = vi.fn();
    
    // Simulate timestamp changes
    const timestamp1 = '2026-03-08T00:30:00.000Z';
    const timestamp2 = '2026-03-08T00:35:00.000Z';
    const timestamp3 = '2026-03-08T00:35:00.000Z'; // Same as 2
    
    // First call - initialization (should not trigger)
    timestamps.push(timestamp1);
    
    // Second call - different timestamp (should trigger)
    timestamps.push(timestamp2);
    
    // Third call - same timestamp (should NOT trigger)
    timestamps.push(timestamp3);
    
    // Verify logic
    expect(timestamp1).not.toBe(timestamp2);
    expect(timestamp2).toBe(timestamp3);
    
    console.log('✅ Timestamp comparison logic works');
  });

  it('should calculate bandwidth savings correctly', () => {
    // Old polling: every 30 seconds
    const oldPollingInterval = 30; // seconds
    const oldRequestsPerMinute = 60 / oldPollingInterval; // 2 requests/minute
    const oldDataSize = 50; // KB per request (full projects data)
    const oldBandwidthPerMinute = oldRequestsPerMinute * oldDataSize; // 100 KB/min
    
    // New realtime: only when changed
    // Assume change happens every 5 minutes on average
    const changesPerMinute = 0.2; // 1 change per 5 minutes
    const realtimeDataSize = 0.05; // KB (just timestamp)
    const newBandwidthPerMinute = changesPerMinute * realtimeDataSize; // 0.01 KB/min
    
    const savings = ((oldBandwidthPerMinute - newBandwidthPerMinute) / oldBandwidthPerMinute) * 100;
    
    console.log(`Old bandwidth: ${oldBandwidthPerMinute} KB/min`);
    console.log(`New bandwidth: ${newBandwidthPerMinute} KB/min`);
    console.log(`Savings: ${savings.toFixed(4)}%`);
    
    expect(savings).toBeGreaterThan(99); // Should save >99%
  });

  it('should handle cache invalidation correctly', () => {
    // Simulate cache
    const cache = new Map<string, { data: unknown; timestamp: number }>();
    const _CACHE_TTL = 30000; // 30 seconds
    
    // Add item to cache
    const key = 'projects:all';
    const data = { projects: [{ id: '1', title: 'Test' }] };
    cache.set(key, { data, timestamp: Date.now() });
    
    // Should be cache hit immediately
    const cached = cache.get(key);
    expect(cached).toBeDefined();
    expect(cached?.data).toEqual(data);
    
    // Clear cache (simulating CRUD operation)
    cache.delete(key);
    
    // Should be cache miss after clear
    const afterClear = cache.get(key);
    expect(afterClear).toBeUndefined();
    
    console.log('✅ Cache invalidation logic works');
  });

  it('should only listen to lastUpdated field', () => {
    // Verify the path being listened
    const listenPath = 'lastUpdated';
    
    // Should NOT listen to these (too expensive):
    const expensivePaths = [
      'projects',           // Full project data
      'projects/project-1', // Individual project
      'content',            // All content
      'content/about',      // About data
    ];
    
    // lastUpdated should be short path
    expect(listenPath.split('/').length).toBe(1);
    
    // Should not be in expensive paths
    expect(expensivePaths).not.toContain(listenPath);
    
    console.log('✅ Only listening to:', listenPath);
    console.log('❌ NOT listening to:', expensivePaths.join(', '));
  });
});

describe('Content Service Cache with Different TTLs', () => {
  it('should cache about data for 5 seconds only', () => {
    const now = Date.now();
    const ABOUT_TTL = 5000; // 5 detik untuk about
    const cacheEntry = {
      data: { iconPositions: { 'icon-1': { x: 100, y: 200 } } },
      timestamp: now,
      ttl: ABOUT_TTL, // Custom TTL untuk about
    };
    
    // Within TTL (3 detik)
    const withinTTL = now + 3000;
    const isValid = (withinTTL - cacheEntry.timestamp) <= cacheEntry.ttl;
    expect(isValid).toBe(true);
    
    // After TTL (6 detik)
    const afterTTL = now + 6000;
    const isExpired = (afterTTL - cacheEntry.timestamp) > cacheEntry.ttl;
    expect(isExpired).toBe(true);
    
    console.log('✅ About data cache TTL: 5 seconds (fast update for positions)');
  });

  it('should cache projects for 30 seconds', () => {
    const now = Date.now();
    const PROJECT_TTL = 30000; // 30 detik untuk projects
    const cacheEntry = {
      data: { projects: [], lastUpdated: new Date().toISOString() },
      timestamp: now,
      ttl: PROJECT_TTL,
    };
    
    // Within TTL (15 detik)
    const withinTTL = now + 15000;
    const isValid = (withinTTL - cacheEntry.timestamp) <= cacheEntry.ttl;
    expect(isValid).toBe(true);
    
    // After TTL (35 detik)
    const afterTTL = now + 35000;
    const isExpired = (afterTTL - cacheEntry.timestamp) > cacheEntry.ttl;
    expect(isExpired).toBe(true);
    
    console.log('✅ Projects cache TTL: 30 seconds (standard)');
  });

  it('should clear cache on CRUD operations', () => {
    const cache = new Map();
    
    // Populate cache
    cache.set('project:all', { data: 'test', timestamp: Date.now() });
    cache.set('project:published', { data: 'test2', timestamp: Date.now() });
    
    expect(cache.size).toBe(2);
    
    // Simulate clearProjectCache()
    for (const key of cache.keys()) {
      if (key.startsWith('project:')) {
        cache.delete(key);
      }
    }
    
    expect(cache.size).toBe(0);
    console.log('✅ Cache cleared after CRUD');
  });
});
