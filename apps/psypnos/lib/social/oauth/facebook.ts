// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Facebook OAuth 2.0 Implementation
 *
 * Gère l'authentification OAuth avec Facebook pour accéder aux pages Facebook
 * et aux comptes Instagram Business connectés.
 *
 * Scopes requis:
 * - pages_manage_posts: Publier sur les pages
 * - pages_read_engagement: Lire les statistiques
 * - instagram_basic: Accès de base Instagram
 * - instagram_content_publish: Publier sur Instagram
 *
 * @see https://developers.facebook.com/docs/facebook-login/guides/access-tokens
 */

import { SocialAccountMetadata } from '../types';

// ===========================================
// Configuration
// ===========================================

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Scopes demandés pour Facebook et Instagram
 *
 * Inclut les permissions Instagram Business nécessaires pour :
 * - Accéder aux comptes Instagram liés aux Pages Facebook
 * - Publier du contenu sur Instagram
 * - Lire les statistiques Instagram
 */
export const FACEBOOK_SCOPES = [
  // Permissions Facebook Pages
  'pages_manage_posts',        // Publier sur les pages
  'pages_read_engagement',     // Lire les statistiques des pages
  'pages_show_list',           // Voir la liste des pages
  // Permissions Instagram Business
  'instagram_basic',           // Accès de base au compte Instagram
  'instagram_content_publish', // Publier sur Instagram
  'instagram_manage_insights', // Lire les statistiques Instagram
  'business_management',       // Gestion des assets business
];

/**
 * Scopes additionnels (optionnels)
 */
export const FACEBOOK_ADVANCED_SCOPES = [
  'pages_read_user_content',   // Lire le contenu des pages
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

// ===========================================
// Helper Functions
// ===========================================

/**
 * Vérifie que les credentials Facebook sont configurés
 */
export function checkFacebookConfig(): { valid: boolean; error?: string } {
  if (!FACEBOOK_APP_ID) {
    return { valid: false, error: 'FACEBOOK_APP_ID non configuré' };
  }
  if (!FACEBOOK_APP_SECRET) {
    return { valid: false, error: 'FACEBOOK_APP_SECRET non configuré' };
  }
  return { valid: true };
}

/**
 * Génère l'URL d'autorisation OAuth Facebook
 */
export function getAuthorizationUrl(redirectUri: string, state: string): string {
  const config = checkFacebookConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID!,
    redirect_uri: redirectUri,
    state,
    scope: FACEBOOK_SCOPES.join(','),
    response_type: 'code',
    auth_type: 'rerequest', // Force re-demander les permissions
  });

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

/**
 * Échange le code d'autorisation contre un access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresIn?: number }> {
  const config = checkFacebookConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID!,
    client_secret: FACEBOOK_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Erreur Facebook OAuth: ${error.error?.message || 'Échec de l\'échange de token'}`
    );
  }

  const data: FacebookTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Échange un token court terme contre un token long terme (60 jours)
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const config = checkFacebookConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: FACEBOOK_APP_ID!,
    client_secret: FACEBOOK_APP_SECRET!,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Erreur échange token long terme: ${error.error?.message || 'Échec de l\'échange'}`
    );
  }

  const data: FacebookTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000, // 60 jours par défaut
  };
}

/**
 * Récupère les informations de l'utilisateur Facebook
 */
export async function getFacebookUser(accessToken: string): Promise<FacebookUser> {
  const response = await fetch(`${GRAPH_API_BASE}/me?fields=id,name,email&access_token=${accessToken}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Erreur récupération utilisateur: ${error.error?.message || 'Échec de la requête'}`
    );
  }

  return response.json();
}

/**
 * Récupère les pages Facebook de l'utilisateur
 */
export async function getFacebookPages(accessToken: string): Promise<FacebookPageInfo[]> {
  const response = await fetch(
    `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,category,instagram_business_account{id,username}&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Erreur récupération pages: ${error.error?.message || 'Échec de la requête'}`
    );
  }

  const data: FacebookPagesResponse = await response.json();

  return data.data.map((page) => ({
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
 * Récupère les informations d'un compte Instagram Business
 */
export async function getInstagramAccount(
  accessToken: string,
  instagramAccountId: string
): Promise<InstagramAccount> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${instagramAccountId}?fields=id,username,profile_picture_url,followers_count&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Erreur récupération compte Instagram: ${error.error?.message || 'Échec de la requête'}`
    );
  }

  return response.json();
}

/**
 * Vérifie si un token est encore valide
 */
export async function debugToken(accessToken: string): Promise<{
  isValid: boolean;
  expiresAt?: Date;
  scopes?: string[];
  userId?: string;
  appId?: string;
}> {
  const config = checkFacebookConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const response = await fetch(
    `${GRAPH_API_BASE}/debug_token?input_token=${accessToken}&access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`
  );

  if (!response.ok) {
    return { isValid: false };
  }

  const data = await response.json();
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
 * Rafraîchit un Page Access Token (les page tokens n'expirent pas si le user token est long-lived)
 * Pour les tokens utilisateur, on doit ré-authentifier
 */
export async function refreshPageToken(
  userAccessToken: string,
  pageId: string
): Promise<string> {
  // Les Page Access Tokens générés à partir d'un long-lived user token n'expirent jamais
  // On récupère simplement le nouveau token de la page
  const pages = await getFacebookPages(userAccessToken);
  const page = pages.find((p) => p.pageId === pageId);

  if (!page) {
    throw new Error(`Page ${pageId} non trouvée ou accès révoqué`);
  }

  return page.pageAccessToken;
}

/**
 * Construit les métadonnées du compte à partir des infos Facebook
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
 * Calcule la date d'expiration du token
 */
export function calculateTokenExpiry(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000);
}
