/**
 * Refresh Token Handler
 *
 * Handles token refresh for maintaining user sessions.
 */

import { createToken, type JWTPayload, verifyToken } from '@kairn/core';

import type { ApiRequest } from '../../middleware/types';
import { error } from '../../utils/response';

import { getDefaultAuthCookieOptions, type RefreshResponse } from './types';

/**
 * Refresh handler configuration
 */
export interface RefreshHandlerConfig {
  /** Cookie name for auth token */
  cookieName?: string;
  /** Cookie name for refresh token (if using separate refresh tokens) */
  refreshCookieName?: string;
  /** Token expiration time */
  tokenExpiration?: string;
  /** Refresh token expiration time */
  refreshTokenExpiration?: string;
  /** Whether to include token in response body */
  includeTokenInBody?: boolean;
  /** Function to get cookies */
  getCookies?: () => Promise<{ get(name: string): { value: string } | undefined }>;
  /** Function to validate refresh token (for token rotation) */
  validateRefreshToken?: (token: string) => Promise<boolean>;
  /** Function to invalidate old refresh token */
  invalidateRefreshToken?: (token: string) => Promise<void>;
  /** Function to store new refresh token */
  storeRefreshToken?: (userId: string, token: string) => Promise<void>;
}

/**
 * Default configuration
 */
const defaultConfig: Partial<RefreshHandlerConfig> = {
  cookieName: 'auth_token',
  refreshCookieName: 'refresh_token',
  tokenExpiration: '24h',
  refreshTokenExpiration: '7d',
  includeTokenInBody: false,
};

/**
 * Refresh result
 */
export interface RefreshResult {
  response:
    | RefreshResponse
    | { success: false; error: { code: string; message: string; details?: unknown } };
  statusCode: number;
  headers: Record<string, string>;
  cookie?: {
    name: string;
    value: string;
    options: {
      maxAge: number;
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      path: string;
    };
  };
  refreshCookie?: {
    name: string;
    value: string;
    options: {
      maxAge: number;
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      path: string;
    };
  };
}

/**
 * Parse Cookie header
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
 * Handle token refresh request
 *
 * @param request - The incoming request
 * @param config - Handler configuration
 * @returns Refresh result
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const result = await handleRefresh(request, {
 *     cookieName: 'my_app_token',
 *     getCookies: () => cookies(),
 *   });
 *
 *   if (result.statusCode !== 200) {
 *     return NextResponse.json(result.response, { status: result.statusCode });
 *   }
 *
 *   const response = NextResponse.json(result.response, {
 *     status: result.statusCode,
 *     headers: result.headers,
 *   });
 *
 *   if (result.cookie) {
 *     response.cookies.set(result.cookie.name, result.cookie.value, result.cookie.options);
 *   }
 *
 *   return response;
 * }
 * ```
 */
export async function handleRefresh(
  request: ApiRequest,
  config: RefreshHandlerConfig = {}
): Promise<RefreshResult> {
  const {
    cookieName,
    refreshCookieName,
    tokenExpiration,
    refreshTokenExpiration,
    includeTokenInBody,
    getCookies,
    validateRefreshToken,
    invalidateRefreshToken,
    storeRefreshToken,
  } = { ...defaultConfig, ...config };

  const headers: Record<string, string> = {};

  // Try to get current token from cookies
  let currentToken: string | null = null;
  let refreshToken: string | null = null;

  if (getCookies) {
    try {
      const cookies = await getCookies();
      currentToken = cookies.get(cookieName || 'auth_token')?.value || null;
      refreshToken = cookies.get(refreshCookieName || 'refresh_token')?.value || null;
    } catch {
      // Cookie access failed
    }
  }

  // Fallback to Cookie header
  if (!currentToken) {
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const parsedCookies = parseCookieHeader(cookieHeader);
      currentToken = parsedCookies[cookieName || 'auth_token'] || null;
      refreshToken = parsedCookies[refreshCookieName || 'refresh_token'] || null;
    }
  }

  // Verify we have a token to refresh
  const tokenToVerify = refreshToken || currentToken;
  if (!tokenToVerify) {
    return {
      response: error('UNAUTHORIZED', 'Token de rafraîchissement requis'),
      statusCode: 401,
      headers,
    };
  }

  // Validate refresh token if validation function is provided
  if (validateRefreshToken && refreshToken) {
    const isValid = await validateRefreshToken(refreshToken);
    if (!isValid) {
      return {
        response: error('INVALID_TOKEN', 'Token de rafraîchissement invalide'),
        statusCode: 401,
        headers,
      };
    }
  }

  // Verify the token
  const payload = await verifyToken(tokenToVerify);

  if (!payload) {
    return {
      response: error('TOKEN_EXPIRED', 'Session expirée. Veuillez vous reconnecter'),
      statusCode: 401,
      headers,
    };
  }

  // Invalidate old refresh token if using token rotation
  if (invalidateRefreshToken && refreshToken) {
    await invalidateRefreshToken(refreshToken);
  }

  // Create new access token
  const newTokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  };

  const newToken = await createToken(newTokenPayload, {
    expiresIn: tokenExpiration,
  });

  // Calculate expiration
  const expiresIn = parseExpiration(tokenExpiration || '24h');
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  // Build response
  const responseData: RefreshResponse = {
    success: true,
  };

  if (includeTokenInBody) {
    responseData.token = newToken;
    responseData.expiresAt = expiresAt;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = getDefaultAuthCookieOptions(
    cookieName || 'auth_token',
    expiresIn,
    isProduction
  );

  const result: RefreshResult = {
    response: responseData,
    statusCode: 200,
    headers,
    cookie: {
      name: cookieOptions.name,
      value: newToken,
      options: {
        maxAge: cookieOptions.maxAge,
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        path: cookieOptions.path,
      },
    },
  };

  // Create new refresh token if using separate refresh tokens
  if (storeRefreshToken) {
    const newRefreshToken = await createToken(newTokenPayload, {
      expiresIn: refreshTokenExpiration,
    });

    await storeRefreshToken(payload.sub, newRefreshToken);

    const refreshExpiresIn = parseExpiration(refreshTokenExpiration || '7d');
    const refreshCookieOptions = getDefaultAuthCookieOptions(
      refreshCookieName || 'refresh_token',
      refreshExpiresIn,
      isProduction
    );

    result.refreshCookie = {
      name: refreshCookieOptions.name,
      value: newRefreshToken,
      options: {
        maxAge: refreshCookieOptions.maxAge,
        httpOnly: refreshCookieOptions.httpOnly,
        secure: refreshCookieOptions.secure,
        sameSite: refreshCookieOptions.sameSite,
        path: refreshCookieOptions.path,
      },
    };
  }

  return result;
}

/**
 * Parse expiration string to seconds
 */
function parseExpiration(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 86400; // Default 24 hours
  }

  const value = parseInt(match[1] || '1', 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 86400;
  }
}

/**
 * Create a refresh handler with preset configuration
 */
export function createRefreshHandler(config: RefreshHandlerConfig = {}) {
  return (request: ApiRequest) => handleRefresh(request, config);
}
