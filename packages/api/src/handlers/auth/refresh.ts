/**
 * Refresh Token Handler
 *
 * Handles token refresh with family-based rotation and replay detection.
 * Uses the RefreshToken Prisma model for persistence.
 */

import { randomUUID } from 'crypto';

import { createToken, type JWTPayload, verifyToken } from '@kairn/core';

import type { ApiRequest } from '../../middleware/types';
import { error } from '../../utils/response';

import { parseExpiration } from './login';
import { hashToken } from './token-utils';
import { getDefaultAuthCookieOptions, type AuthHandlerConfig, type RefreshResponse } from './types';

/**
 * Refresh handler configuration
 */
export interface RefreshHandlerConfig {
  /** Cookie name for access token */
  cookieName?: string;
  /** Cookie name for refresh token */
  refreshCookieName?: string;
  /** Access token expiration time */
  tokenExpiration?: string;
  /** Refresh token expiration time */
  refreshTokenExpiration?: string;
  /** Whether to include token in response body */
  includeTokenInBody?: boolean;
  /** Function to get cookies from the request context */
  getCookies?: () => Promise<{ get(name: string): { value: string } | undefined }>;
  /** Find refresh token by hash */
  findRefreshToken?: AuthHandlerConfig['findRefreshToken'];
  /** Mark a refresh token as used */
  markRefreshTokenUsed?: AuthHandlerConfig['markRefreshTokenUsed'];
  /** Revoke all tokens in a family (replay detection) */
  revokeTokenFamily?: AuthHandlerConfig['revokeTokenFamily'];
  /** Store a new refresh token */
  storeRefreshToken?: AuthHandlerConfig['storeRefreshToken'];
  /** Find user by ID for token payload */
  findUserById?: (userId: string) => Promise<{
    id: string;
    email: string;
    role: string;
  } | null>;
}

/**
 * Default configuration
 */
const defaultRefreshConfig: Partial<RefreshHandlerConfig> = {
  cookieName: 'auth_token',
  refreshCookieName: 'refresh_token',
  tokenExpiration: '15m',
  refreshTokenExpiration: '7d',
  includeTokenInBody: false,
};

/**
 * Cookie info for setting on a response
 */
interface CookieInfo {
  name: string;
  value: string;
  options: {
    maxAge: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
  };
}

/**
 * Refresh result
 */
export interface RefreshResult {
  response:
    | RefreshResponse
    | { success: false; error: { code: string; message: string; details?: unknown } };
  statusCode: number;
  headers: Record<string, string>;
  cookie?: CookieInfo;
  refreshCookie?: CookieInfo;
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
 * @returns Refresh result with new access + refresh tokens
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
    findRefreshToken,
    markRefreshTokenUsed,
    revokeTokenFamily,
    storeRefreshToken,
    findUserById,
  } = { ...defaultRefreshConfig, ...config };

  const headers: Record<string, string> = {};

  // Extract refresh token from cookies
  let rawRefreshToken: string | null = null;
  let currentAccessToken: string | null = null;

  if (getCookies) {
    try {
      const cookies = await getCookies();
      rawRefreshToken = cookies.get(refreshCookieName || 'refresh_token')?.value || null;
      currentAccessToken = cookies.get(cookieName || 'auth_token')?.value || null;
    } catch {
      // Cookie access failed
    }
  }

  // Fallback to Cookie header
  if (!rawRefreshToken) {
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const parsedCookies = parseCookieHeader(cookieHeader);
      rawRefreshToken = parsedCookies[refreshCookieName || 'refresh_token'] || null;
      currentAccessToken = parsedCookies[cookieName || 'auth_token'] || null;
    }
  }

  // If no refresh token, try to refresh from access token (legacy fallback)
  if (!rawRefreshToken && currentAccessToken) {
    return handleLegacyRefresh(currentAccessToken, {
      cookieName,
      tokenExpiration,
      includeTokenInBody,
      headers,
    });
  }

  if (!rawRefreshToken) {
    return {
      response: error('UNAUTHORIZED', 'Token de rafraîchissement requis'),
      statusCode: 401,
      headers,
    };
  }

  // Validate refresh token against database
  if (!findRefreshToken || !markRefreshTokenUsed || !revokeTokenFamily || !storeRefreshToken) {
    return handleLegacyRefresh(rawRefreshToken, {
      cookieName,
      tokenExpiration,
      includeTokenInBody,
      headers,
    });
  }

  const tokenHash = hashToken(rawRefreshToken);
  const storedToken = await findRefreshToken(tokenHash);

  if (!storedToken) {
    return {
      response: error('INVALID_TOKEN', 'Token de rafraîchissement invalide'),
      statusCode: 401,
      headers,
    };
  }

  // Check expiration
  if (new Date() > storedToken.expiresAt) {
    return {
      response: error(
        'TOKEN_EXPIRED',
        'Token de rafraîchissement expiré. Veuillez vous reconnecter'
      ),
      statusCode: 401,
      headers,
    };
  }

  // Replay detection: if token was already used, revoke entire family
  if (storedToken.isUsed) {
    await revokeTokenFamily(storedToken.family);
    return {
      response: error('TOKEN_REUSED', 'Activité suspecte détectée. Veuillez vous reconnecter'),
      statusCode: 401,
      headers,
    };
  }

  // Mark current refresh token as used
  await markRefreshTokenUsed(storedToken.id);

  // Find user for new token payload
  let userPayload: { id: string; email: string; role: string };
  if (findUserById) {
    const user = await findUserById(storedToken.userId);
    if (!user) {
      return {
        response: error('USER_NOT_FOUND', 'Utilisateur introuvable'),
        statusCode: 401,
        headers,
      };
    }
    userPayload = user;
  } else {
    // Fallback: decode expired access token for user info
    const payload = currentAccessToken ? await verifyToken(currentAccessToken) : null;
    if (!payload) {
      return {
        response: error('UNAUTHORIZED', "Impossible de vérifier l'identité"),
        statusCode: 401,
        headers,
      };
    }
    userPayload = { id: payload.sub, email: payload.email, role: payload.role };
  }

  // Generate new access token
  const newTokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: userPayload.id,
    email: userPayload.email,
    role: userPayload.role,
  };

  const newAccessToken = await createToken(newTokenPayload, {
    expiresIn: tokenExpiration,
  });

  const accessExpiresIn = parseExpiration(tokenExpiration || '15m');
  const expiresAt = new Date(Date.now() + accessExpiresIn * 1000).toISOString();

  // Generate new refresh token (rotation)
  const refreshExpiresIn = parseExpiration(refreshTokenExpiration || '7d');
  const newRawRefreshToken = randomUUID();
  const newTokenHash = hashToken(newRawRefreshToken);

  await storeRefreshToken(
    storedToken.userId,
    newTokenHash,
    storedToken.family,
    new Date(Date.now() + refreshExpiresIn * 1000)
  );

  // Build response
  const responseData: RefreshResponse = { success: true };
  if (includeTokenInBody) {
    responseData.token = newAccessToken;
    responseData.expiresAt = expiresAt;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const accessCookieOptions = getDefaultAuthCookieOptions(
    cookieName || 'auth_token',
    accessExpiresIn,
    isProduction
  );

  const refreshCookieOptions = getDefaultAuthCookieOptions(
    refreshCookieName || 'refresh_token',
    refreshExpiresIn,
    isProduction
  );

  return {
    response: responseData,
    statusCode: 200,
    headers,
    cookie: {
      name: accessCookieOptions.name,
      value: newAccessToken,
      options: {
        maxAge: accessCookieOptions.maxAge,
        httpOnly: accessCookieOptions.httpOnly,
        secure: accessCookieOptions.secure,
        sameSite: accessCookieOptions.sameSite,
        path: accessCookieOptions.path,
      },
    },
    refreshCookie: {
      name: refreshCookieOptions.name,
      value: newRawRefreshToken,
      options: {
        maxAge: refreshCookieOptions.maxAge,
        httpOnly: refreshCookieOptions.httpOnly,
        secure: refreshCookieOptions.secure,
        sameSite: refreshCookieOptions.sameSite,
        path: refreshCookieOptions.path,
      },
    },
  };
}

/**
 * Legacy refresh: verify and re-sign the access token (no DB persistence)
 */
async function handleLegacyRefresh(
  token: string,
  opts: {
    cookieName?: string;
    tokenExpiration?: string;
    includeTokenInBody?: boolean;
    headers: Record<string, string>;
  }
): Promise<RefreshResult> {
  const payload = await verifyToken(token);

  if (!payload) {
    return {
      response: error('TOKEN_EXPIRED', 'Session expirée. Veuillez vous reconnecter'),
      statusCode: 401,
      headers: opts.headers,
    };
  }

  const newTokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  };

  const newToken = await createToken(newTokenPayload, {
    expiresIn: opts.tokenExpiration,
  });

  const expiresIn = parseExpiration(opts.tokenExpiration || '15m');
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const responseData: RefreshResponse = { success: true };
  if (opts.includeTokenInBody) {
    responseData.token = newToken;
    responseData.expiresAt = expiresAt;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = getDefaultAuthCookieOptions(
    opts.cookieName || 'auth_token',
    expiresIn,
    isProduction
  );

  return {
    response: responseData,
    statusCode: 200,
    headers: opts.headers,
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
}

/**
 * Create a refresh handler with preset configuration
 */
export function createRefreshHandler(config: RefreshHandlerConfig = {}) {
  return (request: ApiRequest) => handleRefresh(request, config);
}
