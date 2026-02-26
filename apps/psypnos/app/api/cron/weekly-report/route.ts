/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { verifyCronAuth } from '@kairn/core/scheduler';
import { NextRequest, NextResponse } from 'next/server';

import {
  getAnalyticsSummary,
  getAnalyticsSummaryWithComparison,
  getTrafficSources,
  getDeviceBreakdown,
  getSectionHeatmap,
  getCohortAnalysis,
  getAnomalies,
  getScheduledReports,
  updateScheduledReport,
} from '../../analytics/store-index';

export const dynamic = 'force-dynamic';

// Accepter aussi POST car QStash envoie POST par défaut
export { GET as POST };

// GET - Generate and send weekly reports (called by QStash)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication (QStash signature or CRON_SECRET)
    const authResult = await verifyCronAuth(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Get scheduled reports that need to run
    const reports = await getScheduledReports(true);
    const now = new Date();
    const weeklyReports = reports.filter(r => {
      if (r.frequency !== 'weekly') return false;
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

    // Generate report data for the past week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reportData = await generateWeeklyReportData(weekAgo.toISOString(), today.toISOString());

    for (const report of weeklyReports) {
      try {
        // Generate HTML email
        const emailHtml = generateWeeklyReportEmailHtml(report.name, reportData, weekAgo, today);

        // Send email
        await sendReportEmail(
          report.recipients,
          `Rapport Hebdomadaire - Semaine du ${weekAgo.toLocaleDateString('fr-FR')}`,
          emailHtml
        );

        // Update next scheduled time (next week, same day)
        const nextScheduled = new Date();
        nextScheduled.setDate(nextScheduled.getDate() + 7);
        const [hours, minutes] = report.timeOfDay.split(':').map(Number);
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
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return NextResponse.json({
      processed: weeklyReports.length,
      sent: results.filter(r => r.sent).length,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Error generating weekly reports:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la generation des rapports' },
      { status: 500 }
    );
  }
}

// Generate weekly report data
async function generateWeeklyReportData(startDate: string, endDate: string) {
  const [summary, comparison, trafficSources, devices, heatmap, cohorts, anomalies] =
    await Promise.all([
      getAnalyticsSummary(startDate, endDate),
      getAnalyticsSummaryWithComparison('week'),
      getTrafficSources(startDate, endDate),
      getDeviceBreakdown(startDate, endDate),
      getSectionHeatmap(startDate, endDate),
      getCohortAnalysis('week', startDate, endDate),
      getAnomalies(startDate, endDate),
    ]);

  return {
    summary,
    comparison,
    trafficSources: trafficSources.slice(0, 10),
    devices,
    sections: heatmap.slice(0, 10),
    cohorts: cohorts.slice(0, 5),
    anomalies: anomalies.slice(0, 10),
  };
}

// Generate HTML email for weekly report
function generateWeeklyReportEmailHtml(
  reportName: string,
  data: Awaited<ReturnType<typeof generateWeeklyReportData>>,
  startDate: Date,
  endDate: Date
): string {
  const formatNumber = (n: number) => n.toLocaleString('fr-FR');
  const formatPercent = (n: number) => `${n.toFixed(1)}%`;
  const formatTime = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const changeArrow = (change: number) => (change >= 0 ? '↑' : '↓');
  const changeColor = (change: number) => (change >= 0 ? '#28a745' : '#dc3545');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">Psypnos Analytics</h1>
        <p style="color: #fff; margin: 10px 0 0 0; font-size: 16px;">Rapport Hebdomadaire</p>
        <p style="color: #aaa; margin: 5px 0 0 0; font-size: 14px;">
          ${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}
        </p>
      </div>

      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px;">

        <!-- Executive Summary -->
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1a1a2e; margin-top: 0;">Resume Executif</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 20px; text-align: center; width: 25%;">
                <div style="font-size: 36px; font-weight: bold; color: #1a1a2e;">${formatNumber(data.summary.totalVisits)}</div>
                <div style="color: #666; font-size: 14px;">Visites</div>
                <div style="color: ${changeColor(data.comparison.comparison.totalVisitsChange)}; font-size: 14px; font-weight: bold;">
                  ${changeArrow(data.comparison.comparison.totalVisitsChange)} ${formatPercent(Math.abs(data.comparison.comparison.totalVisitsChange))}
                </div>
              </td>
              <td style="padding: 20px; text-align: center; width: 25%;">
                <div style="font-size: 36px; font-weight: bold; color: #1a1a2e;">${formatNumber(data.summary.uniqueSessions)}</div>
                <div style="color: #666; font-size: 14px;">Sessions</div>
                <div style="color: ${changeColor(data.comparison.comparison.uniqueSessionsChange)}; font-size: 14px; font-weight: bold;">
                  ${changeArrow(data.comparison.comparison.uniqueSessionsChange)} ${formatPercent(Math.abs(data.comparison.comparison.uniqueSessionsChange))}
                </div>
              </td>
              <td style="padding: 20px; text-align: center; width: 25%;">
                <div style="font-size: 36px; font-weight: bold; color: #1a1a2e;">${formatTime(data.summary.averageTimeOnSite)}</div>
                <div style="color: #666; font-size: 14px;">Temps moyen</div>
              </td>
              <td style="padding: 20px; text-align: center; width: 25%;">
                <div style="font-size: 36px; font-weight: bold; color: #D4AF37;">${formatPercent(data.summary.conversionRate)}</div>
                <div style="color: #666; font-size: 14px;">Conversion</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Conversions Detail -->
        ${
          Object.keys(data.summary.conversionByType).length > 0
            ? `
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1a1a2e; margin-top: 0;">Performance des Conversions</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #D4AF37;">Type</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #D4AF37;">Clics</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #D4AF37;">Completes</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #D4AF37;">Taux</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(data.summary.conversionByType)
                .map(
                  ([type, conv]) => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-transform: capitalize;">${type.replace(/_/g, ' ')}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${formatNumber(conv.clicks)}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee; font-weight: bold;">${formatNumber(conv.completed)}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee; color: #D4AF37; font-weight: bold;">${formatPercent(conv.rate)}</td>
              </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
        `
            : ''
        }

        <!-- Top Traffic Sources -->
        ${
          data.trafficSources.length > 0
            ? `
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1a1a2e; margin-top: 0;">Top 10 Sources de Trafic</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #D4AF37;">Source / Medium</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #D4AF37;">Visites</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #D4AF37;">Sessions</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #D4AF37;">Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              ${data.trafficSources
                .map(
                  (source, i) => `
              <tr style="background: ${i % 2 === 0 ? 'white' : '#f8f9fa'};">
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                  <strong>${source.source}</strong> / ${source.medium}
                </td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${formatNumber(source.visits)}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${formatNumber(source.uniqueSessions)}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee; color: ${source.conversionRate > 0 ? '#28a745' : '#666'};">${formatPercent(source.conversionRate)}</td>
              </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
        `
            : ''
        }

        <!-- Top Sections -->
        ${
          data.sections.length > 0
            ? `
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1a1a2e; margin-top: 0;">Performance des Sections</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #D4AF37;">Section</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #D4AF37;">Visiteurs</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #D4AF37;">Temps moy.</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #D4AF37;">Conversions</th>
              </tr>
            </thead>
            <tbody>
              ${data.sections
                .map(
                  section => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${section.section}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${formatNumber(section.visitors)}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${section.avgTimeSeconds}s</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee; font-weight: bold; color: #D4AF37;">${formatNumber(section.conversionsFromSection)}</td>
              </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
        `
            : ''
        }

        <!-- Device Breakdown -->
        ${
          data.devices.length > 0
            ? `
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1a1a2e; margin-top: 0;">Repartition par Appareil</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${data.devices
              .map(device => {
                const percentage =
                  data.summary.totalVisits > 0
                    ? (device.visits / data.summary.totalVisits) * 100
                    : 0;
                return `
              <tr>
                <td style="padding: 15px 12px; border-bottom: 1px solid #eee; width: 120px; text-transform: capitalize; font-weight: bold;">${device.deviceType}</td>
                <td style="padding: 15px 12px; border-bottom: 1px solid #eee;">
                  <div style="background: #e9ecef; border-radius: 10px; height: 20px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #D4AF37, #f0d78c); height: 100%; width: ${percentage}%; border-radius: 10px;"></div>
                  </div>
                </td>
                <td style="padding: 15px 12px; border-bottom: 1px solid #eee; width: 100px; text-align: right;">
                  ${formatNumber(device.visits)} (${formatPercent(percentage)})
                </td>
              </tr>
              `;
              })
              .join('')}
          </table>
        </div>
        `
            : ''
        }

        <!-- Anomalies Alert -->
        ${
          data.anomalies.length > 0
            ? `
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
          <h2 style="color: #856404; margin-top: 0;">⚠️ ${data.anomalies.length} Anomalie(s) Detectee(s)</h2>
          ${data.anomalies
            .slice(0, 5)
            .map(
              anomaly => `
          <div style="background: white; padding: 12px; border-radius: 5px; margin-bottom: 10px; border-left: 4px solid ${anomaly.severity === 'high' ? '#dc3545' : anomaly.severity === 'medium' ? '#ffc107' : '#6c757d'};">
            <span style="display: inline-block; padding: 2px 8px; background: ${anomaly.severity === 'high' ? '#dc3545' : anomaly.severity === 'medium' ? '#ffc107' : '#6c757d'}; color: white; border-radius: 4px; font-size: 11px; margin-right: 8px; text-transform: uppercase;">${anomaly.severity}</span>
            <span style="color: #333;">${anomaly.message}</span>
            <div style="color: #666; font-size: 12px; margin-top: 5px;">${new Date(anomaly.timestamp).toLocaleString('fr-FR')}</div>
          </div>
          `
            )
            .join('')}
        </div>
        `
            : ''
        }

        <!-- Call to Action -->
        <div style="text-align: center; padding: 25px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://psypnos.fr'}/admin/analytics"
             style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #D4AF37, #f0d78c); color: #1a1a2e; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            Voir le Dashboard Complet
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #888; font-size: 12px;">
            Ce rapport a ete genere automatiquement par Psypnos Analytics.<br>
            Pour modifier vos preferences, visitez les parametres du dashboard.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send report email
async function sendReportEmail(recipients: string[], subject: string, html: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured, skipping report email');
    throw new Error('Service email non configure');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.REPORT_EMAIL_FROM || 'Psypnos Analytics <analytics@psypnos.fr>',
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
