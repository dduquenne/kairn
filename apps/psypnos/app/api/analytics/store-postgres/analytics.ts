/**
 * PostgreSQL Analytics Summary Functions
 *
 * Uses the unified AnalyticsEvent model for all analytics queries.
 * Aggregates data from different event types stored in the same table.
 */

import { EventType } from '@prisma/client';

import { getCached, CACHE_KEYS, CACHE_TTL, buildCacheKey } from '@/lib/cache/redis';
import { prisma } from '@/lib/db/prisma';

import { buildDateFilter, extractFromData, getCurrentSiteId } from './utils';

/**
 * Get analytics summary for a date range
 */
export async function getAnalyticsSummary(startDate?: string, endDate?: string) {
  const cacheKey = buildCacheKey(CACHE_KEYS.SUMMARY, {
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const siteId = getCurrentSiteId();
      const dateFilter = buildDateFilter(startDate, endDate);

      // Get all events for the period
      const [pageViews, sectionTimes, conversions] = await Promise.all([
        prisma.analyticsEvent.findMany({
          where: {
            siteId,
            type: EventType.PAGE_VIEW,
            ...dateFilter,
          },
          select: {
            sessionId: true,
            data: true,
          },
        }),
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
        prisma.analyticsEvent.findMany({
          where: {
            siteId,
            type: EventType.CONVERSION,
            ...dateFilter,
          },
          select: {
            sessionId: true,
            name: true,
            data: true,
          },
        }),
      ]);

      // Filter out bot visits
      const humanPageViews = pageViews.filter(pv => {
        const data = (pv.data as Record<string, unknown>) || {};
        return !extractFromData<boolean>(data, 'isBot', false);
      });

      const totalVisits = humanPageViews.length;
      const sessionSet = new Set(humanPageViews.map(pv => pv.sessionId).filter(Boolean));
      const uniqueSessions = sessionSet.size;

      // Bounce rate: sessions with only 1 page view
      const sessionPageCounts = new Map<string, number>();
      for (const pv of humanPageViews) {
        if (!pv.sessionId) continue;
        sessionPageCounts.set(pv.sessionId, (sessionPageCounts.get(pv.sessionId) || 0) + 1);
      }
      const bouncedSessions = Array.from(sessionPageCounts.values()).filter(c => c === 1).length;
      const bounceRate = uniqueSessions > 0 ? (bouncedSessions / uniqueSessions) * 100 : 0;

      // Calculate average time on site from section times
      const sessionDurations = new Map<string, number>();
      for (const st of sectionTimes) {
        if (!st.sessionId) continue;
        const data = (st.data as Record<string, unknown>) || {};
        const timeSpent = extractFromData<number>(data, 'timeSpent', 0);
        const current = sessionDurations.get(st.sessionId) || 0;
        sessionDurations.set(st.sessionId, current + timeSpent);
      }

      const averageTimeOnSite =
        sessionDurations.size > 0
          ? Array.from(sessionDurations.values()).reduce((a, b) => a + b, 0) / sessionDurations.size
          : 0;

      // Calculate top sections
      const sectionStats = new Map<string, { totalTime: number; count: number }>();
      for (const st of sectionTimes) {
        const section = st.name || 'unknown';
        const data = (st.data as Record<string, unknown>) || {};
        const timeSpent = extractFromData<number>(data, 'timeSpent', 0);

        const current = sectionStats.get(section) || { totalTime: 0, count: 0 };
        current.totalTime += timeSpent;
        current.count++;
        sectionStats.set(section, current);
      }

      const topSections = Array.from(sectionStats.entries())
        .filter(([section]) => section.toLowerCase() !== 'unknown')
        .map(([section, stats]) => ({
          section,
          avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
          visits: stats.count,
        }))
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 5);

      // Calculate conversions by type
      const conversionByType: Record<string, { clicks: number; completed: number; rate: number }> =
        {};

      for (const conv of conversions) {
        const data = (conv.data as Record<string, unknown>) || {};
        const eventType = conv.name || extractFromData<string>(data, 'conversionType', 'unknown');
        const completed = extractFromData<boolean>(data, 'completed', false);

        if (!conversionByType[eventType]) {
          conversionByType[eventType] = { clicks: 0, completed: 0, rate: 0 };
        }

        conversionByType[eventType].clicks++;
        if (completed) {
          conversionByType[eventType].completed++;
        }
      }

      // Calculate rates
      for (const type of Object.keys(conversionByType)) {
        const typeData = conversionByType[type];
        if (typeData) {
          typeData.rate = typeData.clicks > 0 ? (typeData.completed / typeData.clicks) * 100 : 0;
        }
      }

      const totalClicks = Object.values(conversionByType).reduce((sum, v) => sum + v.clicks, 0);
      const totalCompleted = Object.values(conversionByType).reduce(
        (sum, v) => sum + v.completed,
        0
      );
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
 * Get visits aggregated by time period
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
      const siteId = getCurrentSiteId();
      const dateFilter = buildDateFilter(startDate, endDate);

      const visits = await prisma.analyticsEvent.findMany({
        where: {
          siteId,
          type: EventType.PAGE_VIEW,
          ...dateFilter,
        },
        select: {
          createdAt: true,
          data: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Filter out bots
      const humanVisits = visits.filter(v => {
        const data = (v.data as Record<string, unknown>) || {};
        return !extractFromData<boolean>(data, 'isBot', false);
      });

      const periodMap = new Map<string, number>();

      for (const visit of humanVisits) {
        const date = visit.createdAt;
        let periodKey = '';

        if (period === 'hour') {
          periodKey = date.toISOString().slice(0, 13) + ':00';
        } else if (period === 'day') {
          periodKey = date.toISOString().split('T')[0] ?? '';
        } else if (period === 'week') {
          const tempDate = new Date(date);
          tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
          const yearStart = new Date(tempDate.getFullYear(), 0, 1);
          const weekNum = Math.ceil(
            ((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
          );
          periodKey = `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        } else if (period === 'month') {
          periodKey = date.toISOString().substring(0, 7);
        } else if (period === 'year') {
          periodKey = date.getFullYear().toString();
        }

        const current = periodMap.get(periodKey) || 0;
        periodMap.set(periodKey, current + 1);
      }

      return Array.from(periodMap.entries())
        .map(([key, count]) => ({ period: key, visits: count }))
        .sort((a, b) => a.period.localeCompare(b.period));
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
    currentStart.setHours(0, 0, 0, 0);

    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousStart.setHours(0, 0, 0, 0);
    previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    previousEnd.setHours(23, 59, 59, 999);
  } else if (timeRange === 'year') {
    currentStart = new Date(now.getFullYear(), 0, 1);
    currentStart.setHours(0, 0, 0, 0);

    previousStart = new Date(now.getFullYear() - 1, 0, 1);
    previousStart.setHours(0, 0, 0, 0);
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
 * Get section engagement heatmap
 */
export async function getSectionHeatmap(startDate?: string, endDate?: string) {
  const cacheKey = buildCacheKey(CACHE_KEYS.HEATMAP, {
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const siteId = getCurrentSiteId();
      const dateFilter = buildDateFilter(startDate, endDate);

      const [pageViews, sectionTimes, conversions] = await Promise.all([
        prisma.analyticsEvent.findMany({
          where: {
            siteId,
            type: EventType.PAGE_VIEW,
            ...dateFilter,
          },
          select: { sessionId: true, data: true },
        }),
        prisma.analyticsEvent.findMany({
          where: {
            siteId,
            type: EventType.SECTION_TIME,
            ...dateFilter,
          },
          select: { sessionId: true, name: true, data: true },
        }),
        prisma.analyticsEvent.findMany({
          where: {
            siteId,
            type: EventType.CONVERSION,
            ...dateFilter,
          },
          select: { sessionId: true, name: true, data: true },
        }),
      ]);

      // Filter out bots
      const humanVisits = pageViews.filter(pv => {
        const data = (pv.data as Record<string, unknown>) || {};
        return !extractFromData<boolean>(data, 'isBot', false);
      });

      const sessionIds = new Set(humanVisits.map(v => v.sessionId).filter(Boolean));

      // Build section map
      const sectionMap = new Map<
        string,
        {
          visitors: number;
          totalTime: number;
          count: number;
          sessionIds: Set<string>;
        }
      >();

      for (const time of sectionTimes) {
        const section = time.name || 'unknown';
        const data = (time.data as Record<string, unknown>) || {};
        const timeSpent = extractFromData<number>(data, 'timeSpent', 0);

        const current = sectionMap.get(section) || {
          visitors: 0,
          totalTime: 0,
          count: 0,
          sessionIds: new Set<string>(),
        };

        current.count++;
        current.totalTime += timeSpent;
        if (time.sessionId) {
          current.sessionIds.add(time.sessionId);
        }
        sectionMap.set(section, current);
      }

      // Build conversions by section (based on session overlap)
      const completedConversions = conversions.filter(c => {
        const data = (c.data as Record<string, unknown>) || {};
        return extractFromData<boolean>(data, 'completed', false);
      });

      const conversionsBySection = new Map<
        string,
        {
          count: number;
          byType: Record<string, { count: number; type: string }>;
        }
      >();

      for (const time of sectionTimes) {
        const section = time.name || 'unknown';
        const sessionConversions = completedConversions.filter(c => c.sessionId === time.sessionId);

        if (sessionConversions.length > 0) {
          const current = conversionsBySection.get(section) || { count: 0, byType: {} };
          for (const conv of sessionConversions) {
            const data = (conv.data as Record<string, unknown>) || {};
            const convType =
              conv.name || extractFromData<string>(data, 'conversionType', 'unknown');

            current.count++;
            if (!current.byType[convType]) {
              current.byType[convType] = { count: 0, type: convType };
            }
            current.byType[convType].count++;
          }
          conversionsBySection.set(section, current);
        }
      }

      return Array.from(sectionMap.entries())
        .filter(([section]) => section.toLowerCase() !== 'unknown')
        .map(([section, data]) => ({
          section,
          visitors: data.sessionIds.size,
          avgTimeSeconds: data.count > 0 ? Math.round(data.totalTime / data.count / 1000) : 0,
          scrollRate:
            sessionIds.size > 0
              ? parseFloat(((data.sessionIds.size / sessionIds.size) * 100).toFixed(1))
              : 0,
          conversionsFromSection: conversionsBySection.get(section)?.count || 0,
          conversionsByType: conversionsBySection.get(section)?.byType || {},
        }))
        .sort((a, b) => b.visitors - a.visitors);
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Get traffic sources breakdown
 */
export async function getTrafficSources(startDate?: string, endDate?: string) {
  const cacheKey = buildCacheKey(CACHE_KEYS.TRAFFIC_SOURCES, {
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const siteId = getCurrentSiteId();
      const dateFilter = buildDateFilter(startDate, endDate);

      const [pageViews, conversions] = await Promise.all([
        prisma.analyticsEvent.findMany({
          where: {
            siteId,
            type: EventType.PAGE_VIEW,
            ...dateFilter,
          },
          select: { sessionId: true, referrer: true, data: true },
        }),
        prisma.analyticsEvent.findMany({
          where: {
            siteId,
            type: EventType.CONVERSION,
            ...dateFilter,
          },
          select: { sessionId: true, data: true },
        }),
      ]);

      // Filter out bots
      const humanVisits = pageViews.filter(pv => {
        const data = (pv.data as Record<string, unknown>) || {};
        return !extractFromData<boolean>(data, 'isBot', false);
      });

      // Build source map
      const sourceMap = new Map<
        string,
        { visits: number; sessions: Set<string>; conversions: number }
      >();

      for (const visit of humanVisits) {
        const data = (visit.data as Record<string, unknown>) || {};
        const utmSource = extractFromData<string | undefined>(data, 'utmSource', undefined);
        const referrerDomain = extractFromData<string | undefined>(
          data,
          'referrerDomain',
          undefined
        );
        const utmMedium = extractFromData<string | undefined>(data, 'utmMedium', undefined);

        const source = utmSource || referrerDomain || 'direct';
        const medium = utmMedium || 'none';
        const key = `${source}|${medium}`;

        const current = sourceMap.get(key) || {
          visits: 0,
          sessions: new Set<string>(),
          conversions: 0,
        };

        current.visits++;
        if (visit.sessionId) {
          current.sessions.add(visit.sessionId);
        }
        sourceMap.set(key, current);
      }

      // Get session IDs with completed conversions
      const sessionConversions = new Set(
        conversions
          .filter(c => {
            const data = (c.data as Record<string, unknown>) || {};
            return extractFromData<boolean>(data, 'completed', false);
          })
          .map(c => c.sessionId)
          .filter(Boolean)
      );

      return Array.from(sourceMap.entries())
        .map(([key, data]) => {
          const [source, medium] = key.split('|');
          const sessionsArray = Array.from(data.sessions);
          const convertedSessions = sessionsArray.filter(s => sessionConversions.has(s)).length;

          return {
            source,
            medium,
            visits: data.visits,
            uniqueSessions: data.sessions.size,
            conversionRate:
              data.sessions.size > 0 ? (convertedSessions / data.sessions.size) * 100 : 0,
          };
        })
        .sort((a, b) => b.visits - a.visits);
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Get device breakdown
 */
export async function getDeviceBreakdown(startDate?: string, endDate?: string) {
  const cacheKey = buildCacheKey(CACHE_KEYS.DEVICE_BREAKDOWN, {
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const siteId = getCurrentSiteId();
      const dateFilter = buildDateFilter(startDate, endDate);

      const [pageViews, sectionTimes] = await Promise.all([
        prisma.analyticsEvent.findMany({
          where: {
            siteId,
            type: EventType.PAGE_VIEW,
            ...dateFilter,
          },
          select: { sessionId: true, data: true },
        }),
        prisma.analyticsEvent.findMany({
          where: {
            siteId,
            type: EventType.SECTION_TIME,
            ...dateFilter,
          },
          select: { sessionId: true, data: true },
        }),
      ]);

      // Filter out bots and build device map
      const deviceMap = new Map<string, { visits: number; sessions: Set<string> }>();
      const sessionDevices = new Map<string, string>();

      for (const visit of pageViews) {
        const data = (visit.data as Record<string, unknown>) || {};
        const isBot = extractFromData<boolean>(data, 'isBot', false);
        if (isBot) continue;

        const deviceType = extractFromData<string>(data, 'deviceType', 'unknown');

        const current = deviceMap.get(deviceType) || {
          visits: 0,
          sessions: new Set<string>(),
        };

        current.visits++;
        if (visit.sessionId) {
          current.sessions.add(visit.sessionId);
          sessionDevices.set(visit.sessionId, deviceType);
        }
        deviceMap.set(deviceType, current);
      }

      // Calculate session durations by device
      const deviceDurations = new Map<string, Map<string, number>>();

      for (const time of sectionTimes) {
        if (!time.sessionId) continue;

        const device = sessionDevices.get(time.sessionId) || 'unknown';
        const data = (time.data as Record<string, unknown>) || {};
        const timeSpent = extractFromData<number>(data, 'timeSpent', 0);

        if (!deviceDurations.has(device)) {
          deviceDurations.set(device, new Map());
        }

        const deviceSessions = deviceDurations.get(device)!;
        const current = deviceSessions.get(time.sessionId) || 0;
        deviceSessions.set(time.sessionId, current + timeSpent);
      }

      return Array.from(deviceMap.entries())
        .map(([device, data]) => {
          const deviceSessionTimes = deviceDurations.get(device);
          const avgTime = deviceSessionTimes
            ? Array.from(deviceSessionTimes.values()).reduce((a, b) => a + b, 0) /
              deviceSessionTimes.size
            : 0;

          return {
            deviceType: device,
            visits: data.visits,
            uniqueSessions: data.sessions.size,
            avgTimeOnSite: avgTime,
          };
        })
        .sort((a, b) => b.visits - a.visits);
    },
    CACHE_TTL.MEDIUM
  );
}
