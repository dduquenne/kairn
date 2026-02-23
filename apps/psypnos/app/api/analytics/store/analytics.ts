/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Analytics Summary Functions
 *
 * Optimized to read data once and pass it through functions,
 * eliminating redundant file reads (previously up to 17 reads per dashboard request).
 * O(n²) algorithms replaced with Map-based lookups.
 */

import { readAnalyticsData } from './cache';
import type { PageVisit, SectionTime, ConversionEvent, Analytics } from './types';

// Shared data loader: reads the JSON file once per request context
interface PreloadedData {
  visits: PageVisit[];
  times: SectionTime[];
  events: ConversionEvent[];
}

function filterByDate<T extends { timestamp: string }>(
  items: T[],
  startDate?: string,
  endDate?: string
): T[] {
  if (!startDate && !endDate) return items;
  const start = startDate ? new Date(startDate).getTime() : 0;
  const end = endDate ? new Date(endDate).getTime() : Date.now();
  return items.filter(item => {
    const t = new Date(item.timestamp).getTime();
    return t >= start && t <= end;
  });
}

/**
 * Load all analytics data once, filtered by date range.
 * Pass the result to all summary functions to avoid redundant reads.
 */
export async function preloadAnalyticsData(
  startDate?: string,
  endDate?: string
): Promise<PreloadedData> {
  const data = await readAnalyticsData();
  return {
    visits: filterByDate(data.pageVisits, startDate, endDate),
    times: filterByDate(data.sectionTimes, startDate, endDate),
    events: filterByDate(data.conversionEvents, startDate, endDate),
  };
}

export async function getAnalyticsSummary(
  startDate?: string,
  endDate?: string,
  preloaded?: PreloadedData
) {
  const { visits, times, events } = preloaded || (await preloadAnalyticsData(startDate, endDate));

  const uniqueSessions = new Set(visits.map(v => v.sessionId)).size;
  const totalVisits = visits.length;

  // Bounce rate: sessions with only 1 page view
  const sessionPageCounts = new Map<string, number>();
  for (const v of visits) {
    sessionPageCounts.set(v.sessionId, (sessionPageCounts.get(v.sessionId) || 0) + 1);
  }
  const bouncedSessions = Array.from(sessionPageCounts.values()).filter(c => c === 1).length;
  const bounceRate = uniqueSessions > 0 ? (bouncedSessions / uniqueSessions) * 100 : 0;

  // Average time on site
  const sessionDurations = new Map<string, number>();
  for (const time of times) {
    const current = sessionDurations.get(time.sessionId) || 0;
    sessionDurations.set(time.sessionId, current + time.timeSpent);
  }
  const averageTimeOnSite =
    sessionDurations.size > 0
      ? Array.from(sessionDurations.values()).reduce((a, b) => a + b, 0) / sessionDurations.size
      : 0;

  // Top sections
  const sectionMap = new Map<string, { totalTime: number; count: number }>();
  for (const time of times) {
    const current = sectionMap.get(time.section) || { totalTime: 0, count: 0 };
    sectionMap.set(time.section, {
      totalTime: current.totalTime + time.timeSpent,
      count: current.count + 1,
    });
  }

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
  for (const event of events) {
    const current = conversionMap.get(event.eventType) || { clicks: 0, completed: 0 };
    if (event.completed) {
      current.completed++;
    } else {
      current.clicks++;
    }
    conversionMap.set(event.eventType, current);
  }

  const conversionByType: Record<string, { clicks: number; completed: number; rate: number }> = {};
  conversionMap.forEach((value, key) => {
    conversionByType[key] = {
      clicks: value.clicks,
      completed: value.completed,
      rate: value.clicks > 0 ? (value.completed / value.clicks) * 100 : 0,
    };
  });

  const totalClicks = Array.from(conversionMap.values()).reduce((sum, v) => sum + v.clicks, 0);
  const completedEvents = events.filter(e => e.completed).length;
  const conversionRate = totalClicks > 0 ? (completedEvents / totalClicks) * 100 : 0;

  return {
    totalVisits,
    uniqueSessions,
    averageTimeOnSite,
    conversionRate,
    bounceRate,
    topSections,
    conversionByType,
  };
}

export async function getVisitsByPeriod(
  period: 'hour' | 'day' | 'week' | 'month' | 'year',
  startDate?: string,
  endDate?: string,
  preloaded?: PreloadedData
): Promise<Array<{ period: string; visits: number }>> {
  const { visits } = preloaded || (await preloadAnalyticsData(startDate, endDate));

  const periodMap = new Map<string, number>();

  for (const visit of visits) {
    const date = new Date(visit.timestamp);
    let periodKey = '';

    if (period === 'hour') {
      periodKey = date.toISOString().slice(0, 13) + ':00';
    } else if (period === 'day') {
      periodKey = date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const tempDate = new Date(date);
      tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
      const yearStart = new Date(tempDate.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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
}

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

  // Read data once, filter twice — instead of reading 6 times
  const allData = await readAnalyticsData();

  const currentData: PreloadedData = {
    visits: filterByDate(allData.pageVisits, currentStart.toISOString(), currentEnd.toISOString()),
    times: filterByDate(allData.sectionTimes, currentStart.toISOString(), currentEnd.toISOString()),
    events: filterByDate(
      allData.conversionEvents,
      currentStart.toISOString(),
      currentEnd.toISOString()
    ),
  };

  const previousData: PreloadedData = {
    visits: filterByDate(
      allData.pageVisits,
      previousStart.toISOString(),
      previousEnd.toISOString()
    ),
    times: filterByDate(
      allData.sectionTimes,
      previousStart.toISOString(),
      previousEnd.toISOString()
    ),
    events: filterByDate(
      allData.conversionEvents,
      previousStart.toISOString(),
      previousEnd.toISOString()
    ),
  };

  const [currentSummary, previousSummary] = await Promise.all([
    getAnalyticsSummary(undefined, undefined, currentData),
    getAnalyticsSummary(undefined, undefined, previousData),
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

export async function getSectionHeatmap(
  startDate?: string,
  endDate?: string,
  preloaded?: PreloadedData
) {
  const { visits, times, events } = preloaded || (await preloadAnalyticsData(startDate, endDate));

  const sessionIds = new Set(visits.map(v => v.sessionId));

  const sectionMap = new Map<
    string,
    { visitors: number; totalTime: number; count: number; sessionIds: Set<string> }
  >();

  for (const time of times) {
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
  }

  // Pre-build a Map<sessionId, ConversionEvent[]> for O(1) lookups
  // instead of O(n) filter() inside nested loop (was O(n²))
  const completedBySession = new Map<string, ConversionEvent[]>();
  for (const e of events) {
    if (e.completed) {
      const list = completedBySession.get(e.sessionId) || [];
      list.push(e);
      completedBySession.set(e.sessionId, list);
    }
  }

  const conversionsBySection = new Map<
    string,
    { count: number; byType: Record<string, { count: number; type: string }> }
  >();

  for (const time of times) {
    const sessionConversions = completedBySession.get(time.sessionId);
    if (!sessionConversions || sessionConversions.length === 0) continue;

    const current = conversionsBySection.get(time.section) || { count: 0, byType: {} };
    for (const conv of sessionConversions) {
      current.count++;
      if (!current.byType[conv.eventType]) {
        current.byType[conv.eventType] = { count: 0, type: conv.eventType };
      }
      current.byType[conv.eventType].count++;
    }
    conversionsBySection.set(time.section, current);
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
}

export async function getTrafficSources(
  startDate?: string,
  endDate?: string,
  preloaded?: PreloadedData
) {
  const { visits, events } = preloaded || (await preloadAnalyticsData(startDate, endDate));

  const sourceMap = new Map<string, { visits: number; sessions: Set<string> }>();

  for (const visit of visits) {
    const source = visit.utmSource || visit.referrerDomain || 'direct';
    const medium = visit.utmMedium || 'none';
    const key = `${source}|${medium}`;

    const current = sourceMap.get(key) || { visits: 0, sessions: new Set<string>() };
    current.visits++;
    current.sessions.add(visit.sessionId);
    sourceMap.set(key, current);
  }

  const sessionConversions = new Set<string>();
  for (const e of events) {
    if (e.completed) sessionConversions.add(e.sessionId);
  }

  return Array.from(sourceMap.entries())
    .map(([key, data]) => {
      const [source, medium] = key.split('|');
      const conversions = Array.from(data.sessions).filter(s => sessionConversions.has(s)).length;
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
  preloaded?: PreloadedData
) {
  const { visits, times } = preloaded || (await preloadAnalyticsData(startDate, endDate));

  const deviceMap = new Map<string, { visits: number; sessions: Set<string> }>();

  // Pre-build a Map<sessionId, deviceType> for O(1) lookups
  // instead of O(n) find() inside nested loop (was O(n²))
  const sessionDeviceMap = new Map<string, string>();

  for (const visit of visits) {
    const device = visit.deviceType || 'unknown';
    const current = deviceMap.get(device) || { visits: 0, sessions: new Set<string>() };
    current.visits++;
    current.sessions.add(visit.sessionId);
    deviceMap.set(device, current);
    sessionDeviceMap.set(visit.sessionId, device);
  }

  const sessionDurations = new Map<string, Map<string, number>>();
  for (const time of times) {
    const device = sessionDeviceMap.get(time.sessionId) || 'unknown';

    if (!sessionDurations.has(device)) {
      sessionDurations.set(device, new Map());
    }

    const deviceSessions = sessionDurations.get(device)!;
    const current = deviceSessions.get(time.sessionId) || 0;
    deviceSessions.set(time.sessionId, current + time.timeSpent);
  }

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
