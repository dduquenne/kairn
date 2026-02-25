/**
 * Analytics Store Index
 *
 * Direct re-exports from the PostgreSQL store via Prisma.
 *
 * Previously this module dynamically selected between JSON file storage and
 * PostgreSQL based on the ANALYTICS_STORAGE_MODE env var (defaulting to JSON).
 * This was the root cause of tracking data never reaching the database:
 * the env var was never set, so all data went to a JSON file on an ephemeral
 * filesystem that was wiped on every deployment.
 *
 * The JSON store is now removed from the data path. PostgreSQL (via Prisma)
 * is the only supported storage backend.
 */

// Page Visits
export { trackPageVisit, getPageVisits, getTopPages } from './store-postgres/page-visits';

// Section Times
export { trackSectionTime, getSectionTimes } from './store-postgres/section-times';

// Conversions
export { trackConversionEvent, getConversionEvents } from './store-postgres/conversions';

// Analytics
export {
  getAnalyticsSummary,
  getVisitsByPeriod,
  getAnalyticsSummaryWithComparison,
  getSectionHeatmap,
  getTrafficSources,
  getDeviceBreakdown,
} from './store-postgres/analytics';

// Custom Events
export {
  trackCustomEvent,
  getCustomEvents,
  getCustomEventsSummary,
} from './store-postgres/custom-events';

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
} from './store-postgres/goals';

// Funnels
export {
  trackFunnelStep,
  getFunnelSteps,
  getFunnelAnalysis,
  getAvailableFunnels,
} from './store-postgres/funnels';

// Cohorts
export { getCohortAnalysis } from './store-postgres/cohorts';

// Attribution
export { getMarketingAttribution } from './store-postgres/attribution';

// Alerts
export {
  createAlert,
  getAlerts,
  getAlert,
  updateAlert,
  deleteAlert,
  addAlertHistory,
  getAlertHistory,
} from './store-postgres/alerts';

// Anomalies
export {
  getAnomalies,
  acknowledgeAnomaly,
  getMetricValue,
  evaluateAlertCondition,
  calculateBaseline,
  detectAnomaly,
  runAnomalyDetection,
} from './store-postgres/anomalies';

// Reports
export {
  createScheduledReport,
  getScheduledReports,
  getScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
} from './store-postgres/reports';

// Dashboard
export {
  createDashboardConfig,
  getDashboardConfigs,
  getDashboardConfig,
  getDefaultDashboardConfig,
  updateDashboardConfig,
  deleteDashboardConfig,
} from './store-postgres/dashboard';

// Re-export getDefaultWidgets from store (pure function, no I/O)
export { getDefaultWidgets } from './store/dashboard';

// Storage info (for diagnostics)
export function getStorageInfo() {
  return {
    mode: 'postgres' as const,
    description: 'PostgreSQL with Prisma ORM',
  };
}

// Re-export types from store-postgres (which re-exports from store/types)
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
} from './store-postgres';
