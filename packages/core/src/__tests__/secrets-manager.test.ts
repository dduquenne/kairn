import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { isEncryptedSecret } from '../auth/secret-encryption';
import {
  DatabaseSecretsManager,
  InMemorySecretsStorage,
  createInMemorySecretsManager,
} from '../auth/secrets-manager';

describe('Secrets Manager', () => {
  describe('InMemorySecretsStorage', () => {
    let storage: InMemorySecretsStorage;

    beforeEach(() => {
      storage = new InMemorySecretsStorage();
    });

    it('should create and retrieve a key', async () => {
      const key = await storage.createKey({
        kid: 'test-key-1',
        secret: 'secret-value',
        algorithm: 'HS256',
        isCurrent: true,
        isValid: true,
        expiresAt: null,
      });

      expect(key.kid).toBe('test-key-1');
      expect(key.activatedAt).toBeInstanceOf(Date);

      const retrieved = await storage.getKeyByKid('test-key-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.secret).toBe('secret-value');
    });

    it('should return null for non-existent key', async () => {
      const key = await storage.getKeyByKid('non-existent');
      expect(key).toBeNull();
    });

    it('should get current key', async () => {
      await storage.createKey({
        kid: 'key-1',
        secret: 'secret-1',
        algorithm: 'HS256',
        isCurrent: false,
        isValid: true,
        expiresAt: null,
      });

      await storage.createKey({
        kid: 'key-2',
        secret: 'secret-2',
        algorithm: 'HS256',
        isCurrent: true,
        isValid: true,
        expiresAt: null,
      });

      const current = await storage.getCurrentKey();
      expect(current).not.toBeNull();
      expect(current?.kid).toBe('key-2');
    });

    it('should get all valid keys', async () => {
      await storage.createKey({
        kid: 'valid-1',
        secret: 'secret',
        algorithm: 'HS256',
        isCurrent: false,
        isValid: true,
        expiresAt: null,
      });

      await storage.createKey({
        kid: 'valid-2',
        secret: 'secret',
        algorithm: 'HS256',
        isCurrent: true,
        isValid: true,
        expiresAt: null,
      });

      await storage.createKey({
        kid: 'invalid',
        secret: 'secret',
        algorithm: 'HS256',
        isCurrent: false,
        isValid: false,
        expiresAt: null,
      });

      const validKeys = await storage.getValidKeys();
      expect(validKeys).toHaveLength(2);
      expect(validKeys.map(k => k.kid)).toContain('valid-1');
      expect(validKeys.map(k => k.kid)).toContain('valid-2');
    });

    it('should filter out expired keys from valid keys', async () => {
      const pastDate = new Date(Date.now() - 1000);
      const futureDate = new Date(Date.now() + 1000000);

      await storage.createKey({
        kid: 'expired',
        secret: 'secret',
        algorithm: 'HS256',
        isCurrent: false,
        isValid: true,
        expiresAt: pastDate,
      });

      await storage.createKey({
        kid: 'not-expired',
        secret: 'secret',
        algorithm: 'HS256',
        isCurrent: true,
        isValid: true,
        expiresAt: futureDate,
      });

      const validKeys = await storage.getValidKeys();
      expect(validKeys).toHaveLength(1);
      expect(validKeys[0]?.kid).toBe('not-expired');
    });

    it('should update a key', async () => {
      await storage.createKey({
        kid: 'key-1',
        secret: 'secret',
        algorithm: 'HS256',
        isCurrent: true,
        isValid: true,
        expiresAt: null,
      });

      const updated = await storage.updateKey('key-1', { isCurrent: false });
      expect(updated.isCurrent).toBe(false);

      const retrieved = await storage.getKeyByKid('key-1');
      expect(retrieved?.isCurrent).toBe(false);
    });

    it('should throw when updating non-existent key', async () => {
      await expect(storage.updateKey('non-existent', {})).rejects.toThrow('Key not found');
    });

    it('should set current key and unset others', async () => {
      await storage.createKey({
        kid: 'key-1',
        secret: 'secret',
        algorithm: 'HS256',
        isCurrent: true,
        isValid: true,
        expiresAt: null,
      });

      await storage.createKey({
        kid: 'key-2',
        secret: 'secret',
        algorithm: 'HS256',
        isCurrent: false,
        isValid: true,
        expiresAt: null,
      });

      await storage.setCurrentKey('key-2');

      const key1 = await storage.getKeyByKid('key-1');
      const key2 = await storage.getKeyByKid('key-2');

      expect(key1?.isCurrent).toBe(false);
      expect(key2?.isCurrent).toBe(true);
    });

    it('should invalidate expired keys', async () => {
      const pastDate = new Date(Date.now() - 1000);

      await storage.createKey({
        kid: 'expired-key',
        secret: 'secret',
        algorithm: 'HS256',
        isCurrent: false,
        isValid: true,
        expiresAt: pastDate,
      });

      const count = await storage.invalidateExpiredKeys();
      expect(count).toBe(1);

      const key = await storage.getKeyByKid('expired-key');
      expect(key?.isValid).toBe(false);
    });

    it('should clear all keys', async () => {
      await storage.createKey({
        kid: 'key-1',
        secret: 'secret',
        algorithm: 'HS256',
        isCurrent: true,
        isValid: true,
        expiresAt: null,
      });

      storage.clear();

      const current = await storage.getCurrentKey();
      expect(current).toBeNull();
    });
  });

  describe('DatabaseSecretsManager', () => {
    let manager: DatabaseSecretsManager;
    let storage: InMemorySecretsStorage;

    beforeEach(() => {
      storage = new InMemorySecretsStorage();
      manager = new DatabaseSecretsManager({
        storage,
        defaultAlgorithm: 'HS256',
        keyGracePeriodMs: 1000,
        enableCache: true,
        cacheTtlMs: 100,
      });
    });

    it('should initialize with a new key when none exists', async () => {
      await manager.initialize();

      const signingKey = await manager.getSigningKey();
      expect(signingKey).toBeInstanceOf(Uint8Array);
      expect(signingKey.length).toBeGreaterThan(0);
    });

    it('should not create new key if one already exists', async () => {
      await storage.createKey({
        kid: 'existing-key',
        secret: 'existing-secret',
        algorithm: 'HS256',
        isCurrent: true,
        isValid: true,
        expiresAt: null,
      });

      await manager.initialize();

      const kid = manager.getCurrentKid();
      expect(kid).toBe('existing-key');
    });

    it('should throw when getting signing key without initialization', async () => {
      await expect(manager.getSigningKey()).rejects.toThrow('No current signing key');
    });

    it('should rotate keys', async () => {
      await manager.initialize();
      const firstKid = manager.getCurrentKid();

      const newKey = await manager.rotateKey();

      expect(newKey.kid).not.toBe(firstKid);
      expect(newKey.isCurrent).toBe(true);
      expect(manager.getCurrentKid()).toBe(newKey.kid);

      // Old key should still be valid for verification
      const validVersions = manager.getValidVersions();
      expect(validVersions.length).toBe(2);
    });

    it('should get verification key by kid', async () => {
      await manager.initialize();
      const kid = manager.getCurrentKid();

      const verificationKey = await manager.getVerificationKey(kid);
      expect(verificationKey).not.toBeNull();
      expect(verificationKey).toBeInstanceOf(Uint8Array);
    });

    it('should return null for non-existent verification key', async () => {
      await manager.initialize();

      const verificationKey = await manager.getVerificationKey('non-existent');
      expect(verificationKey).toBeNull();
    });

    it('should return null for invalid verification key', async () => {
      await storage.createKey({
        kid: 'invalid-key',
        secret: 'secret',
        algorithm: 'HS256',
        isCurrent: false,
        isValid: false,
        expiresAt: null,
      });

      await manager.initialize();

      const verificationKey = await manager.getVerificationKey('invalid-key');
      expect(verificationKey).toBeNull();
    });

    it('should get current algorithm', async () => {
      await manager.initialize();

      const algorithm = manager.getCurrentAlgorithm();
      expect(algorithm).toBe('HS256');
    });

    it('should invalidate a specific key', async () => {
      await manager.initialize();
      const kid = manager.getCurrentKid();

      await manager.invalidateKey(kid);

      const key = await storage.getKeyByKid(kid);
      expect(key?.isValid).toBe(false);
    });

    it('should get key statistics', async () => {
      await manager.initialize();
      await manager.rotateKey();

      const stats = await manager.getKeyStats();

      expect(stats.currentKid).not.toBeNull();
      expect(stats.validKeyCount).toBe(2);
      expect(stats.oldestKeyAge).not.toBeNull();
      expect(stats.oldestKeyAge).toBeGreaterThanOrEqual(0);
    });

    it('should use cache when enabled', async () => {
      await manager.initialize();

      // Clear cache to reset state and set up spy
      manager.clearCache();
      const spy = vi.spyOn(storage, 'getCurrentKey');

      // First call populates cache
      await manager.getSigningKey();
      expect(spy).toHaveBeenCalledTimes(1);

      // Second call uses cache
      await manager.getSigningKey();
      expect(spy).toHaveBeenCalledTimes(1);

      // After cache expires, fetch again
      await new Promise(resolve => setTimeout(resolve, 150));
      await manager.getSigningKey();
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should clear cache', async () => {
      await manager.initialize();

      // Clear cache to reset state and set up spy
      manager.clearCache();
      const spy = vi.spyOn(storage, 'getCurrentKey');

      await manager.getSigningKey();
      expect(spy).toHaveBeenCalledTimes(1);

      manager.clearCache();

      await manager.getSigningKey();
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('createInMemorySecretsManager', () => {
    it('should create a manager with in-memory storage', async () => {
      const manager = createInMemorySecretsManager();

      await manager.initialize();

      const signingKey = await manager.getSigningKey();
      expect(signingKey).toBeInstanceOf(Uint8Array);
    });

    it('should accept custom configuration', async () => {
      const manager = createInMemorySecretsManager({
        defaultAlgorithm: 'HS512',
      });

      await manager.initialize();

      const algorithm = manager.getCurrentAlgorithm();
      expect(algorithm).toBe('HS512');
    });
  });

  describe('DatabaseSecretsManager with envelope encryption', () => {
    const TEST_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
    const originalEnv = process.env;
    let manager: DatabaseSecretsManager;
    let storage: InMemorySecretsStorage;

    beforeEach(() => {
      process.env = { ...originalEnv };
      storage = new InMemorySecretsStorage();
      manager = new DatabaseSecretsManager({
        storage,
        defaultAlgorithm: 'HS256',
        keyGracePeriodMs: 1000,
        enableCache: false,
      });
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should store secrets in encrypted format when encryption is enabled', async () => {
      process.env.SECRETS_ENCRYPTION_KEY = TEST_KEY;

      const newKey = await manager.rotateKey();

      expect(isEncryptedSecret(newKey.secret)).toBe(true);
    });

    it('should store secrets in plaintext when encryption is disabled', async () => {
      delete process.env.SECRETS_ENCRYPTION_KEY;

      const newKey = await manager.rotateKey();

      expect(isEncryptedSecret(newKey.secret)).toBe(false);
    });

    it('should decrypt encrypted secrets when getting signing key', async () => {
      process.env.SECRETS_ENCRYPTION_KEY = TEST_KEY;

      await manager.initialize();

      const signingKey = await manager.getSigningKey();
      expect(signingKey).toBeInstanceOf(Uint8Array);
      expect(signingKey.length).toBeGreaterThan(0);
    });

    it('should decrypt encrypted secrets when getting verification key', async () => {
      process.env.SECRETS_ENCRYPTION_KEY = TEST_KEY;

      await manager.initialize();
      const kid = manager.getCurrentKid();

      const verificationKey = await manager.getVerificationKey(kid);
      expect(verificationKey).toBeInstanceOf(Uint8Array);
      expect(verificationKey).not.toBeNull();
      expect((verificationKey as Uint8Array).length).toBeGreaterThan(0);
    });

    it('should handle rotation with encrypted secrets', async () => {
      process.env.SECRETS_ENCRYPTION_KEY = TEST_KEY;

      await manager.initialize();
      const firstKid = manager.getCurrentKid();
      const firstKey = await manager.getSigningKey();

      await manager.rotateKey();
      const secondKid = manager.getCurrentKid();
      const secondKey = await manager.getSigningKey();

      expect(firstKid).not.toBe(secondKid);
      // Keys should be different byte arrays
      expect(Buffer.from(firstKey).toString('hex')).not.toBe(
        Buffer.from(secondKey).toString('hex')
      );

      // Old key should still be verifiable
      const oldVerificationKey = await manager.getVerificationKey(firstKid);
      expect(oldVerificationKey).not.toBeNull();
    });

    it('should handle backward compatibility with plaintext secrets', async () => {
      // First, create a key without encryption (simulates pre-migration state)
      delete process.env.SECRETS_ENCRYPTION_KEY;
      await storage.createKey({
        kid: 'legacy-key',
        secret: 'plaintext-secret-value',
        algorithm: 'HS256',
        isCurrent: true,
        isValid: true,
        expiresAt: null,
      });

      // Now enable encryption - should still read the plaintext key
      process.env.SECRETS_ENCRYPTION_KEY = TEST_KEY;
      manager.clearCache();

      const signingKey = await manager.getSigningKey();
      expect(signingKey).toBeInstanceOf(Uint8Array);

      const decoded = new TextDecoder().decode(signingKey);
      expect(decoded).toBe('plaintext-secret-value');
    });
  });
});
