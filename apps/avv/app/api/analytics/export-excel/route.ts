/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest } from "next/server";
import * as XLSX from "xlsx";

import {
  getAnalyticsSummary,
  getPageVisits,
  getSectionTimes,
  getConversionEvents,
  getTrafficSources,
  getDeviceBreakdown,
} from "../store-index";

export const dynamic = "force-dynamic";

// Types pour les données analytics
interface TopSection {
  section: string;
  visits: number;
  avgTime: number;
}

interface ConversionData {
  clicks: number;
  completed: number;
  rate: number;
}

interface TrafficSource {
  source: string;
  medium: string;
  visits: number;
  conversionRate: number;
}

interface DeviceStats {
  deviceType: string;
  visits: number;
  percentage: number;
  uniqueSessions: number;
  avgTimeOnSite: number;
}

interface PageVisit {
  timestamp: string;
  page: string;
  sessionId: string;
  referrer?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  utmSource?: string;
  utmMedium?: string;
  scrollDepthPercent?: number;
  timeOnPage?: number;
  isBot?: boolean;
}

interface TrafficSourceData {
  source: string;
  medium: string;
  visits: number;
  uniqueSessions: number;
  conversionRate: number;
}

interface SectionTime {
  timestamp: string;
  section: string;
  sessionId: string;
  timeSpent: number;
}

interface ConversionEvent {
  timestamp: string;
  eventType: string;
  stepName: string;
  sessionId: string;
  completed: boolean;
}

/**
 * Export analytics data to Excel format (XLSX)
 * Creates multiple sheets with formatted data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // Fetch all data in parallel
    const [summary, visits, sections, conversions, trafficSources, deviceBreakdown] =
      await Promise.all([
        getAnalyticsSummary(startDate, endDate),
        getPageVisits(startDate, endDate),
        getSectionTimes(startDate, endDate),
        getConversionEvents(startDate, endDate),
        getTrafficSources(startDate, endDate),
        getDeviceBreakdown(startDate, endDate),
      ]);

    // Create new workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      { Métrique: "Visites totales", Valeur: summary.totalVisits },
      { Métrique: "Sessions uniques", Valeur: summary.uniqueSessions },
      {
        Métrique: "Temps moyen sur site (min)",
        Valeur: Math.round(summary.averageTimeOnSite / 60000),
      },
      { Métrique: "Taux de conversion (%)", Valeur: summary.conversionRate.toFixed(2) },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);

    // Set column widths
    summarySheet["!cols"] = [{ wch: 30 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Résumé");

    // Sheet 2: Top Sections
    const sectionsData = (summary.topSections as TopSection[]).map((section: TopSection) => ({
      Section: section.section,
      Visites: section.visits,
      "Temps moyen (s)": Math.round(section.avgTime / 1000),
    }));
    const sectionsSheet = XLSX.utils.json_to_sheet(sectionsData);
    sectionsSheet["!cols"] = [{ wch: 30 }, { wch: 12 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, sectionsSheet, "Top Sections");

    // Sheet 3: Conversions by Type
    const conversionsData = Object.entries(
      summary.conversionByType as Record<string, ConversionData>
    ).map(([type, data]: [string, ConversionData]) => ({
      Type: type,
      Clics: data.clicks,
      Complétées: data.completed,
      "Taux (%)": data.rate.toFixed(2),
    }));
    const conversionsSheet = XLSX.utils.json_to_sheet(conversionsData);
    conversionsSheet["!cols"] = [{ wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, conversionsSheet, "Conversions");

    // Sheet 4: Traffic Sources
    if (trafficSources.length > 0) {
      const trafficData = (trafficSources as TrafficSourceData[]).map(
        (source: TrafficSourceData) => ({
          Source: source.source,
          Médium: source.medium,
          Visites: source.visits,
          "Sessions uniques": source.uniqueSessions,
          "Taux conversion (%)": source.conversionRate.toFixed(2),
        })
      );
      const trafficSheet = XLSX.utils.json_to_sheet(trafficData);
      trafficSheet["!cols"] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 18 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(workbook, trafficSheet, "Sources de trafic");
    }

    // Sheet 5: Device Breakdown
    if (deviceBreakdown.length > 0) {
      const deviceData = (deviceBreakdown as DeviceStats[]).map(
        (device: DeviceStats) => ({
          Appareil: device.deviceType,
          Visites: device.visits,
          "Sessions uniques": device.uniqueSessions,
          "Temps moyen (s)": Math.round(device.avgTimeOnSite / 1000),
        })
      );
      const deviceSheet = XLSX.utils.json_to_sheet(deviceData);
      deviceSheet["!cols"] = [{ wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(workbook, deviceSheet, "Appareils");
    }

    // Sheet 6: Page Visits (dernières 1000)
    const recentVisits = (visits as PageVisit[]).slice(-1000).map(
      (visit: PageVisit) => ({
        Date: new Date(visit.timestamp).toLocaleString("fr-FR"),
        Page: visit.page,
        "Session ID": visit.sessionId,
        Referrer: visit.referrer || "Direct",
        "Type appareil": visit.deviceType || "Unknown",
        Navigateur: visit.browser || "Unknown",
        OS: visit.os || "Unknown",
        "UTM Source": visit.utmSource || "N/A",
        "UTM Medium": visit.utmMedium || "N/A",
        "Scroll (%)": visit.scrollDepthPercent || "N/A",
        "Temps (s)": visit.timeOnPage ? Math.round(visit.timeOnPage / 1000) : "N/A",
        Bot: visit.isBot ? "Oui" : "Non",
      })
    );
    const visitsSheet = XLSX.utils.json_to_sheet(recentVisits);
    visitsSheet["!cols"] = [
      { wch: 20 },
      { wch: 30 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(workbook, visitsSheet, "Visites (1000 dernières)");

    // Sheet 7: Section Times (dernières 1000)
    const recentSections = (sections as SectionTime[]).slice(-1000).map(
      (section: SectionTime) => ({
        Date: new Date(section.timestamp).toLocaleString("fr-FR"),
        Section: section.section,
        "Session ID": section.sessionId,
        "Temps passé (s)": Math.round(section.timeSpent / 1000),
      })
    );
    const sectionTimesSheet = XLSX.utils.json_to_sheet(recentSections);
    sectionTimesSheet["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, sectionTimesSheet, "Temps sections (1000)");

    // Sheet 8: Conversion Events (derniers 1000)
    const recentConversions = (conversions as ConversionEvent[]).slice(-1000).map(
      (event: ConversionEvent) => ({
        Date: new Date(event.timestamp).toLocaleString("fr-FR"),
        Type: event.eventType,
        Étape: event.stepName,
        "Session ID": event.sessionId,
        Complété: event.completed ? "Oui" : "Non",
      })
    );
    const conversionEventsSheet = XLSX.utils.json_to_sheet(recentConversions);
    conversionEventsSheet["!cols"] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(workbook, conversionEventsSheet, "Événements (1000)");

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Create filename with date
    const now = new Date();
    const filename = `analytics-avv-${now.toISOString().split("T")[0]}.xlsx`;

    // Return file
    return new Response(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    return Response.json(
      { error: "Failed to export to Excel" },
      { status: 500 }
    );
  }
}
