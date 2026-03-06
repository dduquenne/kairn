/**
 * Types for API middlewares
 */

import type { JWTPayload } from '@kairn/core';

/**
 * Minimal request interface for middlewares
 */
export interface ApiRequest {
  headers: {
    get(name: string): string | null;
  };
  url?: string;
  method?: string;
  clone(): ApiRequest & { json(): Promise<unknown>; formData(): Promise<FormData> };
  json(): Promise<unknown>;
}

/**
 * Authentication context passed to handlers
 */
export interface AuthContext {
  user: JWTPayload;
  token: string;
}

/**
 * Result of an auth middleware check
 */
export type AuthResult =
  | { success: true; context: AuthContext }
  | { success: false; error: ApiErrorResponse };

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

/**
 * Middleware configuration for auth
 */
export interface AuthMiddlewareConfig {
  /** Cookie name to look for token */
  cookieName?: string;
  /** Header name for Bearer token */
  headerName?: string;
  /** Required role (e.g., 'admin') */
  requiredRole?: string;
  /** Function to get cookies (for Next.js) */
  getCookies?: () => Promise<{ get(name: string): { value: string } | undefined }>;
}

/**
 * CSRF middleware configuration
 */
export interface CSRFConfig {
  /** Cookie name for CSRF token */
  cookieName?: string;
  /** Header name for CSRF token */
  headerName?: string;
  /** Token lifetime in seconds */
  tokenLifetime?: number;
  /** Secret for signing (defaults to env CSRF_SECRET — no fallback on JWT_SECRET) */
  secret?: string;
}

/**
 * Validation middleware configuration
 */
export interface ValidationConfig<T> {
  /** Zod schema for body validation */
  body?: {
    safeParse: (
      data: unknown
    ) => { success: true; data: T } | { success: false; error: { flatten: () => unknown } };
  };
  /** Zod schema for query params validation */
  query?: {
    safeParse: (
      data: unknown
    ) => { success: true; data: T } | { success: false; error: { flatten: () => unknown } };
  };
}

/**
 * Validation result
 */
export type ValidationResult<TBody = unknown, TQuery = unknown> =
  | { success: true; body?: TBody; query?: TQuery }
  | { success: false; error: ApiErrorResponse };
