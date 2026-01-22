/**
 * Validation Middleware
 *
 * Validates request body and query parameters using Zod schemas.
 */

import { z } from 'zod';

import type { ApiErrorResponse, ApiRequest } from './types';

/**
 * Validation result type
 */
export type ValidationResult<TBody = unknown, TQuery = unknown> =
  | { success: true; body: TBody; query: TQuery }
  | { success: false; error: ApiErrorResponse };

/**
 * Parse query string from URL
 */
function parseQueryString(url?: string): Record<string, string | string[]> {
  if (!url) return {};

  try {
    const urlObj = new URL(url);
    const params: Record<string, string | string[]> = {};

    urlObj.searchParams.forEach((value, key) => {
      const existing = params[key];
      if (existing) {
        // Convert to array if multiple values
        params[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        params[key] = value;
      }
    });

    return params;
  } catch {
    return {};
  }
}

/**
 * Create validation error response
 */
function createValidationError(details: unknown, type: 'body' | 'query'): ApiErrorResponse {
  return {
    code: 'VALIDATION_ERROR',
    message:
      type === 'body'
        ? 'Les données fournies sont invalides'
        : 'Les paramètres de requête sont invalides',
    statusCode: 400,
    details: {
      type,
      errors: details,
    },
  };
}

/**
 * Validate request body with Zod schema
 *
 * @param request - The incoming request
 * @param schema - Zod schema for validation
 * @returns Validation result with parsed body or error
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * });
 *
 * export async function POST(request: Request) {
 *   const result = await withBodyValidation(request, schema);
 *
 *   if (!result.success) {
 *     return NextResponse.json(result.error, { status: result.error.statusCode });
 *   }
 *
 *   const { email, password } = result.body;
 *   // Continue with validated data...
 * }
 * ```
 */
export async function withBodyValidation<T extends z.ZodTypeAny>(
  request: ApiRequest,
  schema: T
): Promise<{ success: true; body: z.infer<T> } | { success: false; error: ApiErrorResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: createValidationError(result.error.flatten(), 'body'),
      };
    }

    return {
      success: true,
      body: result.data as z.infer<T>,
    };
  } catch {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Le corps de la requête doit être du JSON valide',
        statusCode: 400,
      },
    };
  }
}

/**
 * Validate query parameters with Zod schema
 *
 * @param request - The incoming request
 * @param schema - Zod schema for validation
 * @returns Validation result with parsed query params or error
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   page: z.coerce.number().int().min(1).default(1),
 *   limit: z.coerce.number().int().min(1).max(100).default(20),
 *   search: z.string().optional(),
 * });
 *
 * export async function GET(request: Request) {
 *   const result = withQueryValidation(request, schema);
 *
 *   if (!result.success) {
 *     return NextResponse.json(result.error, { status: result.error.statusCode });
 *   }
 *
 *   const { page, limit, search } = result.query;
 *   // Continue with validated params...
 * }
 * ```
 */
export function withQueryValidation<T extends z.ZodTypeAny>(
  request: ApiRequest,
  schema: T
): { success: true; query: z.infer<T> } | { success: false; error: ApiErrorResponse } {
  const queryParams = parseQueryString(request.url);
  const result = schema.safeParse(queryParams);

  if (!result.success) {
    return {
      success: false,
      error: createValidationError(result.error.flatten(), 'query'),
    };
  }

  return {
    success: true,
    query: result.data as z.infer<T>,
  };
}

/**
 * Validate both body and query parameters
 *
 * @param request - The incoming request
 * @param bodySchema - Zod schema for body validation
 * @param querySchema - Zod schema for query validation
 * @returns Validation result with parsed body and query or error
 */
export async function withValidation<TBody extends z.ZodTypeAny, TQuery extends z.ZodTypeAny>(
  request: ApiRequest,
  bodySchema: TBody,
  querySchema: TQuery
): Promise<ValidationResult<z.infer<TBody>, z.infer<TQuery>>> {
  // Validate query first (synchronous)
  const queryResult = withQueryValidation(request, querySchema);
  if (!queryResult.success) {
    return queryResult;
  }

  // Then validate body
  const bodyResult = await withBodyValidation(request, bodySchema);
  if (!bodyResult.success) {
    return bodyResult;
  }

  return {
    success: true,
    body: bodyResult.body,
    query: queryResult.query,
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  /** Pagination query parameters */
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),

  /** ID parameter */
  id: z.object({
    id: z.string().min(1),
  }),

  /** Slug parameter */
  slug: z.object({
    slug: z.string().min(1).max(200),
  }),

  /** Search query */
  search: z.object({
    q: z.string().max(200).optional(),
  }),

  /** Date range query */
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),

  /** Email field */
  email: z.string().email().max(255).toLowerCase(),

  /** Non-empty string */
  nonEmptyString: z.string().trim().min(1),
};

/**
 * Create a factory for validation middleware with common options
 */
export function createValidationMiddleware() {
  return {
    body: withBodyValidation,
    query: withQueryValidation,
    both: withValidation,
    schemas: commonSchemas,
  };
}
