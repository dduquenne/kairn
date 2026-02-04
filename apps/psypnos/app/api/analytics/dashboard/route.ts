/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest } from "next/server";

import { isMockMode, generateMockDashboardData, logDataMode } from "@/lib/pwaDataMode";

import {
  getAnalyticsSummary,
  getAnalyticsSummaryWithComparison,
  getSectionHeatmap,
  getVisitsByPeriod,
  getPageVisits,
  getTrafficSources,
  getDeviceBreakdown,
} from "../store-index";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Note: "hour" is used for realtime mode
    const timeRange = (searchParams.get("timeRange") || "day") as "day" | "week" | "month" | "year" | "hour";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Log le mode de données
    logDataMode();

    // Si en mode mock, retourner des données simulées
    if (isMockMode()) {
      console.log('📊 [Analytics Dashboard] Using MOCK data');
      const mockData = generateMockDashboardData(
        timeRange,
        startDateParam || undefined,
        endDateParam || undefined
      );

      const endDate = endDateParam ? new Date(endDateParam) : new Date();
      let startDate = startDateParam ? new Date(startDateParam) : new Date();

      // Calculate date range based on timeRange if no custom dates provided
      if (!startDateParam) {
        if (timeRange === "hour") {
          // For realtime, last hour
          startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
        } else if (timeRange === "day") {
          startDate.setDate(endDate.getDate() - 6);
        } else if (timeRange === "week") {
          startDate.setDate(endDate.getDate() - 27);
        } else if (timeRange === "month") {
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        } else if (timeRange === "year") {
          startDate = new Date(endDate.getFullYear(), 0, 1);
        }
      }

      return Response.json(
        {
          ...mockData,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            timeRange,
          },
        },
        { status: 200 }
      );
    }

    // Mode réel - récupérer les vraies données
    console.log('📊 [Analytics Dashboard] Using REAL data');
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    let startDate = startDateParam ? new Date(startDateParam) : new Date();

    // For realtime mode (hour), we need raw visits with timestamps
    const isRealtimeMode = timeRange === "hour";

    // Calculate date range based on timeRange if no custom dates provided
    if (!startDateParam) {
      if (isRealtimeMode) {
        // For realtime, last hour (frontend should provide this, but fallback)
        startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
      } else if (timeRange === "day") {
        startDate.setDate(endDate.getDate() - 6);
      } else if (timeRange === "week") {
        startDate.setDate(endDate.getDate() - 27);
      } else if (timeRange === "month") {
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      } else if (timeRange === "year") {
        startDate = new Date(endDate.getFullYear(), 0, 1);
      }
    }

    // For non-realtime modes, set to start/end of day
    if (!isRealtimeMode) {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // For comparison and period aggregation, use "day" as fallback for realtime
    const comparisonTimeRange = isRealtimeMode ? "day" : timeRange as "day" | "week" | "month" | "year";

    // Fetch all data in parallel for better performance
    const [summary, comparison, heatmap, visits, trafficSources, deviceBreakdown] = await Promise.all([
      getAnalyticsSummary(startDate.toISOString(), endDate.toISOString()),
      getAnalyticsSummaryWithComparison(comparisonTimeRange),
      getSectionHeatmap(startDate.toISOString(), endDate.toISOString()),
      isRealtimeMode
        ? getPageVisits(startDate.toISOString(), endDate.toISOString())
        : getVisitsByPeriod(comparisonTimeRange, startDate.toISOString(), endDate.toISOString()),
      getTrafficSources(startDate.toISOString(), endDate.toISOString()),
      getDeviceBreakdown(startDate.toISOString(), endDate.toISOString()),
    ]);

    return Response.json(
      {
        summary,
        comparison,
        heatmap,
        visits,
        trafficSources,
        deviceBreakdown,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          timeRange,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
