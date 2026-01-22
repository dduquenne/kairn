/**
 * @kairn/social - Token Encryption Module
 *
 * Provides AES-256-GCM encryption for storing OAuth tokens securely.
 *
 * Security:
 * - AES-256-GCM provides both confidentiality and integrity
 * - Unique IV per encryption (16 bytes)
 * - Auth tag for integrity verification (16 bytes)
 *
 * Format: iv:authTag:encryptedData (hexadecimal)
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  /** 64-character hex key (32 bytes) */
  encryptionKey?: string;
  /** Environment variable name for the key */
  keyEnvVar?: string;
}

const defaultConfig: EncryptionConfig = {
  keyEnvVar: 'SOCIAL_ENCRYPTION_KEY',
};

/**
 * Get the encryption key from configuration or environment
 */
function getEncryptionKey(config: EncryptionConfig = defaultConfig): Buffer {
  const keyHex = config.encryptionKey || process.env[config.keyEnvVar || 'SOCIAL_ENCRYPTION_KEY'];

  if (!keyHex) {
    throw new Error(
      `[SocialCrypto] Encryption key not configured. ` +
        `Set ${config.keyEnvVar || 'SOCIAL_ENCRYPTION_KEY'} or pass encryptionKey option. ` +
        `Generate with: openssl rand -hex 32`
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error(
      `[SocialCrypto] Invalid encryption key format. ` +
        `Key must be 64 hexadecimal characters (32 bytes).`
    );
  }

  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt a token using AES-256-GCM
 *
 * @param plaintext - The token to encrypt
 * @param config - Optional encryption configuration
 * @returns Encrypted token in format iv:authTag:ciphertext (hex)
 *
 * @example
 * const encrypted = encryptToken('access_token_12345');
 * // Returns: "a1b2c3...:d4e5f6...:g7h8i9..."
 */
export function encryptToken(plaintext: string, config?: EncryptionConfig): string {
  if (!plaintext) {
    throw new Error('[SocialCrypto] Cannot encrypt empty token');
  }

  try {
    const key = getEncryptionKey(config);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    if (error instanceof Error && error.message.includes('[SocialCrypto]')) {
      throw error;
    }
    throw new Error(
      `[SocialCrypto] Encryption error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decrypt a token encrypted with AES-256-GCM
 *
 * @param encryptedData - Encrypted token in format iv:authTag:ciphertext
 * @param config - Optional encryption configuration
 * @returns Decrypted token
 *
 * @example
 * const decrypted = decryptToken("a1b2c3...:d4e5f6...:g7h8i9...");
 * // Returns: "access_token_12345"
 */
export function decryptToken(encryptedData: string, config?: EncryptionConfig): string {
  if (!encryptedData) {
    throw new Error('[SocialCrypto] Cannot decrypt empty token');
  }

  try {
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error(
        '[SocialCrypto] Invalid encrypted token format. Expected: iv:authTag:ciphertext'
      );
    }

    const ivHex = parts[0]!;
    const authTagHex = parts[1]!;
    const ciphertext = parts[2]!;

    if (ivHex.length !== IV_LENGTH * 2) {
      throw new Error('[SocialCrypto] Invalid IV length');
    }
    if (authTagHex.length !== AUTH_TAG_LENGTH * 2) {
      throw new Error('[SocialCrypto] Invalid auth tag length');
    }

    const key = getEncryptionKey(config);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    if (error instanceof Error && error.message.includes('[SocialCrypto]')) {
      throw error;
    }
    if (
      error instanceof Error &&
      error.message.includes('Unsupported state or unable to authenticate data')
    ) {
      throw new Error(
        `[SocialCrypto] Token authentication failed. ` +
          `The token may have been tampered with or the encryption key has changed.`
      );
    }
    throw new Error(
      `[SocialCrypto] Decryption error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a string is in valid encrypted token format
 *
 * @param data - String to check
 * @returns true if the format matches an encrypted token
 */
export function isEncryptedToken(data: string): boolean {
  if (!data) return false;

  const parts = data.split(':');
  if (parts.length !== 3) return false;

  const ivHex = parts[0];
  const authTagHex = parts[1];
  const ciphertext = parts[2];
  const hexRegex = /^[0-9a-fA-F]+$/;

  return (
    ivHex !== undefined &&
    authTagHex !== undefined &&
    ciphertext !== undefined &&
    ivHex.length === IV_LENGTH * 2 &&
    authTagHex.length === AUTH_TAG_LENGTH * 2 &&
    ciphertext.length > 0 &&
    hexRegex.test(ivHex) &&
    hexRegex.test(authTagHex) &&
    hexRegex.test(ciphertext)
  );
}

/**
 * Generate a new encryption key
 *
 * @returns 64-character hex string (32 bytes)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Test encryption/decryption with current configuration
 *
 * @param config - Optional encryption configuration
 * @returns true if encryption test passes
 */
export function testEncryption(config?: EncryptionConfig): boolean {
  try {
    const testData = `test_token_${Date.now()}`;
    const encrypted = encryptToken(testData, config);
    const decrypted = decryptToken(encrypted, config);
    return decrypted === testData;
  } catch {
    return false;
  }
}

/**
 * Generate a random state token for OAuth CSRF protection
 *
 * @param length - Number of random bytes (default: 32)
 * @returns Hex-encoded random string
 */
export function generateStateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
