/**
 * PostgreSQL Page Visit Operations
 *
 * Uses the unified AnalyticsEvent model with EventType.PAGE_VIEW
 * Page visit data is stored in the `data` JSON field.
 */

import { EventType, Prisma } from "@prisma/client";

import { invalidateDashboardCache } from "@/lib/cache/redis";
import { prisma } from "@/lib/db/prisma";

import type { PageVisit } from "../store/types";

import {
  toPrismaJson,
  buildPageVisitData,
  buildDateFilter,
  extractFromData,
  getCurrentSiteId,
} from "./utils";

const DEFAULT_PAGE_LIMIT = 10_000;

function toPageVisit(record: {
  id: string;
  createdAt: Date;
  sessionId: string | null;
  path: string;
  referrer: string | null;
  userAgent: string | null;
  data: Prisma.JsonValue;
}): PageVisit {
  const data = (record.data as Record<string, unknown>) || {};

  return {
    id: record.id,
    timestamp: record.createdAt.toISOString(),
    sessionId: record.sessionId || "",
    page: record.path,
    referrer: record.referrer ?? undefined,
    userAgent: record.userAgent ?? undefined,
    utmSource: extractFromData<string | undefined>(data, "utmSource", undefined),
    utmMedium: extractFromData<string | undefined>(data, "utmMedium", undefined),
    utmCampaign: extractFromData<string | undefined>(data, "utmCampaign", undefined),
    utmTerm: extractFromData<string | undefined>(data, "utmTerm", undefined),
    utmContent: extractFromData<string | undefined>(data, "utmContent", undefined),
    referrerDomain: extractFromData<string | undefined>(data, "referrerDomain", undefined),
    deviceType: extractFromData<"mobile" | "tablet" | "desktop" | undefined>(data, "deviceType", undefined),
    browser: extractFromData<string | undefined>(data, "browser", undefined),
    os: extractFromData<string | undefined>(data, "os", undefined),
    scrollDepthPercent: extractFromData<number | undefined>(data, "scrollDepthPercent", undefined),
    timeOnPage: extractFromData<number | undefined>(data, "timeOnPage", undefined),
    isBot: extractFromData<boolean>(data, "isBot", false),
  };
}

export async function trackPageVisit(pageVisit: {
  timestamp: string;
  sessionId: string;
  page: string;
  referrer?: string;
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrerDomain?: string;
  deviceType?: "mobile" | "tablet" | "desktop";
  browser?: string;
  os?: string;
  scrollDepthPercent?: number;
  timeOnPage?: number;
  isBot?: boolean;
}): Promise<PageVisit> {
  const siteId = getCurrentSiteId();

  const eventData = buildPageVisitData({
    referrer: pageVisit.referrer,
    utmSource: pageVisit.utmSource,
    utmMedium: pageVisit.utmMedium,
    utmCampaign: pageVisit.utmCampaign,
    utmTerm: pageVisit.utmTerm,
    utmContent: pageVisit.utmContent,
    referrerDomain: pageVisit.referrerDomain,
    deviceType: pageVisit.deviceType,
    browser: pageVisit.browser,
    os: pageVisit.os,
    isBot: pageVisit.isBot,
    scrollDepthPercent: pageVisit.scrollDepthPercent,
    timeOnPage: pageVisit.timeOnPage,
  });

  const createdAt = new Date(pageVisit.timestamp);
  if (isNaN(createdAt.getTime())) {
    throw new Error(`Invalid timestamp: ${pageVisit.timestamp}`);
  }

  const result = await prisma.analyticsEvent.create({
    data: {
      type: EventType.PAGE_VIEW,
      path: pageVisit.page,
      sessionId: pageVisit.sessionId,
      userAgent: pageVisit.userAgent,
      referrer: pageVisit.referrer,
      data: toPrismaJson(eventData),
      createdAt,
      siteId,
    },
  });

  await invalidateDashboardCache();

  return toPageVisit(result);
}

/**
 * Get page visits within a date range (with pagination)
 */
export async function getPageVisits(
  startDate?: string,
  endDate?: string,
  limit: number = DEFAULT_PAGE_LIMIT
): Promise<PageVisit[]> {
  const siteId = getCurrentSiteId();
  const dateFilter = buildDateFilter(startDate, endDate);

  const visits = await prisma.analyticsEvent.findMany({
    where: {
      siteId,
      type: EventType.PAGE_VIEW,
      ...dateFilter,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return visits.map(toPageVisit);
}

export async function getPageVisitsBySession(sessionId: string): Promise<PageVisit[]> {
  const siteId = getCurrentSiteId();

  const visits = await prisma.analyticsEvent.findMany({
    where: {
      siteId,
      type: EventType.PAGE_VIEW,
      sessionId,
    },
    orderBy: { createdAt: "asc" },
  });

  return visits.map(toPageVisit);
}

/**
 * Get unique page paths with visit counts using SQL aggregation
 */
export async function getTopPages(
  startDate?: string,
  endDate?: string,
  limit: number = 10
): Promise<Array<{ page: string; visits: number; uniqueSessions: number }>> {
  const siteId = getCurrentSiteId();

  // Build parameterized SQL query for safe aggregation
  const params: unknown[] = [siteId, 'PAGE_VIEW'];
  const conditions: string[] = [
    `"siteId" = $1`,
    `"type"::"text" = $2`,
  ];

  if (startDate) {
    params.push(new Date(startDate));
    conditions.push(`"createdAt" >= $${params.length}`);
  }
  if (endDate) {
    params.push(new Date(endDate));
    conditions.push(`"createdAt" <= $${params.length}`);
  }

  params.push(limit);

  const result = await prisma.$queryRawUnsafe<
    Array<{ page: string; visits: bigint; unique_sessions: bigint }>
  >(
    `SELECT "path" as page,
            COUNT(*) as visits,
            COUNT(DISTINCT "sessionId") as unique_sessions
     FROM "AnalyticsEvent"
     WHERE ${conditions.join(' AND ')}
     GROUP BY "path"
     ORDER BY visits DESC
     LIMIT $${params.length}`,
    ...params
  );

  return result.map((row) => ({
    page: row.page,
    visits: Number(row.visits),
    uniqueSessions: Number(row.unique_sessions),
  }));
}
