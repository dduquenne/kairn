/**
 * Authentication Middleware
 *
 * Verifies JWT tokens from cookies or Authorization header.
 */

import { createLogger, getTokenFromHeader, type JWTPayload, verifyToken } from '@kairn/core';

import type { ApiErrorResponse, ApiRequest, AuthMiddlewareConfig, AuthResult } from './types';

const authLogger = createLogger('Auth:Middleware');

/**
 * Error codes for authentication failures
 */
export const AuthErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
} as const;

/**
 * Create an authentication error response
 */
function createAuthError(code: keyof typeof AuthErrorCode, message?: string): ApiErrorResponse {
  const messages: Record<keyof typeof AuthErrorCode, { msg: string; status: number }> = {
    UNAUTHORIZED: { msg: 'Authentification requise', status: 401 },
    TOKEN_EXPIRED: { msg: 'Votre session a expiré. Veuillez vous reconnecter', status: 401 },
    INVALID_TOKEN: { msg: 'Token invalide', status: 401 },
    INSUFFICIENT_PERMISSIONS: { msg: 'Permissions insuffisantes', status: 403 },
  };

  const { msg, status } = messages[code];
  return {
    code: AuthErrorCode[code],
    message: message || msg,
    statusCode: status,
  };
}

/**
 * Default configuration
 */
const defaultConfig: Required<Omit<AuthMiddlewareConfig, 'getCookies'>> = {
  cookieName: 'auth_token',
  headerName: 'Authorization',
  requiredRole: '',
};

/**
 * Extract token from request
 */
async function extractToken(
  request: ApiRequest,
  config: AuthMiddlewareConfig
): Promise<string | null> {
  const { cookieName, headerName, getCookies } = { ...defaultConfig, ...config };

  // Try Authorization header first
  const authHeader = request.headers.get(headerName);
  const headerToken = getTokenFromHeader(authHeader || undefined);
  if (headerToken) {
    return headerToken;
  }

  // Try cookies if getCookies function is provided
  if (getCookies) {
    try {
      const cookies = await getCookies();
      const cookie = cookies.get(cookieName);
      if (cookie?.value) {
        return cookie.value;
      }
    } catch (err) {
      authLogger.warn('Cookie access failed during token extraction', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Try to parse Cookie header manually
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = parseCookieHeader(cookieHeader);
    const tokenFromCookie = cookies[cookieName];
    if (tokenFromCookie) {
      return tokenFromCookie;
    }
  }

  return null;
}

/**
 * Parse Cookie header into key-value pairs
 */
function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(';');

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.trim().split('=');
    if (key) {
      cookies[key] = valueParts.join('=');
    }
  }

  return cookies;
}

/**
 * Verify authentication for a request
 *
 * @param request - The incoming request
 * @param config - Authentication configuration
 * @returns Authentication result with user context or error
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const authResult = await withAuth(request, {
 *     cookieName: 'my_app_token',
 *     getCookies: () => cookies(),
 *   });
 *
 *   if (!authResult.success) {
 *     return NextResponse.json(authResult.error, { status: authResult.error.statusCode });
 *   }
 *
 *   const { user } = authResult.context;
 *   // Continue with authenticated request...
 * }
 * ```
 */
export async function withAuth(
  request: ApiRequest,
  config: AuthMiddlewareConfig = {}
): Promise<AuthResult> {
  try {
    const token = await extractToken(request, config);

    if (!token) {
      return {
        success: false,
        error: createAuthError('UNAUTHORIZED'),
      };
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return {
        success: false,
        error: createAuthError('INVALID_TOKEN'),
      };
    }

    // Check token expiration (verifyToken should handle this, but double-check)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return {
        success: false,
        error: createAuthError('TOKEN_EXPIRED'),
      };
    }

    // Check required role if specified
    const mergedConfig = { ...defaultConfig, ...config };
    if (mergedConfig.requiredRole && payload.role !== mergedConfig.requiredRole) {
      return {
        success: false,
        error: createAuthError('INSUFFICIENT_PERMISSIONS'),
      };
    }

    return {
      success: true,
      context: {
        user: payload,
        token,
      },
    };
  } catch (err) {
    authLogger.error('Unexpected auth middleware error', err, {
      url: request.url,
    });
    return {
      success: false,
      error: createAuthError('INVALID_TOKEN'),
    };
  }
}

/**
 * Factory to create an auth middleware with preset configuration
 *
 * @param config - Default configuration
 * @returns Configured auth middleware function
 */
export function createAuthMiddleware(config: AuthMiddlewareConfig = {}) {
  return (request: ApiRequest, overrides?: AuthMiddlewareConfig) =>
    withAuth(request, { ...config, ...overrides });
}

export type { JWTPayload };
