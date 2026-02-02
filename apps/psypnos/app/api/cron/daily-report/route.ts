// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";
import {
  getAnalyticsSummary,
  getAnalyticsSummaryWithComparison,
  getTrafficSources,
  getDeviceBreakdown,
  getSectionHeatmap,
  getAnomalies,
  getScheduledReports,
  updateScheduledReport,
} from "../../analytics/store-index";
import { verifyCronAuth } from "@kairn/core/scheduler";

export const dynamic = "force-dynamic";

// GET - Generate and send daily reports (called by QStash)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication (QStash signature or CRON_SECRET)
    const authResult = await verifyCronAuth(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Get scheduled reports that need to run
    const reports = await getScheduledReports(true);
    const now = new Date();
    const dailyReports = reports.filter((r) => {
      if (r.frequency !== "daily") return false;
      if (!r.nextScheduled) return true;
      return new Date(r.nextScheduled) <= now;
    });

    const results: Array<{
      reportId: string;
      reportName: string;
      sent: boolean;
      recipients: number;
      error?: string;
    }> = [];

    // Generate report data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reportData = await generateReportData(
      yesterday.toISOString(),
      today.toISOString()
    );

    for (const report of dailyReports) {
      try {
        // Filter sections based on report config
        const filteredData = filterReportSections(reportData, report.sections);

        // Generate HTML email
        const emailHtml = generateReportEmailHtml(
          report.name,
          filteredData,
          yesterday,
          "quotidien"
        );

        // Send email
        await sendReportEmail(
          report.recipients,
          `Rapport Quotidien - ${yesterday.toLocaleDateString("fr-FR")}`,
          emailHtml
        );

        // Update next scheduled time
        const nextScheduled = new Date();
        nextScheduled.setDate(nextScheduled.getDate() + 1);
        const [hours, minutes] = report.timeOfDay.split(":").map(Number);
        nextScheduled.setHours(hours, minutes, 0, 0);

        await updateScheduledReport(report.id, {
          lastSent: now.toISOString(),
          nextScheduled: nextScheduled.toISOString(),
        });

        results.push({
          reportId: report.id,
          reportName: report.name,
          sent: true,
          recipients: report.recipients.length,
        });
      } catch (error) {
        console.error(`Error sending report ${report.id}:`, error);
        results.push({
          reportId: report.id,
          reportName: report.name,
          sent: false,
          recipients: 0,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    return NextResponse.json({
      processed: dailyReports.length,
      sent: results.filter((r) => r.sent).length,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error generating daily reports:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation des rapports" },
      { status: 500 }
    );
  }
}

// Generate report data
async function generateReportData(startDate: string, endDate: string) {
  const [summary, comparison, trafficSources, devices, heatmap, anomalies] = await Promise.all([
    getAnalyticsSummary(startDate, endDate),
    getAnalyticsSummaryWithComparison("day"),
    getTrafficSources(startDate, endDate),
    getDeviceBreakdown(startDate, endDate),
    getSectionHeatmap(startDate, endDate),
    getAnomalies(startDate, endDate),
  ]);

  return {
    summary,
    comparison,
    trafficSources: trafficSources.slice(0, 5),
    devices,
    sections: heatmap.slice(0, 5),
    anomalies: anomalies.filter((a) => !a.acknowledged).slice(0, 5),
  };
}

// Filter sections based on report configuration
function filterReportSections(
  data: Awaited<ReturnType<typeof generateReportData>>,
  sections: string[]
) {
  const filtered: Partial<typeof data> = {};

  if (sections.includes("summary")) {
    filtered.summary = data.summary;
    filtered.comparison = data.comparison;
  }
  if (sections.includes("traffic")) {
    filtered.trafficSources = data.trafficSources;
  }
  if (sections.includes("devices")) {
    filtered.devices = data.devices;
  }
  if (sections.includes("sections")) {
    filtered.sections = data.sections;
  }
  if (sections.includes("conversions")) {
    // Already included in summary.conversionByType
  }

  return filtered as typeof data;
}

// Generate HTML email
function generateReportEmailHtml(
  reportName: string,
  data: Awaited<ReturnType<typeof generateReportData>>,
  date: Date,
  periodLabel: string
): string {
  const formatNumber = (n: number) => n.toLocaleString("fr-FR");
  const formatPercent = (n: number) => `${n.toFixed(1)}%`;
  const formatTime = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const changeArrow = (change: number) => (change >= 0 ? "↑" : "↓");
  const changeColor = (change: number) => (change >= 0 ? "#28a745" : "#dc3545");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1a1a2e; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #D4AF37; margin: 0; font-size: 24px;">Psypnos Analytics</h1>
        <p style="color: #fff; margin: 10px 0 0 0; font-size: 14px;">Rapport ${periodLabel} - ${date.toLocaleDateString("fr-FR")}</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px;">
        <!-- Summary Section -->
        ${data.summary ? `
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Resume</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="padding: 15px; background: white; border-radius: 8px; text-align: center; width: 25%;">
              <div style="font-size: 28px; font-weight: bold; color: #1a1a2e;">${formatNumber(data.summary.totalVisits)}</div>
              <div style="color: #666; font-size: 12px;">Visites</div>
              ${data.comparison ? `<div style="color: ${changeColor(data.comparison.comparison.totalVisitsChange)}; font-size: 12px;">${changeArrow(data.comparison.comparison.totalVisitsChange)} ${formatPercent(Math.abs(data.comparison.comparison.totalVisitsChange))}</div>` : ""}
            </td>
            <td style="width: 2%;"></td>
            <td style="padding: 15px; background: white; border-radius: 8px; text-align: center; width: 25%;">
              <div style="font-size: 28px; font-weight: bold; color: #1a1a2e;">${formatNumber(data.summary.uniqueSessions)}</div>
              <div style="color: #666; font-size: 12px;">Sessions</div>
              ${data.comparison ? `<div style="color: ${changeColor(data.comparison.comparison.uniqueSessionsChange)}; font-size: 12px;">${changeArrow(data.comparison.comparison.uniqueSessionsChange)} ${formatPercent(Math.abs(data.comparison.comparison.uniqueSessionsChange))}</div>` : ""}
            </td>
            <td style="width: 2%;"></td>
            <td style="padding: 15px; background: white; border-radius: 8px; text-align: center; width: 25%;">
              <div style="font-size: 28px; font-weight: bold; color: #1a1a2e;">${formatTime(data.summary.averageTimeOnSite)}</div>
              <div style="color: #666; font-size: 12px;">Temps moyen</div>
            </td>
            <td style="width: 2%;"></td>
            <td style="padding: 15px; background: white; border-radius: 8px; text-align: center; width: 25%;">
              <div style="font-size: 28px; font-weight: bold; color: #D4AF37;">${formatPercent(data.summary.conversionRate)}</div>
              <div style="color: #666; font-size: 12px;">Taux conversion</div>
            </td>
          </tr>
        </table>
        ` : ""}

        <!-- Conversions Section -->
        ${data.summary && Object.keys(data.summary.conversionByType).length > 0 ? `
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Conversions</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background: white; border-radius: 8px;">
          <thead>
            <tr style="background: #1a1a2e; color: white;">
              <th style="padding: 12px; text-align: left; border-radius: 8px 0 0 0;">Type</th>
              <th style="padding: 12px; text-align: center;">Clics</th>
              <th style="padding: 12px; text-align: center;">Completes</th>
              <th style="padding: 12px; text-align: center; border-radius: 0 8px 0 0;">Taux</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(data.summary.conversionByType).map(([type, conv]) => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${type.replace(/_/g, " ")}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${formatNumber(conv.clicks)}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${formatNumber(conv.completed)}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee; color: #D4AF37; font-weight: bold;">${formatPercent(conv.rate)}</td>
            </tr>
            `).join("")}
          </tbody>
        </table>
        ` : ""}

        <!-- Traffic Sources Section -->
        ${data.trafficSources && data.trafficSources.length > 0 ? `
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Top Sources de Trafic</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background: white; border-radius: 8px;">
          <thead>
            <tr style="background: #1a1a2e; color: white;">
              <th style="padding: 12px; text-align: left; border-radius: 8px 0 0 0;">Source / Medium</th>
              <th style="padding: 12px; text-align: center;">Visites</th>
              <th style="padding: 12px; text-align: center; border-radius: 0 8px 0 0;">Conv. Rate</th>
            </tr>
          </thead>
          <tbody>
            ${data.trafficSources.map((source) => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${source.source} / ${source.medium}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${formatNumber(source.visits)}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${formatPercent(source.conversionRate)}</td>
            </tr>
            `).join("")}
          </tbody>
        </table>
        ` : ""}

        <!-- Devices Section -->
        ${data.devices && data.devices.length > 0 ? `
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Repartition par Appareil</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background: white; border-radius: 8px;">
          <thead>
            <tr style="background: #1a1a2e; color: white;">
              <th style="padding: 12px; text-align: left; border-radius: 8px 0 0 0;">Appareil</th>
              <th style="padding: 12px; text-align: center;">Visites</th>
              <th style="padding: 12px; text-align: center; border-radius: 0 8px 0 0;">Temps moyen</th>
            </tr>
          </thead>
          <tbody>
            ${data.devices.map((device) => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-transform: capitalize;">${device.deviceType}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${formatNumber(device.visits)}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${formatTime(device.avgTimeOnSite)}</td>
            </tr>
            `).join("")}
          </tbody>
        </table>
        ` : ""}

        <!-- Anomalies Section -->
        ${data.anomalies && data.anomalies.length > 0 ? `
        <h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">Anomalies Detectees</h2>
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
          ${data.anomalies.map((anomaly) => `
          <div style="margin-bottom: 10px;">
            <span style="display: inline-block; padding: 2px 8px; background: ${anomaly.severity === "high" ? "#dc3545" : anomaly.severity === "medium" ? "#ffc107" : "#6c757d"}; color: white; border-radius: 4px; font-size: 11px; margin-right: 8px;">${anomaly.severity.toUpperCase()}</span>
            ${anomaly.message}
          </div>
          `).join("")}
        </div>
        ` : ""}

        <!-- Footer -->
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://psypnos.fr"}/admin/analytics"
             style="display: inline-block; padding: 12px 30px; background-color: #D4AF37; color: #1a1a2e; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Voir le Dashboard Complet
          </a>
          <p style="color: #888; font-size: 12px; margin-top: 20px;">
            Ce rapport a ete genere automatiquement par Psypnos Analytics.<br>
            Pour modifier vos preferences de rapport, visitez les parametres du dashboard.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send report email
async function sendReportEmail(
  recipients: string[],
  subject: string,
  html: string
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured, skipping report email");
    throw new Error("Service email non configure");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.REPORT_EMAIL_FROM || "Psypnos Analytics <analytics@psypnos.fr>",
      to: recipients,
      subject: `[Psypnos] ${subject}`,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur envoi email: ${error}`);
  }
}
