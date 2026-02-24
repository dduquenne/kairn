/**
 * PostgreSQL Analytics Summary Functions
 *
 * Uses the unified AnalyticsEvent model with SQL-level aggregations
 * instead of loading all records into memory.
 */

import { EventType, Prisma } from '@prisma/client';

import { getCached, CACHE_KEYS, CACHE_TTL, buildCacheKey } from '@/lib/cache/redis';
import { prisma } from '@/lib/db/prisma';

import { buildDateFilter, getCurrentSiteId } from './utils';

/**
 * Get analytics summary for a date range using SQL aggregations
 */
export async function getAnalyticsSummary(startDate?: string, endDate?: string) {
  const cacheKey = buildCacheKey(CACHE_KEYS.SUMMARY, {
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const siteId = await getCurrentSiteId();
      const dateFilter = buildDateFilter(startDate, endDate);

      // Count total page views (excluding bots) and unique sessions via SQL
      const [pageViewStats, bounceStats, sectionTimeStats, conversionStats] = await Promise.all([
        // 1. Page view counts + unique sessions (SQL aggregation)
        prisma.analyticsEvent.groupBy({
          by: ['sessionId'],
          where: {
            siteId,
            type: EventType.PAGE_VIEW,
            ...dateFilter,
            NOT: {
              data: {
                path: ['isBot'],
                equals: true,
              },
            },
          },
          _count: { id: true },
        }),

        // 2. Total page views count (for total)
        prisma.analyticsEvent.count({
          where: {
            siteId,
            type: EventType.PAGE_VIEW,
            ...dateFilter,
            NOT: {
              data: {
                path: ['isBot'],
                equals: true,
              },
            },
          },
        }),

        // 3. Section times grouped by session (for avg time on site)
        prisma.analyticsEvent.findMany({
          where: {
            siteId,
            type: EventType.SECTION_TIME,
            ...dateFilter,
          },
          select: {
            sessionId: true,
            name: true,
            data: true,
          },
        }),

        // 4. Conversion counts grouped by name
        prisma.analyticsEvent.groupBy({
          by: ['name'],
          where: {
            siteId,
            type: EventType.CONVERSION,
            ...dateFilter,
          },
          _count: { id: true },
        }),
      ]);

      // Compute summary from grouped results
      const totalVisits = bounceStats;
      const uniqueSessions = pageViewStats.length;

      // Bounce rate: sessions with exactly 1 page view
      const bouncedSessions = pageViewStats.filter(s => s._count.id === 1).length;
      const bounceRate = uniqueSessions > 0 ? (bouncedSessions / uniqueSessions) * 100 : 0;

      // Average time on site from section times
      const sessionDurations = new Map<string, number>();
      const sectionStats = new Map<string, { totalTime: number; count: number }>();

      for (const st of sectionTimeStats) {
        const data = (st.data as Record<string, unknown>) || {};
        const timeSpent = (typeof data.timeSpent === 'number' ? data.timeSpent : 0);

        if (st.sessionId) {
          sessionDurations.set(st.sessionId, (sessionDurations.get(st.sessionId) || 0) + timeSpent);
        }

        const section = st.name || 'unknown';
        const current = sectionStats.get(section) || { totalTime: 0, count: 0 };
        current.totalTime += timeSpent;
        current.count++;
        sectionStats.set(section, current);
      }

      const averageTimeOnSite =
        sessionDurations.size > 0
          ? Array.from(sessionDurations.values()).reduce((a, b) => a + b, 0) / sessionDurations.size
          : 0;

      const topSections = Array.from(sectionStats.entries())
        .filter(([section]) => section.toLowerCase() !== 'unknown')
        .map(([section, stats]) => ({
          section,
          avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
          visits: stats.count,
        }))
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 5);

      // Conversion summary from groupBy
      const conversionByType: Record<string, { clicks: number; completed: number; rate: number }> = {};
      let totalClicks = 0;

      for (const group of conversionStats) {
        const eventType = group.name || 'unknown';
        conversionByType[eventType] = {
          clicks: group._count.id,
          completed: 0,
          rate: 0,
        };
        totalClicks += group._count.id;
      }

      // Get completed conversions count
      const completedConversions = await prisma.analyticsEvent.groupBy({
        by: ['name'],
        where: {
          siteId,
          type: EventType.CONVERSION,
          ...dateFilter,
          data: {
            path: ['completed'],
            equals: true,
          },
        },
        _count: { id: true },
      });

      let totalCompleted = 0;
      for (const group of completedConversions) {
        const eventType = group.name || 'unknown';
        if (conversionByType[eventType]) {
          conversionByType[eventType].completed = group._count.id;
          conversionByType[eventType].rate =
            conversionByType[eventType].clicks > 0
              ? (group._count.id / conversionByType[eventType].clicks) * 100
              : 0;
        }
        totalCompleted += group._count.id;
      }

      const conversionRate = totalClicks > 0 ? (totalCompleted / totalClicks) * 100 : 0;

      return {
        totalVisits,
        uniqueSessions,
        averageTimeOnSite,
        conversionRate,
        bounceRate,
        topSections,
        conversionByType,
      };
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Get visits aggregated by time period using SQL date_trunc
 */
export async function getVisitsByPeriod(
  period: 'hour' | 'day' | 'week' | 'month' | 'year',
  startDate?: string,
  endDate?: string
) {
  const cacheKey = buildCacheKey(CACHE_KEYS.VISITS_BY_PERIOD, {
    period,
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const siteId = await getCurrentSiteId();
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Use raw SQL for date_trunc aggregation
      const results = await prisma.$queryRaw<Array<{ period: string; visits: bigint }>>`
        SELECT
          date_trunc(${period}, "createdAt") as period,
          COUNT(*) as visits
        FROM "AnalyticsEvent"
        WHERE "siteId" = ${siteId}
          AND "type" = 'PAGE_VIEW'
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
          AND (data->>'isBot' IS NULL OR data->>'isBot' != 'true')
        GROUP BY date_trunc(${period}, "createdAt")
        ORDER BY period ASC
      `;

      return results.map(r => ({
        period: r.period,
        visits: Number(r.visits),
      }));
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Get analytics summary with comparison to previous period
 */
export async function getAnalyticsSummaryWithComparison(
  timeRange: 'day' | 'week' | 'month' | 'year'
) {
  const now = new Date();
  let currentStart = new Date();
  const currentEnd = new Date(now);
  currentEnd.setHours(23, 59, 59, 999);

  let previousStart = new Date();
  let previousEnd = new Date();

  if (timeRange === 'day') {
    currentStart = new Date(now);
    currentStart.setHours(0, 0, 0, 0);
    previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);
    previousStart = new Date(previousEnd);
    previousStart.setHours(0, 0, 0, 0);
  } else if (timeRange === 'week') {
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentStart = new Date(now.setDate(diff));
    currentStart.setHours(0, 0, 0, 0);
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
    previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);
  } else if (timeRange === 'month') {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    previousEnd.setHours(23, 59, 59, 999);
  } else if (timeRange === 'year') {
    currentStart = new Date(now.getFullYear(), 0, 1);
    previousStart = new Date(now.getFullYear() - 1, 0, 1);
    previousEnd = new Date(now.getFullYear() - 1, 11, 31);
    previousEnd.setHours(23, 59, 59, 999);
  }

  const [currentSummary, previousSummary] = await Promise.all([
    getAnalyticsSummary(currentStart.toISOString(), currentEnd.toISOString()),
    getAnalyticsSummary(previousStart.toISOString(), previousEnd.toISOString()),
  ]);

  const calcChange = (current: number, previous: number) =>
    previous > 0 ? ((current - previous) / previous) * 100 : 0;

  return {
    current: {
      totalVisits: currentSummary.totalVisits,
      uniqueSessions: currentSummary.uniqueSessions,
      averageTimeOnSite: currentSummary.averageTimeOnSite,
      conversionRate: currentSummary.conversionRate,
    },
    previous: {
      totalVisits: previousSummary.totalVisits,
      uniqueSessions: previousSummary.uniqueSessions,
      averageTimeOnSite: previousSummary.averageTimeOnSite,
      conversionRate: previousSummary.conversionRate,
    },
    comparison: {
      totalVisitsChange: calcChange(currentSummary.totalVisits, previousSummary.totalVisits),
      uniqueSessionsChange: calcChange(currentSummary.uniqueSessions, previousSummary.uniqueSessions),
      averageTimeOnSiteChange: calcChange(currentSummary.averageTimeOnSite, previousSummary.averageTimeOnSite),
      conversionRateChange: currentSummary.conversionRate - previousSummary.conversionRate,
    },
  };
}

/**
 * Get section engagement heatmap using SQL aggregation
 */
export async function getSectionHeatmap(startDate?: string, endDate?: string) {
  const cacheKey = buildCacheKey(CACHE_KEYS.HEATMAP, {
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const siteId = await getCurrentSiteId();
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Get total unique sessions for scroll rate calculation
      const totalSessions = await prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          siteId,
          type: EventType.PAGE_VIEW,
          createdAt: { gte: start, lte: end },
          NOT: { data: { path: ['isBot'], equals: true } },
        },
      });
      const totalSessionCount = totalSessions.length;

      // Get section stats using raw SQL for JSON extraction + aggregation
      const sectionResults = await prisma.$queryRaw<Array<{
        section: string;
        visitors: bigint;
        avg_time_ms: number;
        view_count: bigint;
      }>>`
        SELECT
          "name" as section,
          COUNT(DISTINCT "sessionId") as visitors,
          AVG(CAST(data->>'timeSpent' AS DOUBLE PRECISION)) as avg_time_ms,
          COUNT(*) as view_count
        FROM "AnalyticsEvent"
        WHERE "siteId" = ${siteId}
          AND "type" = 'SECTION_TIME'
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
          AND "name" IS NOT NULL
          AND LOWER("name") != 'unknown'
        GROUP BY "name"
        ORDER BY visitors DESC
      `;

      return sectionResults.map(row => ({
        section: row.section,
        visitors: Number(row.visitors),
        avgTimeSeconds: Math.round((row.avg_time_ms || 0) / 1000),
        scrollRate: totalSessionCount > 0
          ? parseFloat(((Number(row.visitors) / totalSessionCount) * 100).toFixed(1))
          : 0,
        conversionsFromSection: 0,
        conversionsByType: {},
      }));
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Get traffic sources breakdown using SQL aggregation
 */
export async function getTrafficSources(startDate?: string, endDate?: string) {
  const cacheKey = buildCacheKey(CACHE_KEYS.TRAFFIC_SOURCES, {
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const siteId = await getCurrentSiteId();
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const results = await prisma.$queryRaw<Array<{
        source: string;
        medium: string;
        visits: bigint;
        unique_sessions: bigint;
      }>>`
        SELECT
          COALESCE(data->>'utmSource', data->>'referrerDomain', 'direct') as source,
          COALESCE(data->>'utmMedium', 'none') as medium,
          COUNT(*) as visits,
          COUNT(DISTINCT "sessionId") as unique_sessions
        FROM "AnalyticsEvent"
        WHERE "siteId" = ${siteId}
          AND "type" = 'PAGE_VIEW'
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
          AND (data->>'isBot' IS NULL OR data->>'isBot' != 'true')
        GROUP BY source, medium
        ORDER BY visits DESC
      `;

      return results.map(row => ({
        source: row.source,
        medium: row.medium,
        visits: Number(row.visits),
        uniqueSessions: Number(row.unique_sessions),
        conversionRate: 0,
      }));
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Get device breakdown using SQL aggregation
 */
export async function getDeviceBreakdown(startDate?: string, endDate?: string) {
  const cacheKey = buildCacheKey(CACHE_KEYS.DEVICE_BREAKDOWN, {
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const siteId = await getCurrentSiteId();
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const results = await prisma.$queryRaw<Array<{
        device_type: string;
        visits: bigint;
        unique_sessions: bigint;
      }>>`
        SELECT
          COALESCE(data->>'deviceType', 'unknown') as device_type,
          COUNT(*) as visits,
          COUNT(DISTINCT "sessionId") as unique_sessions
        FROM "AnalyticsEvent"
        WHERE "siteId" = ${siteId}
          AND "type" = 'PAGE_VIEW'
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
          AND (data->>'isBot' IS NULL OR data->>'isBot' != 'true')
        GROUP BY device_type
        ORDER BY visits DESC
      `;

      return results.map(row => ({
        deviceType: row.device_type,
        visits: Number(row.visits),
        uniqueSessions: Number(row.unique_sessions),
        avgTimeOnSite: 0,
      }));
    },
    CACHE_TTL.MEDIUM
  );
}
