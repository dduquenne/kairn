/* eslint-disable @typescript-eslint/no-explicit-any */
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
  getTopPages,
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
          startDate.setUTCDate(endDate.getUTCDate() - 6);
        } else if (timeRange === 'week') {
          startDate.setUTCDate(endDate.getUTCDate() - 27);
        } else if (timeRange === 'month') {
          startDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1));
        } else if (timeRange === 'year') {
          startDate = new Date(Date.UTC(endDate.getUTCFullYear(), 0, 1));
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
        startDate.setUTCDate(endDate.getUTCDate() - 6);
      } else if (timeRange === 'week') {
        startDate.setUTCDate(endDate.getUTCDate() - 27);
      } else if (timeRange === 'month') {
        startDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1));
      } else if (timeRange === 'year') {
        startDate = new Date(Date.UTC(endDate.getUTCFullYear(), 0, 1));
      }
    }

    // Normalize date boundaries to UTC to match PostgreSQL's date_trunc()
    // and the frontend's UTC-based bucket generation.
    // IMPORTANT: use setUTCHours (not setHours) to avoid server-timezone
    // dependent shifts that desynchronise the query range from the chart buckets.
    if (!isRealtimeMode) {
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(23, 59, 59, 999);
    }

    const comparisonTimeRange = isRealtimeMode
      ? 'day'
      : (timeRange as 'day' | 'week' | 'month' | 'year');
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    const siteId = await getCurrentSiteId();
    const cacheTTL = isRealtimeMode ? CACHE_TTL.SHORT : CACHE_TTL.MEDIUM;
    const cacheKey = buildCacheKey(CACHE_KEYS.DASHBOARD, {
      siteId,
      timeRange,
      start: startISO,
      end: endISO,
    });

    const data = await getCached(
      cacheKey,
      async () => {
        // Fetch ALL data in a single parallel batch
        // This replaces 9 separate HTTP calls from the client
        // Each query has its own .catch() so a single failure does not
        // take down the entire dashboard.
        const defaultSummary = {
          totalVisits: 0,
          uniqueSessions: 0,
          averageTimeOnSite: 0,
          conversionRate: 0,
          bounceRate: 0,
          topSections: [],
          conversionByType: {},
          funnelSteps: [],
        };

        const [
          summary,
          comparison,
          heatmap,
          visits,
          topPages,
          trafficSources,
          deviceBreakdown,
          geoData,
          goalsData,
          alertsData,
          blogAnalyticsData,
          blogCtaData,
          blogFaqData,
        ] = await Promise.all([
          getAnalyticsSummary(startISO, endISO).catch((err: unknown) => {
            console.error('[Dashboard] getAnalyticsSummary failed:', err);
            return defaultSummary;
          }),
          getAnalyticsSummaryWithComparison(comparisonTimeRange, startISO, endISO).catch(
            (err: unknown) => {
              console.error('[Dashboard] getAnalyticsSummaryWithComparison failed:', err);
              return { current: defaultSummary, previous: defaultSummary, comparison: {} };
            }
          ),
          getSectionHeatmap(startISO, endISO).catch((err: unknown) => {
            console.error('[Dashboard] getSectionHeatmap failed:', err);
            return [];
          }),
          (isRealtimeMode
            ? getPageVisits(startISO, endISO).then((visits: any[]) => visits.slice(0, 1000))
            : getVisitsByPeriod(comparisonTimeRange, startISO, endISO)
          ).catch((err: unknown) => {
            console.error('[Dashboard] getVisits failed:', err);
            return [];
          }),
          getTopPages(startISO, endISO, 10).catch((err: unknown) => {
            console.error('[Dashboard] getTopPages failed:', err);
            return [];
          }),
          getTrafficSources(startISO, endISO).catch((err: unknown) => {
            console.error('[Dashboard] getTrafficSources failed:', err);
            return [];
          }),
          getDeviceBreakdown(startISO, endISO).catch((err: unknown) => {
            console.error('[Dashboard] getDeviceBreakdown failed:', err);
            return [];
          }),
          fetchGeoData(startDate, endDate),
          getGoalsSummary(startISO, endISO)
            .then((goals: any[]) => ({ goals }))
            .catch((err: unknown) => {
              console.error('[Dashboard] getGoalsSummary failed:', err);
              return { goals: [] };
            }),
          getAlerts().catch((err: unknown) => {
            console.error('[Dashboard] getAlerts failed:', err);
            return [];
          }),
          fetchBlogAnalytics(startDate, endDate),
          fetchBlogCtaClicks(startDate, endDate),
          fetchBlogFaqClicks(startDate, endDate),
        ]);

        return {
          summary,
          comparison,
          heatmap,
          visits,
          topPages,
          trafficSources,
          deviceBreakdown,
          geoData,
          goalsData,
          alertsData: { alerts: alertsData },
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

/**
 * Décode une valeur URI-encodée de manière sûre (retourne la valeur brute en cas d'erreur)
 */
function safeDecodeGeo(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function fetchGeoData(startDate: Date, endDate: Date) {
  try {
    const siteId = await getCurrentSiteId();

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
        regionCode: true,
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
        regionCode: string | null;
        latitude: number | null;
        longitude: number | null;
      }
    > = {};

    for (const geo of geolocations) {
      const country = safeDecodeGeo(geo.country);
      const countryStat = countryStats[country] ?? { count: 0, countryCode: geo.countryCode };
      countryStat.count++;
      countryStats[country] = countryStat;

      if (geo.city) {
        const city = safeDecodeGeo(geo.city);
        const region = geo.region ? safeDecodeGeo(geo.region) : null;
        const cityKey = `${country}|${region || ''}|${city}`;
        const cityStat = cityStats[cityKey] ?? {
          count: 0,
          country,
          countryCode: geo.countryCode,
          region,
          regionCode: geo.regionCode,
          latitude: geo.latitude,
          longitude: geo.longitude,
        };
        cityStat.count++;
        cityStats[cityKey] = cityStat;
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
          regionCode: data.regionCode,
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

/**
 * Fetches blog analytics for the given period, groups by article slug and
 * computes a normalised composite performance score (0–100) per article.
 * Score = (views/max × 25) + (visitors/max × 20) + (time/max × 25) + (scroll/100 × 30)
 */
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

    const articlesRaw = Array.from(grouped.entries()).map(([slug, d]) => ({
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
    }));

    // Compute normalised composite score per article
    // Score = (views/max × 25) + (visitors/max × 20) + (time/max × 25) + (scroll/100 × 30)
    const maxViews = Math.max(...articlesRaw.map(a => a.views), 1);
    const maxVisitors = Math.max(...articlesRaw.map(a => a.uniqueVisitors), 1);
    const maxTime = Math.max(...articlesRaw.map(a => a.engagement.avgTimeOnPage || 0), 1);

    const articles = articlesRaw
      .map(a => {
        const viewsScore = (a.views / maxViews) * 25;
        const visitorsScore = (a.uniqueVisitors / maxVisitors) * 20;
        const timeScore = ((a.engagement.avgTimeOnPage || 0) / maxTime) * 25;
        const readScore = ((a.engagement.avgScrollDepth || 0) / 100) * 30;

        return { ...a, score: Math.round(viewsScore + visitorsScore + timeScore + readScore) };
      })
      .sort((a, b) => b.score - a.score);

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
