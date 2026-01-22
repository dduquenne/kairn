// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * PostgreSQL Page Visit Operations
 */

import { prisma } from "@/lib/db/prisma";
import { invalidateDashboardCache } from "@/lib/cache/redis";
import type { PageVisit } from "../store/types";

// Type alias for where input (workaround for ungenerated Prisma client)
type PageVisitWhereInput = {
  timestamp?: { gte?: Date; lte?: Date };
};

/**
 * Prisma PageVisit record type.
 * Prisma uses `null` for absent optional values, while our PageVisit type uses `undefined`.
 */
interface PageVisitRecord {
  id: string;
  timestamp: Date;
  sessionId: string;
  page: string;
  referrer: string | null;
  userAgent: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  referrerDomain: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  scrollDepthPercent: number | null;
  timeOnPage: number | null;
  isBot: boolean;
}

/**
 * Convert a Prisma PageVisitRecord to our application PageVisit type.
 * This handles the null → undefined conversion for optional fields.
 */
function toPageVisit(record: PageVisitRecord): PageVisit {
  return {
    id: record.id,
    timestamp: record.timestamp.toISOString(),
    sessionId: record.sessionId,
    page: record.page,
    referrer: record.referrer ?? undefined,
    userAgent: record.userAgent ?? undefined,
    utmSource: record.utmSource ?? undefined,
    utmMedium: record.utmMedium ?? undefined,
    utmCampaign: record.utmCampaign ?? undefined,
    utmTerm: record.utmTerm ?? undefined,
    utmContent: record.utmContent ?? undefined,
    referrerDomain: record.referrerDomain ?? undefined,
    deviceType: (record.deviceType as "mobile" | "tablet" | "desktop") ?? undefined,
    browser: record.browser ?? undefined,
    os: record.os ?? undefined,
    scrollDepthPercent: record.scrollDepthPercent ?? undefined,
    timeOnPage: record.timeOnPage ?? undefined,
    isBot: record.isBot,
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
  const result = await prisma.pageVisit.create({
    data: {
      timestamp: new Date(pageVisit.timestamp),
      sessionId: pageVisit.sessionId,
      page: pageVisit.page,
      referrer: pageVisit.referrer,
      userAgent: pageVisit.userAgent,
      utmSource: pageVisit.utmSource,
      utmMedium: pageVisit.utmMedium,
      utmCampaign: pageVisit.utmCampaign,
      utmTerm: pageVisit.utmTerm,
      utmContent: pageVisit.utmContent,
      referrerDomain: pageVisit.referrerDomain,
      deviceType: pageVisit.deviceType,
      browser: pageVisit.browser,
      os: pageVisit.os,
      scrollDepthPercent: pageVisit.scrollDepthPercent,
      timeOnPage: pageVisit.timeOnPage,
      isBot: pageVisit.isBot ?? false,
    },
  });

  await invalidateDashboardCache();

  return toPageVisit(result as PageVisitRecord);
}

export async function getPageVisits(
  startDate?: string,
  endDate?: string,
): Promise<PageVisit[]> {
  const where: PageVisitWhereInput = {};

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const visits = await prisma.pageVisit.findMany({
    where,
    orderBy: { timestamp: "desc" },
  });

  return (visits as PageVisitRecord[]).map(toPageVisit);
}
