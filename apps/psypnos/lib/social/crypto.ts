// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Module de chiffrement pour les tokens des réseaux sociaux
 *
 * Utilise AES-256-GCM pour chiffrer les tokens d'accès et refresh tokens
 * stockés en base de données.
 *
 * Sécurité:
 * - AES-256-GCM fournit confidentialité et intégrité
 * - IV unique par chiffrement (16 bytes)
 * - Auth tag pour vérifier l'intégrité (16 bytes)
 *
 * Format du token chiffré: iv:authTag:encryptedData (en hexadécimal)
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES-GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const KEY_LENGTH = 32; // 256 bits

/**
 * Récupère la clé de chiffrement depuis les variables d'environnement
 * @throws Error si la clé n'est pas configurée ou invalide
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.SOCIAL_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error(
      '[SocialCrypto] SOCIAL_ENCRYPTION_KEY non configurée. ' +
        'Générez une clé avec: openssl rand -hex 32'
    );
  }

  // La clé doit être en hexadécimal (64 caractères pour 32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error(
      '[SocialCrypto] SOCIAL_ENCRYPTION_KEY invalide. ' +
        'La clé doit être de 64 caractères hexadécimaux (32 bytes).'
    );
  }

  return Buffer.from(keyHex, 'hex');
}

/**
 * Chiffre un token avec AES-256-GCM
 *
 * @param plaintext - Le token à chiffrer
 * @returns Le token chiffré au format iv:authTag:ciphertext (hexadécimal)
 * @throws Error si le chiffrement échoue
 *
 * @example
 * const encrypted = encryptToken('access_token_12345');
 * // Returns: "a1b2c3...:d4e5f6...:g7h8i9..."
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) {
    throw new Error('[SocialCrypto] Impossible de chiffrer un token vide');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    if (error instanceof Error && error.message.includes('SOCIAL_ENCRYPTION_KEY')) {
      throw error;
    }
    throw new Error(
      `[SocialCrypto] Erreur de chiffrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    );
  }
}

/**
 * Déchiffre un token chiffré avec AES-256-GCM
 *
 * @param encryptedData - Le token chiffré au format iv:authTag:ciphertext
 * @returns Le token déchiffré
 * @throws Error si le déchiffrement échoue ou le format est invalide
 *
 * @example
 * const decrypted = decryptToken("a1b2c3...:d4e5f6...:g7h8i9...");
 * // Returns: "access_token_12345"
 */
export function decryptToken(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('[SocialCrypto] Impossible de déchiffrer un token vide');
  }

  try {
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error(
        '[SocialCrypto] Format de token chiffré invalide. ' +
          'Attendu: iv:authTag:ciphertext'
      );
    }

    const [ivHex, authTagHex, ciphertext] = parts;

    // Valider les longueurs
    if (ivHex.length !== IV_LENGTH * 2) {
      throw new Error('[SocialCrypto] IV invalide');
    }
    if (authTagHex.length !== AUTH_TAG_LENGTH * 2) {
      throw new Error('[SocialCrypto] Auth tag invalide');
    }

    const key = getEncryptionKey();
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
    if (error instanceof Error && error.message.includes('SOCIAL_ENCRYPTION_KEY')) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('Unsupported state or unable to authenticate data')) {
      throw new Error(
        '[SocialCrypto] Échec de l\'authentification du token. ' +
          'Le token peut avoir été altéré ou la clé de chiffrement a changé.'
      );
    }
    throw new Error(
      `[SocialCrypto] Erreur de déchiffrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    );
  }
}

/**
 * Vérifie si un token est au format chiffré valide
 *
 * @param data - La chaîne à vérifier
 * @returns true si le format ressemble à un token chiffré
 */
export function isEncryptedToken(data: string): boolean {
  if (!data) return false;

  const parts = data.split(':');
  if (parts.length !== 3) return false;

  const [ivHex, authTagHex, ciphertext] = parts;

  // Vérifier que ce sont des chaînes hexadécimales valides
  const hexRegex = /^[0-9a-fA-F]+$/;

  return (
    ivHex.length === IV_LENGTH * 2 &&
    authTagHex.length === AUTH_TAG_LENGTH * 2 &&
    ciphertext.length > 0 &&
    hexRegex.test(ivHex) &&
    hexRegex.test(authTagHex) &&
    hexRegex.test(ciphertext)
  );
}

/**
 * Génère une nouvelle clé de chiffrement
 * Utile pour l'initialisation ou la rotation des clés
 *
 * @returns Clé de 32 bytes en hexadécimal (64 caractères)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Teste le chiffrement/déchiffrement avec la clé actuelle
 * Utile pour vérifier la configuration
 *
 * @returns true si le test réussit
 */
export function testEncryption(): boolean {
  try {
    const testData = 'test_token_' + Date.now();
    const encrypted = encryptToken(testData);
    const decrypted = decryptToken(encrypted);
    return decrypted === testData;
  } catch {
    return false;
  }
}
