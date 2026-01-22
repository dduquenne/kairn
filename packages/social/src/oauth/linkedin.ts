/**
 * @kairn/social - LinkedIn OAuth Provider
 *
 * Handles OAuth 2.0 authentication with LinkedIn for publishing to:
 * - User personal profiles
 * - Organization/Company pages
 *
 * Required scopes:
 * - openid: OpenID Connect
 * - profile: Basic profile info
 * - w_member_social: Post on behalf of member
 * - r_organization_social: Read org info (requires Marketing Developer Platform)
 * - w_organization_social: Post on behalf of org (requires Marketing Developer Platform)
 *
 * @see https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 */

import type { SocialAccountMetadata } from '../types';

import type { OAuthProvider, OAuthTokens, ConfigCheckResult, LinkedInAccountInfo } from './types';

// ===========================================
// Configuration
// ===========================================

export interface LinkedInOAuthConfig {
  clientId?: string;
  clientSecret?: string;
}

const LINKEDIN_AUTH_BASE = 'https://www.linkedin.com/oauth/v2';

function getConfig(config?: LinkedInOAuthConfig) {
  return {
    clientId: config?.clientId || process.env.LINKEDIN_CLIENT_ID,
    clientSecret: config?.clientSecret || process.env.LINKEDIN_CLIENT_SECRET,
  };
}

/**
 * LinkedIn OAuth scopes
 *
 * Required LinkedIn Products:
 * - "Share on LinkedIn": w_member_social
 * - "Sign In with LinkedIn using OpenID Connect": openid, profile, email
 */
export const LINKEDIN_SCOPES = [
  'openid',
  'profile',
  'w_member_social',
  // Organization scopes (require Marketing Developer Platform)
  // 'r_organization_social',
  // 'w_organization_social',
];

// ===========================================
// Types
// ===========================================

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
  token_type: string;
}

interface LinkedInUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
}

// ===========================================
// LinkedIn OAuth Functions
// ===========================================

/**
 * Check if LinkedIn OAuth is configured
 */
export function checkLinkedInConfig(config?: LinkedInOAuthConfig): ConfigCheckResult {
  const { clientId, clientSecret } = getConfig(config);

  if (!clientId) {
    return { valid: false, error: 'LINKEDIN_CLIENT_ID not configured' };
  }
  if (!clientSecret) {
    return { valid: false, error: 'LINKEDIN_CLIENT_SECRET not configured' };
  }
  return { valid: true };
}

/**
 * Generate LinkedIn OAuth authorization URL
 */
export function getAuthorizationUrl(
  redirectUri: string,
  state: string,
  config?: LinkedInOAuthConfig
): string {
  const { clientId } = getConfig(config);
  const configCheck = checkLinkedInConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId!,
    redirect_uri: redirectUri,
    state,
    scope: LINKEDIN_SCOPES.join(' '),
  });

  return `${LINKEDIN_AUTH_BASE}/authorization?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  config?: LinkedInOAuthConfig
): Promise<OAuthTokens> {
  const { clientId, clientSecret } = getConfig(config);
  const configCheck = checkLinkedInConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId!,
    client_secret: clientSecret!,
  });

  const response = await fetch(`${LINKEDIN_AUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error_description?: string; error?: string };
    throw new Error(
      `LinkedIn OAuth error: ${error.error_description || error.error || 'Token exchange failed'}`
    );
  }

  const data = (await response.json()) as LinkedInTokenResponse;

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    scope: data.scope,
  };
}

/**
 * Refresh an access token
 */
export async function refreshAccessToken(
  refreshToken: string,
  config?: LinkedInOAuthConfig
): Promise<OAuthTokens> {
  const { clientId, clientSecret } = getConfig(config);
  const configCheck = checkLinkedInConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId!,
    client_secret: clientSecret!,
  });

  const response = await fetch(`${LINKEDIN_AUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error_description?: string; error?: string };
    throw new Error(
      `LinkedIn refresh token error: ${error.error_description || error.error || 'Refresh failed'}`
    );
  }

  const data = (await response.json()) as LinkedInTokenResponse;

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
  };
}

/**
 * Get user info via OpenID Connect
 * @see https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2
 */
export async function getUserInfo(accessToken: string): Promise<LinkedInUserInfo> {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'LinkedIn-Version': '202401',
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Request failed';
    try {
      const errorJson = JSON.parse(errorText) as { message?: string; error_description?: string };
      errorMessage = errorJson.message || errorJson.error_description || errorText;
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    throw new Error(`LinkedIn profile fetch error: ${errorMessage}`);
  }

  return (await response.json()) as LinkedInUserInfo;
}

/**
 * Get complete LinkedIn account info
 */
export async function getLinkedInAccountInfo(accessToken: string): Promise<LinkedInAccountInfo> {
  const userInfo = await getUserInfo(accessToken);

  return {
    personId: userInfo.sub,
    firstName: userInfo.given_name,
    lastName: userInfo.family_name,
    fullName: userInfo.name,
    email: userInfo.email,
    profilePictureUrl: userInfo.picture,
  };
}

/**
 * Introspect a token (if app supports it)
 */
export async function introspectToken(
  accessToken: string,
  config?: LinkedInOAuthConfig
): Promise<{
  active: boolean;
  expiresAt?: Date;
  scope?: string;
  clientId?: string;
}> {
  const { clientId, clientSecret } = getConfig(config);
  const configCheck = checkLinkedInConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  try {
    const params = new URLSearchParams({
      token: accessToken,
      client_id: clientId!,
      client_secret: clientSecret!,
    });

    const response = await fetch(`${LINKEDIN_AUTH_BASE}/introspectToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      return { active: false };
    }

    const data = (await response.json()) as {
      active: boolean;
      exp?: number;
      scope?: string;
      client_id?: string;
    };

    return {
      active: data.active,
      expiresAt: data.exp ? new Date(data.exp * 1000) : undefined,
      scope: data.scope,
      clientId: data.client_id,
    };
  } catch {
    return { active: true }; // Assume active on error
  }
}

/**
 * Build account metadata from LinkedIn info
 */
export function buildAccountMetadata(info: LinkedInAccountInfo): SocialAccountMetadata {
  return {
    personId: info.personId,
    profileUrl: `https://www.linkedin.com/in/${info.personId}`,
    avatarUrl: info.profilePictureUrl,
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

export class LinkedInOAuthProvider implements OAuthProvider {
  readonly name = 'LinkedIn';
  private config?: LinkedInOAuthConfig;

  constructor(config?: LinkedInOAuthConfig) {
    this.config = config;
  }

  checkConfig(): ConfigCheckResult {
    return checkLinkedInConfig(this.config);
  }

  getAuthorizationUrl(redirectUri: string, state: string): string {
    return getAuthorizationUrl(redirectUri, state, this.config);
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokens> {
    return exchangeCodeForToken(code, redirectUri, this.config);
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    return refreshAccessToken(refreshToken, this.config);
  }

  calculateTokenExpiry(expiresIn: number): Date {
    return calculateTokenExpiry(expiresIn);
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const result = await introspectToken(accessToken, this.config);
    return result.active;
  }
}
