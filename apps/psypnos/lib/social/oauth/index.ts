// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Module OAuth pour les réseaux sociaux
 *
 * Ce module expose les fonctions d'authentification OAuth pour:
 * - Facebook (Pages + Instagram Business)
 * - LinkedIn (Profil personnel)
 * - Instagram (via Facebook Graph API)
 * - Threads (via Threads API)
 * - Twitter/X (via Twitter API v2)
 *
 * @example
 * import { facebook, linkedin, instagram, threads, twitter } from '@/lib/social/oauth';
 *
 * // Générer l'URL d'autorisation
 * const authUrl = facebook.getAuthorizationUrl(redirectUri, state);
 *
 * // Échanger le code contre un token
 * const { accessToken } = await facebook.exchangeCodeForToken(code, redirectUri);
 */

export * as facebook from './facebook';
export * as linkedin from './linkedin';
export * as instagram from './instagram';
export * as threads from './threads';
export * as twitter from './twitter';

// Ré-export des types et fonctions utiles
export {
  FACEBOOK_SCOPES,
  type FacebookPageInfo,
} from './facebook';

export {
  LINKEDIN_SCOPES,
  type LinkedInAccountInfo,
} from './linkedin';

export {
  INSTAGRAM_SCOPES,
  type InstagramBusinessAccount,
} from './instagram';

export {
  THREADS_SCOPES,
  type ThreadsAccountInfo,
} from './threads';

export {
  TWITTER_SCOPES,
  type TwitterAccountInfo,
} from './twitter';
