// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Analytics Store - Main Entry Point
 *
 * This module provides a complete analytics solution with:
 * - Page visit tracking
 * - Section time tracking
 * - Conversion event tracking
 * - Custom event tracking
 * - Goal management
 * - Funnel analysis
 * - Cohort analysis
 * - Marketing attribution
 * - Alert system
 * - Anomaly detection
 * - Scheduled reports
 * - Dashboard configuration
 */

// Types
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
} from "./types";

// Schemas
export {
  pageVisitSchema,
  sectionTimeSchema,
  conversionEventSchema,
  customEventSchema,
  goalSchema,
  goalCompletionSchema,
  funnelStepSchema,
  alertSchema,
  alertHistorySchema,
  dashboardConfigSchema,
  scheduledReportSchema,
  anomalySchema,
  analyticsSchema,
} from "./schemas";

// Cache utilities
export { readAnalyticsData, writeAnalyticsData, generateId } from "./cache";

// Page Visits
export { trackPageVisit, getPageVisits } from "./page-visits";

// Section Times
export { trackSectionTime, getSectionTimes } from "./section-times";

// Conversions
export { trackConversionEvent, getConversionEvents } from "./conversions";

// Custom Events
export { trackCustomEvent, getCustomEvents, getCustomEventsSummary } from "./custom-events";

// Analytics
export {
  getAnalyticsSummary,
  getVisitsByPeriod,
  getAnalyticsSummaryWithComparison,
  getSectionHeatmap,
  getTrafficSources,
  getDeviceBreakdown,
} from "./analytics";

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
  getMetricValue,
  evaluateAlertCondition,
} from "./alerts";

// Anomalies
export {
  calculateBaseline,
  detectAnomaly,
  runAnomalyDetection,
  getAnomalies,
  acknowledgeAnomaly,
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
  getDefaultWidgets,
} from "./dashboard";
