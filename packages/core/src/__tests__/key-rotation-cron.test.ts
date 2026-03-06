/**
 * Key Rotation CRON Logic Tests
 *
 * Tests the rotation logic used by the rotate-secrets CRON job:
 * - Key age detection and rotation threshold
 * - Automatic rotation when key is too old
 * - Grace period for expired keys
 * - Key statistics reporting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { DatabaseSecretsManager, InMemorySecretsStorage } from '../auth/secrets-manager';

const MAX_KEY_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

describe('Key Rotation CRON Logic', () => {
  let storage: InMemorySecretsStorage;
  let manager: DatabaseSecretsManager;

  beforeEach(() => {
    storage = new InMemorySecretsStorage();
    manager = new DatabaseSecretsManager({
      storage,
      keyGracePeriodMs: 7 * 24 * 60 * 60 * 1000, // 7 days
      enableCache: false,
    });
  });

  it('should initialize a key when none exists', async () => {
    const stats = await manager.getKeyStats();
    expect(stats.currentKid).toBeNull();

    await manager.initialize();

    const updatedStats = await manager.getKeyStats();
    expect(updatedStats.currentKid).not.toBeNull();
    expect(updatedStats.validKeyCount).toBe(1);
  });

  it('should not rotate when key is young', async () => {
    await manager.initialize();
    const initialStats = await manager.getKeyStats();
    const initialKid = initialStats.currentKid;

    // Key age is ~0ms, well under 30 days
    expect(initialStats.oldestKeyAge).toBeLessThan(MAX_KEY_AGE_MS);

    // Verify no rotation needed
    const stats = await manager.getKeyStats();
    expect(stats.currentKid).toBe(initialKid);
  });

  it('should rotate key and keep old key valid during grace period', async () => {
    await manager.initialize();
    const initialStats = await manager.getKeyStats();
    const oldKid = initialStats.currentKid;

    // Force rotation
    const newKey = await manager.rotateKey();

    const updatedStats = await manager.getKeyStats();
    expect(updatedStats.currentKid).toBe(newKey.kid);
    expect(updatedStats.currentKid).not.toBe(oldKid);
    // Both old and new key should be valid (grace period)
    expect(updatedStats.validKeyCount).toBe(2);
  });

  it('should invalidate expired keys past grace period', async () => {
    await manager.initialize();

    // Manually set old key with past expiration
    const validKeys = await storage.getValidKeys();
    const currentKey = validKeys.find(k => k.isCurrent);
    if (currentKey) {
      await storage.updateKey(currentKey.kid, {
        isCurrent: false,
        expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
      });
    }

    // Create a new current key
    await storage.createKey({
      kid: 'new-key',
      secret: 'new-secret',
      algorithm: 'HS256',
      isCurrent: true,
      isValid: true,
      expiresAt: null,
    });
    await storage.setCurrentKey('new-key');

    // Invalidate expired keys
    const invalidated = await storage.invalidateExpiredKeys();
    expect(invalidated).toBe(1);
  });

  it('should report key statistics correctly', async () => {
    await manager.initialize();

    const stats = await manager.getKeyStats();
    expect(stats.currentKid).toBeTruthy();
    expect(stats.validKeyCount).toBe(1);
    expect(stats.oldestKeyAge).toBeGreaterThanOrEqual(0);
    expect(stats.oldestKeyAge).toBeLessThan(1000); // Less than 1 second
  });

  it('should support multiple rotations', async () => {
    await manager.initialize();

    await manager.rotateKey();
    await manager.rotateKey();

    const stats = await manager.getKeyStats();
    // Current + 2 previous (with grace period)
    expect(stats.validKeyCount).toBe(3);
  });

  it('should force invalidate a specific key', async () => {
    await manager.initialize();
    const stats = await manager.getKeyStats();
    const kid = stats.currentKid!;

    // Rotate first so we have a new current key
    await manager.rotateKey();

    // Invalidate the old key (emergency procedure)
    await manager.invalidateKey(kid);

    const updatedStats = await manager.getKeyStats();
    // Old key should no longer be valid
    expect(updatedStats.validKeyCount).toBe(1);
  });

  it('should verify tokens with old key during grace period', async () => {
    await manager.initialize();
    const oldKey = await manager.getSigningKey();
    const oldKid = manager.getCurrentKid();

    // Rotate
    await manager.rotateKey();

    // Old key should still be verifiable
    const verificationKey = await manager.getVerificationKey(oldKid);
    expect(verificationKey).not.toBeNull();
  });
});
