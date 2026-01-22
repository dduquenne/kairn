/**
 * @kairn/api Middleware
 *
 * Reusable middleware for API routes.
 */

// Types
export type {
  ApiRequest,
  AuthContext,
  AuthResult,
  ApiErrorResponse,
  AuthMiddlewareConfig,
  CSRFConfig,
  ValidationConfig,
  ValidationResult,
} from './types';

// Auth middleware
export { withAuth, createAuthMiddleware, AuthErrorCode, type JWTPayload } from './with-auth';

// Admin middleware
export {
  withAdmin,
  createAdminMiddleware,
  AdminErrorCode,
  type AdminMiddlewareConfig,
} from './with-admin';

// Rate limit middleware
export {
  withRateLimit,
  createRateLimitMiddleware,
  createKeyGenerator,
  getClientIP,
  RATE_LIMIT_PRESETS,
  MemoryRateLimitStore,
  type RateLimitResult,
  type RateLimitConfig,
  type RateLimitRequest,
  type RateLimitInfo,
  type RateLimitStore,
} from './with-rate-limit';

// CSRF middleware
export {
  withCSRF,
  createCSRFMiddleware,
  generateCSRFToken,
  validateCSRFToken,
  getCSRFConfig,
  type CSRFResult,
} from './with-csrf';

// Validation middleware
export {
  withBodyValidation,
  withQueryValidation,
  withValidation,
  createValidationMiddleware,
  commonSchemas,
  type ValidationResult as BodyValidationResult,
} from './with-validation';
