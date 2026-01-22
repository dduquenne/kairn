/**
 * Rate Limiting Middleware Wrapper
 *
 * Wraps the @kairn/core rate limiter for easy API route usage.
 */

import {
  createRateLimiter,
  MemoryRateLimitStore,
  RATE_LIMIT_PRESETS,
  RateLimitError,
  type RateLimitConfig,
  type RateLimitInfo,
  type RateLimitRequest,
  type RateLimitStore,
} from '@kairn/core';

import type { ApiErrorResponse } from './types';

/**
 * Rate limit result
 */
export type RateLimitResult =
  | { success: true; info: RateLimitInfo; headers: Record<string, string> }
  | { success: false; error: ApiErrorResponse; headers: Record<string, string> };

/**
 * Extract client IP from request
 */
export function getClientIP(request: RateLimitRequest): string {
  // Check various headers for proxied requests
  const forwardedFor = request.headers?.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (client IP)
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers?.get('x-real-ip');
  if (realIp) return realIp;

  // Vercel-specific header
  const vercelIp = request.headers?.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const firstIp = vercelIp.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  // Cloudflare-specific header
  const cfIp = request.headers?.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  return request.ip || 'unknown';
}

/**
 * Check rate limit for a request
 *
 * @param request - The incoming request
 * @param config - Rate limit configuration or preset name
 * @param store - Optional custom rate limit store
 * @returns Rate limit result with info and headers
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const rateLimitResult = await withRateLimit(request, 'strict');
 *
 *   if (!rateLimitResult.success) {
 *     return NextResponse.json(rateLimitResult.error, {
 *       status: rateLimitResult.error.statusCode,
 *       headers: rateLimitResult.headers,
 *     });
 *   }
 *
 *   // Continue with request...
 *   return NextResponse.json(data, { headers: rateLimitResult.headers });
 * }
 * ```
 */
export async function withRateLimit(
  request: RateLimitRequest,
  config: Partial<RateLimitConfig> | keyof typeof RATE_LIMIT_PRESETS = 'standard',
  store?: RateLimitStore
): Promise<RateLimitResult> {
  const rateLimitConfig = typeof config === 'string' ? RATE_LIMIT_PRESETS[config] : config;
  const limiter = createRateLimiter(rateLimitConfig, store);

  try {
    const info = await limiter.checkRateLimit(request);
    const headers = limiter.getRateLimitHeaders(info);

    return {
      success: true,
      info,
      headers,
    };
  } catch (err) {
    if (err instanceof RateLimitError) {
      const headers = {
        'X-RateLimit-Limit': String(rateLimitConfig.maxRequests || 100),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Date.now() + (rateLimitConfig.windowMs || 900000)),
        'Retry-After': String(err.retryAfter),
      };

      return {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: err.message,
          statusCode: 429,
          details: {
            retryAfter: err.retryAfter,
          },
        },
        headers,
      };
    }

    throw err;
  }
}

/**
 * Create a rate limit middleware with preset configuration
 *
 * @param config - Default configuration
 * @param store - Optional custom rate limit store
 * @returns Configured rate limit middleware function
 */
export function createRateLimitMiddleware(
  config: Partial<RateLimitConfig> | keyof typeof RATE_LIMIT_PRESETS = 'standard',
  store?: RateLimitStore
) {
  return (request: RateLimitRequest, overrides?: Partial<RateLimitConfig>) => {
    const finalConfig =
      typeof config === 'string'
        ? { ...RATE_LIMIT_PRESETS[config], ...overrides }
        : { ...config, ...overrides };
    return withRateLimit(request, finalConfig, store);
  };
}

/**
 * Create a key generator that combines IP with a custom identifier
 *
 * @param prefix - Prefix for the rate limit key (e.g., 'login', 'contact')
 * @returns Key generator function
 */
export function createKeyGenerator(prefix: string) {
  return (request: RateLimitRequest) => {
    const ip = getClientIP(request);
    return `${prefix}:${ip}`;
  };
}

// Re-export useful types and presets
export {
  RATE_LIMIT_PRESETS,
  MemoryRateLimitStore,
  type RateLimitConfig,
  type RateLimitRequest,
  type RateLimitInfo,
  type RateLimitStore,
};
