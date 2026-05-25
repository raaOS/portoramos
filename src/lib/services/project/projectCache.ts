import v8 from 'v8';
import { CacheManager } from '@/lib/cache/CacheManager';

const projectCache = new CacheManager({
  defaultTTL: 30_000, // 30 detik
  maxSize: 100,
  label: 'ProjectService',
  enableMetrics: true,
});

let lastMemoryCheck = 0;

export function checkMemoryUsage() {
  const now = Date.now();
  if (now - lastMemoryCheck < 60000) return; // Maksimal sekali per menit

  lastMemoryCheck = now;
  const { heapUsed } = process.memoryUsage();
  const { heap_size_limit } = v8.getHeapStatistics();
  const ratio = heapUsed / heap_size_limit;

  if (ratio > 0.9) {
    console.error(
      `[ProjectService] CRITICAL MEMORY: ${(ratio * 100).toFixed(1)}% (${(heapUsed / 1024 / 1024).toFixed(2)}MB / ${(heap_size_limit / 1024 / 1024).toFixed(2)}MB). clearing cache.`
    );
    clearProjectCache();
  } else if (ratio > 0.8) {
    console.warn(
      `[ProjectService] HIGH MEMORY WARNING: ${(ratio * 100).toFixed(1)}% (${(heapUsed / 1024 / 1024).toFixed(2)}MB).`
    );
  }
}

export function getProjectCacheKey(key: string): string {
  return `project:${key}`;
}

export function getFromProjectCache<T>(key: string): T | null {
  checkMemoryUsage();
  return projectCache.get<T>(key);
}

export function setProjectCache(key: string, data: unknown): void {
  checkMemoryUsage();
  projectCache.set(key, data);
}

export function clearProjectCache(): void {
  console.log('[ProjectService] Clearing all project caches...');
  projectCache.deleteByPrefix('project:');
}

export function getCacheMetrics() {
  return projectCache.getMetrics();
}
