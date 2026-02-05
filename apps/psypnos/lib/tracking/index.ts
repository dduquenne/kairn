/**
 * Tracking Analytics Module for Psypnos
 *
 * Re-exports the shared tracking module from @kairn/analytics with Psypnos-specific
 * configuration. This maintains backwards compatibility with existing imports.
 *
 * Usage:
 * ```typescript
 * import { initTracker, getTracker } from '@/lib/tracking';
 *
 * // Initialize tracker (once at startup)
 * initTracker();
 *
 * // Track events
 * const tracker = getTracker();
 * tracker.trackEvent('CTA', 'click', 'book-appointment');
 * tracker.trackConversion('appointment_request', 'form_opened', 1, false);
 * ```
 */

// Re-export types from @kairn/analytics
export type {
  TrackingEventType,
  DeviceType,
  ConversionType,
  SessionData,
  BaseTrackingEvent,
  PageViewEvent,
  PageExitEvent,
  ScrollDepthEvent,
  SectionViewEvent,
  SectionTimeEvent,
  ConversionTrackingEvent,
  CustomTrackingEvent,
  SessionStartEvent,
  SessionEndEvent,
  TrackingEvent,
  TrackingPayload,
  TrackingResponse,
  TrackerConfig,
  GeolocationData,
} from '@kairn/analytics';

// Re-export utilities
export {
  DEFAULT_TRACKER_CONFIG,
  isValidTrackingEvent,
  generateSessionId,
  generateEventId,
} from '@kairn/analytics';

// Re-export client-side modules
export {
  SessionManager,
  getSessionManager,
  resetSessionManager,
  Tracker,
  getTracker,
  initTracker,
  resetTracker,
} from '@kairn/analytics';
