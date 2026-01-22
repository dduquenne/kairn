// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * PostgreSQL Analytics Store - Main Entry Point
 *
 * This module provides PostgreSQL-backed analytics operations via Prisma.
 * It's a drop-in replacement for the JSON-based store.
 */

// Re-export types from the main store (shared types)
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
} from "../store/types";

// Page Visits
export { trackPageVisit, getPageVisits } from "./page-visits";

// Section Times
export { trackSectionTime, getSectionTimes } from "./section-times";

// Conversions
export { trackConversionEvent, getConversionEvents } from "./conversions";

// Analytics
export {
  getAnalyticsSummary,
  getVisitsByPeriod,
  getAnalyticsSummaryWithComparison,
  getSectionHeatmap,
  getTrafficSources,
  getDeviceBreakdown,
} from "./analytics";

// Custom Events
export {
  trackCustomEvent,
  getCustomEvents,
  getCustomEventsSummary,
} from "./custom-events";

// Goals
export {
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  trackGoalCompletion,
  getGoalCompletions,
  getGoalsSummary,
} from "./goals";

// Funnels
export {
  trackFunnelStep,
  getFunnelSteps,
  getFunnelAnalysis,
  getAvailableFunnels,
} from "./funnels";

// Cohorts
export { getCohortAnalysis } from "./cohorts";

// Attribution
export { getMarketingAttribution } from "./attribution";

// Alerts
export {
  createAlert,
  getAlerts,
  getAlert,
  updateAlert,
  deleteAlert,
  addAlertHistory,
  getAlertHistory,
} from "./alerts";

// Anomalies
export {
  getAnomalies,
  acknowledgeAnomaly,
  getMetricValue,
  evaluateAlertCondition,
  calculateBaseline,
  detectAnomaly,
  runAnomalyDetection,
} from "./anomalies";

// Reports
export {
  createScheduledReport,
  getScheduledReports,
  getScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
} from "./reports";

// Dashboard
export {
  createDashboardConfig,
  getDashboardConfigs,
  getDashboardConfig,
  getDefaultDashboardConfig,
  updateDashboardConfig,
  deleteDashboardConfig,
} from "./dashboard";

// Re-export getDefaultWidgets from main store (it's a pure function)
export { getDefaultWidgets } from "../store/dashboard";
