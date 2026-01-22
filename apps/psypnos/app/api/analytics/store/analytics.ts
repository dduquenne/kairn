// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Analytics Summary Functions
 */

import { getPageVisits } from "./page-visits";
import { getSectionTimes } from "./section-times";
import { getConversionEvents } from "./conversions";

export async function getAnalyticsSummary(
  startDate?: string,
  endDate?: string,
): Promise<{
  totalVisits: number;
  uniqueSessions: number;
  averageTimeOnSite: number;
  conversionRate: number;
  topSections: Array<{ section: string; avgTime: number; visits: number }>;
  conversionByType: Record<string, { clicks: number; completed: number; rate: number }>;
}> {
  const visits = await getPageVisits(startDate, endDate);
  const times = await getSectionTimes(startDate, endDate);
  const events = await getConversionEvents(startDate, endDate);

  const uniqueSessions = new Set(visits.map((v) => v.sessionId)).size;
  const totalVisits = visits.length;

  // Average time on site
  const sessionDurations = new Map<string, number>();
  times.forEach((time) => {
    const current = sessionDurations.get(time.sessionId) || 0;
    sessionDurations.set(time.sessionId, current + time.timeSpent);
  });
  const averageTimeOnSite =
    sessionDurations.size > 0
      ? Array.from(sessionDurations.values()).reduce((a, b) => a + b, 0) /
        sessionDurations.size
      : 0;

  // Top sections
  const sectionMap = new Map<string, { totalTime: number; count: number }>();
  times.forEach((time) => {
    const current = sectionMap.get(time.section) || { totalTime: 0, count: 0 };
    sectionMap.set(time.section, {
      totalTime: current.totalTime + time.timeSpent,
      count: current.count + 1,
    });
  });

  const topSections = Array.from(sectionMap.entries())
    .map(([section, { totalTime, count }]) => ({
      section,
      avgTime: totalTime / count,
      visits: count,
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 5);

  // Conversion by type
  const conversionMap = new Map<string, { clicks: number; completed: number }>();
  events.forEach((event) => {
    const current = conversionMap.get(event.eventType) || { clicks: 0, completed: 0 };
    if (event.completed) {
      conversionMap.set(event.eventType, {
        clicks: current.clicks,
        completed: current.completed + 1,
      });
    } else {
      conversionMap.set(event.eventType, {
        clicks: current.clicks + 1,
        completed: current.completed,
      });
    }
  });

  const conversionByType: Record<string, { clicks: number; completed: number; rate: number }> = {};
  conversionMap.forEach((value, key) => {
    conversionByType[key] = {
      clicks: value.clicks,
      completed: value.completed,
      rate: value.clicks > 0 ? (value.completed / value.clicks) * 100 : 0,
    };
  });

  const totalClicks = Array.from(conversionMap.values()).reduce((sum, v) => sum + v.clicks, 0);
  const completedEvents = events.filter((e) => e.completed).length;
  const conversionRate = totalClicks > 0 ? (completedEvents / totalClicks) * 100 : 0;

  return {
    totalVisits,
    uniqueSessions,
    averageTimeOnSite,
    conversionRate,
    topSections,
    conversionByType,
  };
}

export async function getVisitsByPeriod(
  period: "hour" | "day" | "week" | "month" | "year",
  startDate?: string,
  endDate?: string,
): Promise<Array<{ period: string; visits: number }>> {
  const visits = await getPageVisits(startDate, endDate);

  const periodMap = new Map<string, number>();

  visits.forEach((visit) => {
    const date = new Date(visit.timestamp);
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
      const year = date.getFullYear();
      periodKey = `${year}-W${weekNum.toString().padStart(2, "0")}`;
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
}

export async function getAnalyticsSummaryWithComparison(
  timeRange: "day" | "week" | "month" | "year",
): Promise<{
  current: {
    totalVisits: number;
    uniqueSessions: number;
    averageTimeOnSite: number;
    conversionRate: number;
  };
  previous: {
    totalVisits: number;
    uniqueSessions: number;
    averageTimeOnSite: number;
    conversionRate: number;
  };
  comparison: {
    totalVisitsChange: number;
    uniqueSessionsChange: number;
    averageTimeOnSiteChange: number;
    conversionRateChange: number;
  };
}> {
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

  const currentSummary = await getAnalyticsSummary(
    currentStart.toISOString(),
    currentEnd.toISOString()
  );

  const previousSummary = await getAnalyticsSummary(
    previousStart.toISOString(),
    previousEnd.toISOString()
  );

  const totalVisitsChange = previousSummary.totalVisits > 0
    ? ((currentSummary.totalVisits - previousSummary.totalVisits) / previousSummary.totalVisits) * 100
    : 0;

  const uniqueSessionsChange = previousSummary.uniqueSessions > 0
    ? ((currentSummary.uniqueSessions - previousSummary.uniqueSessions) / previousSummary.uniqueSessions) * 100
    : 0;

  const averageTimeOnSiteChange = previousSummary.averageTimeOnSite > 0
    ? ((currentSummary.averageTimeOnSite - previousSummary.averageTimeOnSite) / previousSummary.averageTimeOnSite) * 100
    : 0;

  const conversionRateChange = previousSummary.conversionRate > 0
    ? currentSummary.conversionRate - previousSummary.conversionRate
    : 0;

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
      totalVisitsChange,
      uniqueSessionsChange,
      averageTimeOnSiteChange,
      conversionRateChange,
    },
  };
}

export async function getSectionHeatmap(
  startDate?: string,
  endDate?: string,
): Promise<
  Array<{
    section: string;
    visitors: number;
    avgTimeSeconds: number;
    scrollRate: number;
    conversionsFromSection: number;
    conversionsByType: Record<
      string,
      { count: number; type: "appointment_request" | "seminar_registration" | "contact_form" }
    >;
  }>
> {
  const visits = await getPageVisits(startDate, endDate);
  const times = await getSectionTimes(startDate, endDate);
  const events = await getConversionEvents(startDate, endDate);

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
      byType: Record<
        string,
        { count: number; type: "appointment_request" | "seminar_registration" | "contact_form" }
      >;
    }
  >();

  times.forEach((time) => {
    const sessionConversions = events.filter(
      (e) => e.sessionId === time.sessionId && e.completed
    );

    if (sessionConversions.length > 0) {
      const current = conversionsBySection.get(time.section) || { count: 0, byType: {} };
      sessionConversions.forEach((conv) => {
        current.count++;
        if (!current.byType[conv.eventType]) {
          current.byType[conv.eventType] = {
            count: 0,
            type: conv.eventType,
          };
        }
        current.byType[conv.eventType].count++;
      });
      conversionsBySection.set(time.section, current);
    }
  });

  const scrollRates = new Map<string, number>();
  Array.from(sectionMap.entries()).forEach(([section, data]) => {
    const rate = sessionIds.size > 0 ? (data.sessionIds.size / sessionIds.size) * 100 : 0;
    scrollRates.set(section, rate);
  });

  return Array.from(sectionMap.entries())
    // Filter out 'unknown' sections - these are sections without proper data-track-section attributes
    .filter(([section]) => section.toLowerCase() !== 'unknown')
    .map(([section, data]) => ({
      section,
      visitors: data.sessionIds.size,
      avgTimeSeconds: data.count > 0 ? Math.round(data.totalTime / data.count / 1000) : 0,
      scrollRate: parseFloat(scrollRates.get(section)?.toFixed(1) || "0"),
      conversionsFromSection: conversionsBySection.get(section)?.count || 0,
      conversionsByType: conversionsBySection.get(section)?.byType || {},
    }))
    .sort((a, b) => b.visitors - a.visitors);
}

export async function getTrafficSources(
  startDate?: string,
  endDate?: string,
): Promise<
  Array<{
    source: string;
    medium: string;
    visits: number;
    uniqueSessions: number;
    conversionRate: number;
  }>
> {
  const visits = await getPageVisits(startDate, endDate);
  const events = await getConversionEvents(startDate, endDate);

  const sourceMap = new Map<
    string,
    {
      visits: number;
      sessions: Set<string>;
      conversions: number;
    }
  >();

  visits.forEach((visit) => {
    const source = visit.utmSource || (visit.referrerDomain || 'direct');
    const medium = visit.utmMedium || 'none';
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

  const sessionConversions = new Set<string>();
  events.filter((e) => e.completed).forEach((e) => {
    sessionConversions.add(e.sessionId);
  });

  return Array.from(sourceMap.entries())
    .map(([key, data]) => {
      const [source, medium] = key.split('|');
      const sessionsArray = Array.from(data.sessions);
      const conversions = sessionsArray.filter((s) => sessionConversions.has(s)).length;

      return {
        source,
        medium,
        visits: data.visits,
        uniqueSessions: data.sessions.size,
        conversionRate: data.sessions.size > 0 ? (conversions / data.sessions.size) * 100 : 0,
      };
    })
    .sort((a, b) => b.visits - a.visits);
}

export async function getDeviceBreakdown(
  startDate?: string,
  endDate?: string,
): Promise<
  Array<{
    deviceType: string;
    visits: number;
    uniqueSessions: number;
    avgTimeOnSite: number;
  }>
> {
  const visits = await getPageVisits(startDate, endDate);
  const times = await getSectionTimes(startDate, endDate);

  const deviceMap = new Map<
    string,
    {
      visits: number;
      sessions: Set<string>;
    }
  >();

  visits.forEach((visit) => {
    const device = visit.deviceType || 'unknown';
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
    const device = visit?.deviceType || 'unknown';

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
}
