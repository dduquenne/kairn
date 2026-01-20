import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  Cache,
  MemoryCacheStore,
  createMemoryCache,
  cacheKeys,
  CACHE_TTL,
  type CacheEntry,
} from '../cache';

describe('Cache System', () => {
  describe('MemoryCacheStore', () => {
    let store: MemoryCacheStore;

    beforeEach(() => {
      store = new MemoryCacheStore(60000); // 1 minute cleanup
    });

    afterEach(() => {
      store.destroy();
    });

    it('should store and retrieve a value', async () => {
      const entry: CacheEntry<string> = {
        value: 'test-value',
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
        tags: [],
      };

      await store.set('test-key', entry);
      const retrieved = await store.get<string>('test-key');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.value).toBe('test-value');
    });

    it('should return null for non-existent key', async () => {
      const result = await store.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return null for expired entry', async () => {
      const entry: CacheEntry<string> = {
        value: 'test-value',
        createdAt: Date.now() - 10000,
        expiresAt: Date.now() - 5000, // Expired 5 seconds ago
        tags: [],
      };

      await store.set('expired-key', entry);
      const result = await store.get<string>('expired-key');

      expect(result).toBeNull();
    });

    it('should delete a key', async () => {
      const entry: CacheEntry<string> = {
        value: 'test-value',
        createdAt: Date.now(),
        expiresAt: null,
        tags: [],
      };

      await store.set('to-delete', entry);
      const deleted = await store.delete('to-delete');

      expect(deleted).toBe(true);
      expect(await store.get('to-delete')).toBeNull();
    });

    it('should check if key exists', async () => {
      const entry: CacheEntry<string> = {
        value: 'test-value',
        createdAt: Date.now(),
        expiresAt: null,
        tags: [],
      };

      await store.set('exists', entry);

      expect(await store.has('exists')).toBe(true);
      expect(await store.has('does-not-exist')).toBe(false);
    });

    it('should clear all keys', async () => {
      const entry: CacheEntry<string> = {
        value: 'test-value',
        createdAt: Date.now(),
        expiresAt: null,
        tags: [],
      };

      await store.set('key1', entry);
      await store.set('key2', entry);

      await store.clear();

      expect(await store.get('key1')).toBeNull();
      expect(await store.get('key2')).toBeNull();
    });

    it('should clear keys by pattern', async () => {
      const entry: CacheEntry<string> = {
        value: 'test-value',
        createdAt: Date.now(),
        expiresAt: null,
        tags: [],
      };

      await store.set('user:1:data', entry);
      await store.set('user:2:data', entry);
      await store.set('post:1:data', entry);

      await store.clear('user:*');

      expect(await store.get('user:1:data')).toBeNull();
      expect(await store.get('user:2:data')).toBeNull();
      expect(await store.get('post:1:data')).not.toBeNull();
    });

    it('should list keys by pattern', async () => {
      const entry: CacheEntry<string> = {
        value: 'test-value',
        createdAt: Date.now(),
        expiresAt: null,
        tags: [],
      };

      await store.set('user:1:data', entry);
      await store.set('user:2:data', entry);
      await store.set('post:1:data', entry);

      const userKeys = await store.keys('user:*');

      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain('user:1:data');
      expect(userKeys).toContain('user:2:data');
    });

    it('should return stats', async () => {
      const entry: CacheEntry<string> = {
        value: 'test-value',
        createdAt: Date.now(),
        expiresAt: null,
        tags: [],
      };

      await store.set('key1', entry);
      await store.set('key2', entry);

      const stats = await store.stats();

      expect(stats.size).toBe(2);
    });
  });

  describe('Cache', () => {
    let cache: Cache;
    let store: MemoryCacheStore;

    beforeEach(() => {
      store = new MemoryCacheStore();
      cache = new Cache({
        store,
        defaultTtl: 300,
        namespace: 'test',
        enableStats: true,
      });
    });

    afterEach(() => {
      store.destroy();
    });

    it('should get and set values', async () => {
      await cache.set('key', 'value');
      const result = await cache.get<string>('key');

      expect(result).toBe('value');
    });

    it('should apply namespace to keys', async () => {
      await cache.set('key', 'value');

      // Internal key should have namespace
      const internalKey = await store.keys('test:*');
      expect(internalKey).toContain('test:key');
    });

    it('should respect TTL', async () => {
      await cache.set('short-lived', 'value', { ttl: 1 });

      // Value should exist immediately
      expect(await cache.get('short-lived')).toBe('value');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Value should be gone
      expect(await cache.get('short-lived')).toBeNull();
    });

    it('should use getOrSet pattern', async () => {
      const factory = vi.fn().mockResolvedValue('generated-value');

      // First call should invoke factory
      const result1 = await cache.getOrSet('cached-key', factory);
      expect(result1).toBe('generated-value');
      expect(factory).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await cache.getOrSet('cached-key', factory);
      expect(result2).toBe('generated-value');
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should delete keys', async () => {
      await cache.set('to-delete', 'value');
      expect(await cache.get('to-delete')).toBe('value');

      await cache.delete('to-delete');
      expect(await cache.get('to-delete')).toBeNull();
    });

    it('should check if key exists', async () => {
      await cache.set('exists', 'value');

      expect(await cache.has('exists')).toBe(true);
      expect(await cache.has('does-not-exist')).toBe(false);
    });

    it('should invalidate by tag', async () => {
      await cache.set('post:1', 'data1', { tags: ['posts', 'user:1'] });
      await cache.set('post:2', 'data2', { tags: ['posts', 'user:2'] });
      await cache.set('comment:1', 'data3', { tags: ['comments', 'user:1'] });

      const count = await cache.invalidateByTag('user:1');

      expect(count).toBe(2);
      expect(await cache.get('post:1')).toBeNull();
      expect(await cache.get('post:2')).toBe('data2');
      expect(await cache.get('comment:1')).toBeNull();
    });

    it('should invalidate by pattern', async () => {
      await cache.set('post:1', 'data1');
      await cache.set('post:2', 'data2');
      await cache.set('comment:1', 'data3');

      await cache.invalidateByPattern('post:*');

      expect(await cache.get('post:1')).toBeNull();
      expect(await cache.get('post:2')).toBeNull();
      expect(await cache.get('comment:1')).toBe('data3');
    });

    it('should clear all cache', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      await cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
    });

    it('should track statistics', async () => {
      await cache.set('hit-key', 'value');

      await cache.get('hit-key'); // hit
      await cache.get('hit-key'); // hit
      await cache.get('miss-key'); // miss

      const stats = await cache.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });

    it('should reset statistics', async () => {
      await cache.set('key', 'value');
      await cache.get('key');
      await cache.get('missing');

      cache.resetStats();
      const stats = await cache.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should wrap functions with caching', async () => {
      const expensiveFunction = vi.fn().mockImplementation(async (id: number) => {
        return { id, data: 'expensive-result' };
      });

      const cachedFunction = cache.wrap(expensiveFunction, (id) => `expensive:${id}`, {
        ttl: 60,
      });

      // First call
      const result1 = await cachedFunction(123);
      expect(result1).toEqual({ id: 123, data: 'expensive-result' });
      expect(expensiveFunction).toHaveBeenCalledTimes(1);

      // Second call (cached)
      const result2 = await cachedFunction(123);
      expect(result2).toEqual({ id: 123, data: 'expensive-result' });
      expect(expensiveFunction).toHaveBeenCalledTimes(1);

      // Different argument
      const result3 = await cachedFunction(456);
      expect(result3).toEqual({ id: 456, data: 'expensive-result' });
      expect(expensiveFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('createMemoryCache', () => {
    it('should create a cache with default settings', () => {
      const cache = createMemoryCache();
      expect(cache).toBeInstanceOf(Cache);
    });

    it('should accept custom configuration', async () => {
      const cache = createMemoryCache({
        namespace: 'custom',
        defaultTtl: 60,
      });

      await cache.set('key', 'value');
      const result = await cache.get('key');

      expect(result).toBe('value');
    });
  });

  describe('cacheKeys', () => {
    it('should build entity key', () => {
      expect(cacheKeys.entity('user', 123)).toBe('user:123');
      expect(cacheKeys.entity('post', 'abc')).toBe('post:abc');
    });

    it('should build list key without params', () => {
      expect(cacheKeys.list('posts')).toBe('posts:list');
    });

    it('should build list key with params', () => {
      const key = cacheKeys.list('posts', { page: 1, limit: 10 });
      expect(key).toBe('posts:list:limit=10&page=1');
    });

    it('should build user-specific key', () => {
      expect(cacheKeys.user('user-123', 'preferences')).toBe('user:user-123:preferences');
    });

    it('should build site-specific key', () => {
      expect(cacheKeys.site('site-456', 'config')).toBe('site:site-456:config');
    });
  });

  describe('CACHE_TTL', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.SHORT).toBe(60);
      expect(CACHE_TTL.MEDIUM).toBe(300);
      expect(CACHE_TTL.LONG).toBe(1800);
      expect(CACHE_TTL.HOUR).toBe(3600);
      expect(CACHE_TTL.DAY).toBe(86400);
      expect(CACHE_TTL.FOREVER).toBe(0);
    });
  });
});
