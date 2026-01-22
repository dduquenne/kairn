/**
 * Module de chiffrement pour les tokens des réseaux sociaux
 *
 * MIGRATION PHASE 6: Ce module réexporte maintenant depuis @kairn/social
 * pour mutualiser le code de chiffrement.
 *
 * Les fonctions utilisent AES-256-GCM pour chiffrer les tokens d'accès
 * et refresh tokens stockés en base de données.
 */

// Re-export everything from @kairn/social
export {
  encryptToken,
  decryptToken,
  isEncryptedToken,
  generateEncryptionKey,
} from '@kairn/social';

// Alias for backward compatibility with local test function
import { encryptToken, decryptToken } from '@kairn/social';

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
