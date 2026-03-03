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

/** Whitelist of valid PostgreSQL date_trunc precision values */
const VALID_DATE_TRUNC_PERIODS = new Set([
  'microseconds',
  'milliseconds',
  'second',
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'quarter',
  'year',
  'decade',
  'century',
  'millennium',
]);

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
      const [
        pageViewStats,
        bounceStats,
        pageExitStats,
        sectionTimeStats,
        conversionStats,
        conversionSessionStats,
        completedSessionStats,
      ] = await Promise.all([
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

        // 3. Page exit events (primary source for session duration & scroll depth)
        prisma.analyticsEvent.findMany({
          where: {
            siteId,
            type: EventType.PAGE_EXIT,
            ...dateFilter,
          },
          select: {
            sessionId: true,
            data: true,
          },
        }),

        // 4. Section times grouped by session (for topSections & fallback duration)
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

        // 5. Conversion counts grouped by name
        prisma.analyticsEvent.groupBy({
          by: ['name'],
          where: {
            siteId,
            type: EventType.CONVERSION,
            ...dateFilter,
          },
          _count: { id: true },
        }),

        // 6. Unique sessions with any CONVERSION event (engaged visitors)
        prisma.analyticsEvent.groupBy({
          by: ['sessionId'],
          where: {
            siteId,
            type: EventType.CONVERSION,
            ...dateFilter,
          },
        }),

        // 7. Unique sessions with completed conversions (converted visitors)
        prisma.analyticsEvent.groupBy({
          by: ['sessionId'],
          where: {
            siteId,
            type: EventType.CONVERSION,
            ...dateFilter,
            data: {
              path: ['completed'],
              equals: true,
            },
          },
        }),
      ]);

      // Compute summary from grouped results
      const totalVisits = bounceStats;
      const uniqueSessions = pageViewStats.length;

      // Bounce rate: sessions with exactly 1 page view
      const bouncedSessions = pageViewStats.filter(s => s._count.id === 1).length;
      const bounceRate = uniqueSessions > 0 ? (bouncedSessions / uniqueSessions) * 100 : 0;

      // ── Session duration from PAGE_EXIT events (primary) ──────────
      const pageExitSessionTimes = new Map<string, number>();
      let totalScrollDepth = 0;
      let scrollDepthCount = 0;

      for (const pe of pageExitStats) {
        const data = (pe.data as Record<string, unknown>) || {};
        const timeOnPage = typeof data.timeOnPage === 'number' ? data.timeOnPage : 0;
        const scrollPct = typeof data.scrollDepthPercent === 'number' ? data.scrollDepthPercent : 0;

        if (pe.sessionId && timeOnPage > 0) {
          pageExitSessionTimes.set(
            pe.sessionId,
            (pageExitSessionTimes.get(pe.sessionId) || 0) + timeOnPage
          );
        }

        if (scrollPct > 0) {
          totalScrollDepth += scrollPct;
          scrollDepthCount++;
        }
      }

      // ── Session duration from SECTION_TIME events (fallback) ──────
      const sectionSessionDurations = new Map<string, number>();
      const sectionStats = new Map<string, { totalTime: number; count: number }>();

      for (const st of sectionTimeStats) {
        const data = (st.data as Record<string, unknown>) || {};
        const timeSpent = typeof data.timeSpent === 'number' ? data.timeSpent : 0;

        if (st.sessionId) {
          sectionSessionDurations.set(
            st.sessionId,
            (sectionSessionDurations.get(st.sessionId) || 0) + timeSpent
          );
        }

        const section = st.name || 'unknown';
        const current = sectionStats.get(section) || { totalTime: 0, count: 0 };
        current.totalTime += timeSpent;
        current.count++;
        sectionStats.set(section, current);
      }

      // Use PAGE_EXIT as primary source; fall back to SECTION_TIME
      const durationSource =
        pageExitSessionTimes.size > 0 ? pageExitSessionTimes : sectionSessionDurations;
      const averageTimeOnSite =
        durationSource.size > 0
          ? Array.from(durationSource.values()).reduce((a, b) => a + b, 0) / durationSource.size
          : 0;

      const averageScrollDepth = scrollDepthCount > 0 ? totalScrollDepth / scrollDepthCount : 0;

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
      const conversionByType: Record<string, { clicks: number; completed: number; rate: number }> =
        {};

      for (const group of conversionStats) {
        const eventType = group.name || 'unknown';
        conversionByType[eventType] = {
          clicks: group._count.id,
          completed: 0,
          rate: 0,
        };
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
          // Rate = completed conversions / unique sessions (not conversion events)
          conversionByType[eventType].rate =
            uniqueSessions > 0 ? (group._count.id / uniqueSessions) * 100 : 0;
        }
        totalCompleted += group._count.id;
      }

      // Conversion rate = unique converted sessions / unique visitor sessions
      const engagedSessions = conversionSessionStats.length;
      const convertedSessions = completedSessionStats.length;
      const conversionRate = uniqueSessions > 0 ? (convertedSessions / uniqueSessions) * 100 : 0;

      // Aggregate conversion funnel (Visiteurs → Intéressés → Convertis)
      const funnelSteps = [
        {
          name: 'Visiteurs',
          visitors: uniqueSessions,
        },
        {
          name: 'Intéressés',
          visitors: engagedSessions,
        },
        {
          name: 'Convertis',
          visitors: convertedSessions,
        },
      ];

      return {
        totalVisits,
        uniqueSessions,
        averageTimeOnSite,
        averageScrollDepth,
        conversionRate,
        bounceRate,
        topSections,
        conversionByType,
        funnelSteps,
      };
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Get visits aggregated by time period using SQL date_trunc.
 *
 * IMPORTANT: The `period` parameter is injected as a raw SQL literal (via
 * Prisma.raw) rather than as a parameterised value.  This is necessary
 * because Prisma's tagged-template $queryRaw creates a SEPARATE positional
 * parameter ($N) for every interpolation, even when the same JS variable is
 * referenced twice.  Using ${period} in both the SELECT and GROUP BY clauses
 * produced `date_trunc($1, …)` vs `date_trunc($5, …)` — two distinct
 * parameter references that PostgreSQL could not prove equivalent at parse
 * time, causing:
 *   ERROR: column "…" must appear in the GROUP BY clause or be used in an
 *          aggregate function
 * The error was silently swallowed by the dashboard route's .catch() handler,
 * resulting in an empty visits array and an all-zeros chart.
 *
 * Safety: the value is validated against a strict whitelist before injection.
 *
 * Additionally, GROUP BY 1 is used (positional reference to the first SELECT
 * expression) to guarantee structural equivalence in all PostgreSQL versions.
 *
 * The returned `period` field is normalised to an ISO-8601 string so that
 * downstream consumers (Redis cache, JSON serialisation, frontend Date
 * parsing) all receive a consistent, unambiguous format.
 */
export async function getVisitsByPeriod(
  period: 'hour' | 'day' | 'week' | 'month' | 'year',
  startDate?: string,
  endDate?: string
) {
  // Validate period against whitelist to prevent SQL injection
  if (!VALID_DATE_TRUNC_PERIODS.has(period)) {
    throw new Error(`Invalid date_trunc period: "${period}"`);
  }

  const cacheKey = buildCacheKey(CACHE_KEYS.VISITS_BY_PERIOD, {
    period,
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const siteId = await getCurrentSiteId();
      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Inject the period as a raw SQL literal — safe because we validated
      // it against VALID_DATE_TRUNC_PERIODS above.
      const periodLiteral = Prisma.raw(`'${period}'`);

      const results = await prisma.$queryRaw<Array<{ period: Date; visits: bigint }>>`
        SELECT
          date_trunc(${periodLiteral}, "createdAt") as period,
          COUNT(*) as visits
        FROM "AnalyticsEvent"
        WHERE "siteId" = ${siteId}
          AND "type" = 'PAGE_VIEW'
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
          AND (data->>'isBot' IS NULL OR data->>'isBot' != 'true')
        GROUP BY 1
        ORDER BY 1 ASC
      `;

      // Normalise period to ISO-8601 string for consistent serialisation.
      // Prisma returns timestamp columns as Date objects; after Redis
      // round-tripping they become strings — normalising here removes the
      // ambiguity.
      return results.map(r => ({
        period: (r.period instanceof Date ? r.period : new Date(r.period)).toISOString(),
        visits: Number(r.visits),
      }));
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Get analytics summary with comparison to the previous period.
 *
 * When explicit startDate / endDate are provided (the normal case from the
 * dashboard route), the "current" period is exactly [startDate, endDate] and
 * the "previous" period is the same-length window immediately before it.
 * This keeps the KPIs aligned with the chart data.
 *
 * The legacy `timeRange`-only signature (no dates) is kept as a fallback
 * but should no longer be used by new code.
 *
 * All date arithmetic uses UTC to stay consistent with PostgreSQL date_trunc().
 */
export async function getAnalyticsSummaryWithComparison(
  timeRange: 'day' | 'week' | 'month' | 'year',
  startDateISO?: string,
  endDateISO?: string
) {
  let currentStart: Date;
  let currentEnd: Date;
  let previousStart: Date;
  let previousEnd: Date;

  if (startDateISO && endDateISO) {
    // ── Explicit date range from the dashboard query ──────────────
    // Mirror the exact same duration for the previous period.
    currentStart = new Date(startDateISO);
    currentEnd = new Date(endDateISO);

    const durationMs = currentEnd.getTime() - currentStart.getTime();
    previousEnd = new Date(currentStart.getTime() - 1); // 1 ms before current start
    previousStart = new Date(previousEnd.getTime() - durationMs);
  } else {
    // ── Legacy fallback: derive dates from timeRange ─────────────
    const now = new Date();
    currentEnd = new Date(now);
    currentEnd.setUTCHours(23, 59, 59, 999);

    if (timeRange === 'day') {
      currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      previousEnd = new Date(currentStart.getTime() - 1);
      previousStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)
      );
    } else if (timeRange === 'week') {
      const dayOfWeek = now.getUTCDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      currentStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff)
      );
      previousEnd = new Date(currentStart.getTime() - 1);
      previousStart = new Date(currentStart);
      previousStart.setUTCDate(previousStart.getUTCDate() - 7);
    } else if (timeRange === 'month') {
      currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      previousEnd = new Date(currentStart.getTime() - 1);
    } else {
      // year
      currentStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      previousStart = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
      previousEnd = new Date(currentStart.getTime() - 1);
    }
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
      uniqueSessionsChange: calcChange(
        currentSummary.uniqueSessions,
        previousSummary.uniqueSessions
      ),
      averageTimeOnSiteChange: calcChange(
        currentSummary.averageTimeOnSite,
        previousSummary.averageTimeOnSite
      ),
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
      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
      const sectionResults = await prisma.$queryRaw<
        Array<{
          section: string;
          visitors: bigint;
          avg_time_ms: number;
          view_count: bigint;
        }>
      >`
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
        scrollRate:
          totalSessionCount > 0
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
      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const results = await prisma.$queryRaw<
        Array<{
          source: string;
          medium: string;
          visits: bigint;
          unique_sessions: bigint;
        }>
      >`
        SELECT
          COALESCE(data->>'utmSource', data->>'referrerDomain', 'direct') as source,
          COALESCE(
            NULLIF(data->>'utmMedium', ''),
            CASE
              WHEN data->>'referrerDomain' IS NOT NULL THEN
                CASE
                  WHEN data->>'referrerDomain' ~* '(google|bing|yahoo|duckduckgo|baidu|yandex|ecosia|qwant)\.' THEN 'organic'
                  WHEN data->>'referrerDomain' ~* '(facebook|instagram|twitter|x\.com|linkedin|tiktok|pinterest|reddit|threads|mastodon|youtube)\.' THEN 'social'
                  ELSE 'referral'
                END
              ELSE 'direct'
            END
          ) as medium,
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
 * Get device breakdown using SQL aggregation.
 *
 * Computes avgTimeOnSite per device type by joining PAGE_VIEW (which stores
 * deviceType) with PAGE_EXIT (which stores timeOnPage) on sessionId.
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
      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const [deviceStats, avgTimeByDevice] = await Promise.all([
        // Visit counts per device type from PAGE_VIEW
        prisma.$queryRaw<
          Array<{
            device_type: string;
            visits: bigint;
            unique_sessions: bigint;
          }>
        >`
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
        `,

        // Avg time on site per device type via PAGE_EXIT + PAGE_VIEW join
        prisma.$queryRaw<
          Array<{
            device_type: string;
            avg_time: number;
          }>
        >`
          SELECT
            COALESCE(sv.device_type, 'unknown') as device_type,
            AVG(CAST(pe.data->>'timeOnPage' AS DOUBLE PRECISION)) as avg_time
          FROM "AnalyticsEvent" pe
          INNER JOIN (
            SELECT DISTINCT ON ("sessionId")
              "sessionId",
              COALESCE(data->>'deviceType', 'unknown') as device_type
            FROM "AnalyticsEvent"
            WHERE "siteId" = ${siteId}
              AND "type" = 'PAGE_VIEW'
              AND "createdAt" >= ${start}
              AND "createdAt" <= ${end}
            ORDER BY "sessionId", "createdAt" ASC
          ) sv ON pe."sessionId" = sv."sessionId"
          WHERE pe."siteId" = ${siteId}
            AND pe."type" = 'PAGE_EXIT'
            AND pe."createdAt" >= ${start}
            AND pe."createdAt" <= ${end}
          GROUP BY sv.device_type
        `,
      ]);

      const avgTimeMap = new Map(avgTimeByDevice.map(r => [r.device_type, r.avg_time || 0]));

      return deviceStats.map(row => ({
        deviceType: row.device_type,
        visits: Number(row.visits),
        uniqueSessions: Number(row.unique_sessions),
        avgTimeOnSite: avgTimeMap.get(row.device_type) || 0,
      }));
    },
    CACHE_TTL.MEDIUM
  );
}
