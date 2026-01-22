/**
 * Login Handler
 *
 * Handles user authentication with rate limiting and JWT token generation.
 */

import { createToken, type JWTPayload } from '@kairn/core';

import type { ApiRequest } from '../../middleware/types';
import { getClientIP, RATE_LIMIT_PRESETS, withRateLimit } from '../../middleware/with-rate-limit';
import { withBodyValidation } from '../../middleware/with-validation';
import { error } from '../../utils/response';

import {
  getDefaultAuthCookieOptions,
  loginSchema,
  type AuthHandlerConfig,
  type LoginResponse,
} from './types';

/**
 * Default configuration
 */
const defaultConfig: Partial<AuthHandlerConfig> = {
  cookieName: 'auth_token',
  tokenExpiration: '24h',
  includeTokenInBody: false,
  rateLimitKey: 'login',
};

/**
 * Login handler result
 */
export interface LoginResult {
  response:
    | LoginResponse
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
}

/**
 * Handle login request
 *
 * @param request - The incoming request
 * @param config - Handler configuration
 * @returns Login result with response, status code, headers, and optional cookie
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const result = await handleLogin(request, {
 *     cookieName: 'my_app_token',
 *     findUserByEmail: async (email) => {
 *       return prisma.user.findUnique({ where: { email } });
 *     },
 *     comparePassword: async (password, hash) => {
 *       return bcrypt.compare(password, hash);
 *     },
 *   });
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
export async function handleLogin(
  request: ApiRequest,
  config: AuthHandlerConfig
): Promise<LoginResult> {
  const {
    cookieName,
    tokenExpiration,
    includeTokenInBody,
    rateLimitKey,
    findUserByEmail,
    comparePassword,
    onFailedAttempt,
    onSuccessfulLogin,
  } = { ...defaultConfig, ...config };

  const clientIP = getClientIP(request);
  const headers: Record<string, string> = {};

  // Check rate limiting
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
    onFailedAttempt?.(normalizedEmail, clientIP);
    return {
      response: error('INVALID_CREDENTIALS', 'Identifiants invalides'),
      statusCode: 401,
      headers,
    };
  }

  // Clear rate limiting for this user on successful login
  onSuccessfulLogin?.(normalizedEmail, clientIP);

  // Generate JWT token
  const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const token = await createToken(tokenPayload, {
    expiresIn: tokenExpiration,
  });

  // Calculate expiration
  const expiresIn = parseExpiration(tokenExpiration || '24h');
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

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
    responseData.token = token;
    responseData.expiresAt = expiresAt;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = getDefaultAuthCookieOptions(
    cookieName || 'auth_token',
    expiresIn,
    isProduction
  );

  return {
    response: responseData,
    statusCode: 200,
    headers,
    cookie: {
      name: cookieOptions.name,
      value: token,
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
 * Create a login handler with preset configuration
 */
export function createLoginHandler(config: AuthHandlerConfig) {
  return (request: ApiRequest) => handleLogin(request, config);
}
