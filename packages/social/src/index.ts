/**
 * @kairn/social - Social Media Integration Module
 *
 * Provides OAuth authentication and post publishing for social media platforms:
 * - Facebook (Pages)
 * - Instagram (Business/Creator)
 * - LinkedIn (Personal & Organization)
 * - Twitter/X
 * - Threads
 *
 * @example OAuth Flow
 * ```typescript
 * import { facebook, generateStateToken } from '@kairn/social/oauth';
 *
 * // Generate state for CSRF protection
 * const state = generateStateToken();
 *
 * // Get authorization URL
 * const authUrl = facebook.getAuthorizationUrl(redirectUri, state);
 *
 * // After callback, exchange code for tokens
 * const tokens = await facebook.exchangeCodeForToken(code, redirectUri);
 * ```
 *
 * @example Publishing
 * ```typescript
 * import { getPublisher } from '@kairn/social/posting';
 *
 * const publisher = getPublisher('FACEBOOK');
 * const result = await publisher.publish({
 *   content: 'Hello, world!',
 *   mediaUrls: [],
 *   hashtags: ['hello'],
 *   linkUrl: 'https://example.com',
 *   accessToken: 'your-access-token',
 *   accountMetadata: { pageId: 'your-page-id' },
 * });
 * ```
 */

// Version
export const VERSION = '0.0.1';

// Core types
export * from './types';

// Re-export modules for convenient access
export * as oauth from './oauth';
export * as posting from './posting';
export * as utils from './utils';

// Convenience re-exports from oauth
export {
  encryptToken,
  decryptToken,
  isEncryptedToken,
  generateEncryptionKey,
  generateStateToken,
  TokenManager,
  type TokenStorage,
  type TokenManagerConfig,
} from './oauth';

// Convenience re-exports from posting
export {
  getPublisher,
  PostScheduler,
  MultiPublisher,
  type PostStorage,
  type SchedulerConfig,
  type MultiPublisherConfig,
} from './posting';
