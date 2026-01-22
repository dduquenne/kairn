/**
 * @kairn/social - Instagram OAuth Provider
 *
 * Instagram Business/Creator accounts are managed through Facebook Graph API.
 * Authentication goes through Facebook OAuth, then accesses the Instagram Business
 * account linked to a Facebook Page.
 *
 * Prerequisites:
 * - Instagram account must be Business or Creator type
 * - Instagram account must be linked to a Facebook Page
 * - User must have admin permissions on the Page
 *
 * @see https://developers.facebook.com/docs/instagram-api/getting-started
 */

import type { SocialAccountMetadata } from '../types';

import {
  checkFacebookConfig,
  getAuthorizationUrl as getFacebookAuthUrl,
  exchangeCodeForToken as exchangeFacebookCode,
  exchangeForLongLivedToken,
  getFacebookPages,
  getInstagramAccount as getFacebookInstagramAccount,
  type FacebookOAuthConfig,
} from './facebook';
import type {
  OAuthProvider,
  OAuthTokens,
  ConfigCheckResult,
  InstagramBusinessAccount,
  FacebookPageInfo,
} from './types';

// ===========================================
// Configuration
// ===========================================

const DEFAULT_GRAPH_API_VERSION = 'v18.0';

function getGraphApiBase(version = DEFAULT_GRAPH_API_VERSION) {
  return `https://graph.facebook.com/${version}`;
}

/**
 * Instagram-specific scopes (subset of Facebook scopes)
 */
export const INSTAGRAM_SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_insights',
  'pages_show_list',
  'pages_read_engagement',
  'business_management',
];

// ===========================================
// Instagram OAuth Functions
// ===========================================

/**
 * Check if Instagram OAuth is configured (uses Facebook config)
 */
export const checkInstagramConfig = checkFacebookConfig;

/**
 * Generate authorization URL (uses Facebook OAuth flow)
 */
export function getAuthorizationUrl(
  redirectUri: string,
  state: string,
  config?: FacebookOAuthConfig
): string {
  return getFacebookAuthUrl(redirectUri, state, config);
}

/**
 * Exchange authorization code for token (same as Facebook)
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  config?: FacebookOAuthConfig
): Promise<OAuthTokens> {
  return exchangeFacebookCode(code, redirectUri, config);
}

/**
 * Get all Instagram Business accounts linked to Facebook Pages
 */
export async function getInstagramAccounts(
  accessToken: string,
  config?: FacebookOAuthConfig
): Promise<InstagramBusinessAccount[]> {
  const pages = await getFacebookPages(accessToken, config);
  const instagramAccounts: InstagramBusinessAccount[] = [];

  for (const page of pages) {
    if (page.instagramAccount) {
      try {
        const igDetails = await getFacebookInstagramAccount(
          page.pageAccessToken,
          page.instagramAccount.id,
          config
        );

        instagramAccounts.push({
          id: igDetails.id,
          username: igDetails.username,
          profilePictureUrl: igDetails.profile_picture_url,
          followersCount: igDetails.followers_count,
          linkedPageId: page.pageId,
          linkedPageName: page.pageName,
        });
      } catch (error) {
        // Skip if we can't access the Instagram account
        console.warn(
          `[Instagram] Cannot access Instagram account for page ${page.pageName}:`,
          error
        );
      }
    }
  }

  return instagramAccounts;
}

/**
 * Get Instagram Business account details
 */
export async function getInstagramAccountDetails(
  accessToken: string,
  instagramAccountId: string,
  config?: FacebookOAuthConfig
): Promise<InstagramBusinessAccount | null> {
  const graphApiBase = getGraphApiBase(config?.graphApiVersion);

  try {
    const response = await fetch(
      `${graphApiBase}/${instagramAccountId}?fields=id,username,name,profile_picture_url,followers_count,media_count,biography,website&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = (await response.json()) as { error?: { message?: string } };
      throw new Error(error.error?.message || 'Request failed');
    }

    const data = (await response.json()) as {
      id: string;
      username: string;
      name?: string;
      profile_picture_url?: string;
      followers_count?: number;
      media_count?: number;
      biography?: string;
      website?: string;
    };

    // Get linked page info
    const pagesResponse = await fetch(
      `${graphApiBase}/${instagramAccountId}?fields=instagram_business_account{id},id,name&access_token=${accessToken}`
    );

    let linkedPageId = '';
    let linkedPageName = '';

    if (pagesResponse.ok) {
      const pageData = (await pagesResponse.json()) as { id?: string; name?: string };
      linkedPageId = pageData.id || '';
      linkedPageName = pageData.name || '';
    }

    return {
      id: data.id,
      username: data.username,
      name: data.name,
      profilePictureUrl: data.profile_picture_url,
      followersCount: data.followers_count,
      mediaCount: data.media_count,
      biography: data.biography,
      website: data.website,
      linkedPageId,
      linkedPageName,
    };
  } catch (error) {
    console.error('[Instagram] Account details fetch error:', error);
    return null;
  }
}

/**
 * Check Instagram permissions on an account
 */
export async function checkInstagramPermissions(
  accessToken: string,
  instagramAccountId: string,
  config?: FacebookOAuthConfig
): Promise<{
  canPublish: boolean;
  canReadInsights: boolean;
  missingPermissions: string[];
}> {
  const graphApiBase = getGraphApiBase(config?.graphApiVersion);
  const missingPermissions: string[] = [];
  let canPublish = false;
  let canReadInsights = false;

  try {
    // Test publish access
    const publishTestResponse = await fetch(
      `${graphApiBase}/${instagramAccountId}/media?access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (publishTestResponse.ok) {
      canPublish = true;
    } else {
      missingPermissions.push('instagram_content_publish');
    }

    // Test insights access
    const insightsResponse = await fetch(
      `${graphApiBase}/${instagramAccountId}/insights?metric=impressions,reach&period=day&access_token=${accessToken}`
    );

    if (insightsResponse.ok) {
      canReadInsights = true;
    } else {
      missingPermissions.push('instagram_manage_insights');
    }
  } catch {
    missingPermissions.push('instagram_content_publish', 'instagram_manage_insights');
  }

  return {
    canPublish,
    canReadInsights,
    missingPermissions,
  };
}

/**
 * Get Page Access Token for Instagram publishing
 */
export async function getPageTokenForInstagram(
  userAccessToken: string,
  linkedPageId: string,
  config?: FacebookOAuthConfig
): Promise<string | null> {
  const pages = await getFacebookPages(userAccessToken, config);
  const page = pages.find(p => p.pageId === linkedPageId);
  return page?.pageAccessToken || null;
}

/**
 * Build account metadata for Instagram
 */
export function buildAccountMetadata(
  account: InstagramBusinessAccount,
  _page: FacebookPageInfo
): SocialAccountMetadata {
  return {
    igUserId: account.id,
    igUsername: account.username,
    linkedFacebookPageId: account.linkedPageId,
    pageName: account.linkedPageName,
    avatarUrl: account.profilePictureUrl,
  };
}

/**
 * Validate Instagram token
 */
export async function validateInstagramToken(
  accessToken: string,
  instagramAccountId: string,
  config?: FacebookOAuthConfig
): Promise<boolean> {
  const graphApiBase = getGraphApiBase(config?.graphApiVersion);

  try {
    const response = await fetch(
      `${graphApiBase}/${instagramAccountId}?fields=id&access_token=${accessToken}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Ensure valid token for Instagram publishing
 */
export async function ensureValidToken(
  userAccessToken: string,
  pageId: string,
  config?: FacebookOAuthConfig
): Promise<string> {
  const pageToken = await getPageTokenForInstagram(userAccessToken, pageId, config);

  if (!pageToken) {
    throw new Error('Cannot retrieve page token for Instagram');
  }

  return pageToken;
}

/**
 * Calculate token expiry
 * Note: Page Access Tokens don't expire if User Token is long-lived
 */
export function calculateTokenExpiry(expiresIn?: number): Date | null {
  if (!expiresIn) {
    return null; // Page tokens don't expire
  }
  return new Date(Date.now() + expiresIn * 1000);
}

// ===========================================
// Provider class for standardized interface
// ===========================================

export class InstagramOAuthProvider implements OAuthProvider {
  readonly name = 'Instagram';
  private config?: FacebookOAuthConfig;

  constructor(config?: FacebookOAuthConfig) {
    this.config = config;
  }

  checkConfig(): ConfigCheckResult {
    return checkInstagramConfig(this.config);
  }

  getAuthorizationUrl(redirectUri: string, state: string): string {
    return getAuthorizationUrl(redirectUri, state, this.config);
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokens> {
    return exchangeCodeForToken(code, redirectUri, this.config);
  }

  calculateTokenExpiry(expiresIn: number): Date {
    return calculateTokenExpiry(expiresIn) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }

  validateToken(accessToken: string): Promise<boolean> {
    // For Instagram, we need the account ID to validate
    // This basic check just verifies the token format
    return Promise.resolve(accessToken.length > 0);
  }
}

// Re-export long-lived token exchange for convenience
export { exchangeForLongLivedToken };
