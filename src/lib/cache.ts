/**
 * Performance Cache Layer
 * Uses React.cache for request deduplication
 * Uses global cache for cross-request persistence
 */
import { cache } from 'react';

// Global cache for server-side persistence across requests
const globalCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60_000; // 1 minute

/**
 * Cached data fetcher with React.cache (request deduplication)
 * and global cache (cross-request persistence)
 */
export function createCachedFetcher<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = CACHE_TTL
) {
  // Use React.cache for request deduplication within same render
  const cachedFetcher = cache(async (): Promise<T> => {
    // Check global cache first
    const cached = globalCache.get(key);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < ttl) {
      return cached.data as T;
    }
    
    // Fetch fresh data
    const data = await fetcher();
    
    // Store in global cache
    globalCache.set(key, { data, timestamp: now });
    
    return data;
  });
  
  return cachedFetcher;
}

/**
 * Invalidate cache by key
 */
export function invalidateCache(key: string): void {
  globalCache.delete(key);
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  globalCache.clear();
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): { key: string; age: number }[] {
  const now = Date.now();
  return Array.from(globalCache.entries()).map(([key, value]) => ({
    key,
    age: now - value.timestamp,
  }));
}
