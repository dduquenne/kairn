/**
 * Tests for Analytics Server Context (DI module)
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  initAnalyticsServer,
  getAnalyticsContext,
  isAnalyticsServerInitialized,
  resetAnalyticsServer,
} from '../context';
import type { AnalyticsServerConfig, AnalyticsCacheProvider } from '../context';

/** Minimal mock PrismaClient for testing */
const mockPrisma = {} as AnalyticsServerConfig['prisma'];
const mockGetSiteId = async () => 'test-site-id';

describe('Analytics Server Context', () => {
  beforeEach(() => {
    resetAnalyticsServer();
  });

  describe('initAnalyticsServer', () => {
    it('should initialize without cache provider', () => {
      initAnalyticsServer({
        prisma: mockPrisma,
        getSiteId: mockGetSiteId,
      });

      expect(isAnalyticsServerInitialized()).toBe(true);
    });

    it('should initialize with cache provider', () => {
      initAnalyticsServer({
        prisma: mockPrisma,
        getSiteId: mockGetSiteId,
        cache: {
          getCached: async (_key, fn) => fn(),
          invalidateDashboard: async () => {},
          buildKey: prefix => prefix,
        },
      });

      expect(isAnalyticsServerInitialized()).toBe(true);
    });
  });

  describe('getAnalyticsContext', () => {
    it('should throw if not initialized', () => {
      expect(() => getAnalyticsContext()).toThrow('[Analytics] Server not initialized');
    });

    it('should return config with no-op cache fallback when no cache provided', () => {
      initAnalyticsServer({
        prisma: mockPrisma,
        getSiteId: mockGetSiteId,
      });

      const ctx = getAnalyticsContext();
      expect(ctx.prisma).toBe(mockPrisma);
      expect(ctx.getSiteId).toBe(mockGetSiteId);
      expect(ctx.cache).toBeDefined();
      expect(typeof ctx.cache.getCached).toBe('function');
      expect(typeof ctx.cache.invalidateDashboard).toBe('function');
      expect(typeof ctx.cache.buildKey).toBe('function');
    });

    it('should use provided cache when available', () => {
      const customCache: AnalyticsCacheProvider = {
        getCached: async <T>(_key: string, fn: () => Promise<T>) => fn(),
        invalidateDashboard: async () => {},
        buildKey: (prefix: string, _params: Record<string, string | number | undefined>) =>
          `custom:${prefix}`,
      };

      initAnalyticsServer({
        prisma: mockPrisma,
        getSiteId: mockGetSiteId,
        cache: customCache,
      });

      const ctx = getAnalyticsContext();
      expect(ctx.cache.buildKey('test', {})).toBe('custom:test');
    });

    it('no-op cache should execute functions directly', async () => {
      initAnalyticsServer({
        prisma: mockPrisma,
        getSiteId: mockGetSiteId,
      });

      const ctx = getAnalyticsContext();
      const result = await ctx.cache.getCached('key', async () => 42, 60);
      expect(result).toBe(42);
    });

    it('no-op cache buildKey should produce deterministic keys', () => {
      initAnalyticsServer({
        prisma: mockPrisma,
        getSiteId: mockGetSiteId,
      });

      const ctx = getAnalyticsContext();
      const key1 = ctx.cache.buildKey('prefix', { a: '1', b: '2' });
      const key2 = ctx.cache.buildKey('prefix', { b: '2', a: '1' });
      expect(key1).toBe(key2);
      expect(key1).toBe('prefix:a:1:b:2');
    });

    it('no-op cache buildKey should skip undefined values', () => {
      initAnalyticsServer({
        prisma: mockPrisma,
        getSiteId: mockGetSiteId,
      });

      const ctx = getAnalyticsContext();
      const key = ctx.cache.buildKey('prefix', {
        a: '1',
        b: undefined,
        c: '3',
      });
      expect(key).toBe('prefix:a:1:c:3');
    });
  });

  describe('isAnalyticsServerInitialized', () => {
    it('should return false before initialization', () => {
      expect(isAnalyticsServerInitialized()).toBe(false);
    });

    it('should return true after initialization', () => {
      initAnalyticsServer({
        prisma: mockPrisma,
        getSiteId: mockGetSiteId,
      });

      expect(isAnalyticsServerInitialized()).toBe(true);
    });
  });

  describe('resetAnalyticsServer', () => {
    it('should reset the server context', () => {
      initAnalyticsServer({
        prisma: mockPrisma,
        getSiteId: mockGetSiteId,
      });

      expect(isAnalyticsServerInitialized()).toBe(true);

      resetAnalyticsServer();

      expect(isAnalyticsServerInitialized()).toBe(false);
    });
  });
});
