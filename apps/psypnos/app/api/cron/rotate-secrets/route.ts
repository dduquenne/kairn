/**
 * Cron Rotate Secrets API Route
 *
 * Automates JWT signing key rotation and cleanup:
 * 1. Checks the age of the current signing key
 * 2. Rotates to a new key if older than MAX_KEY_AGE_DAYS
 * 3. Cleans up expired keys past their grace period
 * 4. Reports key statistics for monitoring
 *
 * Frequency: daily at 2am (0 2 * * *)
 * Security: QStash signature or CRON_SECRET
 */

import { DatabaseSecretsManager, type SecretsStorage } from '@kairn/core';
import { verifyCronAuth } from '@kairn/core/scheduler';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';

/** Maximum age of the current key before rotation (30 days) */
const MAX_KEY_AGE_DAYS = 30;
const MAX_KEY_AGE_MS = MAX_KEY_AGE_DAYS * 24 * 60 * 60 * 1000;

/** Alert threshold: warn if key is older than this (25 days) */
const WARN_KEY_AGE_DAYS = 25;
const WARN_KEY_AGE_MS = WARN_KEY_AGE_DAYS * 24 * 60 * 60 * 1000;

/**
 * Create a PrismaSecretsStorage adapter for DatabaseSecretsManager
 */
function createPrismaStorage(): SecretsStorage {
  return {
    async getCurrentKey() {
      return prisma.secretKey.findFirst({
        where: { isCurrent: true, isValid: true },
      });
    },
    async getKeyByKid(kid: string) {
      return prisma.secretKey.findUnique({ where: { kid } });
    },
    async getValidKeys() {
      const now = new Date();
      return prisma.secretKey.findMany({
        where: {
          isValid: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      });
    },
    async createKey(key) {
      return prisma.secretKey.create({
        data: { ...key, activatedAt: new Date() },
      });
    },
    async updateKey(kid: string, data) {
      return prisma.secretKey.update({ where: { kid }, data });
    },
    async setCurrentKey(kid: string) {
      await prisma.$transaction([
        prisma.secretKey.updateMany({
          where: { isCurrent: true },
          data: { isCurrent: false },
        }),
        prisma.secretKey.update({
          where: { kid },
          data: { isCurrent: true },
        }),
      ]);
    },
    async invalidateExpiredKeys() {
      const now = new Date();
      const result = await prisma.secretKey.updateMany({
        where: {
          isValid: true,
          expiresAt: { lte: now },
        },
        data: { isValid: false },
      });
      return result.count;
    },
  };
}

export async function GET(request: NextRequest) {
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const storage = createPrismaStorage();
    const manager = new DatabaseSecretsManager({
      storage,
      keyGracePeriodMs: 7 * 24 * 60 * 60 * 1000, // 7 days grace period
    });

    // 1. Get current key stats
    const stats = await manager.getKeyStats();
    const actions: string[] = [];

    // 2. Check if rotation is needed
    let rotated = false;
    if (!stats.currentKid) {
      // No current key — initialize
      await manager.initialize();
      actions.push('Initialized new signing key (none existed)');
      rotated = true;
    } else if (stats.oldestKeyAge !== null && stats.oldestKeyAge > MAX_KEY_AGE_MS) {
      // Current key is too old — rotate
      const newKey = await manager.rotateKey();
      actions.push(
        `Rotated key: old key expired after ${Math.round(stats.oldestKeyAge / (24 * 60 * 60 * 1000))} days. New key: ${newKey.kid}`
      );
      rotated = true;
    } else if (stats.oldestKeyAge !== null && stats.oldestKeyAge > WARN_KEY_AGE_MS) {
      // Key is getting old — warn
      const ageDays = Math.round(stats.oldestKeyAge / (24 * 60 * 60 * 1000));
      actions.push(
        `Warning: current key is ${ageDays} days old (rotation at ${MAX_KEY_AGE_DAYS} days)`
      );
      console.warn(`[Cron:rotate-secrets] Key age warning: ${ageDays}/${MAX_KEY_AGE_DAYS} days`);
    }

    // 3. Clean up expired keys
    const invalidated = await storage.invalidateExpiredKeys();
    if (invalidated > 0) {
      actions.push(`Invalidated ${invalidated} expired key(s)`);
    }

    // 4. Get updated stats
    const updatedStats = await manager.getKeyStats();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (actions.length > 0) {
      for (const action of actions) {
        console.warn(`[Cron:rotate-secrets] ${action}`);
      }
    }

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      rotated,
      stats: {
        currentKid: updatedStats.currentKid,
        validKeyCount: updatedStats.validKeyCount,
        currentKeyAgeDays: updatedStats.oldestKeyAge
          ? Math.round(updatedStats.oldestKeyAge / (24 * 60 * 60 * 1000))
          : null,
        maxKeyAgeDays: MAX_KEY_AGE_DAYS,
      },
      actions,
    });
  } catch (error) {
    console.error('[Cron:rotate-secrets] Error:', error);
    return NextResponse.json(
      {
        error: 'Secret rotation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Accept POST as well since QStash sends POST by default
export { GET as POST };
