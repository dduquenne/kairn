/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import type { NextRequest } from "next/server";

import { getAnalyticsSummary, getVisitsByPeriod } from "../store-index";

export const dynamic = 'force-dynamic';

/**
 * Parse time range string (e.g., "24h", "7d", "30d", "90d") and return start/end dates
 */
function parseTimeRange(range: string): { startDate: string; endDate: string; daysCount: number; isHourly: boolean } {
  const now = new Date();
  const endDate = new Date(now);

  const startDate = new Date(now);

  let daysCount = 7; // default
  let isHourly = false;

  const match = range.match(/^(\d+)([hdwmy])$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'h': // hours
        // For hourly data, set end to current time and start to X hours ago
        startDate.setHours(startDate.getHours() - value);
        daysCount = 1; // represents 1 day for comparison purposes
        isHourly = true;
        break;
      case 'd': // days
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        startDate.setDate(startDate.getDate() - value);
        daysCount = value;
        break;
      case 'w': // weeks
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        startDate.setDate(startDate.getDate() - (value * 7));
        daysCount = value * 7;
        break;
      case 'm': // months
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        startDate.setMonth(startDate.getMonth() - value);
        daysCount = value * 30;
        break;
      case 'y': // years
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        startDate.setFullYear(startDate.getFullYear() - value);
        daysCount = value * 365;
        break;
    }
  } else {
    // Default: set proper day boundaries for 7 days
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    startDate.setDate(startDate.getDate() - 7);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    daysCount,
    isHourly,
  };
}

/**
 * Get the previous period dates for comparison
 */
function getPreviousPeriod(startDate: string, daysCount: number): { startDate: string; endDate: string } {
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  prevEndDate.setHours(23, 59, 59, 999);

  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - daysCount + 1);
  prevStartDate.setHours(0, 0, 0, 0);

  return {
    startDate: prevStartDate.toISOString(),
    endDate: prevEndDate.toISOString(),
  };
}

/**
 * Calculate trend percentage between current and previous values
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get today's visits count
 */
async function getTodayVisits(): Promise<number> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const summary = await getAnalyticsSummary(todayStart.toISOString(), todayEnd.toISOString());
  return summary.totalVisits || 0;
}

/**
 * Get yesterday's visits for today's trend
 */
async function getYesterdayVisits(): Promise<number> {
  const now = new Date();
  const yesterdayStart = new Date(now);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);

  const yesterdayEnd = new Date(now);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const summary = await getAnalyticsSummary(yesterdayStart.toISOString(), yesterdayEnd.toISOString());
  return summary.totalVisits || 0;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range");
    const includeComparison = searchParams.get("compare") !== "false";
    let startDate = searchParams.get("startDate") || undefined;
    let endDate = searchParams.get("endDate") || undefined;
    let daysCount = 7;
    let isHourly = false;

    // Parse range parameter if provided
    if (range) {
      const dates = parseTimeRange(range);
      startDate = dates.startDate;
      endDate = dates.endDate;
      daysCount = dates.daysCount;
      isHourly = dates.isHourly;
    }

    // Fetch current period summary
    const summary = await getAnalyticsSummary(startDate, endDate);

    // Fetch chart data for current period - use "hour" for hourly data, otherwise "day"
    const periodType = isHourly ? "hour" : "day";
    const visitsByPeriod = await getVisitsByPeriod(periodType, startDate, endDate);
    const chartData = visitsByPeriod.map(item => ({
      date: item.period,
      value: item.visits
    }));

    // Initialize comparison data
    let comparison = null;
    let previousChartData: Array<{ date: string; value: number }> = [];
    let trends = {
      visits: 0,
      visitors: 0,
      avgTime: 0,
      conversion: 0,
    };

    // Fetch comparison data if requested
    if (includeComparison && startDate) {
      const prevPeriod = getPreviousPeriod(startDate, daysCount);
      const prevSummary = await getAnalyticsSummary(prevPeriod.startDate, prevPeriod.endDate);
      const prevVisitsByPeriod = await getVisitsByPeriod(periodType, prevPeriod.startDate, prevPeriod.endDate);

      previousChartData = prevVisitsByPeriod.map(item => ({
        date: item.period,
        value: item.visits
      }));

      comparison = {
        totalVisits: prevSummary.totalVisits || 0,
        uniqueSessions: prevSummary.uniqueSessions || 0,
        averageTimeOnSite: prevSummary.averageTimeOnSite || 0,
        conversionRate: prevSummary.conversionRate || 0,
      };

      // Calculate trends
      trends = {
        visits: calculateTrend(summary.totalVisits || 0, comparison.totalVisits),
        visitors: calculateTrend(summary.uniqueSessions || 0, comparison.uniqueSessions),
        avgTime: calculateTrend(
          summary.averageTimeOnSite || 0,
          comparison.averageTimeOnSite
        ),
        conversion: calculateTrend(summary.conversionRate || 0, comparison.conversionRate),
      };
    }

    // Get today's stats
    const todayVisits = await getTodayVisits();
    const yesterdayVisits = await getYesterdayVisits();
    const todayTrend = calculateTrend(todayVisits, yesterdayVisits);

    return Response.json({
      ...summary,
      chartData,
      previousChartData,
      comparison,
      trends,
      today: {
        visits: todayVisits,
        trend: Math.round(todayTrend),
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    return Response.json(
      { error: "Failed to fetch analytics summary" },
      { status: 500 },
    );
  }
}
