/**
 * Rate Limiting Middleware
 *
 * Implements a sliding window rate limiter to protect against
 * brute force attacks and API abuse.
 */

import { RateLimitError } from '../errors';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Time window in milliseconds (default: 15 minutes) */
  windowMs: number;
  /** Maximum requests per window (default: 100) */
  maxRequests: number;
  /** Site identifier for multi-tenant isolation */
  siteId?: string;
  /** Function to generate a unique key for the client */
  keyGenerator?: (request: RateLimitRequest) => string;
  /** Skip rate limiting for certain requests */
  skip?: (request: RateLimitRequest) => boolean;
  /** Custom handler when rate limit is exceeded */
  onLimitReached?: (request: RateLimitRequest, info: RateLimitInfo) => void;
}

/**
 * Minimal request interface for rate limiting
 */
export interface RateLimitRequest {
  ip?: string;
  headers?: {
    get(name: string): string | null;
  };
  url?: string;
  method?: string;
}

/**
 * Rate limit information for a client
 */
export interface RateLimitInfo {
  /** Total requests allowed in window */
  limit: number;
  /** Remaining requests in current window */
  remaining: number;
  /** Unix timestamp when the rate limit resets */
  resetTime: number;
  /** Seconds until rate limit resets */
  retryAfter: number;
}

/**
 * Entry in the rate limit store
 */
interface RateLimitEntry {
  /** Request timestamps within the current window */
  timestamps: number[];
  /** When this entry was last accessed */
  lastAccess: number;
}

/**
 * Rate limit store interface for pluggable backends
 */
export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | undefined>;
  set(key: string, entry: RateLimitEntry): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * In-memory rate limit store (for single-instance deployments)
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(cleanupIntervalMs: number = 60000) {
    // Periodically clean up expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  async get(key: string): Promise<RateLimitEntry | undefined> {
    return this.store.get(key);
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Remove entries older than the max window time
   */
  private cleanup(maxAge: number = 3600000): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.lastAccess > maxAge) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get current store size (for monitoring)
   */
  size(): number {
    return this.store.size;
  }
}

// Default store instance
let defaultStore: MemoryRateLimitStore | null = null;

function getDefaultStore(): MemoryRateLimitStore {
  if (!defaultStore) {
    defaultStore = new MemoryRateLimitStore();
  }
  return defaultStore;
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(request: RateLimitRequest): string {
  // Try common headers for proxied requests
  const forwardedFor = request.headers?.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = request.headers?.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return request.ip || 'unknown';
}

/**
 * Create a key generator that prepends siteId for multi-tenant isolation
 *
 * @param siteId - Site identifier for tenant isolation
 * @param baseGenerator - Base key generator (defaults to IP-based)
 * @returns Key generator function with siteId prefix
 */
export function createSiteKeyGenerator(
  siteId: string,
  baseGenerator: (request: RateLimitRequest) => string = defaultKeyGenerator
): (request: RateLimitRequest) => string {
  return (request: RateLimitRequest) => `site:${siteId}:${baseGenerator(request)}`;
}

/**
 * Preset rate limit configurations
 */
export const RATE_LIMIT_PRESETS = {
  /** Very strict: 5 requests per 15 minutes (for login, register) */
  strict: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  },
  /** Standard: 100 requests per 15 minutes (for general API) */
  standard: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  },
  /** Relaxed: 1000 requests per 15 minutes (for public read endpoints) */
  relaxed: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 1000,
  },
  /** Contact form: 10 requests per hour */
  contact: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  },
} as const;

/**
 * Create a rate limiter function
 *
 * @param config - Rate limit configuration
 * @param store - Optional custom store (defaults to in-memory)
 * @returns Rate limiter function
 */
export function createRateLimiter(
  config: Partial<RateLimitConfig> = {},
  store: RateLimitStore = getDefaultStore()
) {
  const {
    windowMs = 15 * 60 * 1000,
    maxRequests = 100,
    siteId,
    keyGenerator: customKeyGenerator,
    skip,
    onLimitReached,
  } = config;

  // Use siteId-scoped key generator when siteId is provided
  const keyGenerator = customKeyGenerator
    ? customKeyGenerator
    : siteId
      ? createSiteKeyGenerator(siteId)
      : defaultKeyGenerator;

  /**
   * Check rate limit for a request
   *
   * @param request - The incoming request
   * @returns Rate limit info if allowed
   * @throws RateLimitError if limit exceeded
   */
  async function checkRateLimit(request: RateLimitRequest): Promise<RateLimitInfo> {
    // Skip if configured
    if (skip?.(request)) {
      return {
        limit: maxRequests,
        remaining: maxRequests,
        resetTime: Date.now() + windowMs,
        retryAfter: 0,
      };
    }

    const key = keyGenerator(request);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing entry
    const entry = await store.get(key);

    // Filter timestamps within the current window
    const validTimestamps = entry?.timestamps.filter(ts => ts > windowStart) || [];

    // Calculate rate limit info
    const resetTime = validTimestamps.length > 0 ? validTimestamps[0]! + windowMs : now + windowMs;
    const remaining = Math.max(0, maxRequests - validTimestamps.length);
    const retryAfter = Math.ceil((resetTime - now) / 1000);

    const info: RateLimitInfo = {
      limit: maxRequests,
      remaining: remaining - 1, // Account for this request
      resetTime,
      retryAfter,
    };

    // Check if limit exceeded
    if (validTimestamps.length >= maxRequests) {
      onLimitReached?.(request, info);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
        { key, windowMs, maxRequests }
      );
    }

    // Record this request
    validTimestamps.push(now);
    await store.set(key, {
      timestamps: validTimestamps,
      lastAccess: now,
    });

    return info;
  }

  /**
   * Get rate limit headers for response
   */
  function getRateLimitHeaders(info: RateLimitInfo): Record<string, string> {
    return {
      'X-RateLimit-Limit': String(info.limit),
      'X-RateLimit-Remaining': String(Math.max(0, info.remaining)),
      'X-RateLimit-Reset': String(info.resetTime),
    };
  }

  /**
   * Reset rate limit for a key (e.g., after successful login)
   */
  async function resetRateLimit(request: RateLimitRequest): Promise<void> {
    const key = keyGenerator(request);
    await store.delete(key);
  }

  return {
    checkRateLimit,
    getRateLimitHeaders,
    resetRateLimit,
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /** For authentication endpoints (login, register) */
  auth: createRateLimiter(RATE_LIMIT_PRESETS.strict),
  /** For general API endpoints */
  api: createRateLimiter(RATE_LIMIT_PRESETS.standard),
  /** For public read endpoints */
  public: createRateLimiter(RATE_LIMIT_PRESETS.relaxed),
  /** For contact forms */
  contact: createRateLimiter(RATE_LIMIT_PRESETS.contact),
};

/**
 * Combine multiple rate limiters (e.g., global + endpoint-specific)
 */
export async function checkMultipleRateLimits(
  request: RateLimitRequest,
  limiters: Array<ReturnType<typeof createRateLimiter>>
): Promise<RateLimitInfo[]> {
  const results: RateLimitInfo[] = [];

  for (const limiter of limiters) {
    const info = await limiter.checkRateLimit(request);
    results.push(info);
  }

  return results;
}
