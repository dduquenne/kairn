/**
 * Analytics Server Initialization for Appréciez Votre Vie
 *
 * Configures the @kairn/analytics server module with the Appréciez Votre Vie-specific
 * Prisma client, site ID resolver, and Redis cache provider.
 *
 * Import this module (side-effect) before using any analytics server function.
 */

import { initAnalyticsServer, isAnalyticsServerInitialized } from '@kairn/analytics/server';
import type { AnalyticsCacheProvider } from '@kairn/analytics/server';

import { getCached, invalidateDashboardCache, buildCacheKey } from '@/lib/cache/redis';
import prisma from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

/** Redis-backed cache provider for the analytics module */
const redisCacheProvider: AnalyticsCacheProvider = {
  getCached,
  invalidateDashboard: invalidateDashboardCache,
  buildKey: buildCacheKey,
};

/**
 * Ensure the analytics server is initialized.
 * Safe to call multiple times — only initializes once.
 */
export function ensureAnalyticsServerInit(): void {
  if (isAnalyticsServerInitialized()) {
    return;
  }

  initAnalyticsServer({
    prisma,
    getSiteId,
    cache: redisCacheProvider,
  });
}

// Auto-initialize on import (side-effect)
ensureAnalyticsServerInit();
