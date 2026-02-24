/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Analytics Store Index
 * Phase 4: Scalability & Performance
 *
 * This module provides dynamic selection between JSON and PostgreSQL storage
 * based on the ANALYTICS_STORAGE_MODE environment variable.
 *
 * Usage:
 *   import * as store from '@/app/api/analytics/store-index';
 *
 * Configuration:
 *   - ANALYTICS_STORAGE_MODE="json" (default) - Use JSON file storage
 *   - ANALYTICS_STORAGE_MODE="postgres" - Use PostgreSQL with Prisma
 */

import { isDatabaseConnected } from "@/lib/db/prisma";

// Determine storage mode
function getStorageMode(): "json" | "postgres" {
  const mode = process.env.ANALYTICS_STORAGE_MODE?.toLowerCase();

  if (mode === "postgres") {
    return "postgres";
  }

  return "json"; // Default
}

// Cache the storage mode to avoid repeated env checks
let cachedMode: "json" | "postgres" | null = null;
let modeChecked = false;

async function resolveStorageMode(): Promise<"json" | "postgres"> {
  if (modeChecked && cachedMode) {
    return cachedMode;
  }

  const requestedMode = getStorageMode();

  if (requestedMode === "postgres") {
    // Check if database is actually available
    const dbConnected = await isDatabaseConnected();

    if (!dbConnected) {
      console.warn(
        "[Analytics Store] PostgreSQL requested but not available, falling back to JSON"
      );
      cachedMode = "json";
    } else {
      cachedMode = "postgres";
    }
  } else {
    cachedMode = "json";
  }

  modeChecked = true;
  return cachedMode;
}

// Dynamic import helper
async function getStore() {
  const mode = await resolveStorageMode();

  if (mode === "postgres") {
    return import("./store-postgres");
  }

  return import("./store");
}

// ===========================================
// Exported functions that delegate to the appropriate store
// ===========================================

// Page Visit Operations
export async function trackPageVisit(
  pageVisit: Parameters<(typeof import("./store"))["trackPageVisit"]>[0]
) {
  const store = await getStore();
  return store.trackPageVisit(pageVisit);
}

export async function getPageVisits(startDate?: string, endDate?: string) {
  const store = await getStore();
  return store.getPageVisits(startDate, endDate);
}

// Section Time Operations
export async function trackSectionTime(
  sectionTime: Parameters<(typeof import("./store"))["trackSectionTime"]>[0]
) {
  const store = await getStore();
  return store.trackSectionTime(sectionTime);
}

export async function getSectionTimes(startDate?: string, endDate?: string) {
  const store = await getStore();
  return store.getSectionTimes(startDate, endDate);
}

// Conversion Event Operations
export async function trackConversionEvent(
  event: Parameters<(typeof import("./store"))["trackConversionEvent"]>[0]
) {
  const store = await getStore();
  return store.trackConversionEvent(event);
}

export async function getConversionEvents(startDate?: string, endDate?: string) {
  const store = await getStore();
  return store.getConversionEvents(startDate, endDate);
}

// Analytics Summary
export async function getAnalyticsSummary(startDate?: string, endDate?: string) {
  const store = await getStore();
  return store.getAnalyticsSummary(startDate, endDate);
}

export async function getAnalyticsSummaryWithComparison(
  timeRange: "day" | "week" | "month" | "year"
) {
  const store = await getStore();
  return store.getAnalyticsSummaryWithComparison(timeRange);
}

export async function getVisitsByPeriod(
  period: "hour" | "day" | "week" | "month" | "year",
  startDate?: string,
  endDate?: string
) {
  const store = await getStore();
  return store.getVisitsByPeriod(period, startDate, endDate);
}

// Heatmap & Traffic
export async function getSectionHeatmap(startDate?: string, endDate?: string) {
  const store = await getStore();
  return store.getSectionHeatmap(startDate, endDate);
}

export async function getTrafficSources(startDate?: string, endDate?: string) {
  const store = await getStore();
  return store.getTrafficSources(startDate, endDate);
}

export async function getDeviceBreakdown(startDate?: string, endDate?: string) {
  const store = await getStore();
  return store.getDeviceBreakdown(startDate, endDate);
}

// Custom Events
export async function trackCustomEvent(
  event: Parameters<(typeof import("./store"))["trackCustomEvent"]>[0]
) {
  const store = await getStore();
  return store.trackCustomEvent(event);
}

export async function getCustomEvents(
  startDate?: string,
  endDate?: string,
  category?: string,
  action?: string
) {
  const store = await getStore();
  return store.getCustomEvents(startDate, endDate, category, action);
}

export async function getCustomEventsSummary(startDate?: string, endDate?: string) {
  const store = await getStore();
  return store.getCustomEventsSummary(startDate, endDate);
}

// Goals
export async function createGoal(
  goal: Parameters<(typeof import("./store"))["createGoal"]>[0]
) {
  const store = await getStore();
  return store.createGoal(goal);
}

export async function getGoals() {
  const store = await getStore();
  return store.getGoals();
}

export async function getGoal(id: string) {
  const store = await getStore();
  return store.getGoal(id);
}

export async function updateGoal(
  id: string,
  updates: Parameters<(typeof import("./store"))["updateGoal"]>[1]
) {
  const store = await getStore();
  return store.updateGoal(id, updates);
}

export async function deleteGoal(id: string) {
  const store = await getStore();
  return store.deleteGoal(id);
}

export async function trackGoalCompletion(
  completion: Parameters<(typeof import("./store"))["trackGoalCompletion"]>[0]
) {
  const store = await getStore();
  return store.trackGoalCompletion(completion);
}

export async function getGoalCompletions(
  goalId?: string,
  startDate?: string,
  endDate?: string
) {
  const store = await getStore();
  return store.getGoalCompletions(goalId, startDate, endDate);
}

export async function getGoalsSummary(startDate?: string, endDate?: string) {
  const store = await getStore();
  return store.getGoalsSummary(startDate, endDate);
}

// Funnels
export async function trackFunnelStep(
  step: Parameters<(typeof import("./store"))["trackFunnelStep"]>[0]
) {
  const store = await getStore();
  return store.trackFunnelStep(step);
}

export async function getFunnelSteps(
  funnelName?: string,
  startDate?: string,
  endDate?: string
) {
  const store = await getStore();
  return store.getFunnelSteps(funnelName, startDate, endDate);
}

export async function getFunnelAnalysis(
  funnelName: string,
  startDate?: string,
  endDate?: string
) {
  const store = await getStore();
  return store.getFunnelAnalysis(funnelName, startDate, endDate);
}

export async function getAvailableFunnels(startDate?: string, endDate?: string) {
  const store = await getStore();
  return store.getAvailableFunnels(startDate, endDate);
}

// Cohorts
export async function getCohortAnalysis(
  cohortBy?: "week" | "month" | "utm_source" | "referrer" | "device",
  startDate?: string,
  endDate?: string
) {
  const store = await getStore();
  return store.getCohortAnalysis(cohortBy, startDate, endDate);
}

// Attribution
export async function getMarketingAttribution(startDate?: string, endDate?: string) {
  const store = await getStore();
  return store.getMarketingAttribution(startDate, endDate);
}

// Alerts
export async function createAlert(
  alert: Parameters<(typeof import("./store"))["createAlert"]>[0]
) {
  const store = await getStore();
  return store.createAlert(alert);
}

export async function getAlerts(enabledOnly?: boolean) {
  const store = await getStore();
  return store.getAlerts(enabledOnly);
}

export async function getAlert(id: string) {
  const store = await getStore();
  return store.getAlert(id);
}

export async function updateAlert(
  id: string,
  updates: Parameters<(typeof import("./store"))["updateAlert"]>[1]
) {
  const store = await getStore();
  return store.updateAlert(id, updates);
}

export async function deleteAlert(id: string) {
  const store = await getStore();
  return store.deleteAlert(id);
}

export async function addAlertHistory(
  history: Parameters<(typeof import("./store"))["addAlertHistory"]>[0]
) {
  const store = await getStore();
  return store.addAlertHistory(history);
}

export async function getAlertHistory(alertId?: string, limit?: number) {
  const store = await getStore();
  return store.getAlertHistory(alertId, limit);
}

export async function getMetricValue(
  metric: Parameters<(typeof import("./store"))["getMetricValue"]>[0],
  timeWindow: Parameters<(typeof import("./store"))["getMetricValue"]>[1]
) {
  const store = await getStore();
  return store.getMetricValue(metric, timeWindow);
}

export async function evaluateAlertCondition(
  actualValue: number,
  threshold: number,
  condition: Parameters<(typeof import("./store"))["evaluateAlertCondition"]>[2],
  previousValue?: number
) {
  const store = await getStore();
  return store.evaluateAlertCondition(actualValue, threshold, condition, previousValue);
}

// Anomalies
export async function calculateBaseline(metric: string, days?: number) {
  const store = await getStore();
  return store.calculateBaseline(metric, days);
}

export async function detectAnomaly(
  actualValue: number,
  baseline: { mean: number; stdDev: number },
  sensitivity?: "low" | "medium" | "high"
) {
  const store = await getStore();
  return store.detectAnomaly(actualValue, baseline, sensitivity);
}

export async function runAnomalyDetection(sensitivity?: "low" | "medium" | "high") {
  const store = await getStore();
  return store.runAnomalyDetection(sensitivity);
}

export async function getAnomalies(
  startDate?: string,
  endDate?: string,
  acknowledgedOnly?: boolean
) {
  const store = await getStore();
  return store.getAnomalies(startDate, endDate, acknowledgedOnly);
}

export async function acknowledgeAnomaly(id: string, acknowledgedBy?: string) {
  const store = await getStore();
  return store.acknowledgeAnomaly(id, acknowledgedBy);
}

// Scheduled Reports
export async function createScheduledReport(
  report: Parameters<(typeof import("./store"))["createScheduledReport"]>[0]
) {
  const store = await getStore();
  return store.createScheduledReport(report);
}

export async function getScheduledReports(enabledOnly?: boolean) {
  const store = await getStore();
  return store.getScheduledReports(enabledOnly);
}

export async function getScheduledReport(id: string) {
  const store = await getStore();
  return store.getScheduledReport(id);
}

export async function updateScheduledReport(
  id: string,
  updates: Parameters<(typeof import("./store"))["updateScheduledReport"]>[1]
) {
  const store = await getStore();
  return store.updateScheduledReport(id, updates);
}

export async function deleteScheduledReport(id: string) {
  const store = await getStore();
  return store.deleteScheduledReport(id);
}

// Dashboard Config
export async function createDashboardConfig(
  config: Parameters<(typeof import("./store"))["createDashboardConfig"]>[0]
) {
  const store = await getStore();
  return store.createDashboardConfig(config);
}

export async function getDashboardConfigs(userId?: string) {
  const store = await getStore();
  return store.getDashboardConfigs(userId);
}

export async function getDashboardConfig(id: string) {
  const store = await getStore();
  return store.getDashboardConfig(id);
}

export async function getDefaultDashboardConfig(userId: string) {
  const store = await getStore();
  return store.getDefaultDashboardConfig(userId);
}

export async function updateDashboardConfig(
  id: string,
  updates: Parameters<(typeof import("./store"))["updateDashboardConfig"]>[1]
) {
  const store = await getStore();
  return store.updateDashboardConfig(id, updates);
}

export async function deleteDashboardConfig(id: string) {
  const store = await getStore();
  return store.deleteDashboardConfig(id);
}

export async function getDefaultWidgets() {
  const store = await getStore();
  return store.getDefaultWidgets();
}

// ===========================================
// Storage Mode Info
// ===========================================

export async function getStorageInfo() {
  const mode = await resolveStorageMode();
  return {
    mode,
    description:
      mode === "postgres"
        ? "PostgreSQL with Prisma ORM (Phase 4)"
        : "JSON file storage (Legacy)",
  };
}

// Re-export types
export type {
  PageVisit,
  SectionTime,
  ConversionEvent,
  CustomEvent,
  Goal,
  GoalCompletion,
  FunnelStep,
  Alert,
  AlertHistory,
  DashboardConfig,
  ScheduledReport,
  Anomaly,
  Analytics,
} from "./store";
