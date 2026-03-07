/**
 * @kairn/analytics Server Module
 *
 * Server-side analytics: stores, aggregation, filters, anomaly detection.
 * Must be initialized with initAnalyticsServer() before use.
 */

// Context & initialization
export {
  initAnalyticsServer,
  getAnalyticsContext,
  isAnalyticsServerInitialized,
  resetAnalyticsServer,
  type AnalyticsServerConfig,
  type AnalyticsCacheProvider,
} from './context';

// Server types
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
  AnalyticsStore,
} from './types';

export { ANALYTICS_CACHE_KEYS, ANALYTICS_CACHE_TTL } from './types';

// Stores
export {
  // Page Visits
  trackPageVisit,
  getPageVisits,
  getTopPages,
  // Page Exits
  trackPageExit,
  trackScrollDepth,
  // Section Times
  trackSectionTime,
  getSectionTimes,
  getSectionTimeStats,
  // Conversions
  trackConversionEvent,
  getConversionEvents,
  getConversionStats,
  // Custom Events
  trackCustomEvent,
  getCustomEvents,
  getCustomEventsSummary,
  // Analytics Summary
  getAnalyticsSummary,
  getVisitsByPeriod,
  getAnalyticsSummaryWithComparison,
  getSectionHeatmap,
  getTrafficSources,
  getDeviceBreakdown,
  // Goals
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  trackGoalCompletion,
  getGoalCompletions,
  getGoalsSummary,
  // Funnels
  trackFunnelStep,
  getFunnelSteps,
  getFunnelAnalysis,
  getAvailableFunnels,
  // Cohorts
  getCohortAnalysis,
  // Attribution
  getMarketingAttribution,
  // Alerts
  createAlert,
  getAlerts,
  getAlert,
  updateAlert,
  deleteAlert,
  addAlertHistory,
  getAlertHistory,
  getMetricValue,
  evaluateAlertCondition,
  // Anomalies
  getAnomalies,
  acknowledgeAnomaly,
  recordAnomaly,
  calculateBaseline,
  detectAnomalyZScore,
  runAnomalyDetection,
  // Reports
  createScheduledReport,
  getScheduledReports,
  getScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  // Dashboard
  createDashboardConfig,
  getDashboardConfigs,
  getDashboardConfig,
  getDefaultDashboardConfig,
  updateDashboardConfig,
  deleteDashboardConfig,
  getDefaultWidgets,
  // Storage info
  getStorageInfo,
} from './stores';

// Utilities
export {
  toPrismaJson,
  normalizeNulls,
  toEventType,
  fromEventType,
  buildDateFilter,
  extractFromData,
  extractDataFields,
  buildPageVisitData,
  buildPageExitData,
  buildSectionTimeData,
  buildConversionData,
  buildFunnelStepData,
  buildCustomEventData,
  type InputJsonValue,
  type InputJsonObject,
  type InputJsonArray,
  type PageVisitDataExtracted,
  type SectionTimeDataExtracted,
  type ConversionDataExtracted,
  type FunnelStepDataExtracted,
  type CustomEventDataExtracted,
} from './utils';

// Aggregation
export {
  computeDailySummary,
  runDailyAggregations,
  backfillAggregations,
  getDailySummaries,
} from './aggregation';

// Filters
export {
  getClientIP,
  isExcludedIP,
  isExcludedUserAgent,
  isExcludedReferrer,
  isExcludedPage,
  isLocalhost,
  shouldTrackRequest,
  type RequestHeaders,
  type FilterResult,
} from './filters';

// Anomaly Detector
export { AnomalyDetector, type AnomalyThresholds, type DetectedAnomaly } from './anomaly-detector';

// Retention
export {
  DEFAULT_RETENTION_CONFIG,
  computeCutoffDate,
  mergeRetentionConfig,
  type RetentionConfig,
  type EventRetentionPolicy,
  type LegacyTableRetention,
  type JobCleanupConfig,
} from './retention';
