/**
 * JWT Secrets Manager
 *
 * Implements key rotation for JWT signing keys.
 * Supports multiple valid keys for seamless rotation without invalidating existing tokens.
 *
 * Key Rotation Strategy:
 * 1. Generate a new key and set it as current
 * 2. Previous key remains valid for verification (grace period)
 * 3. After grace period, old keys are invalidated
 * 4. Tokens signed with old keys will still verify during grace period
 */

import { type SecretsManagerInterface } from './jwt';
import { decryptSecretIfNeeded, encryptSecret, isEncryptionEnabled } from './secret-encryption';

/**
 * Secret key record structure (matches Prisma schema)
 */
export interface SecretKeyRecord {
  kid: string;
  secret: string;
  algorithm: string;
  isCurrent: boolean;
  isValid: boolean;
  activatedAt: Date;
  expiresAt: Date | null;
}

/**
 * Database interface for secrets storage
 */
export interface SecretsStorage {
  /** Get the current signing key */
  getCurrentKey(): Promise<SecretKeyRecord | null>;
  /** Get a key by its ID */
  getKeyByKid(kid: string): Promise<SecretKeyRecord | null>;
  /** Get all valid keys for verification */
  getValidKeys(): Promise<SecretKeyRecord[]>;
  /** Create a new key */
  createKey(key: Omit<SecretKeyRecord, 'activatedAt'>): Promise<SecretKeyRecord>;
  /** Update a key */
  updateKey(kid: string, data: Partial<SecretKeyRecord>): Promise<SecretKeyRecord>;
  /** Set a key as current (and unset others) */
  setCurrentKey(kid: string): Promise<void>;
  /** Invalidate expired keys */
  invalidateExpiredKeys(): Promise<number>;
}

/**
 * Configuration for the secrets manager
 */
export interface SecretsManagerConfig {
  /** Storage implementation */
  storage: SecretsStorage;
  /** Default algorithm for new keys */
  defaultAlgorithm?: 'HS256' | 'HS384' | 'HS512';
  /** Grace period for old keys (in milliseconds) */
  keyGracePeriodMs?: number;
  /** Enable caching of keys */
  enableCache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTtlMs?: number;
}

/**
 * In-memory cache for secrets
 */
interface SecretsCache {
  currentKey: SecretKeyRecord | null;
  validKeys: SecretKeyRecord[];
  lastFetch: number;
}

/**
 * Generate a cryptographically secure random string
 */
function generateSecureSecret(length: number = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a unique key ID
 */
function generateKid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `key-${timestamp}-${random}`;
}

/**
 * Database-backed Secrets Manager
 *
 * Implements the SecretsManagerInterface for JWT signing with support for:
 * - Multiple valid keys for seamless rotation
 * - Automatic key expiration
 * - In-memory caching to reduce database calls
 */
export class DatabaseSecretsManager implements SecretsManagerInterface {
  private storage: SecretsStorage;
  private defaultAlgorithm: 'HS256' | 'HS384' | 'HS512';
  private keyGracePeriodMs: number;
  private enableCache: boolean;
  private cacheTtlMs: number;
  private cache: SecretsCache | null = null;

  constructor(config: SecretsManagerConfig) {
    this.storage = config.storage;
    this.defaultAlgorithm = config.defaultAlgorithm || 'HS256';
    this.keyGracePeriodMs = config.keyGracePeriodMs || 7 * 24 * 60 * 60 * 1000; // 7 days
    this.enableCache = config.enableCache ?? true;
    this.cacheTtlMs = config.cacheTtlMs || 60 * 1000; // 1 minute
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    if (!this.enableCache || !this.cache) {
      return false;
    }
    return Date.now() - this.cache.lastFetch < this.cacheTtlMs;
  }

  /**
   * Refresh the cache from storage
   */
  private async refreshCache(): Promise<void> {
    const [currentKey, validKeys] = await Promise.all([
      this.storage.getCurrentKey(),
      this.storage.getValidKeys(),
    ]);

    this.cache = {
      currentKey,
      validKeys,
      lastFetch: Date.now(),
    };
  }

  /**
   * Get the current signing key, decrypting if envelope encryption is enabled
   */
  async getSigningKey(): Promise<Uint8Array> {
    if (!this.isCacheValid()) {
      await this.refreshCache();
    }

    const currentKey = this.cache?.currentKey;
    if (!currentKey) {
      throw new Error('No current signing key available. Initialize keys first.');
    }

    const plaintext = decryptSecretIfNeeded(currentKey.secret);
    return new TextEncoder().encode(plaintext);
  }

  /**
   * Get a verification key by its ID, decrypting if envelope encryption is enabled
   */
  async getVerificationKey(kid: string): Promise<Uint8Array | null> {
    if (!this.isCacheValid()) {
      await this.refreshCache();
    }

    // First check cache
    const cachedKey = this.cache?.validKeys.find(k => k.kid === kid);
    if (cachedKey) {
      const plaintext = decryptSecretIfNeeded(cachedKey.secret);
      return new TextEncoder().encode(plaintext);
    }

    // Fallback to direct storage lookup
    const key = await this.storage.getKeyByKid(kid);
    if (!key || !key.isValid) {
      return null;
    }

    const plaintext = decryptSecretIfNeeded(key.secret);
    return new TextEncoder().encode(plaintext);
  }

  /**
   * Get the current algorithm
   */
  getCurrentAlgorithm(): string {
    return this.cache?.currentKey?.algorithm || this.defaultAlgorithm;
  }

  /**
   * Get the current key ID
   */
  getCurrentKid(): string {
    if (!this.cache?.currentKey) {
      throw new Error('No current key available');
    }
    return this.cache.currentKey.kid;
  }

  /**
   * Get all valid key versions
   */
  getValidVersions(): Array<{ kid: string }> {
    return (this.cache?.validKeys || []).map(k => ({ kid: k.kid }));
  }

  /**
   * Initialize the secrets manager with a new key if none exists
   */
  async initialize(): Promise<void> {
    await this.refreshCache();

    if (!this.cache?.currentKey) {
      await this.rotateKey();
    }
  }

  /**
   * Rotate to a new signing key
   *
   * The old key remains valid for the grace period to allow
   * existing tokens to continue working.
   */
  async rotateKey(): Promise<SecretKeyRecord> {
    // Invalidate any expired keys first
    await this.storage.invalidateExpiredKeys();

    // Generate new key, encrypting the secret if envelope encryption is enabled
    const rawSecret = generateSecureSecret(64);
    const storedSecret = isEncryptionEnabled() ? encryptSecret(rawSecret) : rawSecret;

    const newKey: Omit<SecretKeyRecord, 'activatedAt'> = {
      kid: generateKid(),
      secret: storedSecret,
      algorithm: this.defaultAlgorithm,
      isCurrent: true,
      isValid: true,
      expiresAt: null, // Current key doesn't expire
    };

    // Set expiration on old current key
    if (this.cache?.currentKey) {
      const expiresAt = new Date(Date.now() + this.keyGracePeriodMs);
      await this.storage.updateKey(this.cache.currentKey.kid, {
        isCurrent: false,
        expiresAt,
      });
    }

    // Create new key and set as current
    const createdKey = await this.storage.createKey(newKey);
    await this.storage.setCurrentKey(createdKey.kid);

    // Refresh cache
    await this.refreshCache();

    return createdKey;
  }

  /**
   * Force invalidate a specific key
   */
  async invalidateKey(kid: string): Promise<void> {
    await this.storage.updateKey(kid, { isValid: false });
    await this.refreshCache();
  }

  /**
   * Get key statistics for monitoring
   */
  async getKeyStats(): Promise<{
    currentKid: string | null;
    validKeyCount: number;
    oldestKeyAge: number | null;
  }> {
    await this.refreshCache();

    const validKeys = this.cache?.validKeys || [];
    const oldestKey = validKeys.reduce<SecretKeyRecord | null>((oldest, key) => {
      if (!oldest || key.activatedAt < oldest.activatedAt) {
        return key;
      }
      return oldest;
    }, null);

    return {
      currentKid: this.cache?.currentKey?.kid || null,
      validKeyCount: validKeys.length,
      oldestKeyAge: oldestKey ? Date.now() - oldestKey.activatedAt.getTime() : null,
    };
  }

  /**
   * Clear the cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache = null;
  }
}

/**
 * In-memory secrets storage for development/testing
 */
export class InMemorySecretsStorage implements SecretsStorage {
  private keys: Map<string, SecretKeyRecord> = new Map();

  async getCurrentKey(): Promise<SecretKeyRecord | null> {
    for (const key of this.keys.values()) {
      if (key.isCurrent && key.isValid) {
        return key;
      }
    }
    return null;
  }

  async getKeyByKid(kid: string): Promise<SecretKeyRecord | null> {
    return this.keys.get(kid) || null;
  }

  async getValidKeys(): Promise<SecretKeyRecord[]> {
    const now = new Date();
    return Array.from(this.keys.values()).filter(
      key => key.isValid && (!key.expiresAt || key.expiresAt > now)
    );
  }

  async createKey(key: Omit<SecretKeyRecord, 'activatedAt'>): Promise<SecretKeyRecord> {
    const record: SecretKeyRecord = {
      ...key,
      activatedAt: new Date(),
    };
    this.keys.set(key.kid, record);
    return record;
  }

  async updateKey(kid: string, data: Partial<SecretKeyRecord>): Promise<SecretKeyRecord> {
    const existing = this.keys.get(kid);
    if (!existing) {
      throw new Error(`Key not found: ${kid}`);
    }
    const updated = { ...existing, ...data };
    this.keys.set(kid, updated);
    return updated;
  }

  async setCurrentKey(kid: string): Promise<void> {
    for (const [id, key] of this.keys.entries()) {
      if (id === kid) {
        this.keys.set(id, { ...key, isCurrent: true });
      } else if (key.isCurrent) {
        this.keys.set(id, { ...key, isCurrent: false });
      }
    }
  }

  async invalidateExpiredKeys(): Promise<number> {
    const now = new Date();
    let count = 0;
    for (const [kid, key] of this.keys.entries()) {
      if (key.expiresAt && key.expiresAt <= now && key.isValid) {
        this.keys.set(kid, { ...key, isValid: false });
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all keys (for testing)
   */
  clear(): void {
    this.keys.clear();
  }
}

/**
 * Create a secrets manager with in-memory storage (for development/testing)
 */
export function createInMemorySecretsManager(
  config?: Partial<Omit<SecretsManagerConfig, 'storage'>>
): DatabaseSecretsManager {
  return new DatabaseSecretsManager({
    storage: new InMemorySecretsStorage(),
    ...config,
  });
}
