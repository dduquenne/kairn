/**
 * Login Handler
 *
 * Handles user authentication with rate limiting and JWT token generation.
 * Implements access token (short-lived) + refresh token (long-lived) flow.
 */

import { randomUUID } from 'crypto';

import { createLogger, createToken, type JWTPayload } from '@kairn/core';

import type { ApiRequest } from '../../middleware/types';
import { getClientIP, RATE_LIMIT_PRESETS, withRateLimit } from '../../middleware/with-rate-limit';
import { withBodyValidation } from '../../middleware/with-validation';
import { error } from '../../utils/response';

import { hashToken } from './token-utils';
import {
  getDefaultAuthCookieOptions,
  loginSchema,
  type AuthHandlerConfig,
  type LoginResponse,
} from './types';

const loginLogger = createLogger('Auth:Login');

/**
 * Dummy hash used to equalize timing when user is not found.
 * This prevents user enumeration via timing side-channel attacks.
 */
const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

/**
 * Default configuration
 */
const defaultConfig: Partial<AuthHandlerConfig> = {
  cookieName: 'auth_token',
  refreshCookieName: 'refresh_token',
  tokenExpiration: '15m',
  refreshTokenExpiration: '7d',
  includeTokenInBody: false,
  rateLimitKey: 'login',
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
 * Login handler result
 */
export interface LoginResult {
  response:
    | LoginResponse
    | { success: false; error: { code: string; message: string; details?: unknown } };
  statusCode: number;
  headers: Record<string, string>;
  cookie?: CookieInfo;
  refreshCookie?: CookieInfo;
}

/**
 * Handle login request
 *
 * @param request - The incoming request
 * @param config - Handler configuration
 * @returns Login result with response, status code, headers, and cookies
 */
export async function handleLogin(
  request: ApiRequest,
  config: AuthHandlerConfig
): Promise<LoginResult> {
  const {
    cookieName,
    refreshCookieName,
    tokenExpiration,
    refreshTokenExpiration,
    includeTokenInBody,
    rateLimitKey,
    findUserByEmail,
    comparePassword,
    onFailedAttempt,
    onSuccessfulLogin,
    storeRefreshToken,
    skipRateLimit,
  } = { ...defaultConfig, ...config };

  const clientIP = getClientIP(request);
  const headers: Record<string, string> = {};

  // Check rate limiting (skip if middleware already handles it)
  if (!skipRateLimit) {
    const rateLimitResult = await withRateLimit(request, {
      ...RATE_LIMIT_PRESETS.strict,
      keyGenerator: () => `${rateLimitKey}:${clientIP}`,
    });

    Object.assign(headers, rateLimitResult.headers);

    if (!rateLimitResult.success) {
      return {
        response: error('TOO_MANY_REQUESTS', rateLimitResult.error.message, {
          retryAfter: rateLimitResult.error.details?.retryAfter,
        }),
        statusCode: 429,
        headers: {
          ...headers,
          'Retry-After': String(rateLimitResult.error.details?.retryAfter || 60),
        },
      };
    }
  }

  // Validate request body
  const validationResult = await withBodyValidation(request, loginSchema);

  if (!validationResult.success) {
    return {
      response: error('INVALID_INPUT', 'Les données fournies sont invalides', {
        validation: validationResult.error.details,
      }),
      statusCode: 400,
      headers,
    };
  }

  const { email, password } = validationResult.body;
  const normalizedEmail = email.toLowerCase();

  // Find user
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    // Perform dummy comparison to equalize timing with valid-user path
    await comparePassword(password, DUMMY_HASH);
    loginLogger.warn('Login attempt for non-existent user', {
      email: normalizedEmail,
      ip: clientIP,
    });
    onFailedAttempt?.(normalizedEmail, clientIP);
    return {
      response: error('INVALID_CREDENTIALS', 'Identifiants invalides'),
      statusCode: 401,
      headers,
    };
  }

  // Verify password
  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    loginLogger.warn('Login attempt with invalid password', {
      userId: user.id,
      ip: clientIP,
    });
    onFailedAttempt?.(normalizedEmail, clientIP);
    return {
      response: error('INVALID_CREDENTIALS', 'Identifiants invalides'),
      statusCode: 401,
      headers,
    };
  }

  // Clear rate limiting for this user on successful login
  onSuccessfulLogin?.(normalizedEmail, clientIP);

  // Generate access token (short-lived)
  const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = await createToken(tokenPayload, {
    expiresIn: tokenExpiration,
  });

  const accessExpiresIn = parseExpiration(tokenExpiration || '15m');
  const expiresAt = new Date(Date.now() + accessExpiresIn * 1000).toISOString();

  // Build response
  const responseData: LoginResponse = {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };

  if (includeTokenInBody) {
    responseData.token = accessToken;
    responseData.expiresAt = expiresAt;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const accessCookieOptions = getDefaultAuthCookieOptions(
    cookieName || 'auth_token',
    accessExpiresIn,
    isProduction
  );

  const result: LoginResult = {
    response: responseData,
    statusCode: 200,
    headers,
    cookie: {
      name: accessCookieOptions.name,
      value: accessToken,
      options: {
        maxAge: accessCookieOptions.maxAge,
        httpOnly: accessCookieOptions.httpOnly,
        secure: accessCookieOptions.secure,
        sameSite: accessCookieOptions.sameSite,
        path: accessCookieOptions.path,
      },
    },
  };

  // Generate refresh token if persistence is configured
  if (storeRefreshToken) {
    const refreshExpiresIn = parseExpiration(refreshTokenExpiration || '7d');
    const family = randomUUID();
    const rawRefreshToken = randomUUID();
    const tokenHash = await hashToken(rawRefreshToken);

    await storeRefreshToken(
      user.id,
      tokenHash,
      family,
      new Date(Date.now() + refreshExpiresIn * 1000)
    );

    const refreshCookieOptions = getDefaultAuthCookieOptions(
      refreshCookieName || 'refresh_token',
      refreshExpiresIn,
      isProduction
    );

    result.refreshCookie = {
      name: refreshCookieOptions.name,
      value: rawRefreshToken,
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
export function parseExpiration(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 900; // Default 15 minutes
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
      return 900;
  }
}

/**
 * Create a login handler with preset configuration
 */
export function createLoginHandler(config: AuthHandlerConfig) {
  return (request: ApiRequest) => handleLogin(request, config);
}
