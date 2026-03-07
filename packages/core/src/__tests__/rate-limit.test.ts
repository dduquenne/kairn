import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createRateLimiter,
  createSiteKeyGenerator,
  MemoryRateLimitStore,
  RATE_LIMIT_PRESETS,
  rateLimiters,
  checkMultipleRateLimits,
  type RateLimitRequest,
} from '../middleware/rate-limit';
import { RateLimitError } from '../errors';

describe('Rate Limiting', () => {
  describe('MemoryRateLimitStore', () => {
    let store: MemoryRateLimitStore;

    beforeEach(() => {
      store = new MemoryRateLimitStore(60000);
    });

    it('should store and retrieve entries', async () => {
      const entry = { timestamps: [Date.now()], lastAccess: Date.now() };

      await store.set('test-key', entry);
      const retrieved = await store.get('test-key');

      expect(retrieved).toEqual(entry);
    });

    it('should return undefined for missing keys', async () => {
      const result = await store.get('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should delete entries', async () => {
      await store.set('test-key', { timestamps: [], lastAccess: Date.now() });
      await store.delete('test-key');

      const result = await store.get('test-key');
      expect(result).toBeUndefined();
    });

    it('should track store size', async () => {
      expect(store.size()).toBe(0);

      await store.set('key1', { timestamps: [], lastAccess: Date.now() });
      await store.set('key2', { timestamps: [], lastAccess: Date.now() });

      expect(store.size()).toBe(2);
    });

    it('should clean up on destroy', () => {
      store.destroy();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('createRateLimiter', () => {
    let store: MemoryRateLimitStore;

    beforeEach(() => {
      store = new MemoryRateLimitStore();
    });

    const createRequest = (ip: string = '127.0.0.1'): RateLimitRequest => ({
      ip,
      headers: {
        get: (name: string) => (name === 'x-forwarded-for' ? null : null),
      },
      url: '/api/test',
      method: 'GET',
    });

    it('should allow requests under the limit', async () => {
      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60000 }, store);
      const request = createRequest();

      const info = await limiter.checkRateLimit(request);

      expect(info.limit).toBe(5);
      expect(info.remaining).toBe(4); // 5 - 1 (this request)
    });

    it('should track multiple requests', async () => {
      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60000 }, store);
      const request = createRequest();

      await limiter.checkRateLimit(request);
      await limiter.checkRateLimit(request);
      const info = await limiter.checkRateLimit(request);

      expect(info.remaining).toBe(2); // 5 - 3
    });

    it('should throw RateLimitError when limit exceeded', async () => {
      const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60000 }, store);
      const request = createRequest();

      await limiter.checkRateLimit(request);
      await limiter.checkRateLimit(request);

      await expect(limiter.checkRateLimit(request)).rejects.toThrow(RateLimitError);
    });

    it('should include retryAfter in error', async () => {
      const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60000 }, store);
      const request = createRequest();

      await limiter.checkRateLimit(request);

      try {
        await limiter.checkRateLimit(request);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBeGreaterThan(0);
      }
    });

    it('should use x-forwarded-for header for key', async () => {
      const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60000 }, store);

      const request1: RateLimitRequest = {
        ip: '127.0.0.1',
        headers: {
          get: (name: string) => (name === 'x-forwarded-for' ? '1.2.3.4' : null),
        },
      };

      const request2: RateLimitRequest = {
        ip: '127.0.0.1',
        headers: {
          get: (name: string) => (name === 'x-forwarded-for' ? '5.6.7.8' : null),
        },
      };

      // Different IPs should have separate limits
      await limiter.checkRateLimit(request1);
      await limiter.checkRateLimit(request1);

      // This should succeed (different IP)
      const info = await limiter.checkRateLimit(request2);
      expect(info.remaining).toBe(1);
    });

    it('should skip rate limiting when configured', async () => {
      const limiter = createRateLimiter(
        {
          maxRequests: 1,
          windowMs: 60000,
          skip: req => req.url === '/api/health',
        },
        store
      );

      const request: RateLimitRequest = {
        ip: '127.0.0.1',
        url: '/api/health',
        headers: { get: () => null },
      };

      // Should not count against limit
      await limiter.checkRateLimit(request);
      await limiter.checkRateLimit(request);
      await limiter.checkRateLimit(request);

      const info = await limiter.checkRateLimit(request);
      expect(info.remaining).toBe(1); // Always returns max
    });

    it('should call onLimitReached callback', async () => {
      const onLimitReached = vi.fn();
      const limiter = createRateLimiter(
        {
          maxRequests: 1,
          windowMs: 60000,
          onLimitReached,
        },
        store
      );

      const request = createRequest();

      await limiter.checkRateLimit(request);

      try {
        await limiter.checkRateLimit(request);
      } catch {
        // Expected
      }

      expect(onLimitReached).toHaveBeenCalledOnce();
    });

    it('should reset rate limit', async () => {
      const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60000 }, store);
      const request = createRequest();

      await limiter.checkRateLimit(request);
      await limiter.checkRateLimit(request);

      // Should throw
      await expect(limiter.checkRateLimit(request)).rejects.toThrow();

      // Reset
      await limiter.resetRateLimit(request);

      // Should succeed again
      const info = await limiter.checkRateLimit(request);
      expect(info.remaining).toBe(1);
    });

    it('should generate rate limit headers', async () => {
      const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60000 }, store);
      const request = createRequest();

      const info = await limiter.checkRateLimit(request);
      const headers = limiter.getRateLimitHeaders(info);

      expect(headers).toHaveProperty('X-RateLimit-Limit', '10');
      expect(headers).toHaveProperty('X-RateLimit-Remaining');
      expect(headers).toHaveProperty('X-RateLimit-Reset');
    });
  });

  describe('RATE_LIMIT_PRESETS', () => {
    it('should have strict preset', () => {
      expect(RATE_LIMIT_PRESETS.strict.maxRequests).toBe(5);
      expect(RATE_LIMIT_PRESETS.strict.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have standard preset', () => {
      expect(RATE_LIMIT_PRESETS.standard.maxRequests).toBe(100);
    });

    it('should have relaxed preset', () => {
      expect(RATE_LIMIT_PRESETS.relaxed.maxRequests).toBe(1000);
    });

    it('should have contact preset', () => {
      expect(RATE_LIMIT_PRESETS.contact.maxRequests).toBe(10);
      expect(RATE_LIMIT_PRESETS.contact.windowMs).toBe(60 * 60 * 1000);
    });
  });

  describe('Pre-configured limiters', () => {
    it('should have auth limiter', () => {
      expect(rateLimiters.auth).toBeDefined();
      expect(rateLimiters.auth.checkRateLimit).toBeInstanceOf(Function);
    });

    it('should have api limiter', () => {
      expect(rateLimiters.api).toBeDefined();
    });

    it('should have public limiter', () => {
      expect(rateLimiters.public).toBeDefined();
    });

    it('should have contact limiter', () => {
      expect(rateLimiters.contact).toBeDefined();
    });
  });

  describe('createSiteKeyGenerator', () => {
    it('should prefix keys with siteId', () => {
      const keyGen = createSiteKeyGenerator('psypnos');
      const request: RateLimitRequest = {
        ip: '192.168.1.1',
        headers: { get: () => null },
      };

      const key = keyGen(request);
      expect(key).toBe('site:psypnos:192.168.1.1');
    });

    it('should use custom base generator', () => {
      const keyGen = createSiteKeyGenerator('unanima', () => 'custom-key');
      const request: RateLimitRequest = {
        ip: '192.168.1.1',
        headers: { get: () => null },
      };

      const key = keyGen(request);
      expect(key).toBe('site:unanima:custom-key');
    });
  });

  describe('siteId rate limit isolation', () => {
    it('should isolate rate limits by siteId', async () => {
      const store = new MemoryRateLimitStore();
      const limiterSiteA = createRateLimiter(
        { maxRequests: 2, windowMs: 60000, siteId: 'site-a' },
        store
      );
      const limiterSiteB = createRateLimiter(
        { maxRequests: 2, windowMs: 60000, siteId: 'site-b' },
        store
      );

      const request: RateLimitRequest = {
        ip: '127.0.0.1',
        headers: { get: () => null },
      };

      // Exhaust site A's limit
      await limiterSiteA.checkRateLimit(request);
      await limiterSiteA.checkRateLimit(request);
      await expect(limiterSiteA.checkRateLimit(request)).rejects.toThrow();

      // Site B should still have capacity
      const info = await limiterSiteB.checkRateLimit(request);
      expect(info.remaining).toBe(1);
    });

    it('should use default key generator when no siteId', async () => {
      const store = new MemoryRateLimitStore();
      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60000 }, store);

      const request: RateLimitRequest = {
        ip: '10.0.0.1',
        headers: { get: () => null },
      };

      const info = await limiter.checkRateLimit(request);
      expect(info.limit).toBe(5);
      expect(info.remaining).toBe(4);
    });
  });

  describe('checkMultipleRateLimits', () => {
    it('should check multiple limiters', async () => {
      const store1 = new MemoryRateLimitStore();
      const store2 = new MemoryRateLimitStore();

      const limiter1 = createRateLimiter({ maxRequests: 10, windowMs: 60000 }, store1);
      const limiter2 = createRateLimiter({ maxRequests: 5, windowMs: 60000 }, store2);

      const request: RateLimitRequest = {
        ip: '127.0.0.1',
        headers: { get: () => null },
      };

      const results = await checkMultipleRateLimits(request, [limiter1, limiter2]);

      expect(results).toHaveLength(2);
      expect(results[0]?.limit).toBe(10);
      expect(results[1]?.limit).toBe(5);
    });

    it('should fail fast on first exceeded limit', async () => {
      const store1 = new MemoryRateLimitStore();
      const store2 = new MemoryRateLimitStore();

      const limiter1 = createRateLimiter({ maxRequests: 1, windowMs: 60000 }, store1);
      const limiter2 = createRateLimiter({ maxRequests: 10, windowMs: 60000 }, store2);

      const request: RateLimitRequest = {
        ip: '127.0.0.1',
        headers: { get: () => null },
      };

      // Exhaust first limiter
      await limiter1.checkRateLimit(request);

      // Should throw on first limiter
      await expect(checkMultipleRateLimits(request, [limiter1, limiter2])).rejects.toThrow(
        RateLimitError
      );
    });
  });
});
