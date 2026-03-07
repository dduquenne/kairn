/**
 * @kairn/core Middleware
 *
 * Rate limiting et middleware Next.js réutilisables.
 */

// Rate limiting
export {
  createRateLimiter,
  createSiteKeyGenerator,
  MemoryRateLimitStore,
  RATE_LIMIT_PRESETS,
  rateLimiters,
  checkMultipleRateLimits,
  type RateLimitConfig,
  type RateLimitRequest,
  type RateLimitInfo,
  type RateLimitStore,
} from './rate-limit';

// Next.js Middleware factory
export {
  createMiddleware,
  getClientIP,
  generateCSPNonce,
  buildCSPHeader,
  EdgeMemoryRateLimitStore,
  type MiddlewareConfig,
  type MiddlewareRateLimitConfig,
  type MiddlewareRouteRule,
  type CSPDirectives,
  type MiddlewareRateLimitResult,
  type EdgeRateLimitStore,
  type NextMiddlewareRequest,
  type NextMiddlewareResponse,
} from './next-middleware';
