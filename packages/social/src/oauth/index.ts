/**
 * @kairn/social/oauth - OAuth Module
 *
 * OAuth 2.0 implementations for social media platforms.
 */

// Types
export * from './types';

// Facebook
export * as facebook from './facebook';
export { FacebookOAuthProvider, FACEBOOK_SCOPES } from './facebook';

// Instagram (uses Facebook OAuth)
export * as instagram from './instagram';
export { InstagramOAuthProvider, INSTAGRAM_SCOPES } from './instagram';

// LinkedIn
export * as linkedin from './linkedin';
export { LinkedInOAuthProvider, LINKEDIN_SCOPES } from './linkedin';

// Twitter (with PKCE)
export * as twitter from './twitter';
export {
  TwitterOAuthProvider,
  TWITTER_SCOPES,
  TWITTER_MINIMAL_SCOPES,
  generateCodeVerifier,
  generateCodeChallenge,
} from './twitter';

// Threads
export * as threads from './threads';
export { ThreadsOAuthProvider, THREADS_SCOPES, THREADS_MINIMAL_SCOPES } from './threads';

// Token Manager
export {
  TokenManager,
  shouldRefreshToken,
  refreshPlatformToken,
  type TokenManagerConfig,
  type TokenStorage,
} from './token-manager';

// Crypto utilities (re-exported for convenience)
export {
  encryptToken,
  decryptToken,
  isEncryptedToken,
  generateEncryptionKey,
  testEncryption,
  generateStateToken,
} from '../utils/crypto';
