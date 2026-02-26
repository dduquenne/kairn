/**
 * Analytics Aggregation Service
 * Phase 4: Scalability & Performance
 *
 * Pre-computes daily aggregations for faster dashboard loading.
 * Uses the unified Kairn schema: AnalyticsEvent -> AnalyticsDailySummary.
 * Should be run via cron job daily.
 */

import { Prisma } from '@prisma/client';

import { prisma, isDatabaseConnected } from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

interface EventData {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: string;
  timeOnPage?: number;
  scrollDepthPercent?: number;
  isBot?: boolean;
  sectionId?: string;
  sectionName?: string;
  timeSpent?: number;
  conversionType?: string;
  completed?: boolean;
}

/**
 * Compute and store daily summary aggregation from AnalyticsEvent
 */
export async function computeDailySummary(date: Date = new Date()): Promise<void> {
  const isConnected = await isDatabaseConnected();
  if (!isConnected) {
    console.log('[Aggregation] Database not connected, skipping');
    return;
  }

  const siteId = await getSiteId();

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  console.log(`[Aggregation] Computing summary for ${dayStart.toISOString().split('T')[0]}`);

  // Get all PAGE_VIEW events for the day (excluding bots)
  const pageViews = await prisma.analyticsEvent.findMany({
    where: {
      siteId,
      type: 'PAGE_VIEW',
      createdAt: { gte: dayStart, lt: dayEnd },
    },
    select: { sessionId: true, data: true, path: true },
  });

  // Filter out bots
  const humanViews = pageViews.filter(v => {
    const data = v.data as EventData | null;
    return !data?.isBot;
  });

  const sessions = new Set(humanViews.map(v => v.sessionId).filter(Boolean));
  const uniqueVisitors = sessions.size;
  const totalPageViews = humanViews.length;

  // Device breakdown
  const deviceBreakdown = { mobile: 0, desktop: 0, tablet: 0 };
  humanViews.forEach(v => {
    const data = v.data as EventData | null;
    const device = data?.deviceType || 'desktop';
    if (device === 'mobile') deviceBreakdown.mobile++;
    else if (device === 'tablet') deviceBreakdown.tablet++;
    else deviceBreakdown.desktop++;
  });

  // Average time on site from PAGE_EXIT events
  const exitEvents = await prisma.analyticsEvent.findMany({
    where: {
      siteId,
      type: 'PAGE_EXIT',
      createdAt: { gte: dayStart, lt: dayEnd },
    },
    select: { data: true },
  });

  const timesOnPage = exitEvents
    .map(e => (e.data as EventData | null)?.timeOnPage)
    .filter((t): t is number => t != null && t > 0);

  const avgTimeOnSite =
    timesOnPage.length > 0 ? timesOnPage.reduce((sum, t) => sum + t, 0) / timesOnPage.length : 0;

  // Sessions count (SESSION_START events)
  const sessionCount = await prisma.analyticsEvent.count({
    where: {
      siteId,
      type: 'SESSION_START',
      createdAt: { gte: dayStart, lt: dayEnd },
    },
  });

  // Bounce rate: sessions with only 1 page view
  const sessionPageCounts = new Map<string, number>();
  humanViews.forEach(v => {
    if (v.sessionId) {
      sessionPageCounts.set(v.sessionId, (sessionPageCounts.get(v.sessionId) || 0) + 1);
    }
  });
  const bouncedSessions = Array.from(sessionPageCounts.values()).filter(
    count => count === 1
  ).length;
  const bounceRate = uniqueVisitors > 0 ? (bouncedSessions / uniqueVisitors) * 100 : 0;

  // Conversions
  const conversionEvents = await prisma.analyticsEvent.findMany({
    where: {
      siteId,
      type: 'CONVERSION',
      createdAt: { gte: dayStart, lt: dayEnd },
    },
    select: { data: true, name: true },
  });

  const conversions: Record<string, number> = {};
  conversionEvents.forEach(e => {
    const key = e.name || 'unknown';
    conversions[key] = (conversions[key] || 0) + 1;
  });

  // Top pages
  const pageCounts = new Map<string, number>();
  humanViews.forEach(v => {
    pageCounts.set(v.path, (pageCounts.get(v.path) || 0) + 1);
  });
  const topPages = Array.from(pageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }));

  // Top sources
  const sourceCounts = new Map<string, number>();
  humanViews.forEach(v => {
    const data = v.data as EventData | null;
    const source = data?.utmSource || data?.referrer || 'direct';
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
  });
  const topSources = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, visits]) => ({ source, visits }));

  // Upsert daily summary
  await prisma.analyticsDailySummary.upsert({
    where: { siteId_date: { siteId, date: dayStart } },
    update: {
      pageViews: totalPageViews,
      uniqueVisitors,
      sessions: sessionCount || uniqueVisitors,
      bounceRate,
      avgTimeOnSite,
      topPages,
      topSources,
      deviceBreakdown,
      conversions: Object.keys(conversions).length > 0 ? conversions : Prisma.JsonNull,
    },
    create: {
      siteId,
      date: dayStart,
      pageViews: totalPageViews,
      uniqueVisitors,
      sessions: sessionCount || uniqueVisitors,
      bounceRate,
      avgTimeOnSite,
      topPages,
      topSources,
      deviceBreakdown,
      conversions: Object.keys(conversions).length > 0 ? conversions : Prisma.JsonNull,
    },
  });

  console.log(
    `[Aggregation] Daily summary saved: ${totalPageViews} views, ${uniqueVisitors} visitors`
  );
}

/**
 * Run all daily aggregations
 */
export async function runDailyAggregations(date: Date = new Date()): Promise<void> {
  console.log('[Aggregation] Starting daily aggregations...');
  const start = Date.now();

  try {
    await computeDailySummary(date);

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`[Aggregation] Completed in ${duration}s`);
  } catch (error) {
    console.error('[Aggregation] Error:', error);
    throw error;
  }
}

/**
 * Backfill aggregations for a date range
 */
export async function backfillAggregations(
  startDate: Date,
  endDate: Date = new Date()
): Promise<void> {
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  console.log(
    `[Aggregation] Backfilling from ${current.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`
  );

  while (current <= end) {
    await runDailyAggregations(current);
    current.setDate(current.getDate() + 1);
  }

  console.log('[Aggregation] Backfill complete');
}

/**
 * Get pre-computed daily summaries for a date range
 */
export async function getDailySummaries(startDate: Date, endDate: Date) {
  const siteId = await getSiteId();
  return prisma.analyticsDailySummary.findMany({
    where: {
      siteId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });
}
