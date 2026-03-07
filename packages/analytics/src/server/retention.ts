/**
 * Analytics data retention configuration
 *
 * Centralizes retention policies for all analytics tables.
 * Used by cleanup CRON jobs to determine data lifetime.
 *
 * @module retention
 */

/** Retention configuration for a group of analytics event types */
export interface EventRetentionPolicy {
  /** Event types included in this group */
  types: string[];
  /** Number of days to retain data */
  days: number;
  /** Human-readable description of the group */
  description: string;
}

/** Retention configuration for legacy tables */
export interface LegacyTableRetention {
  /** Prisma model name */
  model: string;
  /** Date field to filter on */
  dateField: string;
  /** Number of days to retain data */
  days: number;
}

/** Job cleanup configuration */
export interface JobCleanupConfig {
  /** Timeout in minutes for orphaned PROCESSING jobs */
  orphanTimeoutMinutes: number;
  /** Days to retain COMPLETED/FAILED jobs */
  jobRetentionDays: number;
  /** Days to retain social generation logs */
  socialLogRetentionDays: number;
}

/** Complete retention configuration */
export interface RetentionConfig {
  /** Retention policies for unified AnalyticsEvent table by group */
  events: Record<string, EventRetentionPolicy>;
  /** Retention for legacy tables */
  legacyTables: LegacyTableRetention[];
  /** Retention for VisitorGeolocation */
  visitorGeolocationDays: number;
  /** Retention for AnalyticsDailySummary */
  dailySummaryDays: number;
  /** Job cleanup configuration */
  jobs: JobCleanupConfig;
}

/**
 * Default retention configuration
 *
 * - Page events: 90 days (sufficient for trend analysis)
 * - Engagement events: 60 days (high volume, low long-term value)
 * - Conversion events: 365 days (business-critical for ROI analysis)
 * - Interaction events: 60 days (high volume)
 * - Session/custom events: 30 days (diagnostic, high volume)
 * - Daily summaries: 730 days (2 years, low volume, high value)
 */
export const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
  events: {
    pageEvents: {
      types: ['PAGE_VIEW', 'PAGE_EXIT'],
      days: 90,
      description: 'Page views and exits',
    },
    engagementEvents: {
      types: ['SCROLL_DEPTH', 'SECTION_VIEW', 'SECTION_TIME'],
      days: 60,
      description: 'Scroll depth, section views and time',
    },
    conversionEvents: {
      types: ['CONVERSION', 'FUNNEL_STEP'],
      days: 365,
      description: 'Conversions and funnel steps (business-critical)',
    },
    interactionEvents: {
      types: ['CLICK', 'FORM_SUBMIT', 'DOWNLOAD'],
      days: 60,
      description: 'Clicks, form submissions and downloads',
    },
    otherEvents: {
      types: ['CUSTOM', 'SESSION_START', 'SESSION_END'],
      days: 30,
      description: 'Custom events and session markers',
    },
  },
  legacyTables: [
    { model: 'pageVisit', dateField: 'timestamp', days: 90 },
    { model: 'blogAnalytics', dateField: 'timestamp', days: 90 },
    { model: 'blogCtaClick', dateField: 'timestamp', days: 90 },
    { model: 'blogFaqClick', dateField: 'timestamp', days: 90 },
    { model: 'botVisit', dateField: 'timestamp', days: 30 },
  ],
  visitorGeolocationDays: 60,
  dailySummaryDays: 730,
  jobs: {
    orphanTimeoutMinutes: 30,
    jobRetentionDays: 7,
    socialLogRetentionDays: 30,
  },
};

/**
 * Compute a cutoff date from a retention period in days
 *
 * @param days - Number of days to retain
 * @returns Date before which data should be deleted
 */
export function computeCutoffDate(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Merge custom retention configuration with defaults
 *
 * @param overrides - Partial overrides to apply
 * @returns Complete retention configuration
 */
export function mergeRetentionConfig(overrides: Partial<RetentionConfig>): RetentionConfig {
  return {
    events: { ...DEFAULT_RETENTION_CONFIG.events, ...overrides.events },
    legacyTables: overrides.legacyTables ?? DEFAULT_RETENTION_CONFIG.legacyTables,
    visitorGeolocationDays:
      overrides.visitorGeolocationDays ?? DEFAULT_RETENTION_CONFIG.visitorGeolocationDays,
    dailySummaryDays: overrides.dailySummaryDays ?? DEFAULT_RETENTION_CONFIG.dailySummaryDays,
    jobs: { ...DEFAULT_RETENTION_CONFIG.jobs, ...overrides.jobs },
  };
}
