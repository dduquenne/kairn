/**
 * @kairn/social - OAuth Types
 *
 * Common types and interfaces for OAuth implementations across social platforms.
 */

import type { SocialAccountMetadata } from '../types';

// ===========================================
// OAuth Provider Interface
// ===========================================

/**
 * OAuth tokens returned from token exchange
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date;
  scope?: string | string[];
  tokenType?: string;
}

/**
 * Configuration check result
 */
export interface ConfigCheckResult {
  valid: boolean;
  error?: string;
}

/**
 * OAuth provider interface
 * All platform-specific OAuth implementations should implement this interface.
 */
export interface OAuthProvider {
  /** Platform name */
  readonly name: string;

  /**
   * Check if the provider is properly configured
   */
  checkConfig(): ConfigCheckResult;

  /**
   * Generate the authorization URL for OAuth flow
   * @param redirectUri - Callback URL after authorization
   * @param state - CSRF protection token
   */
  getAuthorizationUrl(redirectUri: string, state: string): string;

  /**
   * Exchange authorization code for tokens
   * @param code - Authorization code from callback
   * @param redirectUri - Must match the one used in authorization
   */
  exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokens>;

  /**
   * Refresh an expired access token (optional)
   * @param refreshToken - The refresh token
   */
  refreshToken?(refreshToken: string): Promise<OAuthTokens>;

  /**
   * Validate if a token is still valid
   * @param accessToken - Token to validate
   */
  validateToken?(accessToken: string): Promise<boolean>;

  /**
   * Calculate token expiry date from expiresIn seconds
   * @param expiresIn - Seconds until expiration
   */
  calculateTokenExpiry(expiresIn: number): Date;
}

// ===========================================
// Token Management Types
// ===========================================

/**
 * Result of a token refresh operation
 */
export interface TokenRefreshResult {
  accountId: string;
  platform: string;
  success: boolean;
  message: string;
  newExpiry?: Date;
  newAccessToken?: string;
  newRefreshToken?: string;
}

/**
 * Batch refresh result
 */
export interface TokenRefreshBatchResult {
  total: number;
  refreshed: number;
  failed: number;
  skipped: number;
  results: TokenRefreshResult[];
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  needsRefresh: boolean;
  expiresAt?: Date;
  message?: string;
}

// ===========================================
// Platform-specific Account Info Types
// ===========================================

/**
 * Facebook Page information
 */
export interface FacebookPageInfo {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  category?: string;
  instagramAccount?: {
    id: string;
    username: string;
  };
}

/**
 * Instagram Business account information
 */
export interface InstagramBusinessAccount {
  id: string;
  username: string;
  name?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  mediaCount?: number;
  biography?: string;
  website?: string;
  linkedPageId: string;
  linkedPageName: string;
}

/**
 * LinkedIn account information
 */
export interface LinkedInAccountInfo {
  personId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  profilePictureUrl?: string;
  organizations?: Array<{
    id: number;
    localizedName: string;
    vanityName?: string;
  }>;
}

/**
 * Twitter/X account information
 */
export interface TwitterAccountInfo {
  userId: string;
  username: string;
  name: string;
  profilePictureUrl?: string;
  description?: string;
}

/**
 * Threads account information
 */
export interface ThreadsAccountInfo {
  userId: string;
  username: string;
  name?: string;
  profilePictureUrl?: string;
  biography?: string;
}

// ===========================================
// OAuth State Management
// ===========================================

/**
 * OAuth state data stored in cookies/session
 */
export interface OAuthStateData {
  /** Random state token for CSRF protection */
  state: string;
  /** Code verifier for PKCE (Twitter) */
  codeVerifier?: string;
  /** Timestamp when state was created */
  createdAt: number;
  /** Additional context data */
  context?: Record<string, unknown>;
}

/**
 * OAuth callback parameters
 */
export interface OAuthCallbackParams {
  code: string;
  state: string;
  error?: string;
  errorDescription?: string;
}

// ===========================================
// Helper to build account metadata
// ===========================================

export type AccountMetadataBuilder<T> = (info: T) => SocialAccountMetadata;
