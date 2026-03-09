/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";

import {
  getAnalyticsSummary,
  getAnalyticsSummaryWithComparison,
  getTrafficSources,
  getDeviceBreakdown,
  getSectionHeatmap,
  getCohortAnalysis,
  getAnomalies,
} from "../store-index";

export const dynamic = "force-dynamic";

// Note: jsPDF is client-side only. For server-side PDF generation,
// we'll return the data in a format that can be used by the client
// to generate the PDF, or we can use a different approach.

// GET - Generate PDF report data or trigger email
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const timeRange = (searchParams.get("timeRange") as "day" | "week" | "month" | "year") || "week";
    const format = searchParams.get("format") || "data"; // "data" or "html"
    const sections = searchParams.get("sections")?.split(",") || [
      "summary",
      "conversions",
      "traffic",
      "sections",
      "devices",
    ];

    // Calculate date range if not provided
    const now = new Date();
    const effectiveEndDate = endDate || now.toISOString();
    let effectiveStartDate = startDate;

    if (!effectiveStartDate) {
      const start = new Date(now);
      switch (timeRange) {
        case "day":
          start.setDate(start.getDate() - 1);
          break;
        case "week":
          start.setDate(start.getDate() - 7);
          break;
        case "month":
          start.setMonth(start.getMonth() - 1);
          break;
        case "year":
          start.setFullYear(start.getFullYear() - 1);
          break;
      }
      effectiveStartDate = start.toISOString();
    }

    // Fetch all required data in parallel
    const [summary, comparison, trafficSources, devices, heatmap, cohorts, anomalies] = await Promise.all([
      getAnalyticsSummary(effectiveStartDate, effectiveEndDate),
      getAnalyticsSummaryWithComparison(timeRange),
      getTrafficSources(effectiveStartDate, effectiveEndDate),
      getDeviceBreakdown(effectiveStartDate, effectiveEndDate),
      getSectionHeatmap(effectiveStartDate, effectiveEndDate),
      getCohortAnalysis("week", effectiveStartDate, effectiveEndDate),
      getAnomalies(effectiveStartDate, effectiveEndDate),
    ]);

    // Build report data
    const reportData = {
      metadata: {
        title: "Rapport Analytics - Appréciez Votre Vie",
        generatedAt: new Date().toISOString(),
        period: {
          start: effectiveStartDate,
          end: effectiveEndDate,
          label: getTimeRangeLabel(timeRange),
        },
      },
      summary: sections.includes("summary") ? {
        totalVisits: summary.totalVisits,
        uniqueSessions: summary.uniqueSessions,
        averageTimeOnSite: summary.averageTimeOnSite,
        conversionRate: summary.conversionRate,
        comparison: {
          totalVisitsChange: comparison.comparison.totalVisitsChange,
          uniqueSessionsChange: comparison.comparison.uniqueSessionsChange,
          averageTimeOnSiteChange: comparison.comparison.averageTimeOnSiteChange,
          conversionRateChange: comparison.comparison.conversionRateChange,
        },
      } : null,
      conversions: sections.includes("conversions") ? {
        byType: summary.conversionByType,
        topSections: summary.topSections,
      } : null,
      traffic: sections.includes("traffic") ? {
        sources: trafficSources.slice(0, 10),
      } : null,
      sections: sections.includes("sections") ? {
        heatmap: heatmap.slice(0, 10),
      } : null,
      devices: sections.includes("devices") ? {
        breakdown: devices,
      } : null,
      cohorts: sections.includes("cohorts") ? {
        analysis: cohorts.slice(0, 5),
      } : null,
      anomalies: sections.includes("anomalies") ? {
        detected: anomalies.filter(a => !a.acknowledged).slice(0, 10),
      } : null,
    };

    // If HTML format requested, return printable HTML
    if (format === "html") {
      const html = generatePrintableHTML(reportData);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="rapport-analytics-${Date.now()}.html"`,
        },
      });
    }

    // Return JSON data for client-side PDF generation
    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating PDF report:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation du rapport" },
      { status: 500 }
    );
  }
}

function getTimeRangeLabel(timeRange: string): string {
  switch (timeRange) {
    case "day":
      return "Dernieres 24 heures";
    case "week":
      return "7 derniers jours";
    case "month":
      return "30 derniers jours";
    case "year":
      return "12 derniers mois";
    default:
      return "Periode personnalisee";
  }
}

function generatePrintableHTML(data: {
  metadata: {
    title: string;
    generatedAt: string;
    period: { start: string; end: string; label: string };
  };
  summary: {
    totalVisits: number;
    uniqueSessions: number;
    averageTimeOnSite: number;
    conversionRate: number;
    comparison: {
      totalVisitsChange: number;
      uniqueSessionsChange: number;
      averageTimeOnSiteChange: number;
      conversionRateChange: number;
    };
  } | null;
  conversions: {
    byType: Record<string, { clicks: number; completed: number; rate: number }>;
    topSections: Array<{ section: string; avgTime: number; visits: number }>;
  } | null;
  traffic: {
    sources: Array<{ source: string; medium: string; visits: number; uniqueSessions: number; conversionRate: number }>;
  } | null;
  sections: {
    heatmap: Array<{ section: string; visitors: number; avgTimeSeconds: number; scrollRate: number; conversionsFromSection: number }>;
  } | null;
  devices: {
    breakdown: Array<{ deviceType: string; visits: number; uniqueSessions: number; avgTimeOnSite: number }>;
  } | null;
  cohorts: {
    analysis: Array<{ cohortName: string; userCount: number; retentionDay1: number; retentionDay7: number; conversionRate: number }>;
  } | null;
  anomalies: {
    detected: Array<{ metric: string; message: string; severity: string; timestamp: string }>;
  } | null;
}): string {
  const formatNumber = (n: number) => n.toLocaleString("fr-FR");
  const formatPercent = (n: number) => `${n.toFixed(1)}%`;
  const formatTime = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  const changeIcon = (change: number) => (change >= 0 ? "+" : "");

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <title>${data.metadata.title}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #333;
          background: white;
        }
        .header {
          background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
          color: white;
          padding: 30px;
          margin-bottom: 25px;
          border-radius: 8px;
        }
        .header h1 {
          color: #D4AF37;
          font-size: 24px;
          margin-bottom: 5px;
        }
        .header .subtitle {
          color: #aaa;
          font-size: 12px;
        }
        .section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 16px;
          color: #1a1a2e;
          border-bottom: 2px solid #D4AF37;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        .kpi-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e9ecef;
        }
        .kpi-value {
          font-size: 24px;
          font-weight: bold;
          color: #1a1a2e;
        }
        .kpi-label {
          font-size: 10px;
          color: #666;
          margin-top: 5px;
        }
        .kpi-change {
          font-size: 10px;
          margin-top: 5px;
        }
        .kpi-change.positive { color: #28a745; }
        .kpi-change.negative { color: #dc3545; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 10px;
        }
        th {
          background: #1a1a2e;
          color: white;
          padding: 10px 8px;
          text-align: left;
          font-weight: 500;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #e9ecef;
        }
        tr:nth-child(even) {
          background: #f8f9fa;
        }
        .highlight {
          color: #D4AF37;
          font-weight: bold;
        }
        .alert-box {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 8px;
          padding: 15px;
        }
        .alert-item {
          padding: 8px;
          margin-bottom: 5px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #ffc107;
        }
        .alert-item.high { border-left-color: #dc3545; }
        .alert-item.medium { border-left-color: #ffc107; }
        .alert-item.low { border-left-color: #6c757d; }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #e9ecef;
          text-align: center;
          color: #888;
          font-size: 9px;
        }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .header { background: #1a1a2e !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Appréciez Votre Vie Analytics</h1>
        <div class="subtitle">
          ${data.metadata.period.label} |
          ${new Date(data.metadata.period.start).toLocaleDateString("fr-FR")} - ${new Date(data.metadata.period.end).toLocaleDateString("fr-FR")}
        </div>
      </div>

      ${data.summary ? `
      <div class="section">
        <h2 class="section-title">Resume</h2>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-value">${formatNumber(data.summary.totalVisits)}</div>
            <div class="kpi-label">Visites</div>
            <div class="kpi-change ${data.summary.comparison.totalVisitsChange >= 0 ? "positive" : "negative"}">
              ${changeIcon(data.summary.comparison.totalVisitsChange)}${formatPercent(data.summary.comparison.totalVisitsChange)}
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${formatNumber(data.summary.uniqueSessions)}</div>
            <div class="kpi-label">Sessions</div>
            <div class="kpi-change ${data.summary.comparison.uniqueSessionsChange >= 0 ? "positive" : "negative"}">
              ${changeIcon(data.summary.comparison.uniqueSessionsChange)}${formatPercent(data.summary.comparison.uniqueSessionsChange)}
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${formatTime(data.summary.averageTimeOnSite)}</div>
            <div class="kpi-label">Temps moyen</div>
            <div class="kpi-change ${data.summary.comparison.averageTimeOnSiteChange >= 0 ? "positive" : "negative"}">
              ${changeIcon(data.summary.comparison.averageTimeOnSiteChange)}${formatPercent(data.summary.comparison.averageTimeOnSiteChange)}
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value highlight">${formatPercent(data.summary.conversionRate)}</div>
            <div class="kpi-label">Taux de conversion</div>
            <div class="kpi-change ${data.summary.comparison.conversionRateChange >= 0 ? "positive" : "negative"}">
              ${changeIcon(data.summary.comparison.conversionRateChange)}${formatPercent(Math.abs(data.summary.comparison.conversionRateChange))} pts
            </div>
          </div>
        </div>
      </div>
      ` : ""}

      ${data.conversions && Object.keys(data.conversions.byType).length > 0 ? `
      <div class="section">
        <h2 class="section-title">Conversions</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Clics</th>
              <th>Completes</th>
              <th>Taux</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(data.conversions.byType).map(([type, conv]) => `
            <tr>
              <td style="text-transform: capitalize;">${type.replace(/_/g, " ")}</td>
              <td>${formatNumber(conv.clicks)}</td>
              <td>${formatNumber(conv.completed)}</td>
              <td class="highlight">${formatPercent(conv.rate)}</td>
            </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      ` : ""}

      ${data.traffic && data.traffic.sources.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Sources de Trafic</h2>
        <table>
          <thead>
            <tr>
              <th>Source / Medium</th>
              <th>Visites</th>
              <th>Sessions</th>
              <th>Conv. Rate</th>
            </tr>
          </thead>
          <tbody>
            ${data.traffic.sources.map((source) => `
            <tr>
              <td><strong>${source.source}</strong> / ${source.medium}</td>
              <td>${formatNumber(source.visits)}</td>
              <td>${formatNumber(source.uniqueSessions)}</td>
              <td>${formatPercent(source.conversionRate)}</td>
            </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      ` : ""}

      ${data.sections && data.sections.heatmap.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Performance des Sections</h2>
        <table>
          <thead>
            <tr>
              <th>Section</th>
              <th>Visiteurs</th>
              <th>Temps moy.</th>
              <th>Scroll Rate</th>
              <th>Conversions</th>
            </tr>
          </thead>
          <tbody>
            ${data.sections.heatmap.map((section) => `
            <tr>
              <td>${section.section}</td>
              <td>${formatNumber(section.visitors)}</td>
              <td>${section.avgTimeSeconds}s</td>
              <td>${formatPercent(section.scrollRate)}</td>
              <td class="highlight">${formatNumber(section.conversionsFromSection)}</td>
            </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      ` : ""}

      ${data.devices && data.devices.breakdown.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Repartition par Appareil</h2>
        <table>
          <thead>
            <tr>
              <th>Appareil</th>
              <th>Visites</th>
              <th>Sessions</th>
              <th>Temps moyen</th>
            </tr>
          </thead>
          <tbody>
            ${data.devices.breakdown.map((device) => `
            <tr>
              <td style="text-transform: capitalize;">${device.deviceType}</td>
              <td>${formatNumber(device.visits)}</td>
              <td>${formatNumber(device.uniqueSessions)}</td>
              <td>${formatTime(device.avgTimeOnSite)}</td>
            </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      ` : ""}

      ${data.anomalies && data.anomalies.detected.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Anomalies Detectees</h2>
        <div class="alert-box">
          ${data.anomalies.detected.map((anomaly) => `
          <div class="alert-item ${anomaly.severity}">
            <strong>${anomaly.metric}</strong>: ${anomaly.message}
            <span style="color: #666; font-size: 9px; margin-left: 10px;">${new Date(anomaly.timestamp).toLocaleDateString("fr-FR")}</span>
          </div>
          `).join("")}
        </div>
      </div>
      ` : ""}

      <div class="footer">
        Rapport genere le ${new Date(data.metadata.generatedAt).toLocaleString("fr-FR")} | Appréciez Votre Vie Analytics
      </div>

      <script>
        // Auto-print when loaded
        window.onload = function() {
          if (window.location.search.includes('print=true')) {
            window.print();
          }
        };
      </script>
    </body>
    </html>
  `;
}
