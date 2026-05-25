/**
 * Unified Cache Manager
 *
 * Replaces duplicated in-memory cache implementations across services.
 * Features:
 * - Configurable TTL per-entry and per-instance default
 * - LRU eviction when max size is reached
 * - Optional metrics tracking (hits, misses, evictions)
 * - Thread-safe for single-process Node.js runtime
 *
 * Usage:
 *   const cache = new CacheManager({ defaultTTL: 30000, maxSize: 50 });
 *   cache.set('key', data);
 *   const cached = cache.get<MyType>('key');
 */

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheManagerOptions {
  /** Default TTL in milliseconds (default: 30000) */
  defaultTTL?: number;
  /** Maximum number of cache entries (default: 50) */
  maxSize?: number;
  /** Enable metrics tracking (default: false) */
  enableMetrics?: boolean;
  /** Label for log messages (default: 'CacheManager') */
  label?: string;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: string;
}

export class CacheManager {
  private readonly store = new Map<string, CacheEntry>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private readonly label: string;
  private readonly enableMetrics: boolean;

  // Metrics counters
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(options: CacheManagerOptions = {}) {
    this.defaultTTL = options.defaultTTL ?? 30_000;
    this.maxSize = options.maxSize ?? 50;
    this.label = options.label ?? 'CacheManager';
    this.enableMetrics = options.enableMetrics ?? false;
  }

  /**
   * Get a cached value by key. Returns null if not found or expired.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      if (this.enableMetrics) this.misses++;
      return null;
    }

    // Check TTL expiry
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      if (this.enableMetrics) {
        this.evictions++;
        this.misses++;
      }
      return null;
    }

    // Update access metadata for LRU
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    if (this.enableMetrics) this.hits++;
    return entry.data as T;
  }

  /**
   * Set a cache entry. Evicts LRU entry if cache is full.
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Optional TTL override in ms (uses default if not specified)
   */
  set(key: string, data: unknown, ttl?: number): void {
    // Evict oldest entry if cache is full
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    this.store.set(key, {
      data,
      timestamp: now,
      ttl: ttl ?? this.defaultTTL,
      accessCount: 1,
      lastAccessed: now,
    });
  }

  /**
   * Remove a specific entry from the cache.
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Remove all entries matching a prefix.
   */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    if (this.enableMetrics && count > 0) {
      this.evictions += count;
    }
    return count;
  }

  /**
   * Clear all entries.
   */
  clear(): void {
    const size = this.store.size;
    this.store.clear();
    if (this.enableMetrics) {
      this.evictions += size;
    }
  }

  /**
   * Get current cache size.
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Get cache performance metrics.
   */
  getMetrics(): CacheMetrics {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: this.store.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%',
    };
  }

  /**
   * Get detailed stats for monitoring/debugging.
   */
  getDetailedStats(): {
    size: number;
    maxSize: number;
    entries: Array<{ key: string; accessCount: number; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.store.entries()).map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      age: now - entry.timestamp,
    }));

    return {
      size: this.store.size,
      maxSize: this.maxSize,
      entries,
    };
  }

  /**
   * Evict the least recently used entry.
   */
  private evictLRU(): void {
    if (this.store.size === 0) return;

    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      console.log(`[${this.label}] LRU evicting key: ${lruKey}`);
      this.store.delete(lruKey);
      if (this.enableMetrics) this.evictions++;
    }
  }
}
