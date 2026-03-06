/**
 * Analytics Handler Types
 */

import { z } from 'zod';

/**
 * Tracking event types
 */
export type EventType =
  | 'page_view'
  | 'page_exit'
  | 'scroll_depth'
  | 'section_view'
  | 'section_time'
  | 'conversion'
  | 'custom_event'
  | 'session_start'
  | 'session_end';

/**
 * Device type
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Session data schema
 */
export const sessionDataSchema = z.object({
  id: z.string().min(1),
  startedAt: z.string(),
  lastActivityAt: z.string(),
  landingPage: z.string(),
  referrer: z.string().nullable(),
  utmSource: z.string().nullable(),
  utmMedium: z.string().nullable(),
  utmCampaign: z.string().nullable(),
  utmTerm: z.string().nullable(),
  utmContent: z.string().nullable(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  screenWidth: z.number(),
  screenHeight: z.number(),
  pageViewCount: z.number(),
  isReturning: z.boolean(),
});

export type SessionData = z.infer<typeof sessionDataSchema>;

/**
 * Base event schema
 */
export const baseEventSchema = z.object({
  type: z.string(),
  timestamp: z.string(),
  sessionId: z.string(),
  url: z.string(),
});

export type BaseEvent = z.infer<typeof baseEventSchema>;

/**
 * Client info schema
 */
export const clientInfoSchema = z.object({
  userAgent: z.string(),
  language: z.string(),
  timezone: z.string(),
  screenWidth: z.number(),
  screenHeight: z.number(),
  colorDepth: z.number(),
  pixelRatio: z.number(),
  touchSupport: z.boolean(),
  connectionType: z.string().optional(),
});

export type ClientInfo = z.infer<typeof clientInfoSchema>;

/**
 * Tracking payload schema
 */
export const trackingPayloadSchema = z.object({
  events: z.array(baseEventSchema).min(1).max(100),
  session: sessionDataSchema,
  clientInfo: clientInfoSchema,
});

export type TrackingPayload = z.infer<typeof trackingPayloadSchema>;

/**
 * Geolocation data
 */
export interface GeolocationData {
  country?: string;
  countryCode?: string;
  region?: string;
  regionCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

/**
 * Dashboard query params
 */
export const dashboardQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['today', '7d', '30d', '90d', 'custom']).default('7d'),
});

export type DashboardQueryParams = z.infer<typeof dashboardQuerySchema>;

/**
 * Export query params
 */
export const exportQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  format: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
  type: z.enum(['overview', 'pages', 'events', 'conversions', 'full']).default('overview'),
});

export type ExportQueryParams = z.infer<typeof exportQuerySchema>;

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
  /** Total visits in period */
  totalVisits: number;
  /** Total unique visitors */
  uniqueVisitors: number;
  /** Total page views */
  pageViews: number;
  /** Average session duration in seconds */
  avgSessionDuration: number;
  /** Bounce rate percentage */
  bounceRate: number;
  /** Pages per session */
  pagesPerSession: number;
  /** Change from previous period (percentage) */
  changes: {
    totalVisits: number;
    uniqueVisitors: number;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
    pagesPerSession: number;
  };
}

/**
 * Top pages data
 */
export interface TopPage {
  path: string;
  title?: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

/**
 * Traffic source
 */
export interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
}

/**
 * Device breakdown
 */
export interface DeviceBreakdown {
  device: DeviceType;
  visits: number;
  percentage: number;
}

/**
 * Geographic data
 */
export interface GeoData {
  country: string;
  countryCode: string;
  visits: number;
  percentage: number;
}

/**
 * Time series data point
 */
export interface TimeSeriesPoint {
  date: string;
  value: number;
}

/**
 * Dashboard data
 */
export interface DashboardData {
  metrics: DashboardMetrics;
  topPages: TopPage[];
  trafficSources: TrafficSource[];
  deviceBreakdown: DeviceBreakdown[];
  geoData: GeoData[];
  visitsByDay: TimeSeriesPoint[];
  pageViewsByDay: TimeSeriesPoint[];
}

/**
 * Realtime data
 */
export interface RealtimeData {
  activeVisitors: number;
  activeSessions: Array<{
    sessionId: string;
    page: string;
    startedAt: string;
    deviceType: DeviceType;
    country?: string;
  }>;
  pageViewsLast5Min: number;
  topPagesNow: Array<{
    path: string;
    activeUsers: number;
  }>;
}

/**
 * Bot patterns for detection
 */
export const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /crawling/i,
  /headless/i,
  /lighthouse/i,
  /pingdom/i,
  /gtmetrix/i,
  /pagespeed/i,
  /google/i,
  /bing/i,
  /yahoo/i,
  /yandex/i,
  /baidu/i,
  /duckduck/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /telegrambot/i,
  /whatsapp/i,
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /cypress/i,
  /playwright/i,
  /puppeteer/i,
  /selenium/i,
  /phantomjs/i,
];

/**
 * Check if user agent is a bot
 */
export function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

/**
 * Analytics handler configuration
 */
export interface AnalyticsHandlerConfig {
  /** Site ID for multi-tenant filtering */
  siteId?: string;
  /** Function to track page visit */
  trackPageVisit: (data: {
    timestamp: string;
    sessionId: string;
    page: string;
    referrer?: string;
    userAgent: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    referrerDomain?: string;
    deviceType: DeviceType;
    browser?: string;
    os?: string;
    isBot: boolean;
  }) => Promise<void>;
  /** Function to track custom event */
  trackCustomEvent: (data: {
    timestamp: string;
    sessionId: string;
    category: string;
    action: string;
    label?: string;
    value?: number;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  /** Function to track section time */
  trackSectionTime?: (data: {
    timestamp: string;
    sessionId: string;
    section: string;
    timeSpent: number;
  }) => Promise<void>;
  /** Function to track conversion event */
  trackConversionEvent?: (data: {
    timestamp: string;
    sessionId: string;
    eventType: string;
    stepName: string;
    completed: boolean;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  /** Function to track funnel step */
  trackFunnelStep?: (data: {
    timestamp: string;
    sessionId: string;
    funnelName: string;
    stepName: string;
    stepOrder: number;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  /** Function to track geolocation */
  trackGeolocation?: (data: {
    sessionId: string;
    timestamp: string;
    geolocation: GeolocationData;
    ipHash: string;
  }) => Promise<void>;
  /** Function to get dashboard data */
  getDashboardData: (params: {
    startDate: Date;
    endDate: Date;
    siteId?: string;
  }) => Promise<DashboardData>;
  /** Function to get realtime data */
  getRealtimeData?: (siteId?: string) => Promise<RealtimeData>;
  /** Function to export data */
  exportData?: (params: {
    startDate: Date;
    endDate: Date;
    format: string;
    type: string;
    siteId?: string;
  }) => Promise<{ data: Buffer; filename: string; contentType: string }>;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string | null): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return undefined;
  }
}

/**
 * Hash IP address for privacy using HMAC-SHA256
 */
export function hashIP(ip: string): string {
  // Use dynamic import to avoid bundling crypto in client
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { createHmac } = require('crypto') as typeof import('crypto');
  const secret = process.env.IP_HASH_SECRET || process.env.JWT_SECRET || 'kairn-ip-hash-fallback';
  return `ip_${createHmac('sha256', secret).update(ip).digest('hex').slice(0, 16)}`;
}

/**
 * Country code to name mapping
 */
export const COUNTRY_NAMES: Record<string, string> = {
  FR: 'France',
  BE: 'Belgique',
  CH: 'Suisse',
  CA: 'Canada',
  US: 'États-Unis',
  GB: 'Royaume-Uni',
  DE: 'Allemagne',
  ES: 'Espagne',
  IT: 'Italie',
  PT: 'Portugal',
  NL: 'Pays-Bas',
  LU: 'Luxembourg',
  MC: 'Monaco',
};

/**
 * Get country name from code
 */
export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}
