// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Types pour le système de tracking analytics
 *
 * Ce fichier définit tous les types utilisés par le système de tracking
 * pour assurer la cohérence et la type-safety.
 */

// ============================================
// Types de base
// ============================================

/**
 * Types d'événements trackés
 */
export type TrackingEventType =
  | 'page_view'        // Vue de page
  | 'page_exit'        // Sortie de page (avec temps passé)
  | 'scroll_depth'     // Profondeur de scroll
  | 'section_view'     // Vue d'une section
  | 'section_time'     // Temps passé sur une section
  | 'conversion'       // Événement de conversion
  | 'custom_event'     // Événement personnalisé
  | 'session_start'    // Début de session
  | 'session_end';     // Fin de session

/**
 * Types de devices
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Types d'événements de conversion
 */
export type ConversionType =
  | 'appointment_request'
  | 'seminar_registration'
  | 'contact_form'
  | 'fab_click'
  | 'quick_contact_form';

// ============================================
// Session
// ============================================

/**
 * Données de session
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
// Événements de tracking
// ============================================

/**
 * Base commune à tous les événements
 */
export interface BaseTrackingEvent {
  type: TrackingEventType;
  timestamp: string;
  sessionId: string;
  url: string;
}

/**
 * Événement de vue de page
 */
export interface PageViewEvent extends BaseTrackingEvent {
  type: 'page_view';
  referrer: string | null;
  title: string;
  isLandingPage: boolean;
}

/**
 * Événement de sortie de page
 */
export interface PageExitEvent extends BaseTrackingEvent {
  type: 'page_exit';
  timeOnPage: number;      // ms
  scrollDepthPercent: number;
  engagementScore: number; // 0-100 basé sur temps + scroll
}

/**
 * Événement de profondeur de scroll
 */
export interface ScrollDepthEvent extends BaseTrackingEvent {
  type: 'scroll_depth';
  depth: number; // 0-100
}

/**
 * Événement de vue de section
 */
export interface SectionViewEvent extends BaseTrackingEvent {
  type: 'section_view';
  sectionId: string;
  sectionName: string;
}

/**
 * Événement de temps passé sur une section
 */
export interface SectionTimeEvent extends BaseTrackingEvent {
  type: 'section_time';
  sectionId: string;
  sectionName: string;
  timeSpent: number; // ms
  visibilityPercent: number; // % du temps où la section était visible
}

/**
 * Événement de conversion
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
 * Événement personnalisé
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
 * Événement de début de session
 */
export interface SessionStartEvent extends BaseTrackingEvent {
  type: 'session_start';
  session: SessionData;
}

/**
 * Événement de fin de session
 */
export interface SessionEndEvent extends BaseTrackingEvent {
  type: 'session_end';
  duration: number;        // ms
  pageViewCount: number;
  exitPage: string;
  bounced: boolean;        // Session avec une seule page vue
}

/**
 * Union de tous les types d'événements
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
// Payload API
// ============================================

/**
 * Payload envoyé à l'API de tracking
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
 * Réponse de l'API de tracking
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
 * Configuration du tracker
 */
export interface TrackerConfig {
  // Batching
  batchSize: number;           // Nombre d'événements avant envoi
  batchInterval: number;       // Intervalle max entre envois (ms)

  // Session
  sessionTimeout: number;      // Timeout d'inactivité (ms)
  sessionStorageKey: string;   // Clé localStorage

  // Scroll tracking
  scrollThresholds: number[];  // Seuils de scroll à tracker (%)
  scrollDebounce: number;      // Debounce du scroll (ms)

  // Section tracking
  sectionVisibilityThreshold: number; // % de visibilité pour considérer "vu"
  sectionTimeInterval: number;        // Intervalle de tracking temps section (ms)

  // API
  apiEndpoint: string;

  // Debug
  debug: boolean;

  // Exclusions
  excludedPaths: string[];     // Chemins à ne pas tracker
  excludedParams: string[];    // Params URL à supprimer
}

/**
 * Configuration par défaut
 */
export const DEFAULT_TRACKER_CONFIG: TrackerConfig = {
  batchSize: 10,
  batchInterval: 5000,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  sessionStorageKey: 'psypnos_tracking_session',
  scrollThresholds: [25, 50, 75, 90, 100],
  scrollDebounce: 100,
  sectionVisibilityThreshold: 0.5,
  sectionTimeInterval: 5000,
  apiEndpoint: '/api/analytics/track',
  debug: process.env.NODE_ENV === 'development',
  excludedPaths: ['/api/', '/_next/', '/admin'],
  excludedParams: ['fbclid', 'gclid', '_ga'],
};

// ============================================
// Données de géolocalisation (côté serveur)
// ============================================

/**
 * Données de géolocalisation extraites côté serveur
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
 * Vérifie si un objet est un événement de tracking valide
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
 * Génère un ID unique pour les sessions
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  const counterPart = (performance.now() * 1000).toString(36).substring(0, 4);

  return `ses_${timestamp}_${randomPart}_${counterPart}`;
}

/**
 * Génère un ID unique pour les événements
 */
export function generateEventId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
