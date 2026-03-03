/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Some Prisma models may not be available in Kairn schema
/**
 * Cron Cleanup API Route (unified)
 *
 * Combines data cleanup and job cleanup into a single endpoint
 * to stay within QStash schedule limits.
 *
 * Part 1 - Data cleanup:
 * Purges old analytics data to optimize database performance.
 * Retention strategy for unified AnalyticsEvent table:
 * - PAGE_VIEW / PAGE_EXIT: 90 days
 * - SCROLL_DEPTH / SECTION_VIEW / SECTION_TIME: 60 days
 * - CONVERSION / FUNNEL_STEP: 365 days (business-critical)
 * - CLICK / FORM_SUBMIT / DOWNLOAD: 60 days
 * - CUSTOM / SESSION_START / SESSION_END: 30 days
 *
 * Other tables:
 * - VisitorGeolocation: 60 days
 * - PageVisit (legacy): 90 days
 * - BlogAnalytics (legacy): 90 days
 * - BotVisit (legacy): 30 days
 *
 * Part 2 - Job cleanup:
 * - Marks PROCESSING jobs older than 30 min as FAILED
 * - Deletes COMPLETED/FAILED jobs older than 7 days
 * - Cleans up old social generation logs
 *
 * Frequency: daily at 3am (0 3 * * *)
 * Security: QStash signature or CRON_SECRET
 */

import { verifyCronAuth } from '@kairn/core/scheduler';
import { EventType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';

// ── Data cleanup configuration ──────────────────────────────────────────────

const UNIFIED_RETENTION: Record<string, { types: EventType[]; days: number }> = {
  pageEvents: {
    types: [EventType.PAGE_VIEW, EventType.PAGE_EXIT],
    days: 90,
  },
  engagementEvents: {
    types: [EventType.SCROLL_DEPTH, EventType.SECTION_VIEW, EventType.SECTION_TIME],
    days: 60,
  },
  conversionEvents: {
    types: [EventType.CONVERSION, EventType.FUNNEL_STEP],
    days: 365,
  },
  interactionEvents: {
    types: [EventType.CLICK, EventType.FORM_SUBMIT, EventType.DOWNLOAD],
    days: 60,
  },
  otherEvents: {
    types: [EventType.CUSTOM, EventType.SESSION_START, EventType.SESSION_END],
    days: 30,
  },
};

const LEGACY_RETENTION = {
  visitorGeolocation: 60,
  pageVisit: 90,
  blogAnalytics: 90,
  blogCtaClick: 90,
  blogFaqClick: 90,
  botVisit: 30,
};

// ── Job cleanup configuration ───────────────────────────────────────────────

const ORPHAN_TIMEOUT_MINUTES = 30;
const JOB_RETENTION_DAYS = 7;
const SOCIAL_LOG_RETENTION_DAYS = 30;

// ── Helpers ─────────────────────────────────────────────────────────────────

interface CleanupResult {
  table: string;
  deleted: number;
  retentionDays?: number;
}

function daysToCutoff(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// ── Data cleanup ────────────────────────────────────────────────────────────

async function cleanupData(): Promise<{ results: CleanupResult[]; total: number }> {
  const results: CleanupResult[] = [];
  let total = 0;

  // 1. Clean up unified AnalyticsEvent table by event type
  for (const [groupName, config] of Object.entries(UNIFIED_RETENTION)) {
    const cutoff = daysToCutoff(config.days);
    const result = await prisma.analyticsEvent.deleteMany({
      where: {
        type: { in: config.types },
        createdAt: { lt: cutoff },
      },
    });
    results.push({
      table: `AnalyticsEvent (${groupName})`,
      deleted: result.count,
      retentionDays: config.days,
    });
    total += result.count;
  }

  // 2. Clean up VisitorGeolocation
  const geoCutoff = daysToCutoff(LEGACY_RETENTION.visitorGeolocation);
  const geoResult = await prisma.visitorGeolocation.deleteMany({
    where: { timestamp: { lt: geoCutoff } },
  });
  results.push({
    table: 'VisitorGeolocation',
    deleted: geoResult.count,
    retentionDays: LEGACY_RETENTION.visitorGeolocation,
  });
  total += geoResult.count;

  // 3. Clean up legacy tables (graceful — catch errors for models that may not exist)
  const legacyTables = [
    { name: 'PageVisit', model: 'pageVisit', field: 'timestamp', days: LEGACY_RETENTION.pageVisit },
    {
      name: 'BlogAnalytics',
      model: 'blogAnalytics',
      field: 'timestamp',
      days: LEGACY_RETENTION.blogAnalytics,
    },
    {
      name: 'BlogCtaClick',
      model: 'blogCtaClick',
      field: 'timestamp',
      days: LEGACY_RETENTION.blogCtaClick,
    },
    {
      name: 'BlogFaqClick',
      model: 'blogFaqClick',
      field: 'timestamp',
      days: LEGACY_RETENTION.blogFaqClick,
    },
    { name: 'BotVisit', model: 'botVisit', field: 'timestamp', days: LEGACY_RETENTION.botVisit },
  ];

  for (const table of legacyTables) {
    try {
      const cutoff = daysToCutoff(table.days);
      const model = (prisma as unknown as Record<string, unknown>)[table.model] as
        | {
            deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
          }
        | undefined;

      if (model) {
        const result = await model.deleteMany({
          where: { [table.field]: { lt: cutoff } },
        });
        results.push({ table: table.name, deleted: result.count, retentionDays: table.days });
        total += result.count;
      }
    } catch {
      // Legacy model may not exist in schema — skip silently
    }
  }

  return { results, total };
}

// ── Job cleanup ─────────────────────────────────────────────────────────────

async function cleanupJobs(): Promise<{
  results: CleanupResult[];
  total: number;
}> {
  const results: CleanupResult[] = [];
  let total = 0;

  // 1. Mark orphaned PROCESSING jobs as FAILED
  const orphanCutoff = new Date(Date.now() - ORPHAN_TIMEOUT_MINUTES * 60 * 1000);
  const orphanedJobs = await prisma.blogGenerationJob.updateMany({
    where: {
      status: 'PROCESSING',
      startedAt: { lt: orphanCutoff },
    },
    data: {
      status: 'FAILED',
      error: `Job orphelin - timeout après ${ORPHAN_TIMEOUT_MINUTES} minutes sans activité`,
      completedAt: new Date(),
    },
  });
  results.push({ table: 'BlogGenerationJob (orphaned)', deleted: orphanedJobs.count });
  total += orphanedJobs.count;

  // 2. Delete old COMPLETED/FAILED jobs
  const retentionCutoff = daysToCutoff(JOB_RETENTION_DAYS);
  const deletedJobs = await prisma.blogGenerationJob.deleteMany({
    where: {
      status: { in: ['COMPLETED', 'FAILED'] },
      completedAt: { lt: retentionCutoff },
    },
  });
  results.push({
    table: 'BlogGenerationJob (old)',
    deleted: deletedJobs.count,
    retentionDays: JOB_RETENTION_DAYS,
  });
  total += deletedJobs.count;

  // 3. Delete old social generation logs
  const socialLogCutoff = daysToCutoff(SOCIAL_LOG_RETENTION_DAYS);
  const deletedSocialLogs = await prisma.socialGenerationLog.deleteMany({
    where: { createdAt: { lt: socialLogCutoff } },
  });
  results.push({
    table: 'SocialGenerationLog',
    deleted: deletedSocialLogs.count,
    retentionDays: SOCIAL_LOG_RETENTION_DAYS,
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
      console.log(`[Cron:cleanup] ${totalDeleted} records processed in ${duration}s`);
      for (const r of [...dataCleanup.results, ...jobCleanup.results]) {
        if (r.deleted > 0) {
          const retention = r.retentionDays ? ` (>${r.retentionDays} days)` : '';
          console.log(`  - ${r.table}: ${r.deleted}${retention}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup complete: ${totalDeleted} records processed`,
      duration: `${duration}s`,
      processed: totalDeleted,
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
