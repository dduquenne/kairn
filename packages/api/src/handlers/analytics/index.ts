/**
 * Analytics Handlers
 *
 * Reusable analytics API handlers for tracking, dashboard, realtime, and export.
 */

// Types and schemas
export {
  sessionDataSchema,
  baseEventSchema,
  clientInfoSchema,
  trackingPayloadSchema,
  dashboardQuerySchema,
  exportQuerySchema,
  isBot,
  extractDomain,
  hashIP,
  getCountryName,
  BOT_PATTERNS,
  COUNTRY_NAMES,
  type EventType,
  type DeviceType,
  type SessionData,
  type BaseEvent,
  type ClientInfo,
  type TrackingPayload,
  type GeolocationData,
  type DashboardQueryParams,
  type ExportQueryParams,
  type DashboardMetrics,
  type TopPage,
  type TrafficSource,
  type DeviceBreakdown,
  type GeoData,
  type TimeSeriesPoint,
  type DashboardData,
  type RealtimeData,
  type AnalyticsHandlerConfig,
} from './types';

// Track handler
export { handleTrack, createTrackHandler, extractGeolocation, type TrackResult } from './track';

// Dashboard handler
export { handleDashboard, createDashboardHandler, type DashboardResult } from './dashboard';

// Realtime handler
export { handleRealtime, createRealtimeHandler, type RealtimeResult } from './realtime';

// Export handler
export { handleExport, createExportHandler, type ExportResult } from './export';
