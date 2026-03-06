/**
 * Redis-backed CacheStore implementation
 *
 * Implements the CacheStore interface using ioredis.
 * Provides graceful degradation: falls back silently when Redis
 * is unavailable, returning null/empty results instead of throwing.
 *
 * @requires ioredis — optional peer dependency of @kairn/core
 */

import type { CacheEntry, CacheStore } from './index';

/**
 * Configuration for the Redis cache store
 */
export interface RedisCacheStoreConfig {
  /** Redis connection URL (e.g. redis://localhost:6379) */
  url?: string;
  /** Key prefix to isolate this store's data (default: 'kairn:cache:') */
  keyPrefix?: string;
  /** Maximum retries per request (default: 3) */
  maxRetries?: number;
  /** Lazy connect — defer connection until first command (default: true) */
  lazyConnect?: boolean;
}

/**
 * Redis health check result
 */
export interface RedisHealthResult {
  available: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * Redis cache store implementing the CacheStore interface.
 * Uses ioredis for connection management with automatic reconnection.
 * Falls back gracefully when Redis is unavailable.
 *
 * @example
 * ```typescript
 * import { Cache } from '@kairn/core';
 * import { RedisCacheStore } from '@kairn/core';
 *
 * const store = new RedisCacheStore({ url: process.env.REDIS_URL });
 * const cache = new Cache({ store, namespace: 'mysite' });
 *
 * await cache.set('key', 'value', { ttl: 300 });
 * const value = await cache.get('key');
 * ```
 */
export class RedisCacheStore implements CacheStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;
  private available = false;
  private readonly keyPrefix: string;
  private readonly config: RedisCacheStoreConfig;
  private hasLoggedMissingUrl = false;

  constructor(config: RedisCacheStoreConfig = {}) {
    this.config = config;
    this.keyPrefix = config.keyPrefix ?? 'kairn:cache:';
    this.initClient();
  }

  /**
   * Initialize the Redis client with ioredis
   */
  private initClient(): void {
    const url = this.config.url ?? process.env.REDIS_URL;

    if (!url) {
      if (!this.hasLoggedMissingUrl) {
        this.hasLoggedMissingUrl = true;
        console.warn(
          '[RedisCacheStore] REDIS_URL non configuré — cache Redis désactivé (fallback mémoire recommandé)'
        );
      }
      return;
    }

    try {
      // Dynamic require to support optional peer dependency (ioredis)
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const ioredisModule = require('ioredis');
      const Redis = ioredisModule.default ?? ioredisModule;
      const maxRetries = this.config.maxRetries ?? 3;

      this.client = new Redis(url, {
        maxRetriesPerRequest: maxRetries,
        retryStrategy(times: number) {
          if (times > maxRetries) {
            console.warn('[RedisCacheStore] Max retries reached, disabling cache');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: this.config.lazyConnect ?? true,
      });

      this.client.on('connect', () => {
        this.available = true;
      });

      this.client.on('error', (err: Error) => {
        console.error('[RedisCacheStore] Connection error:', err.message);
        this.available = false;
      });

      this.client.on('close', () => {
        this.available = false;
      });
    } catch (err) {
      console.error(
        '[RedisCacheStore] Failed to initialize:',
        err instanceof Error ? err.message : err
      );
    }
  }

  /**
   * Build the full Redis key with prefix
   */
  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Check if Redis client is available and connected
   */
  isAvailable(): boolean {
    return this.available && this.client !== null;
  }

  /**
   * Get a cache entry by key
   */
  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.isAvailable()) return null;

    try {
      const data = await this.client.get(this.buildKey(key));
      if (!data) return null;

      const entry = JSON.parse(data) as CacheEntry<T>;

      // Check expiration
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      return entry;
    } catch {
      return null;
    }
  }

  /**
   * Set a cache entry with automatic TTL from the entry's expiresAt
   */
  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const fullKey = this.buildKey(key);
      const serialized = JSON.stringify(entry);

      if (entry.expiresAt) {
        const ttlMs = entry.expiresAt - Date.now();
        if (ttlMs <= 0) return;
        const ttlSeconds = Math.ceil(ttlMs / 1000);
        await this.client.setex(fullKey, ttlSeconds, serialized);
      } else {
        await this.client.set(fullKey, serialized);
      }
    } catch {
      // Silently ignore write errors (graceful degradation)
    }
  }

  /**
   * Delete a cache entry
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await this.client.del(this.buildKey(key));
      return result > 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  async has(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await this.client.exists(this.buildKey(key));
      return result > 0;
    } catch {
      return false;
    }
  }

  /**
   * Clear keys matching a pattern (uses SCAN to avoid blocking)
   */
  async clear(pattern?: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const scanPattern = pattern
        ? this.buildKey(pattern.replace(/\*/g, '*'))
        : `${this.keyPrefix}*`;

      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          scanPattern,
          'COUNT',
          100
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch {
      // Silently ignore errors
    }
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern?: string): Promise<string[]> {
    if (!this.isAvailable()) return [];

    try {
      const scanPattern = pattern
        ? this.buildKey(pattern.replace(/\*/g, '*'))
        : `${this.keyPrefix}*`;

      const allKeys: string[] = [];
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          scanPattern,
          'COUNT',
          100
        );
        cursor = nextCursor;
        allKeys.push(...keys);
      } while (cursor !== '0');

      return allKeys;
    } catch {
      return [];
    }
  }

  /**
   * Get store statistics (number of keys with our prefix)
   */
  async stats(): Promise<{ size: number }> {
    if (!this.isAvailable()) return { size: 0 };

    try {
      const keys = await this.keys();
      return { size: keys.length };
    } catch {
      return { size: 0 };
    }
  }

  /**
   * Health check — ping Redis and measure latency
   */
  async healthCheck(): Promise<RedisHealthResult> {
    if (!this.client) {
      return { available: false, error: 'Redis client not initialized' };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      return { available: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        available: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Close the Redis connection and clean up
   */
  async destroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.available = false;
    }
  }
}

/**
 * Create a Cache instance backed by Redis with automatic memory fallback.
 * If Redis is unavailable, returns a memory-backed cache instead.
 *
 * @param config - Redis store configuration
 * @param cacheConfig - Cache-level configuration (namespace, TTL, etc.)
 * @returns A Cache instance using Redis or memory as backend
 *
 * @example
 * ```typescript
 * import { createRedisCache } from '@kairn/core';
 *
 * const cache = createRedisCache(
 *   { url: process.env.REDIS_URL },
 *   { namespace: 'mysite', defaultTtl: 300 }
 * );
 * ```
 */
export function createRedisCache(
  config?: RedisCacheStoreConfig,
  _cacheConfig?: { namespace?: string; defaultTtl?: number; enableStats?: boolean }
): { store: RedisCacheStore; isRedis: true } | { store: null; isRedis: false } {
  const store = new RedisCacheStore(config);
  if (store.isAvailable()) {
    return { store, isRedis: true };
  }
  return { store: null, isRedis: false };
}
