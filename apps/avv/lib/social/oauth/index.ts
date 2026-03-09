/**
 * Module OAuth pour les réseaux sociaux
 *
 * MIGRATION PHASE 6: Ce module réexporte maintenant depuis @kairn/social/oauth
 * pour mutualiser le code d'authentification OAuth.
 *
 * Plateformes supportées:
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

// Re-export everything from @kairn/social/oauth
export * from '@kairn/social/oauth';

// Re-export namespace modules for backward compatibility
export { facebook, linkedin, instagram, threads, twitter } from '@kairn/social/oauth';

// Re-export common types and constants
export { FACEBOOK_SCOPES, type FacebookPageInfo } from '@kairn/social/oauth';
export { LINKEDIN_SCOPES } from '@kairn/social/oauth';
export { INSTAGRAM_SCOPES } from '@kairn/social/oauth';
export { THREADS_SCOPES, THREADS_MINIMAL_SCOPES } from '@kairn/social/oauth';
export { TWITTER_SCOPES, TWITTER_MINIMAL_SCOPES } from '@kairn/social/oauth';

// Re-export token manager
export { TokenManager, type TokenManagerConfig, type TokenStorage } from '@kairn/social/oauth';

// Re-export crypto utilities
export { encryptToken, decryptToken, isEncryptedToken, generateStateToken } from '@kairn/social/oauth';

// Local types for backward compatibility
export type LinkedInAccountInfo = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profilePicture?: string;
};

export type InstagramBusinessAccount = {
  id: string;
  username: string;
  profilePictureUrl?: string;
  followersCount?: number;
};

export type ThreadsAccountInfo = {
  id: string;
  username: string;
  profilePictureUrl?: string;
};

export type TwitterAccountInfo = {
  id: string;
  username: string;
  name: string;
  profileImageUrl?: string;
};
