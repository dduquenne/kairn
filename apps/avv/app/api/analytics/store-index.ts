/**
 * Analytics Store Index
 *
 * Re-exports from @kairn/analytics/server (centralized analytics package).
 * The initialization side-effect import ensures the DI context is configured
 * with the Appréciez Votre Vie Prisma client, site ID resolver, and Redis cache.
 *
 * All analytics business logic now lives in @kairn/analytics.
 * This file is a thin bridge for backwards compatibility with existing imports.
 */

// Side-effect: initialize analytics server context for avv
import '@/lib/analytics-server-init';

// Page Visits
export { trackPageVisit, getPageVisits, getTopPages } from '@kairn/analytics/server';

// Page Exits & Scroll Depth
export { trackPageExit, trackScrollDepth } from '@kairn/analytics/server';

// Section Times
export { trackSectionTime, getSectionTimes, getSectionTimeStats } from '@kairn/analytics/server';

// Conversions
export {
  trackConversionEvent,
  getConversionEvents,
  getConversionStats,
} from '@kairn/analytics/server';

// Analytics
export {
  getAnalyticsSummary,
  getVisitsByPeriod,
  getAnalyticsSummaryWithComparison,
  getSectionHeatmap,
  getTrafficSources,
  getDeviceBreakdown,
} from '@kairn/analytics/server';

// Custom Events
export { trackCustomEvent, getCustomEvents, getCustomEventsSummary } from '@kairn/analytics/server';

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
} from '@kairn/analytics/server';

// Funnels
export {
  trackFunnelStep,
  getFunnelSteps,
  getFunnelAnalysis,
  getAvailableFunnels,
} from '@kairn/analytics/server';

// Cohorts
export { getCohortAnalysis } from '@kairn/analytics/server';

// Attribution
export { getMarketingAttribution } from '@kairn/analytics/server';

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
} from '@kairn/analytics/server';

// Anomalies
export {
  getAnomalies,
  acknowledgeAnomaly,
  recordAnomaly,
  calculateBaseline,
  detectAnomalyZScore as detectAnomaly,
  runAnomalyDetection,
} from '@kairn/analytics/server';

// Reports
export {
  createScheduledReport,
  getScheduledReports,
  getScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
} from '@kairn/analytics/server';

// Dashboard
export {
  createDashboardConfig,
  getDashboardConfigs,
  getDashboardConfig,
  getDefaultDashboardConfig,
  updateDashboardConfig,
  deleteDashboardConfig,
  getDefaultWidgets,
  getStorageInfo,
} from '@kairn/analytics/server';

// Re-export types from @kairn/analytics
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
} from '@kairn/analytics/server';
