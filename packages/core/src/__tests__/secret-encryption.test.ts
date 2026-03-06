import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  encryptSecret,
  decryptSecret,
  decryptSecretIfNeeded,
  isEncryptedSecret,
  isEncryptionEnabled,
} from '../auth/secret-encryption';

// Valid 64-character hex key (32 bytes)
const TEST_ENCRYPTION_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

describe('Secret Encryption', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isEncryptionEnabled', () => {
    it('should return false when SECRETS_ENCRYPTION_KEY is not set', () => {
      delete process.env.SECRETS_ENCRYPTION_KEY;
      expect(isEncryptionEnabled()).toBe(false);
    });

    it('should return true when SECRETS_ENCRYPTION_KEY is set', () => {
      process.env.SECRETS_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
      expect(isEncryptionEnabled()).toBe(true);
    });
  });

  describe('isEncryptedSecret', () => {
    it('should return true for valid encrypted format', () => {
      const valid =
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6:e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2:abcdef0123456789';
      expect(isEncryptedSecret(valid)).toBe(true);
    });

    it('should return false for plaintext', () => {
      expect(isEncryptedSecret('just-a-plain-secret-value')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isEncryptedSecret('')).toBe(false);
    });

    it('should return false for wrong number of parts', () => {
      expect(isEncryptedSecret('part1:part2')).toBe(false);
      expect(isEncryptedSecret('part1:part2:part3:part4')).toBe(false);
    });

    it('should return false for wrong IV length', () => {
      const wrongIv = 'a1b2c3:e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2:abcdef';
      expect(isEncryptedSecret(wrongIv)).toBe(false);
    });

    it('should return false for wrong auth tag length', () => {
      const wrongTag = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6:a1b2:abcdef';
      expect(isEncryptedSecret(wrongTag)).toBe(false);
    });
  });

  describe('encryptSecret / decryptSecret', () => {
    beforeEach(() => {
      process.env.SECRETS_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    });

    it('should encrypt and decrypt a secret successfully', () => {
      const plaintext = 'my-super-secret-jwt-signing-key-12345';
      const encrypted = encryptSecret(plaintext);
      const decrypted = decryptSecret(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    it('should produce encrypted format', () => {
      const encrypted = encryptSecret('test-secret');
      expect(isEncryptedSecret(encrypted)).toBe(true);
    });

    it('should produce different ciphertexts for the same plaintext (unique IV)', () => {
      const plaintext = 'same-secret';
      const encrypted1 = encryptSecret(plaintext);
      const encrypted2 = encryptSecret(plaintext);

      expect(encrypted1).not.toBe(encrypted2);

      // Both should decrypt to the same value
      expect(decryptSecret(encrypted1)).toBe(plaintext);
      expect(decryptSecret(encrypted2)).toBe(plaintext);
    });

    it('should handle long secrets', () => {
      const longSecret = 'a'.repeat(1024);
      const encrypted = encryptSecret(longSecret);
      const decrypted = decryptSecret(encrypted);

      expect(decrypted).toBe(longSecret);
    });

    it('should handle unicode characters', () => {
      const unicodeSecret = 'clé-secrète-avec-accents-é-è-ê';
      const encrypted = encryptSecret(unicodeSecret);
      const decrypted = decryptSecret(encrypted);

      expect(decrypted).toBe(unicodeSecret);
    });
  });

  describe('encryptSecret - error cases', () => {
    it('should throw when encryption key is not configured', () => {
      delete process.env.SECRETS_ENCRYPTION_KEY;

      expect(() => encryptSecret('test')).toThrow('SECRETS_ENCRYPTION_KEY not configured');
    });

    it('should throw when encryption key has invalid format', () => {
      process.env.SECRETS_ENCRYPTION_KEY = 'not-a-valid-hex-key';

      expect(() => encryptSecret('test')).toThrow('Invalid SECRETS_ENCRYPTION_KEY format');
    });

    it('should throw when encryption key is too short', () => {
      process.env.SECRETS_ENCRYPTION_KEY = 'abcdef';

      expect(() => encryptSecret('test')).toThrow('Invalid SECRETS_ENCRYPTION_KEY format');
    });
  });

  describe('decryptSecret - error cases', () => {
    beforeEach(() => {
      process.env.SECRETS_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    });

    it('should throw when encryption key is not configured', () => {
      delete process.env.SECRETS_ENCRYPTION_KEY;

      expect(() =>
        decryptSecret('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6:e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2:abcdef')
      ).toThrow('SECRETS_ENCRYPTION_KEY not configured');
    });

    it('should throw for invalid format', () => {
      expect(() => decryptSecret('not-encrypted')).toThrow('Invalid encrypted secret format');
    });

    it('should throw for wrong IV length', () => {
      expect(() => decryptSecret('aa:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb:cccc')).toThrow(
        'Invalid IV length'
      );
    });

    it('should throw for wrong auth tag length', () => {
      expect(() => decryptSecret('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6:aa:cccc')).toThrow(
        'Invalid auth tag length'
      );
    });

    it('should throw for tampered ciphertext', () => {
      const encrypted = encryptSecret('test-secret');
      const parts = encrypted.split(':');
      // Tamper with the ciphertext
      const ciphertextPart = parts[2] ?? '';
      const tampered = `${parts[0]}:${parts[1]}:${'ff'.repeat(ciphertextPart.length / 2)}`;

      expect(() => decryptSecret(tampered)).toThrow();
    });

    it('should throw when decrypting with wrong key', () => {
      const encrypted = encryptSecret('test-secret');

      // Change to a different valid key
      process.env.SECRETS_ENCRYPTION_KEY =
        'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3';

      expect(() => decryptSecret(encrypted)).toThrow();
    });
  });

  describe('decryptSecretIfNeeded', () => {
    it('should return plaintext as-is when not encrypted format', () => {
      delete process.env.SECRETS_ENCRYPTION_KEY;
      const plaintext = 'just-a-plain-secret';

      expect(decryptSecretIfNeeded(plaintext)).toBe(plaintext);
    });

    it('should decrypt encrypted values when key is configured', () => {
      process.env.SECRETS_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
      const plaintext = 'my-secret';
      const encrypted = encryptSecret(plaintext);

      expect(decryptSecretIfNeeded(encrypted)).toBe(plaintext);
    });

    it('should throw when encrypted format found but key is not set', () => {
      process.env.SECRETS_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
      const encrypted = encryptSecret('my-secret');

      delete process.env.SECRETS_ENCRYPTION_KEY;

      expect(() => decryptSecretIfNeeded(encrypted)).toThrow('SECRETS_ENCRYPTION_KEY is not set');
    });

    it('should warn in production when plaintext detected with encryption enabled', () => {
      process.env.SECRETS_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
      process.env.NODE_ENV = 'production';
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      decryptSecretIfNeeded('plain-secret');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Plaintext secret detected in production')
      );

      warnSpy.mockRestore();
    });

    it('should not warn in development for plaintext', () => {
      process.env.SECRETS_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
      process.env.NODE_ENV = 'development';
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      decryptSecretIfNeeded('plain-secret');

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});
