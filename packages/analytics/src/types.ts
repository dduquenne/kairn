/**
 * Types for the analytics tracking system
 *
 * This file defines all types used by the tracking system
 * for consistency and type-safety.
 */

// ============================================
// Base Types
// ============================================

/**
 * Tracked event types
 */
export type TrackingEventType =
  | 'page_view'        // Page view
  | 'page_exit'        // Page exit (with time spent)
  | 'scroll_depth'     // Scroll depth
  | 'section_view'     // Section view
  | 'section_time'     // Time spent on section
  | 'conversion'       // Conversion event
  | 'custom_event'     // Custom event
  | 'session_start'    // Session start
  | 'session_end';     // Session end

/**
 * Device types
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Conversion event types
 */
export type ConversionType =
  | 'appointment_request'
  | 'seminar_registration'
  | 'contact_form'
  | 'newsletter_signup'
  | 'download'
  | 'fab_click'
  | 'quick_contact_form'
  | 'custom';

// ============================================
// Session
// ============================================

/**
 * Session data
 */
export interface SessionData {
  id: string;
  startedAt: string;
  lastActivityAt: string;
  landingPage: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  deviceType: DeviceType;
  browser: string | null;
  os: string | null;
  screenWidth: number;
  screenHeight: number;
  pageViewCount: number;
  isReturning: boolean;
}

// ============================================
// Tracking Events
// ============================================

/**
 * Base common to all events
 */
export interface BaseTrackingEvent {
  type: TrackingEventType;
  timestamp: string;
  sessionId: string;
  url: string;
}

/**
 * Page view event
 */
export interface PageViewEvent extends BaseTrackingEvent {
  type: 'page_view';
  referrer: string | null;
  title: string;
  isLandingPage: boolean;
}

/**
 * Page exit event
 */
export interface PageExitEvent extends BaseTrackingEvent {
  type: 'page_exit';
  timeOnPage: number;      // ms
  scrollDepthPercent: number;
  engagementScore: number; // 0-100 based on time + scroll
}

/**
 * Scroll depth event
 */
export interface ScrollDepthEvent extends BaseTrackingEvent {
  type: 'scroll_depth';
  depth: number; // 0-100
}

/**
 * Section view event
 */
export interface SectionViewEvent extends BaseTrackingEvent {
  type: 'section_view';
  sectionId: string;
  sectionName: string;
}

/**
 * Section time event
 */
export interface SectionTimeEvent extends BaseTrackingEvent {
  type: 'section_time';
  sectionId: string;
  sectionName: string;
  timeSpent: number; // ms
  visibilityPercent: number; // % of time the section was visible
}

/**
 * Conversion event
 */
export interface ConversionTrackingEvent extends BaseTrackingEvent {
  type: 'conversion';
  conversionType: ConversionType;
  stepName: string;
  stepOrder: number;
  completed: boolean;
  value?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Custom event
 */
export interface CustomTrackingEvent extends BaseTrackingEvent {
  type: 'custom_event';
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Session start event
 */
export interface SessionStartEvent extends BaseTrackingEvent {
  type: 'session_start';
  session: SessionData;
}

/**
 * Session end event
 */
export interface SessionEndEvent extends BaseTrackingEvent {
  type: 'session_end';
  duration: number;        // ms
  pageViewCount: number;
  exitPage: string;
  bounced: boolean;        // Single page view session
}

/**
 * Union of all event types
 */
export type TrackingEvent =
  | PageViewEvent
  | PageExitEvent
  | ScrollDepthEvent
  | SectionViewEvent
  | SectionTimeEvent
  | ConversionTrackingEvent
  | CustomTrackingEvent
  | SessionStartEvent
  | SessionEndEvent;

// ============================================
// API Payload
// ============================================

/**
 * Payload sent to tracking API
 */
export interface TrackingPayload {
  events: TrackingEvent[];
  session: SessionData;
  clientInfo: {
    userAgent: string;
    language: string;
    timezone: string;
    screenWidth: number;
    screenHeight: number;
    colorDepth: number;
    pixelRatio: number;
    touchSupport: boolean;
    connectionType?: string;
  };
}

/**
 * Tracking API response
 */
export interface TrackingResponse {
  success: boolean;
  processed: number;
  errors?: string[];
  sessionId: string;
}

// ============================================
// Configuration
// ============================================

/**
 * Tracker configuration
 */
export interface TrackerConfig {
  // Batching
  batchSize: number;           // Number of events before sending
  batchInterval: number;       // Max interval between sends (ms)

  // Session
  sessionTimeout: number;      // Inactivity timeout (ms)
  sessionStorageKey: string;   // localStorage key

  // Scroll tracking
  scrollThresholds: number[];  // Scroll thresholds to track (%)
  scrollDebounce: number;      // Scroll debounce (ms)

  // Section tracking
  sectionVisibilityThreshold: number; // % visibility to consider "viewed"
  sectionTimeInterval: number;        // Section time tracking interval (ms)

  // API
  apiEndpoint: string;

  // Debug
  debug: boolean;

  // Exclusions
  excludedPaths: string[];     // Paths to not track
  excludedParams: string[];    // URL params to remove

  // Admin cookie name (to exclude admin users from tracking)
  adminCookieName?: string;
}

/**
 * Default configuration
 */
export const DEFAULT_TRACKER_CONFIG: TrackerConfig = {
  batchSize: 10,
  batchInterval: 5000,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  sessionStorageKey: 'kairn_tracking_session',
  scrollThresholds: [25, 50, 75, 90, 100],
  scrollDebounce: 100,
  sectionVisibilityThreshold: 0.5,
  sectionTimeInterval: 5000,
  apiEndpoint: '/api/analytics/track',
  debug: process.env.NODE_ENV === 'development',
  excludedPaths: ['/api/', '/_next/', '/admin'],
  excludedParams: ['fbclid', 'gclid', '_ga'],
  adminCookieName: 'admin_token',
};

// ============================================
// Geolocation Data (server-side)
// ============================================

/**
 * Geolocation data extracted server-side
 */
export interface GeolocationData {
  country: string;
  countryCode: string;
  region?: string;
  regionCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
}

// ============================================
// Utils
// ============================================

/**
 * Validates if an object is a valid tracking event
 */
export function isValidTrackingEvent(event: unknown): event is TrackingEvent {
  if (!event || typeof event !== 'object') return false;

  const e = event as Record<string, unknown>;

  return (
    typeof e.type === 'string' &&
    typeof e.timestamp === 'string' &&
    typeof e.sessionId === 'string' &&
    typeof e.url === 'string'
  );
}

/**
 * Generates a unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  const counterPart = typeof performance !== 'undefined'
    ? (performance.now() * 1000).toString(36).substring(0, 4)
    : Math.random().toString(36).substring(2, 6);

  return `ses_${timestamp}_${randomPart}_${counterPart}`;
}

/**
 * Generates a unique event ID
 */
export function generateEventId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
