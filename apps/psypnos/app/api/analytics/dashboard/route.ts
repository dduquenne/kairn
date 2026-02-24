/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest } from 'next/server';

import { getCached, buildCacheKey, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis';
import { prisma } from '@/lib/db/prisma';
import {
  isMockMode,
  generateMockDashboardData,
  generateMockGeolocationData,
  logDataMode,
} from '@/lib/pwaDataMode';

import {
  getAnalyticsSummary,
  getAnalyticsSummaryWithComparison,
  getSectionHeatmap,
  getVisitsByPeriod,
  getPageVisits,
  getTrafficSources,
  getDeviceBreakdown,
  getGoalsSummary,
  getAlerts,
} from '../store-index';
import { getCurrentSiteId } from '../store-postgres/utils';

export const dynamic = 'force-dynamic';

/**
 * Consolidated dashboard endpoint.
 * Returns ALL analytics data in a single response to avoid waterfall of HTTP calls.
 * Previously the client made 9 separate requests; now it makes 1.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const { withAdminAuth } = await import('../../auth/middleware');
    const authResult = await withAdminAuth();
    if (authResult.error) return authResult.error;

    const searchParams = request.nextUrl.searchParams;
    const timeRange = (searchParams.get('timeRange') || 'day') as
      | 'day'
      | 'week'
      | 'month'
      | 'year'
      | 'hour';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    logDataMode();

    if (isMockMode()) {
      console.log('📊 [Analytics Dashboard] Using MOCK data');
      const mockData = generateMockDashboardData(
        timeRange,
        startDateParam || undefined,
        endDateParam || undefined
      );
      const mockGeoData = generateMockGeolocationData();

      const endDate = endDateParam ? new Date(endDateParam) : new Date();
      let startDate = startDateParam ? new Date(startDateParam) : new Date();

      if (!startDateParam) {
        if (timeRange === 'hour') {
          startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
        } else if (timeRange === 'day') {
          startDate.setDate(endDate.getDate() - 6);
        } else if (timeRange === 'week') {
          startDate.setDate(endDate.getDate() - 27);
        } else if (timeRange === 'month') {
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        } else if (timeRange === 'year') {
          startDate = new Date(endDate.getFullYear(), 0, 1);
        }
      }

      return Response.json(
        {
          ...mockData,
          geoData: mockGeoData,
          goalsData: { goals: [] },
          alertsData: { alerts: [] },
          blogData: { articles: [], totalViews: 0, totalUniqueVisitors: 0 },
          blogCtaData: { summary: { appointment: 0, seminar: 0 } },
          blogFaqData: { summary: {}, clicks: [] },
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            timeRange,
          },
        },
        { status: 200 }
      );
    }

    // Real mode
    console.log('📊 [Analytics Dashboard] Using REAL data');
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    let startDate = startDateParam ? new Date(startDateParam) : new Date();

    const isRealtimeMode = timeRange === 'hour';

    if (!startDateParam) {
      if (isRealtimeMode) {
        startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
      } else if (timeRange === 'day') {
        startDate.setDate(endDate.getDate() - 6);
      } else if (timeRange === 'week') {
        startDate.setDate(endDate.getDate() - 27);
      } else if (timeRange === 'month') {
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      } else if (timeRange === 'year') {
        startDate = new Date(endDate.getFullYear(), 0, 1);
      }
    }

    if (!isRealtimeMode) {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const comparisonTimeRange = isRealtimeMode
      ? 'day'
      : (timeRange as 'day' | 'week' | 'month' | 'year');
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // Use Redis cache for the entire dashboard response (except realtime)
    const cacheTTL = isRealtimeMode ? CACHE_TTL.SHORT : CACHE_TTL.MEDIUM;
    const cacheKey = buildCacheKey(CACHE_KEYS.DASHBOARD, {
      timeRange,
      start: startISO,
      end: endISO,
    });

    const data = await getCached(
      cacheKey,
      async () => {
        // Fetch ALL data in a single parallel batch
        // This replaces 9 separate HTTP calls from the client
        const [
          summary,
          comparison,
          heatmap,
          visits,
          trafficSources,
          deviceBreakdown,
          geoData,
          goalsData,
          alertsData,
          blogAnalyticsData,
          blogCtaData,
          blogFaqData,
        ] = await Promise.all([
          getAnalyticsSummary(startISO, endISO),
          getAnalyticsSummaryWithComparison(comparisonTimeRange),
          getSectionHeatmap(startISO, endISO),
          isRealtimeMode
            ? getPageVisits(startISO, endISO)
            : getVisitsByPeriod(comparisonTimeRange, startISO, endISO),
          getTrafficSources(startISO, endISO),
          getDeviceBreakdown(startISO, endISO),
          fetchGeoData(startDate, endDate),
          getGoalsSummary(startISO, endISO).catch(() => ({ goals: [] })),
          getAlerts().catch(() => []),
          fetchBlogAnalytics(startDate, endDate),
          fetchBlogCtaClicks(startDate, endDate),
          fetchBlogFaqClicks(startDate, endDate),
        ]);

        return {
          summary,
          comparison,
          heatmap,
          visits,
          trafficSources,
          deviceBreakdown,
          geoData,
          goalsData,
          alertsData: { alerts: Array.isArray(alertsData) ? alertsData : alertsData?.alerts || [] },
          blogData: blogAnalyticsData,
          blogCtaData,
          blogFaqData,
        };
      },
      cacheTTL
    );

    return Response.json(
      {
        ...data,
        dateRange: {
          start: startISO,
          end: endISO,
          timeRange,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return Response.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

// ============================================
// Helper functions to fetch additional data
// (previously fetched as separate HTTP calls)
// ============================================

async function fetchGeoData(startDate: Date, endDate: Date) {
  try {
    const siteId = getCurrentSiteId();

    const geolocations = await prisma.visitorGeolocation.findMany({
      where: {
        siteId,
        timestamp: { gte: startDate, lte: endDate },
      },
      select: {
        sessionId: true,
        country: true,
        countryCode: true,
        region: true,
        city: true,
        latitude: true,
        longitude: true,
      },
    });

    const countryStats: Record<string, { count: number; countryCode: string }> = {};
    const cityStats: Record<
      string,
      {
        count: number;
        country: string;
        countryCode: string;
        region: string | null;
        latitude: number | null;
        longitude: number | null;
      }
    > = {};

    for (const geo of geolocations) {
      if (!countryStats[geo.country]) {
        countryStats[geo.country] = { count: 0, countryCode: geo.countryCode };
      }
      countryStats[geo.country].count++;

      if (geo.city) {
        const cityKey = `${geo.country}|${geo.region || ''}|${geo.city}`;
        if (!cityStats[cityKey]) {
          cityStats[cityKey] = {
            count: 0,
            country: geo.country,
            countryCode: geo.countryCode,
            region: geo.region,
            latitude: geo.latitude,
            longitude: geo.longitude,
          };
        }
        cityStats[cityKey].count++;
      }
    }

    const byCountry = Object.entries(countryStats)
      .map(([country, data]) => ({ country, countryCode: data.countryCode, visitors: data.count }))
      .sort((a, b) => b.visitors - a.visitors);

    const byCity = Object.entries(cityStats)
      .map(([key, data]) => {
        const [, , city] = key.split('|');
        return {
          city,
          country: data.country,
          countryCode: data.countryCode,
          region: data.region,
          latitude: data.latitude,
          longitude: data.longitude,
          visitors: data.count,
        };
      })
      .sort((a, b) => b.visitors - a.visitors);

    return { byCountry, byCity };
  } catch {
    return { byCountry: [], byCity: [] };
  }
}

async function fetchBlogAnalytics(startDate: Date, endDate: Date) {
  try {
    const allAnalytics = await prisma.blogAnalytics.findMany({
      where: { timestamp: { gte: startDate, lte: endDate } },
      select: {
        articleSlug: true,
        sessionId: true,
        timestamp: true,
        scrollDepthPercent: true,
        timeOnPage: true,
        completed: true,
      },
    });

    const grouped = new Map<
      string,
      {
        views: number;
        sessions: Set<string>;
        lastViewed: Date;
        scrollDepths: number[];
        timesOnPage: number[];
        completedReads: number;
      }
    >();

    for (const r of allAnalytics) {
      let entry = grouped.get(r.articleSlug);
      if (!entry) {
        entry = {
          views: 0,
          sessions: new Set(),
          lastViewed: r.timestamp,
          scrollDepths: [],
          timesOnPage: [],
          completedReads: 0,
        };
        grouped.set(r.articleSlug, entry);
      }
      entry.views++;
      entry.sessions.add(r.sessionId);
      if (r.timestamp > entry.lastViewed) entry.lastViewed = r.timestamp;
      if (r.scrollDepthPercent != null) entry.scrollDepths.push(r.scrollDepthPercent);
      if (r.timeOnPage != null) entry.timesOnPage.push(r.timeOnPage);
      if (r.completed) entry.completedReads++;
    }

    const articles = Array.from(grouped.entries()).map(([slug, d]) => ({
      slug,
      views: d.views,
      uniqueVisitors: d.sessions.size,
      lastViewed: d.lastViewed.toISOString(),
      engagement: {
        avgScrollDepth:
          d.scrollDepths.length > 0
            ? Math.round(d.scrollDepths.reduce((a, b) => a + b, 0) / d.scrollDepths.length)
            : null,
        avgTimeOnPage:
          d.timesOnPage.length > 0
            ? Math.round(d.timesOnPage.reduce((a, b) => a + b, 0) / d.timesOnPage.length)
            : null,
      },
      score: 0,
    }));

    const totalViews = articles.reduce((s, a) => s + a.views, 0);
    const allSessions = new Set(allAnalytics.map(a => a.sessionId));

    return { articles, totalViews, totalUniqueVisitors: allSessions.size };
  } catch {
    return { articles: [], totalViews: 0, totalUniqueVisitors: 0 };
  }
}

async function fetchBlogCtaClicks(startDate: Date, endDate: Date) {
  try {
    const clicks = await prisma.blogCtaClick.findMany({
      where: { timestamp: { gte: startDate, lte: endDate } },
      select: { ctaType: true },
    });

    const summary = { appointment: 0, seminar: 0 };
    for (const c of clicks) {
      if (c.ctaType === 'appointment') summary.appointment++;
      else if (c.ctaType === 'seminar') summary.seminar++;
    }

    return { summary };
  } catch {
    return { summary: { appointment: 0, seminar: 0 } };
  }
}

async function fetchBlogFaqClicks(startDate: Date, endDate: Date) {
  try {
    const clicks = await prisma.blogFaqClick.findMany({
      where: { timestamp: { gte: startDate, lte: endDate } },
      orderBy: { timestamp: 'desc' },
    });

    const summary: Record<string, { opens: number }> = {};
    for (const c of clicks) {
      const faqId = `${c.articleSlug}-${c.faqIndex}`;
      if (!summary[faqId]) summary[faqId] = { opens: 0 };
      summary[faqId].opens++;
    }

    return {
      clicks: clicks.map(c => ({
        faqId: `${c.articleSlug}-${c.faqIndex}`,
        articleSlug: c.articleSlug,
        question: c.question,
      })),
      summary,
    };
  } catch {
    return { summary: {}, clicks: [] };
  }
}
