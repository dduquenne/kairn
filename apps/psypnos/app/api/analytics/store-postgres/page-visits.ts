/**
 * PostgreSQL Page Visit Operations
 *
 * Uses the unified AnalyticsEvent model with EventType.PAGE_VIEW
 * Page visit data is stored in the `data` JSON field.
 */

import { prisma } from "@/lib/db/prisma";
import { EventType } from "@prisma/client";
import { invalidateDashboardCache } from "@/lib/cache/redis";
import type { PageVisit } from "../store/types";
import {
  toPrismaJson,
  buildPageVisitData,
  buildDateFilter,
  extractFromData,
  getCurrentSiteId,
} from "./utils";

/**
 * Converts an AnalyticsEvent record to PageVisit type
 */
function toPageVisit(record: {
  id: string;
  createdAt: Date;
  sessionId: string | null;
  path: string;
  referrer: string | null;
  userAgent: string | null;
  data: unknown;
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

/**
 * Track a page visit
 */
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

  // Build the data object for JSON storage
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

  const result = await prisma.analyticsEvent.create({
    data: {
      type: EventType.PAGE_VIEW,
      path: pageVisit.page,
      sessionId: pageVisit.sessionId,
      userAgent: pageVisit.userAgent,
      referrer: pageVisit.referrer,
      data: toPrismaJson(eventData),
      createdAt: new Date(pageVisit.timestamp),
      siteId,
    },
  });

  await invalidateDashboardCache();

  return toPageVisit(result);
}

/**
 * Get page visits within a date range
 */
export async function getPageVisits(
  startDate?: string,
  endDate?: string
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
  });

  return visits.map(toPageVisit);
}

/**
 * Get page visits for a specific session
 */
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
 * Get unique page paths with visit counts
 */
export async function getTopPages(
  startDate?: string,
  endDate?: string,
  limit: number = 10
): Promise<Array<{ page: string; visits: number; uniqueSessions: number }>> {
  const siteId = getCurrentSiteId();
  const dateFilter = buildDateFilter(startDate, endDate);

  const visits = await prisma.analyticsEvent.findMany({
    where: {
      siteId,
      type: EventType.PAGE_VIEW,
      ...dateFilter,
    },
    select: {
      path: true,
      sessionId: true,
    },
  });

  // Aggregate by page
  const pageStats = new Map<string, { visits: number; sessions: Set<string> }>();

  for (const visit of visits) {
    const stats = pageStats.get(visit.path) || { visits: 0, sessions: new Set<string>() };
    stats.visits++;
    if (visit.sessionId) {
      stats.sessions.add(visit.sessionId);
    }
    pageStats.set(visit.path, stats);
  }

  // Convert to array and sort
  const result = Array.from(pageStats.entries())
    .map(([page, stats]) => ({
      page,
      visits: stats.visits,
      uniqueSessions: stats.sessions.size,
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, limit);

  return result;
}
