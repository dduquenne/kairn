/**
 * Auth Handlers
 *
 * Reusable authentication handlers for API routes.
 */

// Types and schemas
export {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  getDefaultAuthCookieOptions,
  type LoginInput,
  type RefreshTokenInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type AuthUser,
  type LoginResponse,
  type LogoutResponse,
  type RefreshResponse,
  type ForgotPasswordResponse,
  type AuthHandlerConfig,
  type AuthCookieOptions,
} from './types';

// Login handler
export { handleLogin, createLoginHandler, parseExpiration, type LoginResult } from './login';

// Token utilities
export { hashToken } from './token-utils';

// Logout handler
export {
  handleLogout,
  createLogoutHandler,
  type LogoutHandlerConfig,
  type LogoutResult,
} from './logout';

// Refresh handler
export {
  handleRefresh,
  createRefreshHandler,
  type RefreshHandlerConfig,
  type RefreshResult,
} from './refresh';

// Forgot password handler
export {
  handleForgotPassword,
  createForgotPasswordHandler,
  type ForgotPasswordHandlerConfig,
  type ForgotPasswordResult,
} from './forgot-password';
