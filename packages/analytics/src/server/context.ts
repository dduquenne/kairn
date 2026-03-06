/**
 * Analytics Server Context
 *
 * Provides dependency injection for the analytics server module.
 * Each app initializes the context with its own Prisma client,
 * site ID resolver, and optional cache provider.
 */

import type { PrismaClient } from '@prisma/client';

/**
 * Cache provider interface for analytics server operations.
 * When not provided, functions execute without caching.
 */
export interface AnalyticsCacheProvider {
  /** Retrieve from cache or compute and store */
  getCached: <T>(key: string, fn: () => Promise<T>, ttl: number) => Promise<T>;
  /** Invalidate dashboard-related cache entries */
  invalidateDashboard: () => Promise<void>;
  /** Build a deterministic cache key from prefix and params */
  buildKey: (prefix: string, params: Record<string, string | number | undefined>) => string;
}

/**
 * Configuration for the analytics server module.
 */
export interface AnalyticsServerConfig {
  /** Prisma client instance (must have analytics models generated) */
  prisma: PrismaClient;
  /** Resolves the current site ID for multi-tenant isolation */
  getSiteId: () => Promise<string>;
  /** Optional cache provider (Redis, in-memory, etc.) */
  cache?: AnalyticsCacheProvider;
}

/** Default no-op cache provider — executes functions directly */
const NO_CACHE_PROVIDER: AnalyticsCacheProvider = {
  getCached: async (_key, fn) => fn(),
  invalidateDashboard: async () => {},
  buildKey: (prefix, params) => {
    const parts = [prefix];
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      const value = params[key];
      if (value !== undefined) {
        parts.push(`${key}:${value}`);
      }
    }
    return parts.join(':');
  },
};

let serverConfig: AnalyticsServerConfig | null = null;

/**
 * Initialize the analytics server module.
 * Must be called before any server-side analytics operations.
 */
export function initAnalyticsServer(config: AnalyticsServerConfig): void {
  serverConfig = config;
}

/**
 * Get the current analytics server configuration.
 * @throws if initAnalyticsServer() was not called
 */
export function getAnalyticsContext(): AnalyticsServerConfig & {
  cache: AnalyticsCacheProvider;
} {
  if (!serverConfig) {
    throw new Error('[Analytics] Server not initialized. Call initAnalyticsServer() first.');
  }
  return {
    ...serverConfig,
    cache: serverConfig.cache ?? NO_CACHE_PROVIDER,
  };
}

/**
 * Check if the analytics server has been initialized.
 */
export function isAnalyticsServerInitialized(): boolean {
  return serverConfig !== null;
}

/**
 * Reset the analytics server configuration (for tests).
 */
export function resetAnalyticsServer(): void {
  serverConfig = null;
}
