/**
 * @kairn/social - Facebook OAuth Provider
 *
 * Handles OAuth 2.0 authentication with Facebook for Page publishing
 * and Instagram Business account access.
 *
 * @see https://developers.facebook.com/docs/facebook-login/guides/access-tokens
 */

import type { SocialAccountMetadata } from '../types';

import type { OAuthProvider, OAuthTokens, ConfigCheckResult, FacebookPageInfo } from './types';

// ===========================================
// Configuration
// ===========================================

export interface FacebookOAuthConfig {
  appId?: string;
  appSecret?: string;
  graphApiVersion?: string;
}

const DEFAULT_GRAPH_API_VERSION = 'v18.0';

function getConfig(config?: FacebookOAuthConfig) {
  return {
    appId: config?.appId || process.env.FACEBOOK_APP_ID,
    appSecret: config?.appSecret || process.env.FACEBOOK_APP_SECRET,
    graphApiVersion: config?.graphApiVersion || DEFAULT_GRAPH_API_VERSION,
  };
}

function getGraphApiBase(version: string) {
  return `https://graph.facebook.com/${version}`;
}

/**
 * Scopes for Facebook and Instagram Business
 */
export const FACEBOOK_SCOPES = [
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_insights',
  'business_management',
];

// ===========================================
// Types
// ===========================================

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  instagram_business_account?: {
    id: string;
    username?: string;
  };
}

interface FacebookPagesResponse {
  data: FacebookPage[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

interface FacebookUser {
  id: string;
  name: string;
  email?: string;
}

interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
  followers_count?: number;
}

// ===========================================
// Facebook OAuth Provider
// ===========================================

/**
 * Check if Facebook OAuth is configured
 */
export function checkFacebookConfig(config?: FacebookOAuthConfig): ConfigCheckResult {
  const { appId, appSecret } = getConfig(config);

  if (!appId) {
    return { valid: false, error: 'FACEBOOK_APP_ID not configured' };
  }
  if (!appSecret) {
    return { valid: false, error: 'FACEBOOK_APP_SECRET not configured' };
  }
  return { valid: true };
}

/**
 * Generate Facebook OAuth authorization URL
 */
export function getAuthorizationUrl(
  redirectUri: string,
  state: string,
  config?: FacebookOAuthConfig
): string {
  const { appId, graphApiVersion } = getConfig(config);
  const configCheck = checkFacebookConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const params = new URLSearchParams({
    client_id: appId!,
    redirect_uri: redirectUri,
    state,
    scope: FACEBOOK_SCOPES.join(','),
    response_type: 'code',
    auth_type: 'rerequest',
  });

  return `https://www.facebook.com/${graphApiVersion}/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  config?: FacebookOAuthConfig
): Promise<OAuthTokens> {
  const { appId, appSecret, graphApiVersion } = getConfig(config);
  const configCheck = checkFacebookConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const params = new URLSearchParams({
    client_id: appId!,
    client_secret: appSecret!,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(
    `${getGraphApiBase(graphApiVersion)}/oauth/access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = (await response.json()) as { error?: { message?: string } };
    throw new Error(`Facebook OAuth error: ${error.error?.message || 'Token exchange failed'}`);
  }

  const data = (await response.json()) as FacebookTokenResponse;

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  config?: FacebookOAuthConfig
): Promise<OAuthTokens> {
  const { appId, appSecret, graphApiVersion } = getConfig(config);
  const configCheck = checkFacebookConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId!,
    client_secret: appSecret!,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(
    `${getGraphApiBase(graphApiVersion)}/oauth/access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = (await response.json()) as { error?: { message?: string } };
    throw new Error(
      `Long-lived token exchange error: ${error.error?.message || 'Exchange failed'}`
    );
  }

  const data = (await response.json()) as FacebookTokenResponse;

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000, // 60 days default
  };
}

/**
 * Get Facebook user information
 */
export async function getFacebookUser(
  accessToken: string,
  config?: FacebookOAuthConfig
): Promise<FacebookUser> {
  const { graphApiVersion } = getConfig(config);

  const response = await fetch(
    `${getGraphApiBase(graphApiVersion)}/me?fields=id,name,email&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = (await response.json()) as { error?: { message?: string } };
    throw new Error(`User fetch error: ${error.error?.message || 'Request failed'}`);
  }

  return (await response.json()) as FacebookUser;
}

/**
 * Get user's Facebook Pages
 */
export async function getFacebookPages(
  accessToken: string,
  config?: FacebookOAuthConfig
): Promise<FacebookPageInfo[]> {
  const { graphApiVersion } = getConfig(config);

  const response = await fetch(
    `${getGraphApiBase(graphApiVersion)}/me/accounts?fields=id,name,access_token,category,instagram_business_account{id,username}&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = (await response.json()) as { error?: { message?: string } };
    throw new Error(`Pages fetch error: ${error.error?.message || 'Request failed'}`);
  }

  const data = (await response.json()) as FacebookPagesResponse;

  return data.data.map(page => ({
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token,
    category: page.category,
    instagramAccount: page.instagram_business_account
      ? {
          id: page.instagram_business_account.id,
          username: page.instagram_business_account.username || '',
        }
      : undefined,
  }));
}

/**
 * Get Instagram Business account details
 */
export async function getInstagramAccount(
  accessToken: string,
  instagramAccountId: string,
  config?: FacebookOAuthConfig
): Promise<InstagramAccount> {
  const { graphApiVersion } = getConfig(config);

  const response = await fetch(
    `${getGraphApiBase(graphApiVersion)}/${instagramAccountId}?fields=id,username,profile_picture_url,followers_count&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = (await response.json()) as { error?: { message?: string } };
    throw new Error(`Instagram account fetch error: ${error.error?.message || 'Request failed'}`);
  }

  return (await response.json()) as InstagramAccount;
}

/**
 * Debug/validate a token
 */
export async function debugToken(
  accessToken: string,
  config?: FacebookOAuthConfig
): Promise<{
  isValid: boolean;
  expiresAt?: Date;
  scopes?: string[];
  userId?: string;
  appId?: string;
}> {
  const { appId, appSecret, graphApiVersion } = getConfig(config);
  const configCheck = checkFacebookConfig(config);

  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const response = await fetch(
    `${getGraphApiBase(graphApiVersion)}/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`
  );

  if (!response.ok) {
    return { isValid: false };
  }

  const data = (await response.json()) as {
    data: {
      is_valid: boolean;
      expires_at?: number;
      scopes?: string[];
      user_id?: string;
      app_id?: string;
    };
  };
  const tokenData = data.data;

  return {
    isValid: tokenData.is_valid,
    expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at * 1000) : undefined,
    scopes: tokenData.scopes,
    userId: tokenData.user_id,
    appId: tokenData.app_id,
  };
}

/**
 * Refresh Page Access Token
 * Note: Page tokens from long-lived user tokens don't expire
 */
export async function refreshPageToken(
  userAccessToken: string,
  pageId: string,
  config?: FacebookOAuthConfig
): Promise<string> {
  const pages = await getFacebookPages(userAccessToken, config);
  const page = pages.find(p => p.pageId === pageId);

  if (!page) {
    throw new Error(`Page ${pageId} not found or access revoked`);
  }

  return page.pageAccessToken;
}

/**
 * Build account metadata from Facebook/Instagram info
 */
export function buildAccountMetadata(
  page: FacebookPageInfo,
  instagramInfo?: InstagramAccount
): SocialAccountMetadata {
  const metadata: SocialAccountMetadata = {
    pageId: page.pageId,
    pageName: page.pageName,
  };

  if (page.instagramAccount && instagramInfo) {
    metadata.igUserId = instagramInfo.id;
    metadata.igUsername = instagramInfo.username;
    metadata.linkedFacebookPageId = page.pageId;
    metadata.avatarUrl = instagramInfo.profile_picture_url;
  }

  return metadata;
}

/**
 * Calculate token expiry date
 */
export function calculateTokenExpiry(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000);
}

// ===========================================
// Provider class for standardized interface
// ===========================================

export class FacebookOAuthProvider implements OAuthProvider {
  readonly name = 'Facebook';
  private config?: FacebookOAuthConfig;

  constructor(config?: FacebookOAuthConfig) {
    this.config = config;
  }

  checkConfig(): ConfigCheckResult {
    return checkFacebookConfig(this.config);
  }

  getAuthorizationUrl(redirectUri: string, state: string): string {
    return getAuthorizationUrl(redirectUri, state, this.config);
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokens> {
    return exchangeCodeForToken(code, redirectUri, this.config);
  }

  calculateTokenExpiry(expiresIn: number): Date {
    return calculateTokenExpiry(expiresIn);
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const result = await debugToken(accessToken, this.config);
    return result.isValid;
  }
}
