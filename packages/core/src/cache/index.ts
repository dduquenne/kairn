/**
 * Cache Abstraction Layer
 *
 * Provides a unified caching interface that supports multiple backends:
 * - In-memory cache for development and testing
 * - Redis cache for production
 *
 * Features:
 * - TTL-based expiration
 * - Namespace support for cache isolation
 * - Automatic serialization/deserialization
 * - Cache tags for invalidation groups
 * - Stale-while-revalidate pattern support
 */

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number | null;
  tags: string[];
}

/**
 * Cache options for set operations
 */
export interface CacheSetOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Tags for grouped invalidation */
  tags?: string[];
}

/**
 * Cache get options
 */
export interface CacheGetOptions {
  /** If true, returns stale data while revalidating */
  staleWhileRevalidate?: boolean;
  /** Grace period in seconds for stale data */
  staleGracePeriod?: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Cache store interface - implement this for different backends
 */
export interface CacheStore {
  /** Get a value by key */
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  /** Set a value with optional TTL */
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  /** Delete a key */
  delete(key: string): Promise<boolean>;
  /** Check if key exists */
  has(key: string): Promise<boolean>;
  /** Clear all keys (optionally by pattern) */
  clear(pattern?: string): Promise<void>;
  /** Get all keys (optionally by pattern) */
  keys(pattern?: string): Promise<string[]>;
  /** Get store statistics */
  stats(): Promise<{ size: number }>;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache store implementation */
  store: CacheStore;
  /** Default TTL in seconds (default: 300 = 5 minutes) */
  defaultTtl?: number;
  /** Namespace prefix for all keys */
  namespace?: string;
  /** Enable statistics tracking */
  enableStats?: boolean;
}

/**
 * In-memory cache store implementation
 */
export class MemoryCacheStore implements CacheStore {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(cleanupIntervalMs: number = 60000) {
    // Periodically clean up expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return null;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    this.cache.set(key, entry as CacheEntry<unknown>);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = await this.get(key);
    return entry !== null;
  }

  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    if (!pattern) {
      return allKeys;
    }

    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter((key) => regex.test(key));
  }

  async stats(): Promise<{ size: number }> {
    return { size: this.cache.size };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Destroy the store and clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

/**
 * Main cache class with high-level operations
 */
export class Cache {
  private store: CacheStore;
  private defaultTtl: number;
  private namespace: string;
  private enableStats: boolean;
  private stats: { hits: number; misses: number } = { hits: 0, misses: 0 };

  constructor(config: CacheConfig) {
    this.store = config.store;
    this.defaultTtl = config.defaultTtl ?? 300; // 5 minutes
    this.namespace = config.namespace ?? '';
    this.enableStats = config.enableStats ?? false;
  }

  /**
   * Build the full cache key with namespace
   */
  private buildKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key;
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: string, options?: CacheGetOptions): Promise<T | null> {
    const fullKey = this.buildKey(key);
    const entry = await this.store.get<T>(fullKey);

    if (!entry) {
      if (this.enableStats) this.stats.misses++;
      return null;
    }

    // Check if expired but within stale grace period
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      if (
        options?.staleWhileRevalidate &&
        options.staleGracePeriod &&
        Date.now() < entry.expiresAt + options.staleGracePeriod * 1000
      ) {
        // Return stale data
        if (this.enableStats) this.stats.hits++;
        return entry.value;
      }
      if (this.enableStats) this.stats.misses++;
      return null;
    }

    if (this.enableStats) this.stats.hits++;
    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    const fullKey = this.buildKey(key);
    const ttl = options?.ttl ?? this.defaultTtl;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      expiresAt: ttl > 0 ? now + ttl * 1000 : null,
      tags: options?.tags ?? [],
    };

    await this.store.set(fullKey, entry);
  }

  /**
   * Get or set a value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheSetOptions
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Delete a key from the cache
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);
    return this.store.delete(fullKey);
  }

  /**
   * Check if a key exists in the cache
   */
  async has(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);
    return this.store.has(fullKey);
  }

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    const keys = await this.store.keys(this.namespace ? `${this.namespace}:*` : '*');
    let count = 0;

    for (const key of keys) {
      const entry = await this.store.get(key);
      if (entry?.tags.includes(tag)) {
        await this.store.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Invalidate all keys matching a pattern
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    const fullPattern = this.buildKey(pattern);
    await this.store.clear(fullPattern);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    if (this.namespace) {
      await this.store.clear(`${this.namespace}:*`);
    } else {
      await this.store.clear();
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const storeStats = await this.store.stats();
    const total = this.stats.hits + this.stats.misses;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: storeStats.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Wrap a function with caching
   */
  wrap<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    keyGenerator: (...args: TArgs) => string,
    options?: CacheSetOptions
  ): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
      const key = keyGenerator(...args);
      return this.getOrSet(key, () => fn(...args), options);
    };
  }
}

/**
 * Create an in-memory cache instance
 */
export function createMemoryCache(config?: Partial<Omit<CacheConfig, 'store'>>): Cache {
  return new Cache({
    store: new MemoryCacheStore(),
    ...config,
  });
}

/**
 * Cache key builders for common use cases
 */
export const cacheKeys = {
  /** Build a key for a single entity */
  entity: (type: string, id: string | number): string => `${type}:${id}`,

  /** Build a key for a list query */
  list: (type: string, params?: Record<string, unknown>): string => {
    const base = `${type}:list`;
    if (!params || Object.keys(params).length === 0) {
      return base;
    }
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${JSON.stringify(params[k])}`)
      .join('&');
    return `${base}:${sorted}`;
  },

  /** Build a key for a user-specific cache */
  user: (userId: string, key: string): string => `user:${userId}:${key}`,

  /** Build a key for site-specific cache */
  site: (siteId: string, key: string): string => `site:${siteId}:${key}`,
};

/**
 * Common cache TTL presets (in seconds)
 */
export const CACHE_TTL = {
  /** 1 minute - for frequently changing data */
  SHORT: 60,
  /** 5 minutes - default for most data */
  MEDIUM: 300,
  /** 30 minutes - for semi-static data */
  LONG: 1800,
  /** 1 hour - for static data */
  HOUR: 3600,
  /** 24 hours - for rarely changing data */
  DAY: 86400,
  /** No expiration */
  FOREVER: 0,
} as const;

/**
 * Global cache instance (lazy initialized)
 */
let globalCache: Cache | null = null;

/**
 * Get or create the global cache instance
 */
export function getCache(): Cache {
  if (!globalCache) {
    globalCache = createMemoryCache({
      namespace: 'kairn',
      enableStats: true,
    });
  }
  return globalCache;
}

/**
 * Set a custom global cache instance
 */
export function setCache(cache: Cache): void {
  globalCache = cache;
}
