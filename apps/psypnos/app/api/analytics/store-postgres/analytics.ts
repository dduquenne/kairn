// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * PostgreSQL Analytics Summary Functions
 */

import { prisma } from "@/lib/db/prisma";
import {
  getCached,
  CACHE_KEYS,
  CACHE_TTL,
  buildCacheKey,
} from "@/lib/cache/redis";

// Type aliases for Prisma where inputs (workaround for ungenerated Prisma client)
type DateFilter = { gte?: Date; lte?: Date };
type PageVisitWhere = { isBot?: boolean; timestamp?: DateFilter };
type SectionTimeWhere = { timestamp?: DateFilter };
type ConversionEventWhere = { timestamp?: DateFilter; completed?: boolean };

// Type aliases for Prisma query results
type PageVisitRecord = {
  id: string;
  timestamp: Date;
  sessionId: string;
  page: string;
  referrer: string | null;
  userAgent: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  referrerDomain: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  scrollDepthPercent: number | null;
  timeOnPage: number | null;
  isBot: boolean;
};

type SectionTimeRecord = {
  id: string;
  timestamp: Date;
  sessionId: string;
  section: string;
  timeSpent: number;
};

type ConversionEventRecord = {
  id: string;
  timestamp: Date;
  sessionId: string;
  eventType: string;
  stepName: string;
  completed: boolean;
  metadata: unknown;
};

export async function getAnalyticsSummary(startDate?: string, endDate?: string) {
  const cacheKey = buildCacheKey(CACHE_KEYS.SUMMARY, {
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const where: { isBot: boolean; timestamp?: { gte?: Date; lte?: Date } } = {
        isBot: false,
      };

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const timeWhere: { timestamp?: { gte?: Date; lte?: Date } } = {};
      const eventWhere: { timestamp?: { gte?: Date; lte?: Date } } = {};

      if (startDate || endDate) {
        timeWhere.timestamp = {};
        eventWhere.timestamp = {};
        if (startDate) {
          timeWhere.timestamp.gte = new Date(startDate);
          eventWhere.timestamp.gte = new Date(startDate);
        }
        if (endDate) {
          timeWhere.timestamp.lte = new Date(endDate);
          eventWhere.timestamp.lte = new Date(endDate);
        }
      }

      const [
        visitStats,
        uniqueSessions,
        sectionStats,
        conversionStats,
      ] = await Promise.all([
        prisma.pageVisit.count({ where }),
        prisma.pageVisit.findMany({
          where,
          select: { sessionId: true },
          distinct: ["sessionId"],
        }),
        prisma.sectionTime.groupBy({
          by: ["section"],
          where: timeWhere,
          _avg: { timeSpent: true },
          _count: { id: true },
          orderBy: { _avg: { timeSpent: "desc" } },
          take: 5,
        }),
        prisma.conversionEvent.groupBy({
          by: ["eventType", "completed"],
          where: eventWhere,
          _count: { id: true },
        }),
      ]);

      const totalVisits = visitStats;
      const uniqueSessionCount = uniqueSessions.length;

      const sessionDurations = await prisma.sectionTime.groupBy({
        by: ["sessionId"],
        where: timeWhere,
        _sum: { timeSpent: true },
      });

      const averageTimeOnSite =
        sessionDurations.length > 0
          ? (sessionDurations as Array<{ sessionId: string; _sum: { timeSpent: number | null } }>).reduce(
              (sum: number, s) => sum + (s._sum.timeSpent || 0),
              0
            ) / sessionDurations.length
          : 0;

      const topSections = (sectionStats as Array<{ section: string; _avg: { timeSpent: number | null }; _count: { id: number } }>).map((s) => ({
        section: s.section,
        avgTime: s._avg.timeSpent || 0,
        visits: s._count.id,
      }));

      const conversionByType: Record<string, { clicks: number; completed: number; rate: number }> = {};

      (conversionStats as Array<{ eventType: string; completed: boolean; _count: { id: number } }>).forEach((stat) => {
        if (!conversionByType[stat.eventType]) {
          conversionByType[stat.eventType] = { clicks: 0, completed: 0, rate: 0 };
        }

        if (stat.completed) {
          conversionByType[stat.eventType].completed += stat._count.id;
        } else {
          conversionByType[stat.eventType].clicks += stat._count.id;
        }
      });

      Object.keys(conversionByType).forEach((type) => {
        const data = conversionByType[type];
        data.rate = data.clicks > 0 ? (data.completed / data.clicks) * 100 : 0;
      });

      const totalClicks = Object.values(conversionByType).reduce((sum, v) => sum + v.clicks, 0);
      const totalCompleted = Object.values(conversionByType).reduce((sum, v) => sum + v.completed, 0);
      const conversionRate = totalClicks > 0 ? (totalCompleted / totalClicks) * 100 : 0;

      return {
        totalVisits,
        uniqueSessions: uniqueSessionCount,
        averageTimeOnSite,
        conversionRate,
        topSections,
        conversionByType,
      };
    },
    CACHE_TTL.MEDIUM
  );
}

export async function getVisitsByPeriod(
  period: "hour" | "day" | "week" | "month" | "year",
  startDate?: string,
  endDate?: string,
) {
  const cacheKey = buildCacheKey(CACHE_KEYS.VISITS_BY_PERIOD, {
    period,
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const where: { isBot: boolean; timestamp?: { gte?: Date; lte?: Date } } = {
        isBot: false,
      };

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const visits = await prisma.pageVisit.findMany({
        where,
        select: { timestamp: true },
        orderBy: { timestamp: "asc" },
      });

      const periodMap = new Map<string, number>();

      (visits as Array<{ timestamp: Date }>).forEach((visit) => {
        const date = visit.timestamp;
        let periodKey = "";

        if (period === "hour") {
          // Format: YYYY-MM-DDTHH:00 for hourly data
          periodKey = date.toISOString().slice(0, 13) + ":00";
        } else if (period === "day") {
          periodKey = date.toISOString().split("T")[0];
        } else if (period === "week") {
          const tempDate = new Date(date);
          tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
          const yearStart = new Date(tempDate.getFullYear(), 0, 1);
          const weekNum = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
          periodKey = `${date.getFullYear()}-W${weekNum.toString().padStart(2, "0")}`;
        } else if (period === "month") {
          periodKey = date.toISOString().substring(0, 7);
        } else if (period === "year") {
          periodKey = date.getFullYear().toString();
        }

        const current = periodMap.get(periodKey) || 0;
        periodMap.set(periodKey, current + 1);
      });

      return Array.from(periodMap.entries())
        .map(([key, count]) => ({ period: key, visits: count }))
        .sort((a, b) => a.period.localeCompare(b.period));
    },
    CACHE_TTL.MEDIUM
  );
}

export async function getAnalyticsSummaryWithComparison(
  timeRange: "day" | "week" | "month" | "year",
) {
  const now = new Date();
  let currentStart = new Date();
  let currentEnd = new Date(now);
  currentEnd.setHours(23, 59, 59, 999);

  let previousStart = new Date();
  let previousEnd = new Date();

  if (timeRange === "day") {
    currentStart = new Date(now);
    currentStart.setHours(0, 0, 0, 0);

    previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);
    previousStart = new Date(previousEnd);
    previousStart.setHours(0, 0, 0, 0);
  } else if (timeRange === "week") {
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentStart = new Date(now.setDate(diff));
    currentStart.setHours(0, 0, 0, 0);

    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
    previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);
  } else if (timeRange === "month") {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentStart.setHours(0, 0, 0, 0);

    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousStart.setHours(0, 0, 0, 0);
    previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    previousEnd.setHours(23, 59, 59, 999);
  } else if (timeRange === "year") {
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
      uniqueSessionsChange: calcChange(currentSummary.uniqueSessions, previousSummary.uniqueSessions),
      averageTimeOnSiteChange: calcChange(
        currentSummary.averageTimeOnSite,
        previousSummary.averageTimeOnSite
      ),
      conversionRateChange:
        currentSummary.conversionRate - previousSummary.conversionRate,
    },
  };
}

export async function getSectionHeatmap(startDate?: string, endDate?: string) {
  const cacheKey = buildCacheKey(CACHE_KEYS.HEATMAP, {
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const where: PageVisitWhere = { isBot: false };
      const timeWhere: SectionTimeWhere = {};
      const eventWhere: ConversionEventWhere = {};

      if (startDate || endDate) {
        where.timestamp = {};
        timeWhere.timestamp = {};
        eventWhere.timestamp = {};
        if (startDate) {
          where.timestamp.gte = new Date(startDate);
          timeWhere.timestamp.gte = new Date(startDate);
          eventWhere.timestamp.gte = new Date(startDate);
        }
        if (endDate) {
          where.timestamp.lte = new Date(endDate);
          timeWhere.timestamp.lte = new Date(endDate);
          eventWhere.timestamp.lte = new Date(endDate);
        }
      }

      const [visits, times, events] = await Promise.all([
        prisma.pageVisit.findMany({ where, select: { sessionId: true } }),
        prisma.sectionTime.findMany({ where: timeWhere }),
        prisma.conversionEvent.findMany({
          where: { ...eventWhere, completed: true },
        }),
      ]) as [Array<{ sessionId: string }>, SectionTimeRecord[], ConversionEventRecord[]];

      const sessionIds = new Set(visits.map((v) => v.sessionId));

      const sectionMap = new Map<
        string,
        {
          visitors: number;
          totalTime: number;
          count: number;
          sessionIds: Set<string>;
        }
      >();

      times.forEach((time) => {
        const current = sectionMap.get(time.section) || {
          visitors: 0,
          totalTime: 0,
          count: 0,
          sessionIds: new Set<string>(),
        };
        current.count++;
        current.totalTime += time.timeSpent;
        current.sessionIds.add(time.sessionId);
        sectionMap.set(time.section, current);
      });

      const conversionsBySection = new Map<
        string,
        {
          count: number;
          byType: Record<string, { count: number; type: string }>;
        }
      >();

      times.forEach((time) => {
        const sessionConversions = events.filter((e) => e.sessionId === time.sessionId);

        if (sessionConversions.length > 0) {
          const current = conversionsBySection.get(time.section) || { count: 0, byType: {} };
          sessionConversions.forEach((conv) => {
            current.count++;
            if (!current.byType[conv.eventType]) {
              current.byType[conv.eventType] = { count: 0, type: conv.eventType };
            }
            current.byType[conv.eventType].count++;
          });
          conversionsBySection.set(time.section, current);
        }
      });

      return Array.from(sectionMap.entries())
        // Filter out 'unknown' sections - these are sections without proper data-track-section attributes
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

export async function getTrafficSources(startDate?: string, endDate?: string) {
  const cacheKey = buildCacheKey(CACHE_KEYS.TRAFFIC_SOURCES, {
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const where: PageVisitWhere = { isBot: false };
      const eventWhere: ConversionEventWhere = { completed: true };

      if (startDate || endDate) {
        where.timestamp = {};
        eventWhere.timestamp = {};
        if (startDate) {
          where.timestamp.gte = new Date(startDate);
          eventWhere.timestamp.gte = new Date(startDate);
        }
        if (endDate) {
          where.timestamp.lte = new Date(endDate);
          eventWhere.timestamp.lte = new Date(endDate);
        }
      }

      const [visits, events] = await Promise.all([
        prisma.pageVisit.findMany({ where }),
        prisma.conversionEvent.findMany({ where: eventWhere }),
      ]) as [PageVisitRecord[], ConversionEventRecord[]];

      const sourceMap = new Map<
        string,
        { visits: number; sessions: Set<string>; conversions: number }
      >();

      visits.forEach((visit) => {
        const source = visit.utmSource || visit.referrerDomain || "direct";
        const medium = visit.utmMedium || "none";
        const key = `${source}|${medium}`;

        const current = sourceMap.get(key) || {
          visits: 0,
          sessions: new Set<string>(),
          conversions: 0,
        };

        current.visits++;
        current.sessions.add(visit.sessionId);
        sourceMap.set(key, current);
      });

      const sessionConversions = new Set(events.map((e) => e.sessionId));

      return Array.from(sourceMap.entries())
        .map(([key, data]) => {
          const [source, medium] = key.split("|");
          const sessionsArray = Array.from(data.sessions);
          const conversions = sessionsArray.filter((s) => sessionConversions.has(s)).length;

          return {
            source,
            medium,
            visits: data.visits,
            uniqueSessions: data.sessions.size,
            conversionRate:
              data.sessions.size > 0 ? (conversions / data.sessions.size) * 100 : 0,
          };
        })
        .sort((a, b) => b.visits - a.visits);
    },
    CACHE_TTL.MEDIUM
  );
}

export async function getDeviceBreakdown(startDate?: string, endDate?: string) {
  const cacheKey = buildCacheKey(CACHE_KEYS.DEVICE_BREAKDOWN, {
    start: startDate,
    end: endDate,
  });

  return getCached(
    cacheKey,
    async () => {
      const where: PageVisitWhere = { isBot: false };

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      type DeviceVisit = { sessionId: string; deviceType: string | null };

      const visits = await prisma.pageVisit.findMany({
        where,
        select: {
          sessionId: true,
          deviceType: true,
        },
      }) as DeviceVisit[];

      const times = await prisma.sectionTime.findMany({
        where: {
          timestamp: where.timestamp as DateFilter | undefined,
        },
      }) as SectionTimeRecord[];

      const deviceMap = new Map<string, { visits: number; sessions: Set<string> }>();

      visits.forEach((visit) => {
        const device = visit.deviceType || "unknown";
        const current = deviceMap.get(device) || {
          visits: 0,
          sessions: new Set<string>(),
        };

        current.visits++;
        current.sessions.add(visit.sessionId);
        deviceMap.set(device, current);
      });

      const sessionDurations = new Map<string, Map<string, number>>();
      times.forEach((time) => {
        const visit = visits.find((v) => v.sessionId === time.sessionId);
        const device = visit?.deviceType || "unknown";

        if (!sessionDurations.has(device)) {
          sessionDurations.set(device, new Map());
        }

        const deviceSessions = sessionDurations.get(device)!;
        const current = deviceSessions.get(time.sessionId) || 0;
        deviceSessions.set(time.sessionId, current + time.timeSpent);
      });

      return Array.from(deviceMap.entries())
        .map(([device, data]) => {
          const deviceSessionTimes = sessionDurations.get(device);
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
