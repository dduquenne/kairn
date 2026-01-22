// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Instagram Business OAuth Implementation
 *
 * Instagram Business/Creator accounts sont gérés via Facebook Graph API.
 * L'authentification se fait via Facebook OAuth, puis on accède au compte
 * Instagram Business lié à une Page Facebook.
 *
 * Prérequis:
 * - Le compte Instagram doit être un compte Business ou Creator
 * - Le compte Instagram doit être lié à une Page Facebook
 * - L'utilisateur doit avoir les permissions d'admin sur la Page
 *
 * @see https://developers.facebook.com/docs/instagram-api/getting-started
 */

import { SocialAccountMetadata } from '../types';
import {
  checkFacebookConfig,
  getAuthorizationUrl as getFacebookAuthUrl,
  exchangeCodeForToken as exchangeFacebookCode,
  exchangeForLongLivedToken,
  getFacebookPages,
  getInstagramAccount,
  FacebookPageInfo,
  FACEBOOK_SCOPES,
} from './facebook';

// ===========================================
// Configuration
// ===========================================

const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Scopes spécifiques pour Instagram (sous-ensemble des scopes Facebook)
 */
export const INSTAGRAM_SCOPES = FACEBOOK_SCOPES.filter((scope) =>
  [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
    'business_management',
  ].includes(scope)
);

// ===========================================
// Types
// ===========================================

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

interface InstagramMediaInsights {
  impressions: number;
  reach: number;
  engagement: number;
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Vérifie que les credentials sont configurés (utilise Facebook)
 */
export const checkInstagramConfig = checkFacebookConfig;

/**
 * Génère l'URL d'autorisation OAuth pour Instagram
 * (utilise le même flow Facebook mais avec des scopes Instagram)
 */
export function getAuthorizationUrl(redirectUri: string, state: string): string {
  return getFacebookAuthUrl(redirectUri, state);
}

/**
 * Échange le code d'autorisation contre un access token
 * (identique à Facebook)
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresIn?: number }> {
  return exchangeFacebookCode(code, redirectUri);
}

/**
 * Récupère tous les comptes Instagram Business liés aux Pages Facebook
 */
export async function getInstagramAccounts(
  accessToken: string
): Promise<InstagramBusinessAccount[]> {
  const pages = await getFacebookPages(accessToken);

  const instagramAccounts: InstagramBusinessAccount[] = [];

  for (const page of pages) {
    if (page.instagramAccount) {
      try {
        const igDetails = await getInstagramAccount(
          page.pageAccessToken,
          page.instagramAccount.id
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
        // Si on ne peut pas accéder au compte Instagram, on l'ignore
        console.warn(
          `[Instagram] Impossible d'accéder au compte Instagram de la page ${page.pageName}:`,
          error
        );
      }
    }
  }

  return instagramAccounts;
}

/**
 * Récupère les détails d'un compte Instagram Business
 */
export async function getInstagramAccountDetails(
  accessToken: string,
  instagramAccountId: string
): Promise<InstagramBusinessAccount | null> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${instagramAccountId}?fields=id,username,name,profile_picture_url,followers_count,media_count,biography,website&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Échec de la requête');
    }

    const data = await response.json();

    // Récupérer la page liée
    const pagesResponse = await fetch(
      `${GRAPH_API_BASE}/${instagramAccountId}?fields=instagram_business_account{id},id,name&access_token=${accessToken}`
    );

    let linkedPageId = '';
    let linkedPageName = '';

    if (pagesResponse.ok) {
      const pageData = await pagesResponse.json();
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
    console.error('[Instagram] Erreur récupération détails compte:', error);
    return null;
  }
}

/**
 * Vérifie les permissions Instagram sur un compte
 */
export async function checkInstagramPermissions(
  accessToken: string,
  instagramAccountId: string
): Promise<{
  canPublish: boolean;
  canReadInsights: boolean;
  missingPermissions: string[];
}> {
  const missingPermissions: string[] = [];
  let canPublish = false;
  let canReadInsights = false;

  try {
    // Test de publication (on vérifie juste qu'on peut accéder à l'endpoint)
    const publishTestResponse = await fetch(
      `${GRAPH_API_BASE}/${instagramAccountId}/media?access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (publishTestResponse.ok) {
      canPublish = true;
    } else {
      missingPermissions.push('instagram_content_publish');
    }

    // Test des insights
    const insightsResponse = await fetch(
      `${GRAPH_API_BASE}/${instagramAccountId}/insights?metric=impressions,reach&period=day&access_token=${accessToken}`
    );

    if (insightsResponse.ok) {
      canReadInsights = true;
    } else {
      missingPermissions.push('instagram_manage_insights');
    }
  } catch {
    // En cas d'erreur réseau, on considère qu'on n'a pas les permissions
    missingPermissions.push('instagram_content_publish', 'instagram_manage_insights');
  }

  return {
    canPublish,
    canReadInsights,
    missingPermissions,
  };
}

/**
 * Récupère le Page Access Token pour un compte Instagram
 * Le token de page est nécessaire pour publier sur Instagram
 */
export async function getPageTokenForInstagram(
  userAccessToken: string,
  linkedPageId: string
): Promise<string | null> {
  const pages = await getFacebookPages(userAccessToken);
  const page = pages.find((p) => p.pageId === linkedPageId);

  return page?.pageAccessToken || null;
}

/**
 * Construit les métadonnées du compte Instagram
 */
export function buildAccountMetadata(
  account: InstagramBusinessAccount,
  page: FacebookPageInfo
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
 * Vérifie si un token Instagram est valide
 */
export async function validateInstagramToken(
  accessToken: string,
  instagramAccountId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${instagramAccountId}?fields=id&access_token=${accessToken}`
    );

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Les tokens Instagram (via Facebook) n'expirent pas s'ils sont
 * des Page Access Tokens dérivés d'un Long-Lived User Token.
 * Cette fonction vérifie et renouvelle si nécessaire.
 */
export async function ensureValidToken(
  userAccessToken: string,
  pageId: string
): Promise<string> {
  // Récupérer un nouveau Page Access Token
  const pageToken = await getPageTokenForInstagram(userAccessToken, pageId);

  if (!pageToken) {
    throw new Error('Impossible de récupérer le token de page pour Instagram');
  }

  return pageToken;
}

/**
 * Calcule la date d'expiration du token
 * Note: Les Page Access Tokens n'expirent pas si le User Token est long-lived
 */
export function calculateTokenExpiry(expiresIn?: number): Date | null {
  if (!expiresIn) {
    // Page Access Token - n'expire pas
    return null;
  }
  return new Date(Date.now() + expiresIn * 1000);
}
