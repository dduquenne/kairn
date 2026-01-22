// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Alert Operations
 */

import type { Alert, AlertHistory } from "./types";
import { readAnalyticsData, writeAnalyticsData, generateId } from "./cache";
import { getAnalyticsSummary } from "./analytics";
import { getPageVisits } from "./page-visits";

export async function createAlert(alert: Omit<Alert, "id" | "createdAt" | "updatedAt" | "triggerCount">): Promise<Alert> {
  const data = await readAnalyticsData();
  const id = generateId("alert");
  const now = new Date().toISOString();
  const newAlert: Alert = {
    ...alert,
    id,
    triggerCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  data.alerts.push(newAlert);
  await writeAnalyticsData(data);
  return newAlert;
}

export async function getAlerts(enabledOnly: boolean = false): Promise<Alert[]> {
  const data = await readAnalyticsData();
  if (enabledOnly) {
    return data.alerts.filter((a) => a.enabled);
  }
  return data.alerts;
}

export async function getAlert(id: string): Promise<Alert | undefined> {
  const data = await readAnalyticsData();
  return data.alerts.find((a) => a.id === id);
}

export async function updateAlert(id: string, updates: Partial<Omit<Alert, "id" | "createdAt">>): Promise<Alert | null> {
  const data = await readAnalyticsData();
  const index = data.alerts.findIndex((a) => a.id === id);
  if (index === -1) return null;

  data.alerts[index] = {
    ...data.alerts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeAnalyticsData(data);
  return data.alerts[index];
}

export async function deleteAlert(id: string): Promise<boolean> {
  const data = await readAnalyticsData();
  const index = data.alerts.findIndex((a) => a.id === id);
  if (index === -1) return false;

  data.alerts.splice(index, 1);
  data.alertHistory = data.alertHistory.filter((h) => h.alertId !== id);
  await writeAnalyticsData(data);
  return true;
}

export async function addAlertHistory(history: Omit<AlertHistory, "id">): Promise<AlertHistory> {
  const data = await readAnalyticsData();
  const id = generateId("ah");
  const newHistory: AlertHistory = { ...history, id };
  data.alertHistory.push(newHistory);

  // Keep only last 100 history entries
  if (data.alertHistory.length > 100) {
    data.alertHistory = data.alertHistory.slice(-100);
  }

  await writeAnalyticsData(data);
  return newHistory;
}

export async function getAlertHistory(alertId?: string, limit: number = 50): Promise<AlertHistory[]> {
  const data = await readAnalyticsData();
  let history = data.alertHistory;

  if (alertId) {
    history = history.filter((h) => h.alertId === alertId);
  }

  return history.slice(-limit).reverse();
}

// Get metric value for alert evaluation
export async function getMetricValue(
  metric: Alert['metric'],
  timeWindow: Alert['timeWindow'],
): Promise<number> {
  const now = new Date();
  let startDate = new Date();

  switch (timeWindow) {
    case 'hour':
      startDate.setHours(now.getHours() - 1);
      break;
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  const summary = await getAnalyticsSummary(startDate.toISOString(), now.toISOString());

  switch (metric) {
    case 'visits':
      return summary.totalVisits;
    case 'sessions':
      return summary.uniqueSessions;
    case 'conversions':
      return Object.values(summary.conversionByType).reduce((sum, v) => sum + v.completed, 0);
    case 'conversion_rate':
      return summary.conversionRate;
    case 'avg_time':
      return summary.averageTimeOnSite / 1000;
    case 'bounce_rate':
      const visits = await getPageVisits(startDate.toISOString(), now.toISOString());
      const sessionPageViews = new Map<string, number>();
      visits.forEach(v => {
        sessionPageViews.set(v.sessionId, (sessionPageViews.get(v.sessionId) || 0) + 1);
      });
      const bouncedSessions = Array.from(sessionPageViews.values()).filter(v => v === 1).length;
      const totalSessions = sessionPageViews.size;
      return totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
    default:
      return 0;
  }
}

// Evaluate alert condition
export function evaluateAlertCondition(
  actualValue: number,
  threshold: number,
  condition: Alert['condition'],
  previousValue?: number,
): boolean {
  switch (condition) {
    case 'greater_than':
      return actualValue > threshold;
    case 'less_than':
      return actualValue < threshold;
    case 'equals':
      return actualValue === threshold;
    case 'change_percent':
      if (previousValue === undefined || previousValue === 0) return false;
      const changePercent = ((actualValue - previousValue) / previousValue) * 100;
      return Math.abs(changePercent) >= threshold;
    default:
      return false;
  }
}
