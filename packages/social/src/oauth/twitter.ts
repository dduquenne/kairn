/**
 * @kairn/social - Twitter/X OAuth Provider with PKCE
 *
 * Handles OAuth 2.0 authentication with Twitter using PKCE
 * (Proof Key for Code Exchange) for security.
 *
 * Required scopes:
 * - tweet.read: Read tweets
 * - tweet.write: Publish tweets
 * - users.read: Read user info
 * - offline.access: Obtain refresh token
 *
 * @see https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
 */

import { randomBytes, createHash } from 'crypto';

import type { SocialAccountMetadata } from '../types';

import type { OAuthProvider, OAuthTokens, ConfigCheckResult, TwitterAccountInfo } from './types';

// ===========================================
// Configuration
// ===========================================

export interface TwitterOAuthConfig {
  clientId?: string;
  clientSecret?: string;
}

const TWITTER_AUTH_BASE = 'https://twitter.com/i/oauth2';
const TWITTER_API_BASE = 'https://api.twitter.com/2';

function getConfig(config?: TwitterOAuthConfig) {
  return {
    clientId: config?.clientId || process.env.TWITTER_CLIENT_ID,
    clientSecret: config?.clientSecret || process.env.TWITTER_CLIENT_SECRET,
  };
}

/**
 * Twitter OAuth scopes
 */
export const TWITTER_SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];

/**
 * Minimal scopes (publish only)
 */
export const TWITTER_MINIMAL_SCOPES = ['tweet.write', 'users.read'];

// ===========================================
// Types
// ===========================================

interface TwitterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  description?: string;
}

interface TwitterUserResponse {
  data: TwitterUser;
}

// ===========================================
// PKCE Helper Functions
// ===========================================

/**
 * Generate a random code_verifier for PKCE
 * The code_verifier must be between 43 and 128 characters
 */
export function generateCodeVerifier(): string {
  return randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate the code_challenge from the code_verifier
 * Uses SHA256 then base64url encodes
 */
export function generateCodeChallenge(codeVerifier: string): string {
  return createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// ===========================================
// Twitter OAuth Functions
// ===========================================

/**
 * Check if Twitter OAuth is configured
 */
export function checkTwitterConfig(config?: TwitterOAuthConfig): ConfigCheckResult {
  const { clientId, clientSecret } = getConfig(config);

  if (!clientId) {
    return { valid: false, error: 'TWITTER_CLIENT_ID not configured' };
  }
  if (!clientSecret) {
    return { valid: false, error: 'TWITTER_CLIENT_SECRET not configured' };
  }
  return { valid: true };
}

/**
 * Generate Twitter OAuth authorization URL with PKCE
 *
 * @param redirectUri - Callback URL after authorization
 * @param state - CSRF protection token
 * @param codeChallenge - PKCE challenge generated from code_verifier
 */
export function getAuthorizationUrl(
  redirectUri: string,
  state: string,
  codeChallenge: string,
  config?: TwitterOAuthConfig
): string {
  const { clientId } = getConfig(config);
  const configCheck = checkTwitterConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId!,
    redirect_uri: redirectUri,
    state,
    scope: TWITTER_SCOPES.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${TWITTER_AUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Generate authorization URL with automatic PKCE handling
 * Returns both URL and code verifier
 */
export function getAuthorizationUrlWithPKCE(
  redirectUri: string,
  state: string,
  config?: TwitterOAuthConfig
): { url: string; codeVerifier: string } {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const url = getAuthorizationUrl(redirectUri, state, codeChallenge, config);

  return { url, codeVerifier };
}

/**
 * Exchange authorization code for access token
 *
 * @param code - Authorization code from callback
 * @param redirectUri - Must match the one used for authorization
 * @param codeVerifier - Original PKCE code verifier
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  codeVerifier: string,
  config?: TwitterOAuthConfig
): Promise<OAuthTokens> {
  const { clientId, clientSecret } = getConfig(config);
  const configCheck = checkTwitterConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  // Twitter uses Basic Auth for token exchange
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${TWITTER_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Token exchange failed';
    try {
      const errorJson = JSON.parse(errorText) as { error_description?: string; error?: string };
      errorMessage = errorJson.error_description || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    throw new Error(`Twitter OAuth error: ${errorMessage}`);
  }

  const data = (await response.json()) as TwitterTokenResponse;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

/**
 * Refresh an access token
 */
export async function refreshAccessToken(
  refreshToken: string,
  config?: TwitterOAuthConfig
): Promise<OAuthTokens> {
  const { clientId, clientSecret } = getConfig(config);
  const configCheck = checkTwitterConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(`${TWITTER_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Refresh failed';
    try {
      const errorJson = JSON.parse(errorText) as { error_description?: string; error?: string };
      errorMessage = errorJson.error_description || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    throw new Error(`Twitter refresh token error: ${errorMessage}`);
  }

  const data = (await response.json()) as TwitterTokenResponse;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Get authenticated Twitter user info
 */
export async function getTwitterUser(accessToken: string): Promise<TwitterUser> {
  const response = await fetch(
    `${TWITTER_API_BASE}/users/me?user.fields=id,name,username,profile_image_url,description`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Request failed';
    try {
      const errorJson = JSON.parse(errorText) as { detail?: string; title?: string };
      errorMessage = errorJson.detail || errorJson.title || errorMessage;
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    throw new Error(`Twitter profile fetch error: ${errorMessage}`);
  }

  const data = (await response.json()) as TwitterUserResponse;
  return data.data;
}

/**
 * Validate a token
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${TWITTER_API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get complete Twitter account info
 */
export async function getTwitterAccountInfo(accessToken: string): Promise<TwitterAccountInfo> {
  const user = await getTwitterUser(accessToken);

  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    profilePictureUrl: user.profile_image_url,
    description: user.description,
  };
}

/**
 * Build account metadata from Twitter user
 */
export function buildAccountMetadata(user: TwitterUser): SocialAccountMetadata {
  return {
    twitterUserId: user.id,
    twitterUsername: user.username,
    profileUrl: `https://twitter.com/${user.username}`,
    avatarUrl: user.profile_image_url,
  };
}

/**
 * Convert user data to account info
 */
export function toAccountInfo(user: TwitterUser): TwitterAccountInfo {
  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    profilePictureUrl: user.profile_image_url,
    description: user.description,
  };
}

/**
 * Calculate token expiry date
 */
export function calculateTokenExpiry(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000);
}

/**
 * Check if token should be refreshed (expires in less than 5 minutes)
 */
export function shouldRefreshToken(tokenExpiry: Date | null): boolean {
  if (!tokenExpiry) return true;

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return tokenExpiry < fiveMinutesFromNow;
}

// ===========================================
// Provider class for standardized interface
// ===========================================

export class TwitterOAuthProvider implements OAuthProvider {
  readonly name = 'Twitter';
  private config?: TwitterOAuthConfig;

  constructor(config?: TwitterOAuthConfig) {
    this.config = config;
  }

  checkConfig(): ConfigCheckResult {
    return checkTwitterConfig(this.config);
  }

  /**
   * Get authorization URL - requires code challenge for PKCE
   * Use getAuthorizationUrlWithPKCE for automatic handling
   */
  getAuthorizationUrl(_redirectUri: string, _state: string): string {
    throw new Error('Twitter requires PKCE. Use getAuthorizationUrlWithPKCE() instead.');
  }

  exchangeCodeForToken(_code: string, _redirectUri: string): Promise<OAuthTokens> {
    throw new Error(
      'Twitter requires code verifier for PKCE. Use exchangeCodeForToken(code, redirectUri, codeVerifier) instead.'
    );
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    return refreshAccessToken(refreshToken, this.config);
  }

  calculateTokenExpiry(expiresIn: number): Date {
    return calculateTokenExpiry(expiresIn);
  }

  async validateToken(accessToken: string): Promise<boolean> {
    return validateToken(accessToken);
  }
}
