/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { verifyCronAuth } from "@kairn/core/scheduler";
import { NextRequest, NextResponse } from "next/server";

import {
  getAlerts,
  getMetricValue,
  evaluateAlertCondition,
  updateAlert,
  addAlertHistory,
  type Alert,
  type AlertHistory,
} from "../../analytics/store-index";

export const dynamic = "force-dynamic";

// GET - Check all enabled alerts (called by QStash)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication (QStash signature or CRON_SECRET)
    const authResult = await verifyCronAuth(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: "Non autorise" },
        { status: 401 }
      );
    }

    const alerts = await getAlerts(true); // Get only enabled alerts
    const results: Array<{
      alertId: string;
      alertName: string;
      triggered: boolean;
      value?: number;
      threshold?: number;
      error?: string;
    }> = [];

    for (const alert of alerts) {
      try {
        // Get current metric value
        const currentValue = await getMetricValue(alert.metric, alert.timeWindow);

        // Evaluate condition - convert null to undefined for lastValue
        const triggered = await evaluateAlertCondition(
          currentValue,
          alert.threshold,
          alert.condition,
          alert.lastValue ?? undefined
        );

        if (triggered) {
          // Normalize alert for notifications (convert null to undefined)
          const normalizedAlert: Alert = {
            ...alert,
            description: alert.description ?? undefined,
            lastTriggered: alert.lastTriggered ?? undefined,
            lastValue: alert.lastValue ?? undefined,
            emailRecipients: alert.emailRecipients ?? undefined,
            webhookUrl: alert.webhookUrl ?? undefined,
          };

          // Send notifications
          const notificationResults = await sendAlertNotifications(normalizedAlert, currentValue);

          // Record in history
          const historyEntry: Omit<AlertHistory, "id"> = {
            alertId: normalizedAlert.id,
            alertName: normalizedAlert.name,
            triggeredAt: new Date().toISOString(),
            metric: normalizedAlert.metric,
            condition: normalizedAlert.condition,
            threshold: normalizedAlert.threshold,
            actualValue: currentValue,
            message: generateAlertMessage(normalizedAlert, currentValue),
            notificationsSent: notificationResults,
          };

          await addAlertHistory(historyEntry);

          // Update alert with trigger info
          await updateAlert(normalizedAlert.id, {
            lastTriggered: new Date().toISOString(),
            lastValue: currentValue,
            triggerCount: normalizedAlert.triggerCount + 1,
          });
        } else {
          // Update last value even if not triggered
          await updateAlert(alert.id, {
            lastValue: currentValue,
          });
        }

        results.push({
          alertId: alert.id,
          alertName: alert.name,
          triggered,
          value: currentValue,
          threshold: alert.threshold,
        });
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
        results.push({
          alertId: alert.id,
          alertName: alert.name,
          triggered: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    const triggeredCount = results.filter((r) => r.triggered).length;

    return NextResponse.json({
      checked: alerts.length,
      triggered: triggeredCount,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking alerts:", error);
    return NextResponse.json(
      { error: "Erreur lors de la verification des alertes" },
      { status: 500 }
    );
  }
}

// Generate alert message
function generateAlertMessage(alert: Alert, currentValue: number): string {
  const metricLabels: Record<string, string> = {
    visits: "visites",
    sessions: "sessions",
    conversions: "conversions",
    conversion_rate: "taux de conversion",
    avg_time: "temps moyen (secondes)",
    bounce_rate: "taux de rebond",
  };

  const conditionLabels: Record<string, string> = {
    greater_than: "superieur a",
    less_than: "inferieur a",
    equals: "egal a",
    change_percent: "varie de plus de",
  };

  const timeWindowLabels: Record<string, string> = {
    hour: "derniere heure",
    day: "dernieres 24h",
    week: "derniere semaine",
    month: "dernier mois",
  };

  const metric = metricLabels[alert.metric] || alert.metric;
  const condition = conditionLabels[alert.condition] || alert.condition;
  const timeWindow = timeWindowLabels[alert.timeWindow] || alert.timeWindow;

  let thresholdDisplay = alert.threshold.toString();
  if (alert.condition === "change_percent") {
    thresholdDisplay = `${alert.threshold}%`;
  } else if (alert.metric === "conversion_rate" || alert.metric === "bounce_rate") {
    thresholdDisplay = `${alert.threshold}%`;
  }

  return `Alerte "${alert.name}": ${metric} (${timeWindow}) est ${condition} ${thresholdDisplay}. Valeur actuelle: ${currentValue.toFixed(2)}`;
}

// Send notifications via configured channels
async function sendAlertNotifications(
  alert: Alert,
  currentValue: number
): Promise<Array<{ channel: string; success: boolean; error?: string }>> {
  const results: Array<{ channel: string; success: boolean; error?: string }> = [];
  const message = generateAlertMessage(alert, currentValue);

  for (const channel of alert.channels) {
    try {
      switch (channel) {
        case "email":
          if (alert.emailRecipients && alert.emailRecipients.length > 0) {
            await sendEmailNotification(alert.emailRecipients, alert.name, message);
            results.push({ channel: "email", success: true });
          } else {
            results.push({ channel: "email", success: false, error: "Pas de destinataires" });
          }
          break;

        case "webhook":
          if (alert.webhookUrl) {
            await sendWebhookNotification(alert.webhookUrl, alert, currentValue, message);
            results.push({ channel: "webhook", success: true });
          } else {
            results.push({ channel: "webhook", success: false, error: "Pas d'URL webhook" });
          }
          break;

        default:
          results.push({ channel, success: false, error: "Canal non supporte" });
      }
    } catch (error) {
      results.push({
        channel,
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  return results;
}

// Send email notification
async function sendEmailNotification(
  recipients: string[],
  alertName: string,
  message: string
): Promise<void> {
  // Check if Resend API key is configured
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured, skipping email notification");
    throw new Error("Service email non configure");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.ALERT_EMAIL_FROM || "Psypnos Analytics <analytics@psypnos.fr>",
      to: recipients,
      subject: `[Alerte] ${alertName} - Psypnos Analytics`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
            <h1 style="color: #D4AF37; margin: 0;">Psypnos Analytics</h1>
          </div>
          <div style="padding: 20px; background-color: #f5f5f5;">
            <h2 style="color: #d9534f;">Alerte Declenchee</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">${message}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">
              Date: ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}
            </p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://psypnos.fr"}/admin/analytics"
               style="display: inline-block; padding: 10px 20px; background-color: #D4AF37; color: #1a1a2e; text-decoration: none; border-radius: 5px; margin-top: 15px;">
              Voir le Dashboard
            </a>
          </div>
          <div style="padding: 15px; background-color: #1a1a2e; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Cet email a ete envoye automatiquement par Psypnos Analytics
            </p>
          </div>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur envoi email: ${error}`);
  }
}

// Send webhook notification
async function sendWebhookNotification(
  webhookUrl: string,
  alert: Alert,
  currentValue: number,
  message: string
): Promise<void> {
  const payload = {
    type: "alert_triggered",
    alert: {
      id: alert.id,
      name: alert.name,
      description: alert.description,
      metric: alert.metric,
      condition: alert.condition,
      threshold: alert.threshold,
      timeWindow: alert.timeWindow,
    },
    data: {
      currentValue,
      message,
      triggeredAt: new Date().toISOString(),
    },
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}`);
  }
}
