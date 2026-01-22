// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * PostgreSQL Alert Operations
 */

import { prisma } from "@/lib/db/prisma";
import type { Alert, AlertHistory } from "../store/types";

// Database record types (for when Prisma client isn't properly generated)
interface AlertRecord {
  id: string;
  name: string;
  description: string | null;
  type: string;
  metric: string;
  condition: string;
  threshold: number;
  timeWindow: string;
  channels: unknown;
  emailRecipients: string[];
  webhookUrl: string | null;
  enabled: boolean;
  lastTriggered: Date | null;
  lastValue: number | null;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AlertHistoryRecord {
  id: string;
  alertId: string;
  alertName: string;
  triggeredAt: Date;
  metric: string;
  condition: string;
  threshold: number;
  actualValue: number;
  message: string;
  notificationsSent: unknown;
}

function toAlert(a: AlertRecord): Alert {
  return {
    id: a.id,
    name: a.name,
    description: a.description ?? undefined,
    type: a.type as "threshold" | "anomaly" | "trend",
    metric: a.metric as "visits" | "sessions" | "conversions" | "conversion_rate" | "avg_time" | "bounce_rate",
    condition: a.condition as "greater_than" | "less_than" | "equals" | "change_percent",
    threshold: a.threshold,
    timeWindow: a.timeWindow as "hour" | "day" | "week" | "month",
    channels: a.channels as Array<"email" | "webhook">,
    emailRecipients: a.emailRecipients,
    webhookUrl: a.webhookUrl ?? undefined,
    enabled: a.enabled,
    lastTriggered: a.lastTriggered?.toISOString(),
    lastValue: a.lastValue ?? undefined,
    triggerCount: a.triggerCount,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function toAlertHistory(h: AlertHistoryRecord): AlertHistory {
  return {
    id: h.id,
    alertId: h.alertId,
    alertName: h.alertName,
    triggeredAt: h.triggeredAt.toISOString(),
    metric: h.metric,
    condition: h.condition,
    threshold: h.threshold,
    actualValue: h.actualValue,
    message: h.message,
    notificationsSent: h.notificationsSent as Array<{
      channel: string;
      success: boolean;
      error?: string;
    }>,
  };
}

export async function createAlert(alert: {
  name: string;
  description?: string;
  type: "threshold" | "anomaly" | "trend";
  metric: "visits" | "sessions" | "conversions" | "conversion_rate" | "avg_time" | "bounce_rate";
  condition: "greater_than" | "less_than" | "equals" | "change_percent";
  threshold: number;
  timeWindow: "hour" | "day" | "week" | "month";
  channels: Array<"email" | "webhook">;
  emailRecipients?: string[];
  webhookUrl?: string;
  enabled: boolean;
}): Promise<Alert> {
  const result = await prisma.alert.create({
    data: {
      name: alert.name,
      description: alert.description,
      type: alert.type,
      metric: alert.metric,
      condition: alert.condition,
      threshold: alert.threshold,
      timeWindow: alert.timeWindow,
      channels: alert.channels,
      emailRecipients: alert.emailRecipients ?? [],
      webhookUrl: alert.webhookUrl,
      enabled: alert.enabled,
      triggerCount: 0,
    },
  });

  return toAlert(result as AlertRecord);
}

export async function getAlerts(enabledOnly: boolean = false): Promise<Alert[]> {
  const alerts = await prisma.alert.findMany({
    where: enabledOnly ? { enabled: true } : {},
    orderBy: { createdAt: "desc" },
  });

  return (alerts as AlertRecord[]).map(toAlert);
}

export async function getAlert(id: string): Promise<Alert | undefined> {
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) return undefined;
  return toAlert(alert as AlertRecord);
}

export async function updateAlert(
  id: string,
  updates: Partial<{
    name: string;
    description?: string;
    type: "threshold" | "anomaly" | "trend";
    metric: "visits" | "sessions" | "conversions" | "conversion_rate" | "avg_time" | "bounce_rate";
    condition: "greater_than" | "less_than" | "equals" | "change_percent";
    threshold: number;
    timeWindow: "hour" | "day" | "week" | "month";
    channels: Array<"email" | "webhook">;
    emailRecipients?: string[];
    webhookUrl?: string;
    enabled: boolean;
    lastTriggered?: string;
    lastValue?: number;
    triggerCount?: number;
  }>,
): Promise<Alert | null> {
  try {
    const { lastTriggered, ...rest } = updates;
    const data = {
      ...rest,
      ...(lastTriggered && { lastTriggered: new Date(lastTriggered) }),
    };

    const result = await prisma.alert.update({
      where: { id },
      data,
    });

    return toAlert(result as AlertRecord);
  } catch {
    return null;
  }
}

export async function deleteAlert(id: string): Promise<boolean> {
  try {
    await prisma.alert.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function addAlertHistory(history: {
  alertId: string;
  alertName: string;
  triggeredAt: string;
  metric: string;
  condition: string;
  threshold: number;
  actualValue: number;
  message: string;
  notificationsSent: Array<{ channel: string; success: boolean; error?: string }>;
}): Promise<AlertHistory> {
  const result = await prisma.alertHistory.create({
    data: {
      alertId: history.alertId,
      alertName: history.alertName,
      triggeredAt: new Date(history.triggeredAt),
      metric: history.metric,
      condition: history.condition,
      threshold: history.threshold,
      actualValue: history.actualValue,
      message: history.message,
      notificationsSent: history.notificationsSent,
    },
  });

  return toAlertHistory(result as AlertHistoryRecord);
}

export async function getAlertHistory(alertId?: string, limit: number = 50): Promise<AlertHistory[]> {
  const history = await prisma.alertHistory.findMany({
    where: alertId ? { alertId } : {},
    orderBy: { triggeredAt: "desc" },
    take: limit,
  });

  return (history as AlertHistoryRecord[]).map(toAlertHistory);
}
