import { describe, it, expect, afterEach } from 'vitest';

import type { CacheEntry } from '../cache';

/**
 * Tests for RedisCacheStore
 *
 * Tests the graceful degradation behavior (no Redis connection)
 * and interface compliance. Integration tests with a real Redis
 * instance would be done separately.
 */
describe('RedisCacheStore', () => {
  const originalEnv = process.env.REDIS_URL;

  afterEach(() => {
    process.env.REDIS_URL = originalEnv;
  });

  describe('graceful degradation without Redis', () => {
    it('should handle missing REDIS_URL gracefully', async () => {
      delete process.env.REDIS_URL;
      const { RedisCacheStore } = await import('../cache/redis-store');
      const store = new RedisCacheStore({ url: undefined });

      expect(store.isAvailable()).toBe(false);
      expect(await store.get('key')).toBeNull();
      expect(await store.has('key')).toBe(false);
      expect(await store.delete('key')).toBe(false);
      expect(await store.keys()).toEqual([]);
      expect(await store.stats()).toEqual({ size: 0 });
    });

    it('should return health check failure without Redis', async () => {
      delete process.env.REDIS_URL;
      const { RedisCacheStore } = await import('../cache/redis-store');
      const store = new RedisCacheStore({ url: undefined });
      const health = await store.healthCheck();

      expect(health.available).toBe(false);
      expect(health.error).toBe('Redis client not initialized');
    });

    it('should handle set gracefully when unavailable', async () => {
      delete process.env.REDIS_URL;
      const { RedisCacheStore } = await import('../cache/redis-store');
      const store = new RedisCacheStore({ url: undefined });

      const entry: CacheEntry<string> = {
        value: 'test',
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
        tags: [],
      };

      // Should not throw
      await store.set('key', entry);
    });

    it('should handle clear gracefully when unavailable', async () => {
      delete process.env.REDIS_URL;
      const { RedisCacheStore } = await import('../cache/redis-store');
      const store = new RedisCacheStore({ url: undefined });

      await store.clear();
      await store.clear('pattern*');
    });

    it('should handle destroy gracefully when unavailable', async () => {
      delete process.env.REDIS_URL;
      const { RedisCacheStore } = await import('../cache/redis-store');
      const store = new RedisCacheStore({ url: undefined });

      await store.destroy();
      expect(store.isAvailable()).toBe(false);
    });
  });

  describe('createRedisCache', () => {
    it('should return isRedis false when Redis unavailable', async () => {
      delete process.env.REDIS_URL;
      const { createRedisCache } = await import('../cache/redis-store');
      const result = createRedisCache({ url: undefined });

      expect(result.isRedis).toBe(false);
      expect(result.store).toBeNull();
    });
  });

  describe('CacheStore interface compliance', () => {
    it('should implement all CacheStore methods', async () => {
      delete process.env.REDIS_URL;
      const { RedisCacheStore } = await import('../cache/redis-store');
      const store = new RedisCacheStore({ url: undefined });

      expect(typeof store.get).toBe('function');
      expect(typeof store.set).toBe('function');
      expect(typeof store.delete).toBe('function');
      expect(typeof store.has).toBe('function');
      expect(typeof store.clear).toBe('function');
      expect(typeof store.keys).toBe('function');
      expect(typeof store.stats).toBe('function');
      expect(typeof store.isAvailable).toBe('function');
      expect(typeof store.healthCheck).toBe('function');
      expect(typeof store.destroy).toBe('function');
    });
  });

  describe('configuration', () => {
    it('should accept all config options', async () => {
      delete process.env.REDIS_URL;
      const { RedisCacheStore } = await import('../cache/redis-store');

      const store = new RedisCacheStore({
        url: undefined,
        keyPrefix: 'custom:',
        maxRetries: 5,
        lazyConnect: false,
      });

      expect(store.isAvailable()).toBe(false);
    });

    it('should use defaults when config is empty', async () => {
      delete process.env.REDIS_URL;
      const { RedisCacheStore } = await import('../cache/redis-store');
      const store = new RedisCacheStore();

      expect(store.isAvailable()).toBe(false);
    });
  });
});
