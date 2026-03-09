import type { NextRequest } from 'next/server';

import prisma from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

import { withAdminAuth } from '../../auth/middleware';

export const dynamic = 'force-dynamic';

/**
 * Purge analytics data older than a given date.
 * Uses the unified Kairn schema models (AnalyticsEvent, AnalyticsDailySummary, etc.)
 */
export async function POST(request: NextRequest) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { purgeDate } = await request.json();

    if (!purgeDate) {
      return Response.json({ error: 'purgeDate is required (ISO format)' }, { status: 400 });
    }

    const purgeDateObj = new Date(purgeDate);
    purgeDateObj.setHours(23, 59, 59, 999);

    if (isNaN(purgeDateObj.getTime())) {
      return Response.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const siteId = await getSiteId();

    // Count records before deletion
    const countsBefore = await Promise.all([
      prisma.analyticsEvent.count({ where: { siteId } }),
      prisma.analyticsDailySummary.count({ where: { siteId } }),
      prisma.blogAnalytics.count(),
      prisma.blogCtaClick.count(),
      prisma.blogFaqClick.count(),
      prisma.visitorGeolocation.count({ where: { siteId } }),
      prisma.analyticsGoalCompletion.count(),
      prisma.analyticsAlertHistory.count(),
      prisma.analyticsAnomaly.count({ where: { siteId } }),
      prisma.botVisit.count(),
    ]);

    // Delete records older than purgeDate
    const deletionResults = await Promise.all([
      prisma.analyticsEvent.deleteMany({
        where: { siteId, createdAt: { lte: purgeDateObj } },
      }),
      prisma.analyticsDailySummary.deleteMany({
        where: { siteId, date: { lte: purgeDateObj } },
      }),
      prisma.blogAnalytics.deleteMany({
        where: { timestamp: { lte: purgeDateObj } },
      }),
      prisma.blogCtaClick.deleteMany({
        where: { timestamp: { lte: purgeDateObj } },
      }),
      prisma.blogFaqClick.deleteMany({
        where: { timestamp: { lte: purgeDateObj } },
      }),
      prisma.visitorGeolocation.deleteMany({
        where: { siteId, timestamp: { lte: purgeDateObj } },
      }),
      prisma.analyticsGoalCompletion.deleteMany({
        where: { timestamp: { lte: purgeDateObj } },
      }),
      prisma.analyticsAlertHistory.deleteMany({
        where: { triggeredAt: { lte: purgeDateObj } },
      }),
      prisma.analyticsAnomaly.deleteMany({
        where: { siteId, detectedAt: { lte: purgeDateObj } },
      }),
      prisma.botVisit.deleteMany({
        where: { timestamp: { lte: purgeDateObj } },
      }),
    ]);

    // Count records after deletion
    const countsAfter = await Promise.all([
      prisma.analyticsEvent.count({ where: { siteId } }),
      prisma.analyticsDailySummary.count({ where: { siteId } }),
      prisma.blogAnalytics.count(),
      prisma.blogCtaClick.count(),
      prisma.blogFaqClick.count(),
      prisma.visitorGeolocation.count({ where: { siteId } }),
      prisma.analyticsGoalCompletion.count(),
      prisma.analyticsAlertHistory.count(),
      prisma.analyticsAnomaly.count({ where: { siteId } }),
      prisma.botVisit.count(),
    ]);

    const labels = [
      'analyticsEvents',
      'dailySummaries',
      'blogAnalytics',
      'blogCtaClicks',
      'blogFaqClicks',
      'visitorGeolocations',
      'goalCompletions',
      'alertHistory',
      'anomalies',
      'botVisits',
    ];

    const deletedRecords: Record<string, number> = {};
    const remainingRecords: Record<string, number> = {};
    let totalDeleted = 0;

    for (const [i, label] of labels.entries()) {
      const deleted = deletionResults[i]?.count ?? 0;
      deletedRecords[label] = deleted;
      remainingRecords[label] = countsAfter[i] ?? 0;
      totalDeleted += deleted;
    }

    deletedRecords.total = totalDeleted;
    remainingRecords.total = countsAfter.reduce((sum, count) => sum + count, 0);

    return Response.json({
      success: true,
      message: `Purged ${totalDeleted} records up to and including ${purgeDate}`,
      deletedRecords,
      remainingRecords,
    });
  } catch (error) {
    console.error('Error purging analytics data:', error);
    return Response.json({ error: 'Failed to purge analytics data' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    message:
      'POST with { purgeDate: string } to purge data up to and including that date (ISO format)',
  });
}
