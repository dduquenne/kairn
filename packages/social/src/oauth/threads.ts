/**
 * @kairn/social - Threads OAuth Provider
 *
 * Handles OAuth 2.0 authentication with Threads for publishing content.
 *
 * Required scopes:
 * - threads_basic: Basic profile access
 * - threads_content_publish: Publish on Threads
 * - threads_manage_insights: Read statistics (optional)
 * - threads_manage_replies: Manage replies (optional)
 *
 * @see https://developers.facebook.com/docs/threads/overview
 */

import type { SocialAccountMetadata } from '../types';

import type { OAuthProvider, OAuthTokens, ConfigCheckResult, ThreadsAccountInfo } from './types';

// ===========================================
// Configuration
// ===========================================

export interface ThreadsOAuthConfig {
  appId?: string;
  appSecret?: string;
  apiVersion?: string;
}

const THREADS_API_VERSION = 'v1.0';
const THREADS_API_BASE = 'https://graph.threads.net';
const THREADS_AUTH_BASE = 'https://threads.net';

function getConfig(config?: ThreadsOAuthConfig) {
  return {
    appId: config?.appId || process.env.THREADS_APP_ID || process.env.FACEBOOK_APP_ID,
    appSecret:
      config?.appSecret || process.env.THREADS_APP_SECRET || process.env.FACEBOOK_APP_SECRET,
    apiVersion: config?.apiVersion || THREADS_API_VERSION,
  };
}

/**
 * Threads OAuth scopes
 */
export const THREADS_SCOPES = [
  'threads_basic',
  'threads_content_publish',
  'threads_manage_insights',
  'threads_manage_replies',
];

/**
 * Minimal scopes (publish only)
 */
export const THREADS_MINIMAL_SCOPES = ['threads_basic', 'threads_content_publish'];

// ===========================================
// Types
// ===========================================

interface ThreadsTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface ThreadsLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ThreadsUser {
  id: string;
  username: string;
  name?: string;
  threads_profile_picture_url?: string;
  threads_biography?: string;
}

// ===========================================
// Threads OAuth Functions
// ===========================================

/**
 * Check if Threads OAuth is configured
 */
export function checkThreadsConfig(config?: ThreadsOAuthConfig): ConfigCheckResult {
  const { appId, appSecret } = getConfig(config);

  if (!appId) {
    return { valid: false, error: 'THREADS_APP_ID (or FACEBOOK_APP_ID) not configured' };
  }
  if (!appSecret) {
    return { valid: false, error: 'THREADS_APP_SECRET (or FACEBOOK_APP_SECRET) not configured' };
  }
  return { valid: true };
}

/**
 * Generate Threads OAuth authorization URL
 */
export function getAuthorizationUrl(
  redirectUri: string,
  state: string,
  config?: ThreadsOAuthConfig
): string {
  const { appId } = getConfig(config);
  const configCheck = checkThreadsConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const params = new URLSearchParams({
    client_id: appId!,
    redirect_uri: redirectUri,
    state,
    scope: THREADS_SCOPES.join(','),
    response_type: 'code',
  });

  return `${THREADS_AUTH_BASE}/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for short-lived access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  config?: ThreadsOAuthConfig
): Promise<OAuthTokens> {
  const { appId, appSecret } = getConfig(config);
  const configCheck = checkThreadsConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const params = new URLSearchParams({
    client_id: appId!,
    client_secret: appSecret!,
    redirect_uri: redirectUri,
    code,
    grant_type: 'authorization_code',
  });

  const response = await fetch(`${THREADS_API_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = (await response.json()) as {
      error_message?: string;
      error?: { message?: string };
    };
    throw new Error(
      `Threads OAuth error: ${error.error_message || error.error?.message || 'Token exchange failed'}`
    );
  }

  const data = (await response.json()) as ThreadsTokenResponse;

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  config?: ThreadsOAuthConfig
): Promise<OAuthTokens> {
  const { appSecret } = getConfig(config);
  const configCheck = checkThreadsConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const params = new URLSearchParams({
    grant_type: 'th_exchange_token',
    client_secret: appSecret!,
    access_token: shortLivedToken,
  });

  const response = await fetch(`${THREADS_API_BASE}/access_token?${params.toString()}`);

  if (!response.ok) {
    const error = (await response.json()) as {
      error_message?: string;
      error?: { message?: string };
    };
    throw new Error(
      `Threads long-lived token exchange error: ${error.error_message || error.error?.message || 'Exchange failed'}`
    );
  }

  const data = (await response.json()) as ThreadsLongLivedTokenResponse;

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000, // 60 days default
  };
}

/**
 * Refresh a long-lived token (before expiration)
 */
export async function refreshLongLivedToken(
  longLivedToken: string,
  config?: ThreadsOAuthConfig
): Promise<OAuthTokens> {
  const configCheck = checkThreadsConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const params = new URLSearchParams({
    grant_type: 'th_refresh_token',
    access_token: longLivedToken,
  });

  const response = await fetch(`${THREADS_API_BASE}/refresh_access_token?${params.toString()}`);

  if (!response.ok) {
    const error = (await response.json()) as {
      error_message?: string;
      error?: { message?: string };
    };
    throw new Error(
      `Threads token refresh error: ${error.error_message || error.error?.message || 'Refresh failed'}`
    );
  }

  const data = (await response.json()) as ThreadsLongLivedTokenResponse;

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000,
  };
}

/**
 * Get Threads profile info
 */
export async function getThreadsUser(
  accessToken: string,
  config?: ThreadsOAuthConfig
): Promise<ThreadsUser> {
  const { apiVersion } = getConfig(config);
  const fields = 'id,username,name,threads_profile_picture_url,threads_biography';

  const response = await fetch(
    `${THREADS_API_BASE}/${apiVersion}/me?fields=${fields}&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = (await response.json()) as {
      error_message?: string;
      error?: { message?: string };
    };
    throw new Error(
      `Threads profile fetch error: ${error.error_message || error.error?.message || 'Request failed'}`
    );
  }

  return (await response.json()) as ThreadsUser;
}

/**
 * Validate a Threads token
 */
export async function validateToken(
  accessToken: string,
  config?: ThreadsOAuthConfig
): Promise<boolean> {
  const { apiVersion } = getConfig(config);

  try {
    const response = await fetch(
      `${THREADS_API_BASE}/${apiVersion}/me?fields=id&access_token=${accessToken}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Build account metadata from Threads user
 */
export function buildAccountMetadata(user: ThreadsUser): SocialAccountMetadata {
  return {
    threadsUserId: user.id,
    threadsUsername: user.username,
    avatarUrl: user.threads_profile_picture_url,
  };
}

/**
 * Convert user data to account info
 */
export function toAccountInfo(user: ThreadsUser): ThreadsAccountInfo {
  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    profilePictureUrl: user.threads_profile_picture_url,
    biography: user.threads_biography,
  };
}

/**
 * Calculate token expiry date
 */
export function calculateTokenExpiry(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000);
}

/**
 * Check if token should be refreshed (expires in less than 7 days)
 */
export function shouldRefreshToken(tokenExpiry: Date | null): boolean {
  if (!tokenExpiry) return true;

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return tokenExpiry < sevenDaysFromNow;
}

// ===========================================
// Provider class for standardized interface
// ===========================================

export class ThreadsOAuthProvider implements OAuthProvider {
  readonly name = 'Threads';
  private config?: ThreadsOAuthConfig;

  constructor(config?: ThreadsOAuthConfig) {
    this.config = config;
  }

  checkConfig(): ConfigCheckResult {
    return checkThreadsConfig(this.config);
  }

  getAuthorizationUrl(redirectUri: string, state: string): string {
    return getAuthorizationUrl(redirectUri, state, this.config);
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokens> {
    return exchangeCodeForToken(code, redirectUri, this.config);
  }

  async refreshToken(token: string): Promise<OAuthTokens> {
    return refreshLongLivedToken(token, this.config);
  }

  calculateTokenExpiry(expiresIn: number): Date {
    return calculateTokenExpiry(expiresIn);
  }

  async validateToken(accessToken: string): Promise<boolean> {
    return validateToken(accessToken, this.config);
  }
}
