/**
 * Analytics Server Utilities
 *
 * Type conversion, event mapping, JSON helpers, and data builders
 * for the PostgreSQL analytics store.
 */

import type { EventType } from '@prisma/client';

/**
 * Local string constants matching the Prisma EventType enum values.
 * Avoids runtime dependency on the generated Prisma client while
 * preserving type safety via `import type` above.
 */
const EVENT_TYPE = {
  PAGE_VIEW: 'PAGE_VIEW',
  PAGE_EXIT: 'PAGE_EXIT',
  SCROLL_DEPTH: 'SCROLL_DEPTH',
  SECTION_VIEW: 'SECTION_VIEW',
  SECTION_TIME: 'SECTION_TIME',
  CONVERSION: 'CONVERSION',
  FUNNEL_STEP: 'FUNNEL_STEP',
  CLICK: 'CLICK',
  FORM_SUBMIT: 'FORM_SUBMIT',
  DOWNLOAD: 'DOWNLOAD',
  CUSTOM: 'CUSTOM',
  SESSION_START: 'SESSION_START',
  SESSION_END: 'SESSION_END',
} as const satisfies Record<string, EventType>;

// =============================================================================
// JSON TYPE HELPERS
// =============================================================================

/** InputJsonValue - Type compatible with Prisma for WRITING JSON. */
export type InputJsonObject = {
  readonly [Key in string]?: InputJsonValue | null;
};
export type InputJsonArray = ReadonlyArray<InputJsonValue | null>;
export type InputJsonValue = string | number | boolean | InputJsonObject | InputJsonArray;

/**
 * Converts a Record<string, unknown> to Prisma JSON INPUT compatible type.
 */
export function toPrismaJson(
  metadata: Record<string, unknown> | undefined
): InputJsonValue | undefined {
  if (metadata === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(metadata)) as InputJsonValue;
}

/**
 * Converts null values to undefined in an object.
 */
export function normalizeNulls<T extends Record<string, unknown>>(
  obj: T
): { [K in keyof T]: T[K] extends null ? undefined : T[K] } {
  const result = {} as {
    [K in keyof T]: T[K] extends null ? undefined : T[K];
  };

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      (result as Record<string, unknown>)[key] = value === null ? undefined : value;
    }
  }

  return result;
}

// =============================================================================
// EVENT TYPE MAPPING
// =============================================================================

/**
 * Maps internal event type strings to Prisma EventType enum.
 */
export function toEventType(type: string): EventType {
  const mapping: Record<string, EventType> = {
    page_view: EVENT_TYPE.PAGE_VIEW,
    page_exit: EVENT_TYPE.PAGE_EXIT,
    scroll_depth: EVENT_TYPE.SCROLL_DEPTH,
    section_view: EVENT_TYPE.SECTION_VIEW,
    section_time: EVENT_TYPE.SECTION_TIME,
    conversion: EVENT_TYPE.CONVERSION,
    funnel_step: EVENT_TYPE.FUNNEL_STEP,
    click: EVENT_TYPE.CLICK,
    form_submit: EVENT_TYPE.FORM_SUBMIT,
    download: EVENT_TYPE.DOWNLOAD,
    custom: EVENT_TYPE.CUSTOM,
    custom_event: EVENT_TYPE.CUSTOM,
    session_start: EVENT_TYPE.SESSION_START,
    session_end: EVENT_TYPE.SESSION_END,
  };

  return mapping[type.toLowerCase()] || EVENT_TYPE.CUSTOM;
}

/**
 * Maps Prisma EventType enum to internal type string.
 */
export function fromEventType(type: EventType): string {
  const mapping: Record<EventType, string> = {
    [EVENT_TYPE.PAGE_VIEW]: 'page_view',
    [EVENT_TYPE.PAGE_EXIT]: 'page_exit',
    [EVENT_TYPE.SCROLL_DEPTH]: 'scroll_depth',
    [EVENT_TYPE.SECTION_VIEW]: 'section_view',
    [EVENT_TYPE.SECTION_TIME]: 'section_time',
    [EVENT_TYPE.CONVERSION]: 'conversion',
    [EVENT_TYPE.FUNNEL_STEP]: 'funnel_step',
    [EVENT_TYPE.CLICK]: 'click',
    [EVENT_TYPE.FORM_SUBMIT]: 'form_submit',
    [EVENT_TYPE.DOWNLOAD]: 'download',
    [EVENT_TYPE.CUSTOM]: 'custom',
    [EVENT_TYPE.SESSION_START]: 'session_start',
    [EVENT_TYPE.SESSION_END]: 'session_end',
  };

  return mapping[type] || 'custom';
}

// =============================================================================
// DATE HELPERS
// =============================================================================

/**
 * Builds a Prisma date filter for createdAt field.
 */
export function buildDateFilter(
  startDate?: string,
  endDate?: string
): {
  createdAt?: { gte?: Date; lte?: Date };
} {
  if (!startDate && !endDate) {
    return {};
  }

  const filter: { createdAt: { gte?: Date; lte?: Date } } = {
    createdAt: {},
  };

  if (startDate) {
    filter.createdAt.gte = new Date(startDate);
  }
  if (endDate) {
    filter.createdAt.lte = new Date(endDate);
  }

  return filter;
}

// =============================================================================
// DATA EXTRACTION FROM JSON
// =============================================================================

/**
 * Safely extracts a value from a JSON data object.
 */
export function extractFromData<T>(data: unknown, key: string, defaultValue: T): T {
  if (data && typeof data === 'object' && key in data) {
    return (data as Record<string, unknown>)[key] as T;
  }
  return defaultValue;
}

/**
 * Extracts multiple values from a JSON data object.
 */
export function extractDataFields<T extends Record<string, unknown>>(
  data: unknown,
  keys: (keyof T)[]
): Partial<T> {
  const result: Partial<T> = {};

  if (data && typeof data === 'object') {
    const dataObj = data as Record<string, unknown>;
    for (const key of keys) {
      if (key in dataObj) {
        result[key] = dataObj[key as string] as T[keyof T];
      }
    }
  }

  return result;
}

// =============================================================================
// ANALYTICS EVENT DATA BUILDERS
// =============================================================================

/**
 * Builds page visit data object for storing in AnalyticsEvent.data
 */
export function buildPageVisitData(params: {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrerDomain?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  isBot?: boolean;
  isLandingPage?: boolean;
  scrollDepthPercent?: number;
  timeOnPage?: number;
}): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (params.referrer !== undefined) data.referrer = params.referrer;
  if (params.utmSource !== undefined) data.utmSource = params.utmSource;
  if (params.utmMedium !== undefined) data.utmMedium = params.utmMedium;
  if (params.utmCampaign !== undefined) data.utmCampaign = params.utmCampaign;
  if (params.utmTerm !== undefined) data.utmTerm = params.utmTerm;
  if (params.utmContent !== undefined) data.utmContent = params.utmContent;
  if (params.referrerDomain !== undefined) data.referrerDomain = params.referrerDomain;
  if (params.deviceType !== undefined) data.deviceType = params.deviceType;
  if (params.browser !== undefined) data.browser = params.browser;
  if (params.os !== undefined) data.os = params.os;
  if (params.isBot !== undefined) data.isBot = params.isBot;
  if (params.isLandingPage !== undefined) data.isLandingPage = params.isLandingPage;
  if (params.scrollDepthPercent !== undefined) data.scrollDepthPercent = params.scrollDepthPercent;
  if (params.timeOnPage !== undefined) data.timeOnPage = params.timeOnPage;

  return data;
}

/**
 * Builds page exit data object for storing in AnalyticsEvent.data
 */
export function buildPageExitData(params: {
  timeOnPage: number;
  scrollDepthPercent: number;
  engagementScore?: number;
}): Record<string, unknown> {
  return {
    timeOnPage: params.timeOnPage,
    scrollDepthPercent: params.scrollDepthPercent,
    ...(params.engagementScore !== undefined && {
      engagementScore: params.engagementScore,
    }),
  };
}

/**
 * Builds section time data object for storing in AnalyticsEvent.data
 */
export function buildSectionTimeData(params: {
  sectionId?: string;
  sectionName: string;
  timeSpent: number;
}): Record<string, unknown> {
  return {
    sectionId: params.sectionId,
    sectionName: params.sectionName,
    timeSpent: params.timeSpent,
  };
}

/**
 * Builds conversion data object for storing in AnalyticsEvent.data
 */
export function buildConversionData(params: {
  conversionType: string;
  stepName: string;
  completed: boolean;
  value?: number;
  metadata?: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    conversionType: params.conversionType,
    stepName: params.stepName,
    completed: params.completed,
    ...(params.value !== undefined && { value: params.value }),
    ...(params.metadata && { metadata: params.metadata }),
  };
}

/**
 * Builds funnel step data object for storing in AnalyticsEvent.data
 */
export function buildFunnelStepData(params: {
  funnelName: string;
  stepName: string;
  stepOrder: number;
  metadata?: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    funnelName: params.funnelName,
    stepName: params.stepName,
    stepOrder: params.stepOrder,
    ...(params.metadata && { metadata: params.metadata }),
  };
}

/**
 * Builds custom event data object for storing in AnalyticsEvent.data
 */
export function buildCustomEventData(params: {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    category: params.category,
    action: params.action,
    ...(params.label !== undefined && { label: params.label }),
    ...(params.value !== undefined && { value: params.value }),
    ...(params.metadata && { metadata: params.metadata }),
  };
}

// =============================================================================
// TYPE DEFINITIONS FOR EXTRACTED DATA
// =============================================================================

export interface PageVisitDataExtracted {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrerDomain?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  isBot: boolean;
  isLandingPage?: boolean;
  scrollDepthPercent?: number;
  timeOnPage?: number;
}

export interface SectionTimeDataExtracted {
  sectionId?: string;
  sectionName: string;
  timeSpent: number;
}

export interface ConversionDataExtracted {
  conversionType: 'appointment_request' | 'seminar_registration' | 'contact_form';
  stepName: string;
  completed: boolean;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface FunnelStepDataExtracted {
  funnelName: string;
  stepName: string;
  stepOrder: number;
  metadata?: Record<string, unknown>;
}

export interface CustomEventDataExtracted {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}
