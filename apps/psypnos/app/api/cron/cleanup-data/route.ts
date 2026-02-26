/**
 * Cron Cleanup Data API Route
 *
 * Purges old analytics data to optimize database performance.
 *
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
 * Frequency: daily at 3am (0 3 * * *)
 * Security: QStash signature or CRON_SECRET
 */

import { verifyCronAuth } from '@kairn/core/scheduler';
import { EventType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';

// Retention configuration (in days) by event type
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

// Legacy table retention (for tables that still exist in schema)
const LEGACY_RETENTION = {
  visitorGeolocation: 60,
  pageVisit: 90,
  blogAnalytics: 90,
  blogCtaClick: 90,
  blogFaqClick: 90,
  botVisit: 30,
};

interface CleanupResult {
  table: string;
  deleted: number;
  retentionDays: number;
}

function daysToCutoff(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function GET(request: NextRequest) {
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: CleanupResult[] = [];
  let totalDeleted = 0;

  try {
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
      totalDeleted += result.count;
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
    totalDeleted += geoResult.count;

    // 3. Clean up legacy tables (graceful — catch errors for models that may not exist)
    const legacyTables = [
      {
        name: 'PageVisit',
        model: 'pageVisit',
        field: 'timestamp',
        days: LEGACY_RETENTION.pageVisit,
      },
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
          totalDeleted += result.count;
        }
      } catch {
        // Legacy model may not exist in schema — skip silently
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (totalDeleted > 0) {
      console.log(`[Cron:cleanup-data] ${totalDeleted} records deleted in ${duration}s`);
      results.forEach(r => {
        if (r.deleted > 0) {
          console.log(`  - ${r.table}: ${r.deleted} (>${r.retentionDays} days)`);
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup complete: ${totalDeleted} records deleted`,
      duration: `${duration}s`,
      processed: totalDeleted,
      results,
    });
  } catch (error) {
    console.error('[Cron:cleanup-data] Error:', error);
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Accepter aussi POST car QStash envoie POST par défaut
export { GET as POST };
