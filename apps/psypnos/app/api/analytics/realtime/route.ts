/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import type { NextRequest } from "next/server";

import { getPageVisits, getAnalyticsSummary } from "../store-index";

export const dynamic = 'force-dynamic';

/**
 * API endpoint for real-time analytics polling
 * Returns active visitors count and today's stats
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const { withAdminAuth } = await import('../../auth/middleware');
    const authResult = await withAdminAuth();
    if (authResult.error) return authResult.error;

    const now = new Date();

    // Calculate time windows
    // Use a 15-minute window for "active" visitors.
    // Page views are only recorded on navigation, so a user reading a page
    // generates no new events. A 5-minute window causes visitors to
    // "disappear" too quickly.
    const recentWindowStart = new Date(now.getTime() - 15 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Yesterday for trend calculation
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(now);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Fetch data in parallel
    const [recentVisits, todaySummary, yesterdaySummary] = await Promise.all([
      // Get visits from last 15 minutes for "active" count
      getPageVisits(recentWindowStart.toISOString(), now.toISOString()),
      // Get today's summary
      getAnalyticsSummary(todayStart.toISOString(), todayEnd.toISOString()),
      // Get yesterday's summary for trend
      getAnalyticsSummary(yesterdayStart.toISOString(), yesterdayEnd.toISOString()),
    ]);

    // Count unique sessions in last 15 minutes as "active visitors"
    const uniqueSessions = new Set(
      recentVisits.map((v: { sessionId?: string }) => v.sessionId).filter(Boolean)
    );
    const activeVisitors = uniqueSessions.size;

    // Calculate today's trend vs yesterday
    const todayVisits = todaySummary.totalVisits || 0;
    const yesterdayVisits = yesterdaySummary.totalVisits || 0;
    const todayTrend = yesterdayVisits > 0
      ? Math.round(((todayVisits - yesterdayVisits) / yesterdayVisits) * 100)
      : todayVisits > 0 ? 100 : 0;

    return Response.json({
      activeVisitors,
      today: {
        visits: todayVisits,
        trend: todayTrend,
      },
      timestamp: now.toISOString(),
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error("Error fetching realtime analytics:", error);
    return Response.json(
      { error: "Failed to fetch realtime analytics" },
      { status: 500 }
    );
  }
}
