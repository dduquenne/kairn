/**
 * Auth Handler Types
 */

import { z } from 'zod';

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Refresh token request schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requis'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Forgot password request schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password request schema
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token requis'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * User info returned after successful auth
 */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  success: true;
  user: AuthUser;
  token?: string; // Only included if not using httpOnly cookies
  expiresAt?: string;
}

/**
 * Logout response
 */
export interface LogoutResponse {
  success: true;
  message: string;
}

/**
 * Refresh token response
 */
export interface RefreshResponse {
  success: true;
  token?: string;
  expiresAt?: string;
}

/**
 * Forgot password response
 */
export interface ForgotPasswordResponse {
  success: true;
  message: string;
}

/**
 * Auth handler configuration
 */
export interface AuthHandlerConfig {
  /** Cookie name for access token */
  cookieName?: string;
  /** Cookie name for refresh token */
  refreshCookieName?: string;
  /** Access token expiration time (default: '15m') */
  tokenExpiration?: string;
  /** Refresh token expiration time (default: '7d') */
  refreshTokenExpiration?: string;
  /** Whether to include token in response body */
  includeTokenInBody?: boolean;
  /** Rate limit configuration key */
  rateLimitKey?: string;
  /** Skip handler-level rate limiting (use when middleware already handles it) */
  skipRateLimit?: boolean;
  /** User lookup function */
  findUserByEmail: (email: string) => Promise<{
    id: string;
    email: string;
    role: string;
    passwordHash: string;
  } | null>;
  /** Password comparison function */
  comparePassword: (password: string, hash: string) => Promise<boolean>;
  /** Function to record failed login attempt */
  onFailedAttempt?: (email: string, ip: string) => void;
  /** Function to clear failed attempts after successful login */
  onSuccessfulLogin?: (email: string, ip: string) => void;
  /** Function to generate reset token */
  generateResetToken?: (email: string) => Promise<string>;
  /** Function to send reset email (returns void, email is sent async) */
  sendResetEmail?: (email: string, resetToken: string) => Promise<void>;
  /** Function to store a refresh token hash in the database */
  storeRefreshToken?: (
    userId: string,
    tokenHash: string,
    family: string,
    expiresAt: Date
  ) => Promise<void>;
  /** Function to find and validate a refresh token by hash */
  findRefreshToken?: (tokenHash: string) => Promise<{
    id: string;
    userId: string;
    family: string;
    isUsed: boolean;
    expiresAt: Date;
  } | null>;
  /** Function to mark a refresh token as used */
  markRefreshTokenUsed?: (tokenId: string) => Promise<void>;
  /** Function to revoke all tokens in a family (replay detection) */
  revokeTokenFamily?: (family: string) => Promise<void>;
  /** Function to revoke all refresh tokens for a user */
  revokeAllUserTokens?: (userId: string) => Promise<void>;
}

/**
 * Cookie options for auth token
 */
export interface AuthCookieOptions {
  name: string;
  maxAge: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  domain?: string;
}

/**
 * Get default cookie options for auth
 */
export function getDefaultAuthCookieOptions(
  name: string,
  maxAge: number,
  isProduction: boolean
): AuthCookieOptions {
  return {
    name,
    maxAge,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  };
}
