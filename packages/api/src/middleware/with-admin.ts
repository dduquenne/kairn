/**
 * Admin Authentication Middleware
 *
 * Verifies that the user is authenticated AND has admin role.
 */

import type { ApiRequest, AuthMiddlewareConfig, AuthResult, ApiErrorResponse } from './types';
import { withAuth } from './with-auth';

/**
 * Error codes for authorization failures
 */
export const AdminErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
} as const;

/**
 * Create an authorization error response
 */
function createAdminError(code: keyof typeof AdminErrorCode, message?: string): ApiErrorResponse {
  const messages: Record<keyof typeof AdminErrorCode, { msg: string; status: number }> = {
    UNAUTHORIZED: { msg: 'Authentification requise', status: 401 },
    INSUFFICIENT_PERMISSIONS: { msg: 'Permissions insuffisantes', status: 403 },
  };

  const { msg, status } = messages[code];
  return {
    code: AdminErrorCode[code],
    message: message || msg,
    statusCode: status,
  };
}

/**
 * Admin middleware configuration
 */
export interface AdminMiddlewareConfig extends AuthMiddlewareConfig {
  /** Required admin role name (default: 'admin') */
  adminRole?: string;
}

/**
 * Verify admin authentication for a request
 *
 * @param request - The incoming request
 * @param config - Admin authentication configuration
 * @returns Authentication result with admin user context or error
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const authResult = await withAdmin(request, {
 *     cookieName: 'my_app_admin_token',
 *     getCookies: () => cookies(),
 *   });
 *
 *   if (!authResult.success) {
 *     return NextResponse.json(authResult.error, { status: authResult.error.statusCode });
 *   }
 *
 *   const { user } = authResult.context;
 *   // Continue with admin-only operation...
 * }
 * ```
 */
export async function withAdmin(
  request: ApiRequest,
  config: AdminMiddlewareConfig = {}
): Promise<AuthResult> {
  const { adminRole = 'admin', ...authConfig } = config;

  // First verify authentication
  const authResult = await withAuth(request, authConfig);

  if (!authResult.success) {
    return authResult;
  }

  // Check admin role
  const { user } = authResult.context;

  if (user.role !== adminRole) {
    return {
      success: false,
      error: createAdminError('INSUFFICIENT_PERMISSIONS'),
    };
  }

  return authResult;
}

/**
 * Factory to create an admin middleware with preset configuration
 *
 * @param config - Default configuration
 * @returns Configured admin middleware function
 */
export function createAdminMiddleware(config: AdminMiddlewareConfig = {}) {
  return (request: ApiRequest, overrides?: AdminMiddlewareConfig) =>
    withAdmin(request, { ...config, ...overrides });
}
