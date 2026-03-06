/**
 * JWT Secret Encryption Module
 *
 * Provides AES-256-GCM envelope encryption for JWT signing secrets stored in database.
 * When enabled, secrets are encrypted at rest and decrypted only at runtime.
 *
 * Security:
 * - AES-256-GCM provides both confidentiality and integrity
 * - Unique IV per encryption (16 bytes)
 * - Auth tag for integrity verification (16 bytes)
 * - Encryption key sourced from environment variable (never stored in DB)
 *
 * Format: iv:authTag:encryptedData (hexadecimal)
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_FORMAT_REGEX = /^[0-9a-fA-F]{32}:[0-9a-fA-F]{32}:[0-9a-fA-F]+$/;

/**
 * Get the secrets encryption key from environment
 *
 * @returns Buffer containing the 32-byte encryption key, or null if not configured
 */
function getEncryptionKey(): Buffer | null {
  const keyHex = process.env.SECRETS_ENCRYPTION_KEY;

  if (!keyHex) {
    return null;
  }

  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error(
      '[SecretEncryption] Invalid SECRETS_ENCRYPTION_KEY format. ' +
        'Key must be 64 hexadecimal characters (32 bytes). ' +
        'Generate with: openssl rand -hex 32'
    );
  }

  return Buffer.from(keyHex, 'hex');
}

/**
 * Check if envelope encryption is enabled (key is configured)
 *
 * @returns true if SECRETS_ENCRYPTION_KEY is set
 */
export function isEncryptionEnabled(): boolean {
  return !!process.env.SECRETS_ENCRYPTION_KEY;
}

/**
 * Check if a value appears to be in encrypted format (iv:authTag:ciphertext)
 *
 * @param value - The string to check
 * @returns true if the value matches the encrypted format
 */
export function isEncryptedSecret(value: string): boolean {
  return ENCRYPTED_FORMAT_REGEX.test(value);
}

/**
 * Encrypt a secret using AES-256-GCM envelope encryption
 *
 * @param plaintext - The secret to encrypt
 * @returns Encrypted value in format iv:authTag:ciphertext (hex)
 * @throws Error if encryption key is not configured or invalid
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();

  if (!key) {
    throw new Error(
      '[SecretEncryption] SECRETS_ENCRYPTION_KEY not configured. ' +
        'Set this environment variable to enable secret encryption. ' +
        'Generate with: openssl rand -hex 32'
    );
  }

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a secret encrypted with AES-256-GCM
 *
 * @param encryptedData - Encrypted value in format iv:authTag:ciphertext
 * @returns Decrypted secret
 * @throws Error if decryption fails (wrong key, tampered data, invalid format)
 */
export function decryptSecret(encryptedData: string): string {
  const key = getEncryptionKey();

  if (!key) {
    throw new Error(
      '[SecretEncryption] SECRETS_ENCRYPTION_KEY not configured. ' +
        'Cannot decrypt secrets without the encryption key.'
    );
  }

  const parts = encryptedData.split(':');

  if (parts.length !== 3) {
    throw new Error(
      '[SecretEncryption] Invalid encrypted secret format. Expected: iv:authTag:ciphertext'
    );
  }

  const [ivHex, authTagHex, ciphertext] = parts as [string, string, string];

  if (ivHex.length !== IV_LENGTH * 2) {
    throw new Error('[SecretEncryption] Invalid IV length');
  }
  if (authTagHex.length !== AUTH_TAG_LENGTH * 2) {
    throw new Error('[SecretEncryption] Invalid auth tag length');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Decrypt a secret if encrypted, or return as-is if plaintext
 *
 * Provides backward compatibility during migration:
 * - If the value is in encrypted format and encryption is enabled, decrypt it
 * - If the value is plaintext (not in encrypted format), return as-is
 * - In production with encryption enabled, logs a warning for plaintext secrets
 *
 * @param value - The potentially encrypted secret value
 * @returns The plaintext secret
 */
export function decryptSecretIfNeeded(value: string): string {
  if (isEncryptedSecret(value)) {
    if (!isEncryptionEnabled()) {
      throw new Error(
        '[SecretEncryption] Found encrypted secret but SECRETS_ENCRYPTION_KEY is not set. ' +
          'Configure the encryption key to decrypt secrets.'
      );
    }
    return decryptSecret(value);
  }

  // Value is plaintext
  if (isEncryptionEnabled() && process.env.NODE_ENV === 'production') {
    console.warn(
      '[SecretEncryption] Plaintext secret detected in production. ' +
        'Run the migration to encrypt existing secrets.'
    );
  }

  return value;
}
