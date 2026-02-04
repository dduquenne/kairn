/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest } from "next/server";

import {
  getPageVisits,
  getSectionTimes,
  getConversionEvents,
  getAnalyticsSummary,
  getTrafficSources,
  getDeviceBreakdown,
  getSectionHeatmap,
  type PageVisit,
  type ConversionEvent,
} from "../store-index";

export const dynamic = "force-dynamic";

// Helper function to convert array of objects to CSV
function arrayToCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(",");
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        // Escape commas and quotes in values
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",");
  });

  return [csvHeaders, ...csvRows].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const exportType = searchParams.get("type") || "summary";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    let csvContent = "";
    let filename = "analytics-export.csv";

    switch (exportType) {
      case "summary": {
        const summary = await getAnalyticsSummary(startDate, endDate);
        const data = [
          {
            metric: "Total Visits",
            value: summary.totalVisits,
          },
          {
            metric: "Unique Sessions",
            value: summary.uniqueSessions,
          },
          {
            metric: "Average Time on Site (ms)",
            value: summary.averageTimeOnSite.toFixed(0),
          },
          {
            metric: "Conversion Rate (%)",
            value: summary.conversionRate.toFixed(2),
          },
        ];
        csvContent = arrayToCSV(data, ["metric", "value"]);
        filename = "analytics-summary.csv";
        break;
      }

      case "sections": {
        const heatmap = await getSectionHeatmap(startDate, endDate);
        const data = heatmap.map((section) => ({
          section: section.section,
          visitors: section.visitors,
          avgTimeSeconds: section.avgTimeSeconds,
          scrollRate: section.scrollRate.toFixed(1),
          conversions: section.conversionsFromSection,
        }));
        csvContent = arrayToCSV(data, [
          "section",
          "visitors",
          "avgTimeSeconds",
          "scrollRate",
          "conversions",
        ]);
        filename = "analytics-sections.csv";
        break;
      }

      case "traffic-sources": {
        const sources = await getTrafficSources(startDate, endDate);
        const data = sources.map((source) => ({
          source: source.source,
          medium: source.medium,
          visits: source.visits,
          uniqueSessions: source.uniqueSessions,
          conversionRate: source.conversionRate.toFixed(2),
        }));
        csvContent = arrayToCSV(data, [
          "source",
          "medium",
          "visits",
          "uniqueSessions",
          "conversionRate",
        ]);
        filename = "analytics-traffic-sources.csv";
        break;
      }

      case "devices": {
        const devices = await getDeviceBreakdown(startDate, endDate);
        const data = devices.map((device) => ({
          deviceType: device.deviceType,
          visits: device.visits,
          uniqueSessions: device.uniqueSessions,
          avgTimeOnSite: (device.avgTimeOnSite / 1000).toFixed(0),
        }));
        csvContent = arrayToCSV(data, [
          "deviceType",
          "visits",
          "uniqueSessions",
          "avgTimeOnSite",
        ]);
        filename = "analytics-devices.csv";
        break;
      }

      case "visits": {
        const visits = await getPageVisits(startDate, endDate);
        const data = (visits as PageVisit[]).map((visit: PageVisit) => ({
          timestamp: visit.timestamp,
          sessionId: visit.sessionId,
          page: visit.page,
          referrer: visit.referrer || "",
          utmSource: visit.utmSource || "",
          utmMedium: visit.utmMedium || "",
          utmCampaign: visit.utmCampaign || "",
          deviceType: visit.deviceType || "",
          browser: visit.browser || "",
          isBot: visit.isBot || false,
        }));
        csvContent = arrayToCSV(data, [
          "timestamp",
          "sessionId",
          "page",
          "referrer",
          "utmSource",
          "utmMedium",
          "utmCampaign",
          "deviceType",
          "browser",
          "isBot",
        ]);
        filename = "analytics-visits.csv";
        break;
      }

      case "conversions": {
        const conversions = await getConversionEvents(startDate, endDate);
        const data = (conversions as ConversionEvent[]).map(
          (conv: ConversionEvent) => ({
            timestamp: conv.timestamp,
            sessionId: conv.sessionId,
            eventType: conv.eventType,
            stepName: conv.stepName,
            completed: conv.completed,
          })
        );
        csvContent = arrayToCSV(data, [
          "timestamp",
          "sessionId",
          "eventType",
          "stepName",
          "completed",
        ]);
        filename = "analytics-conversions.csv";
        break;
      }

      default:
        return Response.json({ error: "Invalid export type" }, { status: 400 });
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return Response.json({ error: "Failed to export data" }, { status: 500 });
  }
}
