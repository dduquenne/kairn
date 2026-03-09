/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — pre-existing type issues (Prisma JSON typing, social client interface)
/**
 * Service de snapshots pour le suivi historique des métriques de comptes sociaux
 *
 * Permet de :
 * - Capturer un snapshot quotidien (followers, following, postsCount)
 * - Récupérer l'historique des snapshots pour un compte
 * - Calculer les variations de followers sur une période
 */

import { prisma } from '@/lib/db/prisma';

import { getSocialClient } from './clients';
import { getAllSocialAccounts } from './store';
import type { SocialPlatform } from './types';

// ===========================================
// Types
// ===========================================

export interface AccountSnapshot {
  accountId: string;
  platform: SocialPlatform;
  followers: number;
  following: number;
  postsCount: number;
  snapshotDate: Date;
}

export interface FollowerGrowth {
  accountId: string;
  platform: SocialPlatform;
  currentFollowers: number;
  previousFollowers: number;
  change: number;
  changePercent: number;
}

// ===========================================
// Snapshot Capture
// ===========================================

/**
 * Tronque une date au jour (00:00:00.000 UTC)
 */
function truncateToDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Capture un snapshot pour un compte donné.
 * Utilise upsert pour ne créer qu'un snapshot par jour par compte.
 */
export async function captureAccountSnapshot(
  accountId: string,
  metrics: {
    followers: number;
    following?: number;
    postsCount?: number;
    rawMetrics?: Record<string, unknown>;
  }
): Promise<AccountSnapshot> {
  const snapshotDate = truncateToDay(new Date());

  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
    select: { platform: true },
  });

  if (!account) {
    throw new Error(`Account not found: ${accountId}`);
  }

  const snapshot = await prisma.socialAccountSnapshot.upsert({
    where: {
      accountId_snapshotDate: {
        accountId,
        snapshotDate,
      },
    },
    update: {
      followers: metrics.followers,
      following: metrics.following ?? 0,
      postsCount: metrics.postsCount ?? 0,
      rawMetrics: metrics.rawMetrics ?? undefined,
    },
    create: {
      accountId,
      platform: account.platform,
      followers: metrics.followers,
      following: metrics.following ?? 0,
      postsCount: metrics.postsCount ?? 0,
      rawMetrics: metrics.rawMetrics ?? undefined,
      snapshotDate,
    },
  });

  return {
    accountId: snapshot.accountId,
    platform: snapshot.platform as SocialPlatform,
    followers: snapshot.followers,
    following: snapshot.following,
    postsCount: snapshot.postsCount,
    snapshotDate: snapshot.snapshotDate,
  };
}

/**
 * Capture les snapshots pour tous les comptes actifs.
 * Appelle l'API de chaque plateforme pour récupérer les métriques courantes.
 */
export async function captureAllSnapshots(): Promise<{
  captured: number;
  failed: number;
  errors: Array<{ accountId: string; error: string }>;
}> {
  const accounts = await getAllSocialAccounts();
  const activeAccounts = accounts.filter(a => a.isActive);

  let captured = 0;
  let failed = 0;
  const errors: Array<{ accountId: string; error: string }> = [];

  for (const account of activeAccounts) {
    try {
      const client = getSocialClient(account.platform as SocialPlatform);

      const profileResult = await client.getAccountMetrics({
        accessToken: account.accessToken,
        accountMetadata: account.metadata,
        platformId: account.platformId,
      });

      if (profileResult.success) {
        await captureAccountSnapshot(account.id, {
          followers: profileResult.followers ?? 0,
          following: profileResult.following ?? 0,
          postsCount: profileResult.postsCount ?? 0,
          rawMetrics: profileResult.rawData,
        });
        captured++;
      } else {
        errors.push({ accountId: account.id, error: profileResult.error || 'Unknown error' });
        failed++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ accountId: account.id, error: message });
      failed++;
    }

    // Petit délai pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return { captured, failed, errors };
}

// ===========================================
// Snapshot Queries
// ===========================================

/**
 * Récupère les snapshots d'un compte sur une période
 */
export async function getAccountSnapshots(
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<AccountSnapshot[]> {
  const snapshots = await prisma.socialAccountSnapshot.findMany({
    where: {
      accountId,
      snapshotDate: {
        gte: truncateToDay(startDate),
        lte: truncateToDay(endDate),
      },
    },
    orderBy: { snapshotDate: 'asc' },
  });

  return snapshots.map(s => ({
    accountId: s.accountId,
    platform: s.platform as SocialPlatform,
    followers: s.followers,
    following: s.following,
    postsCount: s.postsCount,
    snapshotDate: s.snapshotDate,
  }));
}

/**
 * Récupère le dernier snapshot de chaque compte actif
 */
export async function getLatestSnapshots(): Promise<AccountSnapshot[]> {
  // Get distinct accounts that have snapshots
  const accounts = await prisma.socialAccount.findMany({
    where: { isActive: true },
    select: { id: true, platform: true },
  });

  const results: AccountSnapshot[] = [];

  for (const account of accounts) {
    const latest = await prisma.socialAccountSnapshot.findFirst({
      where: { accountId: account.id },
      orderBy: { snapshotDate: 'desc' },
    });

    if (latest) {
      results.push({
        accountId: latest.accountId,
        platform: latest.platform as SocialPlatform,
        followers: latest.followers,
        following: latest.following,
        postsCount: latest.postsCount,
        snapshotDate: latest.snapshotDate,
      });
    }
  }

  return results;
}

/**
 * Calcule la croissance des followers pour chaque plateforme
 * sur une période donnée.
 */
export async function getFollowerGrowth(startDate: Date, endDate: Date): Promise<FollowerGrowth[]> {
  const accounts = await prisma.socialAccount.findMany({
    where: { isActive: true },
    select: { id: true, platform: true },
  });

  const results: FollowerGrowth[] = [];

  for (const account of accounts) {
    // Snapshot le plus proche de startDate
    const startSnapshot = await prisma.socialAccountSnapshot.findFirst({
      where: {
        accountId: account.id,
        snapshotDate: { gte: truncateToDay(startDate) },
      },
      orderBy: { snapshotDate: 'asc' },
    });

    // Snapshot le plus récent <= endDate
    const endSnapshot = await prisma.socialAccountSnapshot.findFirst({
      where: {
        accountId: account.id,
        snapshotDate: { lte: truncateToDay(endDate) },
      },
      orderBy: { snapshotDate: 'desc' },
    });

    if (startSnapshot && endSnapshot) {
      const change = endSnapshot.followers - startSnapshot.followers;
      const changePercent =
        startSnapshot.followers > 0
          ? (change / startSnapshot.followers) * 100
          : endSnapshot.followers > 0
            ? 100
            : 0;

      results.push({
        accountId: account.id,
        platform: account.platform as SocialPlatform,
        currentFollowers: endSnapshot.followers,
        previousFollowers: startSnapshot.followers,
        change,
        changePercent,
      });
    }
  }

  return results;
}

/**
 * Récupère le total de followers par plateforme (dernier snapshot de chaque compte)
 */
export async function getTotalFollowersByPlatform(): Promise<
  Map<string, { followers: number; change: number }>
> {
  console.log('[PostsPanel:Debug][getTotalFollowersByPlatform] Appelé');

  const latestSnapshots = await getLatestSnapshots();

  console.log(
    '[PostsPanel:Debug][getTotalFollowersByPlatform] Snapshots récents:',
    latestSnapshots.length,
    latestSnapshots.map(s => `${s.platform}=${s.followers}`)
  );

  // Get snapshots from 7 days ago for comparison
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoTruncated = truncateToDay(weekAgo);

  const result = new Map<string, { followers: number; change: number }>();

  // Group latest by platform
  const latestByPlatform = new Map<string, number>();
  for (const snap of latestSnapshots) {
    const existing = latestByPlatform.get(snap.platform) ?? 0;
    latestByPlatform.set(snap.platform, existing + snap.followers);
  }

  // Get week-ago snapshots for each account
  for (const [platform, currentFollowers] of latestByPlatform) {
    const weekAgoSnapshots = await prisma.socialAccountSnapshot.findMany({
      where: {
        platform: platform as any,
        snapshotDate: {
          gte: new Date(weekAgoTruncated.getTime() - 24 * 60 * 60 * 1000), // +-1 day tolerance
          lte: new Date(weekAgoTruncated.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const previousFollowers = weekAgoSnapshots.reduce((sum, s) => sum + s.followers, 0);
    const change =
      previousFollowers > 0
        ? ((currentFollowers - previousFollowers) / previousFollowers) * 100
        : 0;

    result.set(platform, { followers: currentFollowers, change });
  }

  console.log(
    '[PostsPanel:Debug][getTotalFollowersByPlatform] Résultat Map:',
    [...result.entries()].map(
      ([k, v]) => `${k}: followers=${v.followers}, change=${v.change.toFixed(1)}%`
    )
  );

  return result;
}
