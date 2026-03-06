/**
 * API Response Utilities
 *
 * Helper functions for creating standardized API responses.
 * Provides a bridge between @kairn/core AppError classes and
 * the standardized API response format.
 */

import {
  type AppError,
  isAppError,
  normalizeError,
  RateLimitError,
  ValidationError,
} from '@kairn/core';

/**
 * Success response structure
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  meta?: Record<string, unknown>;
}

/**
 * Create a success response
 *
 * @param data - Response data
 * @param meta - Optional metadata
 * @returns Success response object
 *
 * @example
 * ```typescript
 * return NextResponse.json(success({ user: { id: '1', name: 'John' } }));
 * ```
 */
export function success<T>(data: T, meta?: Record<string, unknown>): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

/**
 * Create an error response
 *
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional error details
 * @returns Error response object
 *
 * @example
 * ```typescript
 * return NextResponse.json(error('NOT_FOUND', 'User not found'), { status: 404 });
 * ```
 */
export function error(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

/**
 * Create a paginated response
 *
 * @param data - Array of items
 * @param pagination - Pagination info
 * @param meta - Optional metadata
 * @returns Paginated response object
 *
 * @example
 * ```typescript
 * return NextResponse.json(paginated(posts, {
 *   page: 1,
 *   limit: 20,
 *   total: 100,
 * }));
 * ```
 */
export function paginated<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number },
  meta?: Record<string, unknown>
): PaginatedResponse<T> {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
    ...(meta && { meta }),
  };
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate limiting
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // CSRF
  CSRF_INVALID: 'CSRF_INVALID',
} as const;

/**
 * Standard HTTP status codes with their default messages
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Map error codes to HTTP status codes
 */
export const ErrorCodeToStatus: Record<string, number> = {
  [ErrorCodes.INVALID_INPUT]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.MISSING_FIELD]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.INVALID_CREDENTIALS]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.TOKEN_EXPIRED]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.INVALID_TOKEN]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: HttpStatus.FORBIDDEN,
  [ErrorCodes.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCodes.CONFLICT]: HttpStatus.CONFLICT,
  [ErrorCodes.TOO_MANY_REQUESTS]: HttpStatus.TOO_MANY_REQUESTS,
  [ErrorCodes.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCodes.SERVICE_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [ErrorCodes.CSRF_INVALID]: HttpStatus.FORBIDDEN,
};

/**
 * Get status code for an error code
 */
export function getStatusForError(code: string): number {
  return ErrorCodeToStatus[code] || HttpStatus.INTERNAL_SERVER_ERROR;
}

/**
 * Common cache control headers
 */
export const CacheControl = {
  /** No caching at all */
  noCache: 'private, no-cache, no-store, must-revalidate',

  /** Short cache (5 minutes) */
  short: 'public, max-age=300, stale-while-revalidate=3600',

  /** Medium cache (1 hour) */
  medium: 'public, s-maxage=3600, max-age=3600, stale-while-revalidate=86400',

  /** Long cache (24 hours) */
  long: 'public, s-maxage=86400, max-age=86400, stale-while-revalidate=604800',

  /** Private, revalidate on each request */
  private: 'private, must-revalidate',
} as const;

/**
 * Build common response headers
 */
export function buildHeaders(options: {
  cacheControl?: keyof typeof CacheControl;
  rateLimitHeaders?: Record<string, string>;
  custom?: Record<string, string>;
}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.cacheControl) {
    headers['Cache-Control'] = CacheControl[options.cacheControl];
  }

  if (options.rateLimitHeaders) {
    Object.assign(headers, options.rateLimitHeaders);
  }

  if (options.custom) {
    Object.assign(headers, options.custom);
  }

  return headers;
}

// ─── AppError codes → ErrorCodes mapping ────────────────────────────────────

/**
 * Maps AppError.code values to the standardized ErrorCodes constants.
 * Ensures consistent error codes across @kairn/core and @kairn/api.
 */
const APP_ERROR_CODE_MAP: Record<string, string> = {
  VALIDATION_ERROR: ErrorCodes.VALIDATION_ERROR,
  AUTHENTICATION_ERROR: ErrorCodes.UNAUTHORIZED,
  AUTHORIZATION_ERROR: ErrorCodes.INSUFFICIENT_PERMISSIONS,
  NOT_FOUND: ErrorCodes.NOT_FOUND,
  CONFLICT: ErrorCodes.CONFLICT,
  RATE_LIMIT_EXCEEDED: ErrorCodes.TOO_MANY_REQUESTS,
  INTERNAL_ERROR: ErrorCodes.INTERNAL_ERROR,
  SERVICE_UNAVAILABLE: ErrorCodes.SERVICE_UNAVAILABLE,
  CONFIGURATION_ERROR: ErrorCodes.INTERNAL_ERROR,
};

/**
 * Convert an AppError code to its standardized ErrorCodes equivalent.
 *
 * @param appErrorCode - The code from an AppError instance
 * @returns The corresponding ErrorCodes constant, or INTERNAL_ERROR as fallback
 */
function mapAppErrorCode(appErrorCode: string): string {
  return APP_ERROR_CODE_MAP[appErrorCode] ?? ErrorCodes.INTERNAL_ERROR;
}

// ─── AppError → ErrorResponse bridge ────────────────────────────────────────

/**
 * Result of converting an AppError to an API response.
 */
export interface AppErrorResponseResult {
  /** Standardized error response body */
  response: ErrorResponse;
  /** HTTP status code */
  statusCode: number;
  /** Optional response headers (e.g. Retry-After) */
  headers?: Record<string, string>;
}

/**
 * Convert an AppError instance to a standardized API error response.
 * Bridges @kairn/core error classes with @kairn/api response format.
 *
 * @param appError - An AppError instance from @kairn/core
 * @returns Standardized error response with status code and headers
 *
 * @example
 * ```typescript
 * import { NotFoundError } from '@kairn/core';
 * import { appErrorToResponse } from '@kairn/api';
 *
 * const err = new NotFoundError('Article non trouvé', 'BlogPost');
 * const { response, statusCode } = appErrorToResponse(err);
 * return NextResponse.json(response, { status: statusCode });
 * ```
 */
export function appErrorToResponse(appError: AppError): AppErrorResponseResult {
  const code = mapAppErrorCode(appError.code);
  const details: Record<string, unknown> = {};

  if (appError instanceof ValidationError && appError.fields) {
    details.fields = appError.fields;
  }

  if (appError instanceof RateLimitError && appError.retryAfter) {
    details.retryAfter = appError.retryAfter;
  }

  const headers: Record<string, string> = {};
  if (appError instanceof RateLimitError && appError.retryAfter) {
    headers['Retry-After'] = String(appError.retryAfter);
  }

  return {
    response: error(code, appError.message, Object.keys(details).length > 0 ? details : undefined),
    statusCode: appError.statusCode,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  };
}

/**
 * Catch-all error handler that normalizes any error and returns a
 * standardized API response. Combines normalizeError() from @kairn/core
 * with the @kairn/api response format.
 *
 * @param err - Any error (AppError, Error, string, unknown)
 * @returns Standardized error response with status code and headers
 *
 * @example
 * ```typescript
 * import { handleErrorResponse } from '@kairn/api';
 *
 * export async function POST(request: Request) {
 *   try {
 *     // ... handler logic
 *   } catch (err) {
 *     const { response, statusCode, headers } = handleErrorResponse(err);
 *     return NextResponse.json(response, { status: statusCode, headers });
 *   }
 * }
 * ```
 */
export function handleErrorResponse(err: unknown): AppErrorResponseResult {
  if (isAppError(err)) {
    return appErrorToResponse(err);
  }

  const appError = normalizeError(err);
  return appErrorToResponse(appError);
}
