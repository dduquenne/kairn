/**
 * @kairn/social - Token Manager
 *
 * Service for managing OAuth token lifecycle:
 * - Token encryption/decryption for secure storage
 * - Automatic token refresh before expiration
 * - Token validation
 *
 * Strategies per platform:
 * - Facebook: Page Access Tokens don't expire when derived from long-lived tokens
 * - Instagram: Uses Facebook Page Access Tokens (don't expire)
 * - LinkedIn: Tokens expire after 60 days, refresh token available
 * - Twitter: Tokens expire after 2 hours, refresh token available
 * - Threads: Tokens expire after 60 days, can be refreshed
 */

import type { SocialPlatform, SocialAccountFull } from '../types';
import { encryptToken, decryptToken, isEncryptedToken } from '../utils/crypto';

import * as linkedin from './linkedin';
import * as threads from './threads';
import * as twitter from './twitter';
import type { OAuthTokens, TokenRefreshResult, TokenRefreshBatchResult } from './types';

// Refresh threshold (7 days before expiration)
const REFRESH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

// Maximum refresh attempts
const MAX_REFRESH_ATTEMPTS = 3;

// Delay between retry attempts (ms)
const RETRY_DELAY_MS = 1000;

/**
 * Token manager configuration
 */
export interface TokenManagerConfig {
  /** Encryption key (64-char hex) */
  encryptionKey?: string;
  /** Refresh threshold in milliseconds */
  refreshThresholdMs?: number;
  /** Maximum refresh attempts */
  maxRefreshAttempts?: number;
}

/**
 * Token storage interface
 * Implement this to integrate with your database
 */
export interface TokenStorage {
  /** Get an account by ID */
  getAccount(accountId: string): Promise<SocialAccountFull | null>;

  /** Get all active accounts */
  getAllActiveAccounts(): Promise<SocialAccountFull[]>;

  /** Get accounts needing token refresh */
  getAccountsNeedingRefresh(thresholdDate: Date): Promise<SocialAccountFull[]>;

  /** Update account tokens */
  updateAccountTokens(
    accountId: string,
    data: {
      accessToken: string;
      refreshToken?: string | null;
      tokenExpiry?: Date | null;
    }
  ): Promise<void>;

  /** Mark account as inactive (needs reconnection) */
  markAccountInactive(accountId: string): Promise<void>;
}

/**
 * Check if a token should be refreshed
 */
export function shouldRefreshToken(
  tokenExpiry: Date | null,
  thresholdMs = REFRESH_THRESHOLD_MS
): boolean {
  if (!tokenExpiry) {
    // No expiration = no refresh needed (Facebook/Instagram Page Tokens)
    return false;
  }

  const expiryTime = tokenExpiry.getTime();
  const refreshThreshold = Date.now() + thresholdMs;

  return expiryTime < refreshThreshold;
}

/**
 * Refresh token for a specific platform
 */
export async function refreshPlatformToken(
  platform: SocialPlatform,
  refreshToken: string
): Promise<OAuthTokens> {
  switch (platform) {
    case 'LINKEDIN':
      return linkedin.refreshAccessToken(refreshToken);

    case 'TWITTER':
      return twitter.refreshAccessToken(refreshToken);

    case 'THREADS':
      return threads.refreshLongLivedToken(refreshToken);

    case 'FACEBOOK':
    case 'INSTAGRAM':
      // Page Access Tokens don't expire
      throw new Error(`${platform as string} tokens don't require refresh`);

    default: {
      const unknownPlatform: string = platform;
      throw new Error(`Platform ${unknownPlatform} not supported for token refresh`);
    }
  }
}

/**
 * Token Manager class
 */
export class TokenManager {
  private storage: TokenStorage;
  private config: Required<Omit<TokenManagerConfig, 'encryptionKey'>> & {
    encryptionKey?: string;
  };

  constructor(storage: TokenStorage, config?: TokenManagerConfig) {
    this.storage = storage;
    this.config = {
      encryptionKey: config?.encryptionKey,
      refreshThresholdMs: config?.refreshThresholdMs || REFRESH_THRESHOLD_MS,
      maxRefreshAttempts: config?.maxRefreshAttempts || MAX_REFRESH_ATTEMPTS,
    };
  }

  /**
   * Encrypt a token for storage
   */
  encrypt(token: string): string {
    return encryptToken(token, { encryptionKey: this.config.encryptionKey });
  }

  /**
   * Decrypt a token from storage
   */
  decrypt(encryptedToken: string): string {
    return decryptToken(encryptedToken, { encryptionKey: this.config.encryptionKey });
  }

  /**
   * Check if a token is encrypted
   */
  isEncrypted(token: string): boolean {
    return isEncryptedToken(token);
  }

  /**
   * Get decrypted access token for an account
   */
  async getAccessToken(accountId: string): Promise<string | null> {
    const account = await this.storage.getAccount(accountId);
    if (!account?.accessToken) return null;

    try {
      return this.decrypt(account.accessToken);
    } catch {
      // Token might not be encrypted (legacy)
      return account.accessToken;
    }
  }

  /**
   * Refresh token for a single account
   */
  async refreshAccountToken(account: SocialAccountFull): Promise<TokenRefreshResult> {
    const { id, platform, refreshToken } = account;

    // Facebook and Instagram Page tokens don't expire
    if (platform === 'FACEBOOK' || platform === 'INSTAGRAM') {
      return {
        accountId: id,
        platform,
        success: true,
        message: 'Page tokens do not expire',
      };
    }

    if (!refreshToken) {
      return {
        accountId: id,
        platform,
        success: false,
        message: 'No refresh token available. Reconnection required.',
      };
    }

    try {
      // Decrypt refresh token
      let decryptedRefreshToken: string;
      try {
        decryptedRefreshToken = this.decrypt(refreshToken);
      } catch {
        decryptedRefreshToken = refreshToken;
      }

      // Refresh the token
      const newTokens = await refreshPlatformToken(platform, decryptedRefreshToken);

      // Calculate new expiry
      let newExpiry: Date | undefined;
      if (newTokens.expiresIn) {
        if (platform === 'LINKEDIN') {
          newExpiry = linkedin.calculateTokenExpiry(newTokens.expiresIn);
        } else if (platform === 'TWITTER') {
          newExpiry = twitter.calculateTokenExpiry(newTokens.expiresIn);
        } else if (platform === 'THREADS') {
          newExpiry = threads.calculateTokenExpiry(newTokens.expiresIn);
        } else {
          newExpiry = new Date(Date.now() + newTokens.expiresIn * 1000);
        }
      }

      // Update storage
      await this.storage.updateAccountTokens(id, {
        accessToken: this.encrypt(newTokens.accessToken),
        refreshToken: newTokens.refreshToken
          ? this.encrypt(newTokens.refreshToken)
          : account.refreshToken,
        tokenExpiry: newExpiry,
      });

      return {
        accountId: id,
        platform,
        success: true,
        message: 'Token refreshed successfully',
        newExpiry,
        newAccessToken: newTokens.accessToken,
        newRefreshToken: newTokens.refreshToken,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        accountId: id,
        platform,
        success: false,
        message: `Refresh failed: ${message}`,
      };
    }
  }

  /**
   * Refresh all expiring tokens
   */
  async refreshAllExpiringTokens(): Promise<TokenRefreshBatchResult> {
    const thresholdDate = new Date(Date.now() + this.config.refreshThresholdMs);
    const accounts = await this.storage.getAccountsNeedingRefresh(thresholdDate);

    const results: TokenRefreshResult[] = [];
    let refreshed = 0;
    let failed = 0;
    let skipped = 0;

    for (const account of accounts) {
      // Skip platforms that don't expire
      if (account.platform === 'FACEBOOK' || account.platform === 'INSTAGRAM') {
        skipped++;
        continue;
      }

      let lastError: string | null = null;
      let success = false;

      // Retry with backoff
      for (let attempt = 1; attempt <= this.config.maxRefreshAttempts; attempt++) {
        try {
          const result = await this.refreshAccountToken(account);
          results.push(result);

          if (result.success) {
            refreshed++;
            success = true;
            break;
          } else {
            lastError = result.message;
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
        }

        // Wait before retry
        if (attempt < this.config.maxRefreshAttempts) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
      }

      if (!success) {
        failed++;
        results.push({
          accountId: account.id,
          platform: account.platform,
          success: false,
          message: lastError || 'Failed after multiple attempts',
        });

        // Mark account as needing reconnection if refresh fails
        await this.storage.markAccountInactive(account.id);
      }
    }

    return {
      total: accounts.length,
      refreshed,
      failed,
      skipped,
      results,
    };
  }

  /**
   * Validate account token
   */
  async validateAccountToken(accountId: string): Promise<{
    valid: boolean;
    needsRefresh: boolean;
    expiresAt?: Date;
    message?: string;
  }> {
    const account = await this.storage.getAccount(accountId);

    if (!account) {
      return { valid: false, needsRefresh: false, message: 'Account not found' };
    }

    const needsRefresh = shouldRefreshToken(account.tokenExpiry, this.config.refreshThresholdMs);

    // For LinkedIn, verify with introspection API
    if (account.platform === 'LINKEDIN' && account.accessToken) {
      try {
        const decryptedToken = this.decrypt(account.accessToken);
        const introspection = await linkedin.introspectToken(decryptedToken);

        return {
          valid: introspection.active,
          needsRefresh,
          expiresAt: introspection.expiresAt || account.tokenExpiry || undefined,
        };
      } catch {
        return {
          valid: false,
          needsRefresh: true,
          message: 'Cannot verify token',
        };
      }
    }

    // For Twitter, validate with API
    if (account.platform === 'TWITTER' && account.accessToken) {
      try {
        const decryptedToken = this.decrypt(account.accessToken);
        const isValid = await twitter.validateToken(decryptedToken);

        return {
          valid: isValid,
          needsRefresh,
          expiresAt: account.tokenExpiry || undefined,
        };
      } catch {
        return {
          valid: false,
          needsRefresh: true,
          message: 'Cannot verify token',
        };
      }
    }

    // For Threads, validate with API
    if (account.platform === 'THREADS' && account.accessToken) {
      try {
        const decryptedToken = this.decrypt(account.accessToken);
        const isValid = await threads.validateToken(decryptedToken);

        return {
          valid: isValid,
          needsRefresh,
          expiresAt: account.tokenExpiry || undefined,
        };
      } catch {
        return {
          valid: false,
          needsRefresh: true,
          message: 'Cannot verify token',
        };
      }
    }

    // For Facebook/Instagram, assume valid (Page tokens don't expire)
    return {
      valid: true,
      needsRefresh: false,
      expiresAt: account.tokenExpiry || undefined,
    };
  }
}
