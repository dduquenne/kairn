/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Module de Tracking Analytics
 *
 * Ce module exporte toutes les fonctionnalités de tracking pour le site Psypnos.
 *
 * Usage:
 * ```typescript
 * import { initTracker, getTracker } from '@/lib/tracking';
 *
 * // Initialiser le tracker (une fois au démarrage)
 * initTracker();
 *
 * // Tracker des événements
 * const tracker = getTracker();
 * tracker.trackEvent('CTA', 'click', 'book-appointment');
 * tracker.trackConversion('appointment_request', 'form_opened', 1, false);
 * ```
 */

// Types
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
} from './types';

// Constantes et utilitaires
export {
  DEFAULT_TRACKER_CONFIG,
  isValidTrackingEvent,
  generateSessionId,
  generateEventId,
} from './types';

// Session Manager
export {
  SessionManager,
  getSessionManager,
  resetSessionManager,
} from './session';

// Tracker principal
export {
  Tracker,
  getTracker,
  initTracker,
  resetTracker,
} from './tracker';
