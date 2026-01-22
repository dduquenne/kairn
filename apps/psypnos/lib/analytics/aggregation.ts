// @ts-nocheck
// TODO: Migration - Prisma/type incompatibilities to fix
/**
 * Analytics Aggregation Service
 * Phase 4: Scalability & Performance
 *
 * Pre-computes daily aggregations for faster dashboard loading.
 * Should be run via cron job daily.
 */

import { prisma, isDatabaseConnected } from "@/lib/db/prisma";

/**
 * Types locaux pour les records Prisma (évite les problèmes de génération Prisma)
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
  isBot: boolean | null;
}

interface ConversionEventRecord {
  id: string;
  timestamp: Date;
  sessionId: string;
  eventType: string;
  stepName: string;
  completed: boolean;
}

interface SectionTimeRecord {
  id: string;
  timestamp: Date;
  sessionId: string;
  section: string;
  timeSpent: number;
}

interface VisitSourceRecord {
  sessionId: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrerDomain: string | null;
}

interface SessionIdRecord {
  sessionId: string;
}

/**
 * Compute and store daily summary aggregations
 */
export async function computeDailySummary(date: Date = new Date()): Promise<void> {
  const isConnected = await isDatabaseConnected();
  if (!isConnected) {
    console.log("[Aggregation] Database not connected, skipping");
    return;
  }

  // Normalize to start of day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  console.log(`[Aggregation] Computing summary for ${dayStart.toISOString().split("T")[0]}`);

  // Get all visits for the day
  const visits = await prisma.pageVisit.findMany({
    where: {
      timestamp: { gte: dayStart, lt: dayEnd },
      isBot: false,
    },
  });

  const sessions = new Set(visits.map((v: PageVisitRecord) => v.sessionId));
  const uniqueSessions = sessions.size;
  const totalVisits = visits.length;

  // Device breakdown
  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  visits.forEach((v: PageVisitRecord) => {
    if (v.deviceType === "mobile") deviceCounts.mobile++;
    else if (v.deviceType === "tablet") deviceCounts.tablet++;
    else deviceCounts.desktop++;
  });

  // Average time on page
  const timesWithValue = visits.filter((v: PageVisitRecord) => v.timeOnPage != null);
  const avgTimeOnPage =
    timesWithValue.length > 0
      ? timesWithValue.reduce((sum: number, v: PageVisitRecord) => sum + (v.timeOnPage || 0), 0) /
        timesWithValue.length
      : null;

  // Conversions
  const conversions = await prisma.conversionEvent.count({
    where: {
      timestamp: { gte: dayStart, lt: dayEnd },
      completed: true,
    },
  });

  // Bounce rate (sessions with only 1 page view)
  const sessionPageCounts = new Map<string, number>();
  visits.forEach((v: PageVisitRecord) => {
    sessionPageCounts.set(v.sessionId, (sessionPageCounts.get(v.sessionId) || 0) + 1);
  });
  const bouncedSessions = Array.from(sessionPageCounts.values()).filter(
    (count) => count === 1
  ).length;
  const bounceRate = uniqueSessions > 0 ? (bouncedSessions / uniqueSessions) * 100 : null;

  // Conversion rate
  const conversionRate = uniqueSessions > 0 ? (conversions / uniqueSessions) * 100 : null;

  // Upsert daily summary
  await prisma.dailySummary.upsert({
    where: { date: dayStart },
    update: {
      totalVisits,
      uniqueSessions,
      avgTimeOnPage,
      mobileSessions: deviceCounts.mobile,
      desktopSessions: deviceCounts.desktop,
      tabletSessions: deviceCounts.tablet,
      totalConversions: conversions,
      conversionRate,
      bounceRate,
      updatedAt: new Date(),
    },
    create: {
      date: dayStart,
      totalVisits,
      uniqueSessions,
      avgTimeOnPage,
      mobileSessions: deviceCounts.mobile,
      desktopSessions: deviceCounts.desktop,
      tabletSessions: deviceCounts.tablet,
      totalConversions: conversions,
      conversionRate,
      bounceRate,
    },
  });

  console.log(`[Aggregation] Daily summary saved: ${totalVisits} visits, ${uniqueSessions} sessions`);
}

/**
 * Compute and store traffic source summary for a day
 */
export async function computeTrafficSourceSummary(date: Date = new Date()): Promise<void> {
  const isConnected = await isDatabaseConnected();
  if (!isConnected) return;

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  console.log(`[Aggregation] Computing traffic sources for ${dayStart.toISOString().split("T")[0]}`);

  const visits = await prisma.pageVisit.findMany({
    where: {
      timestamp: { gte: dayStart, lt: dayEnd },
      isBot: false,
    },
    select: {
      sessionId: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      referrerDomain: true,
    },
  });

  const conversions = await prisma.conversionEvent.findMany({
    where: {
      timestamp: { gte: dayStart, lt: dayEnd },
      completed: true,
    },
    select: { sessionId: true },
  });

  const convertingSessions = new Set(conversions.map((c: SessionIdRecord) => c.sessionId));

  // Group by source/medium/campaign
  const sourceMap = new Map<
    string,
    { visits: number; sessions: Set<string>; conversions: number }
  >();

  visits.forEach((v: VisitSourceRecord) => {
    const source = v.utmSource || v.referrerDomain || "direct";
    const medium = v.utmMedium || "none";
    const campaign = v.utmCampaign || "";
    const key = `${source}|${medium}|${campaign}`;

    if (!sourceMap.has(key)) {
      sourceMap.set(key, { visits: 0, sessions: new Set(), conversions: 0 });
    }

    const data = sourceMap.get(key)!;
    data.visits++;
    data.sessions.add(v.sessionId);
  });

  // Count conversions per source
  sourceMap.forEach((data) => {
    data.sessions.forEach((sessionId) => {
      if (convertingSessions.has(sessionId)) {
        data.conversions++;
      }
    });
  });

  // Delete existing entries for the day
  await prisma.trafficSourceSummary.deleteMany({
    where: { date: dayStart },
  });

  // Insert new entries
  const records = Array.from(sourceMap.entries()).map(([key, data]) => {
    const [source, medium, campaign] = key.split("|");
    return {
      date: dayStart,
      source,
      medium,
      campaign: campaign || null,
      visits: data.visits,
      uniqueSessions: data.sessions.size,
      conversions: data.conversions,
      conversionRate:
        data.sessions.size > 0 ? (data.conversions / data.sessions.size) * 100 : null,
    };
  });

  if (records.length > 0) {
    await prisma.trafficSourceSummary.createMany({ data: records });
  }

  console.log(`[Aggregation] Traffic sources saved: ${records.length} sources`);
}

/**
 * Compute and store section engagement summary for a day
 */
export async function computeSectionSummary(date: Date = new Date()): Promise<void> {
  const isConnected = await isDatabaseConnected();
  if (!isConnected) return;

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  console.log(`[Aggregation] Computing section summary for ${dayStart.toISOString().split("T")[0]}`);

  // Get visits and section times
  const visits = await prisma.pageVisit.findMany({
    where: {
      timestamp: { gte: dayStart, lt: dayEnd },
      isBot: false,
    },
    select: { sessionId: true },
  });

  const totalSessions = new Set(visits.map((v: SessionIdRecord) => v.sessionId)).size;

  const sectionTimes = await prisma.sectionTime.findMany({
    where: {
      timestamp: { gte: dayStart, lt: dayEnd },
    },
  });

  const conversions = await prisma.conversionEvent.findMany({
    where: {
      timestamp: { gte: dayStart, lt: dayEnd },
      completed: true,
    },
    select: { sessionId: true },
  });

  const convertingSessions = new Set(conversions.map((c: SessionIdRecord) => c.sessionId));

  // Group by section
  const sectionMap = new Map<
    string,
    { sessions: Set<string>; totalTime: number; count: number }
  >();

  sectionTimes.forEach((st: SectionTimeRecord) => {
    if (!sectionMap.has(st.section)) {
      sectionMap.set(st.section, { sessions: new Set(), totalTime: 0, count: 0 });
    }

    const data = sectionMap.get(st.section)!;
    data.sessions.add(st.sessionId);
    data.totalTime += st.timeSpent;
    data.count++;
  });

  // Delete existing entries
  await prisma.sectionSummary.deleteMany({
    where: { date: dayStart },
  });

  // Insert new entries
  const records = Array.from(sectionMap.entries()).map(([section, data]) => {
    let conversionsFromSection = 0;
    data.sessions.forEach((sessionId) => {
      if (convertingSessions.has(sessionId)) {
        conversionsFromSection++;
      }
    });

    return {
      date: dayStart,
      section,
      visitors: data.sessions.size,
      totalTime: data.totalTime,
      avgTime: data.count > 0 ? data.totalTime / data.count : 0,
      scrollRate: totalSessions > 0 ? (data.sessions.size / totalSessions) * 100 : 0,
      conversions: conversionsFromSection,
    };
  });

  if (records.length > 0) {
    await prisma.sectionSummary.createMany({ data: records });
  }

  console.log(`[Aggregation] Section summary saved: ${records.length} sections`);
}

/**
 * Run all daily aggregations
 */
export async function runDailyAggregations(date: Date = new Date()): Promise<void> {
  console.log("[Aggregation] Starting daily aggregations...");
  const start = Date.now();

  try {
    await computeDailySummary(date);
    await computeTrafficSourceSummary(date);
    await computeSectionSummary(date);

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`[Aggregation] Completed in ${duration}s`);
  } catch (error) {
    console.error("[Aggregation] Error:", error);
    throw error;
  }
}

/**
 * Backfill aggregations for a date range
 */
export async function backfillAggregations(
  startDate: Date,
  endDate: Date = new Date()
): Promise<void> {
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  console.log(
    `[Aggregation] Backfilling from ${current.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]}`
  );

  while (current <= end) {
    await runDailyAggregations(current);
    current.setDate(current.getDate() + 1);
  }

  console.log("[Aggregation] Backfill complete");
}

/**
 * Get pre-computed daily summaries for a date range
 */
export async function getDailySummaries(startDate: Date, endDate: Date) {
  return prisma.dailySummary.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });
}

/**
 * Get pre-computed traffic source summaries for a date range
 */
export async function getTrafficSourceSummaries(startDate: Date, endDate: Date) {
  return prisma.trafficSourceSummary.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: [{ date: "asc" }, { visits: "desc" }],
  });
}

/**
 * Get pre-computed section summaries for a date range
 */
export async function getSectionSummaries(startDate: Date, endDate: Date) {
  return prisma.sectionSummary.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: [{ date: "asc" }, { visitors: "desc" }],
  });
}
