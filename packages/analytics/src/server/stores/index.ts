/**
 * Analytics Stores — Barrel Export
 *
 * Re-exports all PostgreSQL store operations for the analytics server module.
 */

// Page Visits
export { trackPageVisit, getPageVisits, getTopPages } from './page-visits';

// Page Exits
export { trackPageExit, trackScrollDepth } from './page-exits';

// Section Times
export { trackSectionTime, getSectionTimes, getSectionTimeStats } from './section-times';

// Conversions
export { trackConversionEvent, getConversionEvents, getConversionStats } from './conversions';

// Custom Events
export { trackCustomEvent, getCustomEvents, getCustomEventsSummary } from './custom-events';

// Analytics Summary
export {
  getAnalyticsSummary,
  getVisitsByPeriod,
  getAnalyticsSummaryWithComparison,
  getSectionHeatmap,
  getTrafficSources,
  getDeviceBreakdown,
} from './analytics';

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
} from './goals';

// Funnels
export { trackFunnelStep, getFunnelSteps, getFunnelAnalysis, getAvailableFunnels } from './funnels';

// Cohorts
export { getCohortAnalysis } from './cohorts';

// Attribution
export { getMarketingAttribution } from './attribution';

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
} from './alerts';

// Anomalies
export {
  getAnomalies,
  acknowledgeAnomaly,
  recordAnomaly,
  calculateBaseline,
  detectAnomaly as detectAnomalyZScore,
  runAnomalyDetection,
} from './anomalies';

// Reports
export {
  createScheduledReport,
  getScheduledReports,
  getScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
} from './reports';

// Dashboard
export {
  createDashboardConfig,
  getDashboardConfigs,
  getDashboardConfig,
  getDefaultDashboardConfig,
  updateDashboardConfig,
  deleteDashboardConfig,
  getDefaultWidgets,
} from './dashboard';

// Storage info
export { getStorageInfo } from './storage-info';
