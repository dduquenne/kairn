import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ApiCacheManager,
  buildCacheControlHeader,
  API_CACHE_PRESETS,
  type ApiCacheRequest,
  type ApiCacheResponse,
} from '../middleware/api-cache';
import { Cache, MemoryCacheStore } from '../cache';

describe('API Cache', () => {
  describe('buildCacheControlHeader', () => {
    it('should build no-store header', () => {
      const header = buildCacheControlHeader({ noStore: true });
      expect(header).toBe('no-store');
    });

    it('should build no-cache header', () => {
      const header = buildCacheControlHeader({ noCache: true });
      expect(header).toBe('no-cache');
    });

    it('should build public header with max-age', () => {
      const header = buildCacheControlHeader({
        public: true,
        maxAge: 300,
      });
      expect(header).toBe('public, max-age=300');
    });

    it('should build private header with max-age', () => {
      const header = buildCacheControlHeader({
        private: true,
        maxAge: 60,
      });
      expect(header).toBe('private, max-age=60');
    });

    it('should include s-maxage for CDN', () => {
      const header = buildCacheControlHeader({
        public: true,
        maxAge: 60,
        sMaxAge: 300,
      });
      expect(header).toBe('public, max-age=60, s-maxage=300');
    });

    it('should include stale-while-revalidate', () => {
      const header = buildCacheControlHeader({
        public: true,
        maxAge: 60,
        staleWhileRevalidate: 120,
      });
      expect(header).toBe('public, max-age=60, stale-while-revalidate=120');
    });

    it('should include stale-if-error', () => {
      const header = buildCacheControlHeader({
        public: true,
        maxAge: 60,
        staleIfError: 300,
      });
      expect(header).toBe('public, max-age=60, stale-if-error=300');
    });

    it('should include must-revalidate', () => {
      const header = buildCacheControlHeader({
        private: true,
        maxAge: 60,
        mustRevalidate: true,
      });
      expect(header).toBe('private, max-age=60, must-revalidate');
    });

    it('should include no-transform', () => {
      const header = buildCacheControlHeader({
        public: true,
        maxAge: 3600,
        noTransform: true,
      });
      expect(header).toBe('public, max-age=3600, no-transform');
    });

    it('should include immutable', () => {
      const header = buildCacheControlHeader({
        public: true,
        maxAge: 31536000,
        immutable: true,
      });
      expect(header).toBe('public, max-age=31536000, immutable');
    });

    it('should build complex header', () => {
      const header = buildCacheControlHeader({
        public: true,
        maxAge: 60,
        sMaxAge: 300,
        staleWhileRevalidate: 600,
        staleIfError: 86400,
      });
      expect(header).toBe(
        'public, max-age=60, s-maxage=300, stale-while-revalidate=600, stale-if-error=86400'
      );
    });
  });

  describe('ApiCacheManager', () => {
    let manager: ApiCacheManager;
    let store: MemoryCacheStore;
    let cache: Cache;

    beforeEach(() => {
      store = new MemoryCacheStore();
      cache = new Cache({
        store,
        namespace: 'api-test',
        enableStats: true,
      });
      manager = new ApiCacheManager(cache);
    });

    afterEach(() => {
      store.destroy();
    });

    it('should cache GET requests', async () => {
      const request: ApiCacheRequest = {
        method: 'GET',
        url: '/api/posts',
        headers: {},
      };

      const response: ApiCacheResponse = {
        status: 200,
        body: { posts: [{ id: 1, title: 'Test' }] },
      };

      // Set cache
      const etag = await manager.set(request, response);
      expect(etag).toBeTruthy();

      // Get from cache
      const result = await manager.get(request);
      expect(result.hit).toBe(true);
      expect(result.response?.body).toEqual(response.body);
      expect(result.etag).toBe(etag);
    });

    it('should not cache POST requests', async () => {
      const request: ApiCacheRequest = {
        method: 'POST',
        url: '/api/posts',
        headers: {},
      };

      const result = await manager.get(request);
      expect(result.hit).toBe(false);
    });

    it('should not cache non-success responses', async () => {
      const request: ApiCacheRequest = {
        method: 'GET',
        url: '/api/posts',
        headers: {},
      };

      const response: ApiCacheResponse = {
        status: 404,
        body: { error: 'Not found' },
      };

      await manager.set(request, response);
      const result = await manager.get(request);

      expect(result.hit).toBe(false);
    });

    it('should support conditional requests with If-None-Match', async () => {
      const request: ApiCacheRequest = {
        method: 'GET',
        url: '/api/posts',
        headers: {},
      };

      const response: ApiCacheResponse = {
        status: 200,
        body: { data: 'test' },
      };

      const etag = await manager.set(request, response);

      // Request with matching ETag
      const conditionalRequest: ApiCacheRequest = {
        ...request,
        headers: { 'if-none-match': etag },
      };

      const result = await manager.get(conditionalRequest);

      expect(result.hit).toBe(true);
      expect(result.response?.status).toBe(304);
      expect(result.response?.body).toBeNull();
    });

    it('should include query params in cache key when configured', async () => {
      const request1: ApiCacheRequest = {
        method: 'GET',
        url: '/api/posts',
        headers: {},
        query: { page: '1' },
      };

      const request2: ApiCacheRequest = {
        method: 'GET',
        url: '/api/posts',
        headers: {},
        query: { page: '2' },
      };

      const response: ApiCacheResponse = {
        status: 200,
        body: { data: 'page1' },
      };

      await manager.set(request1, response, { includeQueryParams: true });

      const result1 = await manager.get(request1, { includeQueryParams: true });
      const result2 = await manager.get(request2, { includeQueryParams: true });

      expect(result1.hit).toBe(true);
      expect(result2.hit).toBe(false);
    });

    it('should vary by user when configured', async () => {
      const request1: ApiCacheRequest = {
        method: 'GET',
        url: '/api/profile',
        headers: {},
        userId: 'user-1',
      };

      const request2: ApiCacheRequest = {
        method: 'GET',
        url: '/api/profile',
        headers: {},
        userId: 'user-2',
      };

      const response: ApiCacheResponse = {
        status: 200,
        body: { name: 'User 1' },
      };

      await manager.set(request1, response, { varyByUser: true });

      const result1 = await manager.get(request1, { varyByUser: true });
      const result2 = await manager.get(request2, { varyByUser: true });

      expect(result1.hit).toBe(true);
      expect(result2.hit).toBe(false);
    });

    it('should invalidate cache by tag', async () => {
      const request: ApiCacheRequest = {
        method: 'GET',
        url: '/api/posts/1',
        headers: {},
      };

      const response: ApiCacheResponse = {
        status: 200,
        body: { id: 1, title: 'Test' },
      };

      await manager.set(request, response, { tags: ['posts', 'post:1'] });

      // Verify cached
      let result = await manager.get(request);
      expect(result.hit).toBe(true);

      // Invalidate by tag
      await manager.invalidateByTag('posts');

      // Should be cache miss now
      result = await manager.get(request);
      expect(result.hit).toBe(false);
    });

    it('should invalidate cache by URL pattern', async () => {
      const request1: ApiCacheRequest = {
        method: 'GET',
        url: '/api/posts/1',
        headers: {},
      };

      const request2: ApiCacheRequest = {
        method: 'GET',
        url: '/api/users/1',
        headers: {},
      };

      const response: ApiCacheResponse = {
        status: 200,
        body: { data: 'test' },
      };

      await manager.set(request1, response);
      await manager.set(request2, response);

      // Invalidate posts
      await manager.invalidateByUrl('/api/posts');

      expect((await manager.get(request1)).hit).toBe(false);
      expect((await manager.get(request2)).hit).toBe(true);
    });

    it('should generate response headers', () => {
      const headers = manager.getResponseHeaders({
        ttl: 300,
        cacheControl: {
          public: true,
          maxAge: 300,
          staleWhileRevalidate: 60,
        },
        varyByUser: true,
        varyHeaders: ['Accept-Language'],
      });

      expect(headers['Cache-Control']).toBe('public, max-age=300, stale-while-revalidate=60');
      expect(headers['Vary']).toBe('Authorization, Accept-Language');
    });

    it('should generate ETag header', () => {
      const headers = manager.getResponseHeaders({}, '"abc123"');
      expect(headers['ETag']).toBe('"abc123"');
    });
  });

  describe('API_CACHE_PRESETS', () => {
    it('should have static preset', () => {
      expect(API_CACHE_PRESETS.static.ttl).toBe(86400);
      expect(API_CACHE_PRESETS.static.cacheControl?.public).toBe(true);
    });

    it('should have public preset', () => {
      expect(API_CACHE_PRESETS.public.ttl).toBe(1800);
      expect(API_CACHE_PRESETS.public.cacheControl?.public).toBe(true);
    });

    it('should have private preset', () => {
      expect(API_CACHE_PRESETS.private.varyByUser).toBe(true);
      expect(API_CACHE_PRESETS.private.cacheControl?.private).toBe(true);
    });

    it('should have dynamic preset', () => {
      expect(API_CACHE_PRESETS.dynamic.ttl).toBe(60);
    });

    it('should have none preset', () => {
      expect(API_CACHE_PRESETS.none.cacheControl?.noStore).toBe(true);
      expect(API_CACHE_PRESETS.none.shouldCache?.({ status: 200, body: {} })).toBe(false);
    });
  });
});
