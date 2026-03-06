/**
 * Token Utilities
 *
 * Provides hashing for refresh tokens using SHA-256.
 * Refresh tokens are never stored in plain text.
 */

import { createHash } from 'crypto';

/**
 * Hash a token using SHA-256
 *
 * @param token - The raw token to hash
 * @returns The hex-encoded SHA-256 hash
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
