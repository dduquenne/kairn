/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * Cron Process Reports API Route
 *
 * Traite tous les rapports programmés (daily, weekly, monthly) dont
 * l'heure d'envoi est arrivée.
 *
 * Cet endpoint unifié remplace les appels séparés à daily-report,
 * weekly-report en vérifiant tous les rapports programmés.
 *
 * Fonctionnalités:
 * - Traite tous les types de rapports (daily, weekly, monthly)
 * - Vérifie nextScheduled pour décider si envoi nécessaire
 * - Met à jour nextScheduled après envoi
 * - Gestion robuste des erreurs par rapport
 *
 * Fréquence recommandée: toutes les heures à :45 (45 * * * *)
 *
 * Security: QStash signature or CRON_SECRET
 */

import { verifyCronAuth } from "@kairn/core/scheduler";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

import {
  getAnalyticsSummary,
  getAnalyticsSummaryWithComparison,
  getTrafficSources,
  getDeviceBreakdown,
  getSectionHeatmap,
  getAnomalies,
} from "../../analytics/store-index";

interface ReportResult {
  reportId: string;
  reportName: string;
  frequency: string;
  sent: boolean;
  recipients: number;
  error?: string;
}

export async function GET(request: NextRequest) {
  // Verify authentication (QStash signature or CRON_SECRET)
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const now = new Date();
  const results: ReportResult[] = [];

  try {
    // 1. Récupérer tous les rapports programmés actifs dont nextScheduled est passé
    const reports = await prisma.scheduledReport.findMany({
      where: {
        enabled: true,
        nextScheduled: {
          lte: now,
        },
      },
    });

    console.log(`[Cron:process-reports] ${reports.length} rapport(s) à envoyer`);

    if (reports.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun rapport à envoyer",
        processed: 0,
        results: [],
      });
    }

    // 2. Traiter chaque rapport
    for (const report of reports) {
      try {
        // Calculer la période du rapport
        const { startDate, endDate, periodLabel } = calculateReportPeriod(report.frequency);

        // Générer les données du rapport
        const reportData = await generateReportData(startDate, endDate);

        // Filtrer les sections selon la configuration
        const filteredData = filterReportSections(reportData, report.sections);

        // Générer l'email HTML
        const emailHtml = generateReportEmailHtml(
          report.name,
          filteredData,
          new Date(startDate),
          periodLabel,
          report.frequency
        );

        // Envoyer l'email
        await sendReportEmail(
          report.recipients,
          `Rapport ${periodLabel} - ${new Date(startDate).toLocaleDateString("fr-FR")}`,
          emailHtml
        );

        // Calculer la prochaine date d'envoi
        const nextScheduled = calculateNextScheduled(report);

        // Mettre à jour le rapport
        await prisma.scheduledReport.update({
          where: { id: report.id },
          data: {
            lastSent: now,
            nextScheduled,
          },
        });

        results.push({
          reportId: report.id,
          reportName: report.name,
          frequency: report.frequency,
          sent: true,
          recipients: report.recipients.length,
        });

        console.log(`[Cron:process-reports] Rapport "${report.name}" envoyé à ${report.recipients.length} destinataire(s)`);
      } catch (error) {
        console.error(`[Cron:process-reports] Erreur rapport "${report.name}":`, error);
        results.push({
          reportId: report.id,
          reportName: report.name,
          frequency: report.frequency,
          sent: false,
          recipients: 0,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const sentCount = results.filter((r) => r.sent).length;

    return NextResponse.json({
      success: true,
      message: `${sentCount}/${reports.length} rapport(s) envoyé(s)`,
      duration: `${duration}s`,
      processed: reports.length,
      results,
    });
  } catch (error) {
    console.error("[Cron:process-reports] Erreur:", error);
    return NextResponse.json(
      {
        error: "Report processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Calcule la période du rapport selon sa fréquence
 */
function calculateReportPeriod(frequency: string): {
  startDate: string;
  endDate: string;
  periodLabel: string;
} {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(0, 0, 0, 0);

  let startDate: Date;
  let periodLabel: string;

  switch (frequency) {
    case "daily":
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 1);
      periodLabel = "quotidien";
      break;

    case "weekly":
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);
      periodLabel = "hebdomadaire";
      break;

    case "monthly":
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);
      periodLabel = "mensuel";
      break;

    default:
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 1);
      periodLabel = "quotidien";
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    periodLabel,
  };
}

/**
 * Calcule la prochaine date d'envoi d'un rapport
 */
function calculateNextScheduled(report: {
  frequency: string;
  timeOfDay: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
}): Date {
  const [hours, minutes] = report.timeOfDay.split(":").map(Number);
  const next = new Date();

  next.setHours(hours, minutes, 0, 0);

  switch (report.frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;

    case "weekly":
      const targetDay = report.dayOfWeek || 1; // Lundi par défaut
      const currentDay = next.getDay();
      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget <= 0) daysUntilTarget += 7;
      next.setDate(next.getDate() + daysUntilTarget);
      break;

    case "monthly":
      const targetDate = report.dayOfMonth || 1;
      next.setMonth(next.getMonth() + 1);
      next.setDate(Math.min(targetDate, getDaysInMonth(next.getFullYear(), next.getMonth())));
      break;
  }

  return next;
}

/**
 * Retourne le nombre de jours dans un mois
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Génère les données du rapport
 */
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
    trafficSources: trafficSources.slice(0, 10),
    devices,
    sections: heatmap.slice(0, 10),
    anomalies: anomalies.filter((a) => !a.acknowledged).slice(0, 10),
  };
}

/**
 * Filtre les sections du rapport
 */
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
  if (sections.includes("insights") || sections.includes("cohorts")) {
    filtered.anomalies = data.anomalies;
  }

  return filtered as typeof data;
}

/**
 * Génère l'email HTML du rapport
 */
function generateReportEmailHtml(
  reportName: string,
  data: Awaited<ReturnType<typeof generateReportData>>,
  date: Date,
  periodLabel: string,
  frequency: string
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

  const frequencyEmoji = frequency === "daily" ? "📊" : frequency === "weekly" ? "📈" : "📉";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1a1a2e; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #D4AF37; margin: 0; font-size: 24px;">${frequencyEmoji} Psypnos Analytics</h1>
        <p style="color: #fff; margin: 10px 0 0 0; font-size: 14px;">Rapport ${periodLabel} - ${date.toLocaleDateString("fr-FR")}</p>
        <p style="color: #aaa; margin: 5px 0 0 0; font-size: 12px;">${reportName}</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px;">
        ${data.summary ? `
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">📌 Résumé</h2>
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
              <div style="color: #666; font-size: 12px;">Conversions</div>
            </td>
          </tr>
        </table>
        ` : ""}

        ${data.trafficSources && data.trafficSources.length > 0 ? `
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">🌐 Sources de Trafic</h2>
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

        ${data.devices && data.devices.length > 0 ? `
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">📱 Appareils</h2>
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

        ${data.anomalies && data.anomalies.length > 0 ? `
        <h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">⚠️ Alertes</h2>
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
          ${data.anomalies.map((anomaly) => `
          <div style="margin-bottom: 10px;">
            <span style="display: inline-block; padding: 2px 8px; background: ${anomaly.severity === "high" ? "#dc3545" : anomaly.severity === "medium" ? "#ffc107" : "#6c757d"}; color: white; border-radius: 4px; font-size: 11px; margin-right: 8px;">${anomaly.severity.toUpperCase()}</span>
            ${anomaly.message}
          </div>
          `).join("")}
        </div>
        ` : ""}

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://psypnos.fr"}/admin/analytics"
             style="display: inline-block; padding: 12px 30px; background-color: #D4AF37; color: #1a1a2e; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Voir le Dashboard
          </a>
          <p style="color: #888; font-size: 12px; margin-top: 20px;">
            Ce rapport est généré automatiquement par Psypnos Analytics.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envoie l'email du rapport
 */
async function sendReportEmail(
  recipients: string[],
  subject: string,
  html: string
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY non configuré");
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
