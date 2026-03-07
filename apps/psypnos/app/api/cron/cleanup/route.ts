/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Some Prisma models may not be available in Kairn schema
/**
 * Cron Cleanup API Route (unified)
 *
 * Combines data cleanup and job cleanup into a single endpoint
 * to stay within QStash schedule limits.
 *
 * Uses centralized retention configuration from @kairn/analytics.
 * See packages/analytics/src/server/retention.ts for retention policies.
 *
 * Frequency: daily at 3am (0 3 * * *)
 * Security: QStash signature or CRON_SECRET
 */

import { DEFAULT_RETENTION_CONFIG, computeCutoffDate } from '@kairn/analytics/server';
import { verifyCronAuth } from '@kairn/core/scheduler';
import { EventType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

// Use centralized retention configuration from @kairn/analytics
const retentionConfig = DEFAULT_RETENTION_CONFIG;

// ── Helpers ─────────────────────────────────────────────────────────────────

interface CleanupResult {
  table: string;
  deleted: number;
  retentionDays?: number;
}

// ── Data cleanup ────────────────────────────────────────────────────────────

/**
 * Clean up analytics data based on centralized retention policies
 */
async function cleanupData(): Promise<{ results: CleanupResult[]; total: number }> {
  const results: CleanupResult[] = [];
  let total = 0;
  const siteId = await getSiteId();

  // 1. Clean up unified AnalyticsEvent table by event type group
  for (const [groupName, policy] of Object.entries(retentionConfig.events)) {
    const cutoff = computeCutoffDate(policy.days);
    const eventTypes = policy.types
      .map(t => EventType[t as keyof typeof EventType])
      .filter(Boolean);
    const result = await prisma.analyticsEvent.deleteMany({
      where: {
        siteId,
        type: { in: eventTypes },
        createdAt: { lt: cutoff },
      },
    });
    results.push({
      table: `AnalyticsEvent (${groupName})`,
      deleted: result.count,
      retentionDays: policy.days,
    });
    total += result.count;
  }

  // 2. Clean up VisitorGeolocation
  const geoCutoff = computeCutoffDate(retentionConfig.visitorGeolocationDays);
  const geoResult = await prisma.visitorGeolocation.deleteMany({
    where: { siteId, timestamp: { lt: geoCutoff } },
  });
  results.push({
    table: 'VisitorGeolocation',
    deleted: geoResult.count,
    retentionDays: retentionConfig.visitorGeolocationDays,
  });
  total += geoResult.count;

  // 3. Clean up old daily summaries
  const summaryCutoff = computeCutoffDate(retentionConfig.dailySummaryDays);
  const summaryResult = await prisma.analyticsDailySummary.deleteMany({
    where: { siteId, date: { lt: summaryCutoff } },
  });
  results.push({
    table: 'AnalyticsDailySummary',
    deleted: summaryResult.count,
    retentionDays: retentionConfig.dailySummaryDays,
  });
  total += summaryResult.count;

  // 4. Clean up legacy tables (graceful — catch errors for models that may not exist)
  for (const table of retentionConfig.legacyTables) {
    try {
      const cutoff = computeCutoffDate(table.days);
      const model = (prisma as unknown as Record<string, unknown>)[table.model] as
        | {
            deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
          }
        | undefined;

      if (model) {
        const result = await model.deleteMany({
          where: { siteId, [table.dateField]: { lt: cutoff } },
        });
        results.push({
          table: table.model,
          deleted: result.count,
          retentionDays: table.days,
        });
        total += result.count;
      }
    } catch {
      // Legacy model may not exist in schema — skip silently
    }
  }

  return { results, total };
}

// ── Job cleanup ─────────────────────────────────────────────────────────────

/**
 * Clean up orphaned and old jobs
 */
async function cleanupJobs(): Promise<{
  results: CleanupResult[];
  total: number;
}> {
  const results: CleanupResult[] = [];
  let total = 0;
  const siteId = await getSiteId();
  const { orphanTimeoutMinutes, jobRetentionDays, socialLogRetentionDays } = retentionConfig.jobs;

  // 1. Mark orphaned PROCESSING jobs as FAILED
  const orphanCutoff = new Date(Date.now() - orphanTimeoutMinutes * 60 * 1000);
  const orphanedJobs = await prisma.blogGenerationJob.updateMany({
    where: {
      siteId,
      status: 'PROCESSING',
      startedAt: { lt: orphanCutoff },
    },
    data: {
      status: 'FAILED',
      error: `Job orphelin - timeout après ${orphanTimeoutMinutes} minutes sans activité`,
      completedAt: new Date(),
    },
  });
  results.push({ table: 'BlogGenerationJob (orphaned)', deleted: orphanedJobs.count });
  total += orphanedJobs.count;

  // 2. Delete old COMPLETED/FAILED jobs
  const retentionCutoff = computeCutoffDate(jobRetentionDays);
  const deletedJobs = await prisma.blogGenerationJob.deleteMany({
    where: {
      siteId,
      status: { in: ['COMPLETED', 'FAILED'] },
      completedAt: { lt: retentionCutoff },
    },
  });
  results.push({
    table: 'BlogGenerationJob (old)',
    deleted: deletedJobs.count,
    retentionDays: jobRetentionDays,
  });
  total += deletedJobs.count;

  // 3. Delete old social generation logs
  const socialLogCutoff = computeCutoffDate(socialLogRetentionDays);
  const deletedSocialLogs = await prisma.socialGenerationLog.deleteMany({
    where: { createdAt: { lt: socialLogCutoff } },
  });
  results.push({
    table: 'SocialGenerationLog',
    deleted: deletedSocialLogs.count,
    retentionDays: socialLogRetentionDays,
  });
  total += deletedSocialLogs.count;

  return { results, total };
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Run both cleanup phases
    const [dataCleanup, jobCleanup] = await Promise.all([cleanupData(), cleanupJobs()]);

    const totalDeleted = dataCleanup.total + jobCleanup.total;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (totalDeleted > 0) {
      console.warn(`[Cron:cleanup] ${totalDeleted} records processed in ${duration}s`);
      for (const r of [...dataCleanup.results, ...jobCleanup.results]) {
        if (r.deleted > 0) {
          const retention = r.retentionDays ? ` (>${r.retentionDays} days)` : '';
          console.warn(`  - ${r.table}: ${r.deleted}${retention}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup complete: ${totalDeleted} records processed`,
      duration: `${duration}s`,
      processed: totalDeleted,
      retentionPolicy: {
        events: Object.fromEntries(
          Object.entries(retentionConfig.events).map(([k, v]) => [k, `${v.days} days`])
        ),
        visitorGeolocation: `${retentionConfig.visitorGeolocationDays} days`,
        dailySummary: `${retentionConfig.dailySummaryDays} days`,
      },
      data: {
        total: dataCleanup.total,
        results: dataCleanup.results,
      },
      jobs: {
        total: jobCleanup.total,
        results: jobCleanup.results,
      },
    });
  } catch (error) {
    console.error('[Cron:cleanup] Error:', error);
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Accept POST as well since QStash sends POST by default
export { GET as POST };
