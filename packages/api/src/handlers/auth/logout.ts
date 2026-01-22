/**
 * Logout Handler
 *
 * Handles user logout by clearing auth cookies.
 */

import type { LogoutResponse } from './types';

/**
 * Logout handler configuration
 */
export interface LogoutHandlerConfig {
  /** Cookie name for auth token */
  cookieName?: string;
  /** Additional cookies to clear */
  additionalCookies?: string[];
  /** Callback after successful logout */
  onLogout?: (userId?: string) => Promise<void>;
}

/**
 * Default configuration
 */
const defaultConfig: LogoutHandlerConfig = {
  cookieName: 'auth_token',
  additionalCookies: [],
};

/**
 * Logout result
 */
export interface LogoutResult {
  response: LogoutResponse;
  statusCode: number;
  cookiesToClear: Array<{
    name: string;
    options: {
      maxAge: number;
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      path: string;
    };
  }>;
}

/**
 * Handle logout request
 *
 * @param config - Handler configuration
 * @returns Logout result with cookies to clear
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const result = await handleLogout({
 *     cookieName: 'my_app_token',
 *   });
 *
 *   const response = NextResponse.json(result.response, {
 *     status: result.statusCode,
 *   });
 *
 *   // Clear cookies
 *   for (const cookie of result.cookiesToClear) {
 *     response.cookies.set(cookie.name, '', cookie.options);
 *   }
 *
 *   return response;
 * }
 * ```
 */
export async function handleLogout(config: LogoutHandlerConfig = {}): Promise<LogoutResult> {
  const { cookieName, additionalCookies, onLogout } = { ...defaultConfig, ...config };

  // Call logout callback if provided
  if (onLogout) {
    await onLogout();
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // Build list of cookies to clear
  const cookiesToClear = [cookieName, ...(additionalCookies || [])].map(name => ({
    name: name || 'auth_token',
    options: {
      maxAge: 0,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/',
    },
  }));

  return {
    response: {
      success: true,
      message: 'Déconnexion réussie',
    },
    statusCode: 200,
    cookiesToClear,
  };
}

/**
 * Create a logout handler with preset configuration
 */
export function createLogoutHandler(config: LogoutHandlerConfig = {}) {
  return () => handleLogout(config);
}
