/**
 * Centralized Error Management
 *
 * Provides a hierarchy of typed errors for consistent error handling
 * across the entire platform.
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to a safe object for API responses (no stack trace)
   */
  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp.toISOString(),
      },
    };
  }

  /**
   * Convert to detailed object for logging (includes context)
   */
  toLog(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Validation errors (400 Bad Request)
 * Use for invalid input data, malformed requests
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string,
    fields?: Record<string, string[]>,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
    this.fields = fields;
  }

  override toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp.toISOString(),
        fields: this.fields,
      },
    };
  }
}

/**
 * Authentication errors (401 Unauthorized)
 * Use when user is not authenticated or token is invalid
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context);
  }
}

/**
 * Authorization errors (403 Forbidden)
 * Use when user is authenticated but lacks permission
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Insufficient permissions',
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context);
  }
}

/**
 * Not found errors (404 Not Found)
 * Use when requested resource does not exist
 */
export class NotFoundError extends AppError {
  public readonly resource?: string;

  constructor(
    message: string = 'Resource not found',
    resource?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'NOT_FOUND', 404, true, context);
    this.resource = resource;
  }
}

/**
 * Conflict errors (409 Conflict)
 * Use for duplicate resources, concurrent modifications
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', context?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, true, context);
  }
}

/**
 * Rate limit errors (429 Too Many Requests)
 * Use when client exceeds rate limits
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Too many requests',
    retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, context);
    this.retryAfter = retryAfter;
  }

  override toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp.toISOString(),
        retryAfter: this.retryAfter,
      },
    };
  }
}

/**
 * Internal server errors (500 Internal Server Error)
 * Use for unexpected errors, system failures
 */
export class InternalError extends AppError {
  constructor(
    message: string = 'Internal server error',
    context?: Record<string, unknown>,
    isOperational: boolean = false
  ) {
    super(message, 'INTERNAL_ERROR', 500, isOperational, context);
  }
}

/**
 * Service unavailable errors (503 Service Unavailable)
 * Use when a dependent service is down
 */
export class ServiceUnavailableError extends AppError {
  public readonly service?: string;

  constructor(
    message: string = 'Service temporarily unavailable',
    service?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'SERVICE_UNAVAILABLE', 503, true, context);
    this.service = service;
  }
}

/**
 * Configuration errors
 * Use for missing or invalid configuration
 */
export class ConfigurationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', 500, false, context);
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is operational (expected)
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}

/**
 * Convert unknown error to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message, { originalError: error.name });
  }

  return new InternalError('An unexpected error occurred');
}

/**
 * Error handler for API routes
 * Returns a standardized error response
 */
export function handleApiError(error: unknown): {
  body: Record<string, unknown>;
  status: number;
  headers?: Record<string, string>;
} {
  const appError = normalizeError(error);

  const headers: Record<string, string> = {};

  if (appError instanceof RateLimitError && appError.retryAfter) {
    headers['Retry-After'] = String(appError.retryAfter);
  }

  return {
    body: appError.toJSON(),
    status: appError.statusCode,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  };
}
