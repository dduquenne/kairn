/**
 * Redis Client & Cache Utilities
 * Phase 4: Scalability & Performance
 *
 * Provides Redis connection and caching utilities for analytics data.
 * Falls back gracefully when Redis is not available.
 */

import Redis from 'ioredis';

// Flag to log missing REDIS_URL only once per cold start
let hasLoggedMissingUrl = false;

// Cache key prefixes
export const CACHE_KEYS = {
  DASHBOARD: 'analytics:dashboard',
  SUMMARY: 'analytics:summary',
  HEATMAP: 'analytics:heatmap',
  TRAFFIC_SOURCES: 'analytics:traffic-sources',
  DEVICE_BREAKDOWN: 'analytics:device-breakdown',
  VISITS_BY_PERIOD: 'analytics:visits-by-period',
  COHORTS: 'analytics:cohorts',
  ATTRIBUTION: 'analytics:attribution',
  GOALS: 'analytics:goals',
  FUNNELS: 'analytics:funnels',
  ALERTS: 'analytics:alerts',
  ANOMALIES: 'analytics:anomalies',
  INSIGHTS: 'analytics:insights',
  DAILY_SUMMARY: 'analytics:daily-summary',
} as const;

// Default TTL values in seconds
export const CACHE_TTL = {
  SHORT: 60, // 1 minute - for rapidly changing data
  MEDIUM: 300, // 5 minutes - for dashboard data
  LONG: 3600, // 1 hour - for aggregated data
  DAILY: 86400, // 24 hours - for historical data
} as const;

// Redis client singleton
let redisClient: Redis | null = null;
let isRedisAvailable = false;

/**
 * Initialize Redis client with connection handling.
 * Returns null when REDIS_URL is not configured (graceful degradation).
 */
function createRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    if (!hasLoggedMissingUrl) {
      hasLoggedMissingUrl = true;
      console.info('[Redis] REDIS_URL non configuré — cache désactivé (fallback mémoire actif)');
    }
    return null;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) {
          console.warn('[Redis] Max retries reached, disabling cache');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    client.on('connect', () => {
      console.log('[Redis] Connected successfully');
      isRedisAvailable = true;
    });

    client.on('error', (err: Error) => {
      console.error('[Redis] Connection error:', err.message);
      isRedisAvailable = false;
    });

    client.on('close', () => {
      console.warn('[Redis] Connection closed');
      isRedisAvailable = false;
    });

    return client;
  } catch (error) {
    console.error('[Redis] Failed to create client:', error);
    return null;
  }
}

/**
 * Get Redis client instance (lazy initialization)
 */
export function getRedisClient(): Redis | null {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

/**
 * Check if Redis is available and connected
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient !== null;
}

/**
 * Get cached data with automatic JSON parsing
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client || !isRedisAvailable) {
    return null;
  }

  try {
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    return null;
  } catch (error) {
    console.error(`[Redis] Error getting cache key "${key}":`, error);
    return null;
  }
}

/**
 * Set cache with automatic JSON serialization
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !isRedisAvailable) {
    return false;
  }

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`[Redis] Error setting cache key "${key}":`, error);
    return false;
  }
}

/**
 * Get cached data or fetch from source if not cached.
 * This is the main caching utility.
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache (don't await - fire and forget)
  setCache(key, data, ttlSeconds).catch(() => {
    // Silently ignore cache write errors
  });

  return data;
}

/**
 * Delete a specific cache key
 */
export async function deleteCache(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !isRedisAvailable) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`[Redis] Error deleting cache key "${key}":`, error);
    return false;
  }
}

/**
 * Invalidate all cache keys matching a pattern
 */
export async function invalidateCache(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client || !isRedisAvailable) {
    return 0;
  }

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return keys.length;
  } catch (error) {
    console.error(`[Redis] Error invalidating cache pattern "${pattern}":`, error);
    return 0;
  }
}

/**
 * Invalidate all analytics cache
 */
export async function invalidateAllAnalyticsCache(): Promise<void> {
  await invalidateCache('analytics:*');
}

/**
 * Invalidate dashboard cache (called after new data is tracked)
 */
export async function invalidateDashboardCache(): Promise<void> {
  const patterns = [
    `${CACHE_KEYS.DASHBOARD}:*`,
    `${CACHE_KEYS.SUMMARY}:*`,
    `${CACHE_KEYS.VISITS_BY_PERIOD}:*`,
  ];

  for (const pattern of patterns) {
    await invalidateCache(pattern);
  }
}

/**
 * Generate cache key with time range parameters
 */
export function buildCacheKey(
  prefix: string,
  params: Record<string, string | number | undefined>
): string {
  const parts = [prefix];

  // Sort keys for consistent cache key generation
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    const value = params[key];
    if (value !== undefined) {
      parts.push(`${key}:${value}`);
    }
  }

  return parts.join(':');
}

/**
 * Cleanup and close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisAvailable = false;
  }
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<{
  available: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const client = getRedisClient();

  if (!client) {
    return { available: false, error: 'Redis client not initialized' };
  }

  try {
    const start = Date.now();
    await client.ping();
    const latencyMs = Date.now() - start;

    return { available: true, latencyMs };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
