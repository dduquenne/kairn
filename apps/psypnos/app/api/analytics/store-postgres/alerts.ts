/**
 * PostgreSQL Alert Operations
 *
 * Uses the AnalyticsAlert and AnalyticsAlertHistory models.
 */

import { AlertType, AlertCondition, AlertTimeWindow } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type { Alert, AlertHistory } from "../store/types";

import { getCurrentSiteId } from "./utils";

/**
 * Maps internal alert type strings to Prisma AlertType enum
 */
function toAlertType(type: string): AlertType {
  const mapping: Record<string, AlertType> = {
    threshold: AlertType.THRESHOLD,
    anomaly: AlertType.ANOMALY,
    trend: AlertType.TREND,
  };
  return mapping[type] || AlertType.THRESHOLD;
}

/**
 * Maps Prisma AlertType enum to internal type string
 */
function fromAlertType(type: AlertType): string {
  const mapping: Record<AlertType, string> = {
    [AlertType.THRESHOLD]: "threshold",
    [AlertType.ANOMALY]: "anomaly",
    [AlertType.TREND]: "trend",
  };
  return mapping[type] || "threshold";
}

/**
 * Maps internal condition strings to Prisma AlertCondition enum
 */
function toAlertCondition(condition: string): AlertCondition {
  const mapping: Record<string, AlertCondition> = {
    greater_than: AlertCondition.GREATER_THAN,
    less_than: AlertCondition.LESS_THAN,
    equals: AlertCondition.EQUALS,
    change_percent: AlertCondition.CHANGE_PERCENT,
  };
  return mapping[condition] || AlertCondition.GREATER_THAN;
}

/**
 * Maps Prisma AlertCondition enum to internal condition string
 */
function fromAlertCondition(condition: AlertCondition): string {
  const mapping: Record<AlertCondition, string> = {
    [AlertCondition.GREATER_THAN]: "greater_than",
    [AlertCondition.LESS_THAN]: "less_than",
    [AlertCondition.EQUALS]: "equals",
    [AlertCondition.CHANGE_PERCENT]: "change_percent",
  };
  return mapping[condition] || "greater_than";
}

/**
 * Maps internal time window strings to Prisma AlertTimeWindow enum
 */
function toAlertTimeWindow(timeWindow: string): AlertTimeWindow {
  const mapping: Record<string, AlertTimeWindow> = {
    hour: AlertTimeWindow.HOUR,
    day: AlertTimeWindow.DAY,
    week: AlertTimeWindow.WEEK,
    month: AlertTimeWindow.MONTH,
  };
  return mapping[timeWindow] || AlertTimeWindow.DAY;
}

/**
 * Maps Prisma AlertTimeWindow enum to internal time window string
 */
function fromAlertTimeWindow(timeWindow: AlertTimeWindow): string {
  const mapping: Record<AlertTimeWindow, string> = {
    [AlertTimeWindow.HOUR]: "hour",
    [AlertTimeWindow.DAY]: "day",
    [AlertTimeWindow.WEEK]: "week",
    [AlertTimeWindow.MONTH]: "month",
  };
  return mapping[timeWindow] || "day";
}

/**
 * Converts a Prisma AnalyticsAlert record to Alert type
 */
function toAlert(record: {
  id: string;
  name: string;
  description: string | null;
  type: AlertType;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  timeWindow: AlertTimeWindow;
  channels: unknown;
  emailRecipients: string[];
  webhookUrl: string | null;
  enabled: boolean;
  lastTriggered: Date | null;
  lastValue: number | null;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}): Alert {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? undefined,
    type: fromAlertType(record.type) as "threshold" | "anomaly" | "trend",
    metric: record.metric as "visits" | "sessions" | "conversions" | "conversion_rate" | "avg_time" | "bounce_rate",
    condition: fromAlertCondition(record.condition) as "greater_than" | "less_than" | "equals" | "change_percent",
    threshold: record.threshold,
    timeWindow: fromAlertTimeWindow(record.timeWindow) as "hour" | "day" | "week" | "month",
    channels: (record.channels as Array<"email" | "webhook">) || [],
    emailRecipients: record.emailRecipients,
    webhookUrl: record.webhookUrl ?? undefined,
    enabled: record.enabled,
    lastTriggered: record.lastTriggered?.toISOString(),
    lastValue: record.lastValue ?? undefined,
    triggerCount: record.triggerCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Converts a Prisma AnalyticsAlertHistory record to AlertHistory type
 */
function toAlertHistory(record: {
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
}): AlertHistory {
  return {
    id: record.id,
    alertId: record.alertId,
    alertName: record.alertName,
    triggeredAt: record.triggeredAt.toISOString(),
    metric: record.metric,
    condition: record.condition,
    threshold: record.threshold,
    actualValue: record.actualValue,
    message: record.message,
    notificationsSent: (record.notificationsSent as Array<{
      channel: string;
      success: boolean;
      error?: string;
    }>) || [],
  };
}

/**
 * Create a new alert
 */
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
  const siteId = getCurrentSiteId();

  const result = await prisma.analyticsAlert.create({
    data: {
      name: alert.name,
      description: alert.description,
      type: toAlertType(alert.type),
      metric: alert.metric,
      condition: toAlertCondition(alert.condition),
      threshold: alert.threshold,
      timeWindow: toAlertTimeWindow(alert.timeWindow),
      channels: alert.channels,
      emailRecipients: alert.emailRecipients || [],
      webhookUrl: alert.webhookUrl,
      enabled: alert.enabled,
      triggerCount: 0,
      siteId,
    },
  });

  return toAlert(result);
}

/**
 * Get all alerts
 */
export async function getAlerts(enabledOnly: boolean = false): Promise<Alert[]> {
  const siteId = getCurrentSiteId();

  const alerts = await prisma.analyticsAlert.findMany({
    where: {
      siteId,
      ...(enabledOnly ? { enabled: true } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return alerts.map(toAlert);
}

/**
 * Get a single alert by ID
 */
export async function getAlert(id: string): Promise<Alert | undefined> {
  const alert = await prisma.analyticsAlert.findUnique({
    where: { id },
  });

  if (!alert) return undefined;

  return toAlert(alert);
}

/**
 * Update an alert
 */
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
  }>
): Promise<Alert | null> {
  try {
    const { lastTriggered, type, condition, timeWindow, ...rest } = updates;

    const data: Record<string, unknown> = { ...rest };

    if (type) data.type = toAlertType(type);
    if (condition) data.condition = toAlertCondition(condition);
    if (timeWindow) data.timeWindow = toAlertTimeWindow(timeWindow);
    if (lastTriggered) data.lastTriggered = new Date(lastTriggered);

    const result = await prisma.analyticsAlert.update({
      where: { id },
      data,
    });

    return toAlert(result);
  } catch {
    return null;
  }
}

/**
 * Delete an alert
 */
export async function deleteAlert(id: string): Promise<boolean> {
  try {
    await prisma.analyticsAlert.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Add alert history entry
 */
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
  const result = await prisma.analyticsAlertHistory.create({
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

  return toAlertHistory(result);
}

/**
 * Get alert history
 */
export async function getAlertHistory(
  alertId?: string,
  limit: number = 50
): Promise<AlertHistory[]> {
  const history = await prisma.analyticsAlertHistory.findMany({
    where: alertId ? { alertId } : {},
    orderBy: { triggeredAt: "desc" },
    take: limit,
  });

  return history.map(toAlertHistory);
}
