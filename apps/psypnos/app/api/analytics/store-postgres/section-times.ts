/**
 * PostgreSQL Section Time Operations
 *
 * Uses the unified AnalyticsEvent model with EventType.SECTION_TIME
 * Section time data is stored in the `data` JSON field.
 */

import { prisma } from "@/lib/db/prisma";
import { EventType } from "@prisma/client";
import type { SectionTime } from "../store/types";
import {
  toPrismaJson,
  buildSectionTimeData,
  buildDateFilter,
  extractFromData,
  getCurrentSiteId,
} from "./utils";

/**
 * Converts an AnalyticsEvent record to SectionTime type
 */
function toSectionTime(record: {
  id: string;
  createdAt: Date;
  sessionId: string | null;
  name: string | null;
  data: unknown;
}): SectionTime {
  const data = (record.data as Record<string, unknown>) || {};

  return {
    id: record.id,
    timestamp: record.createdAt.toISOString(),
    sessionId: record.sessionId || "",
    section: record.name || extractFromData<string>(data, "sectionName", "unknown"),
    timeSpent: extractFromData<number>(data, "timeSpent", 0),
  };
}

/**
 * Track time spent on a section
 */
export async function trackSectionTime(sectionTime: {
  timestamp: string;
  sessionId: string;
  section: string;
  timeSpent: number;
}): Promise<SectionTime> {
  const siteId = getCurrentSiteId();

  // Build the data object for JSON storage
  const eventData = buildSectionTimeData({
    sectionName: sectionTime.section,
    timeSpent: sectionTime.timeSpent,
  });

  const result = await prisma.analyticsEvent.create({
    data: {
      type: EventType.SECTION_TIME,
      path: "/", // Section events don't have a specific path
      name: sectionTime.section,
      sessionId: sectionTime.sessionId,
      data: toPrismaJson(eventData),
      createdAt: new Date(sectionTime.timestamp),
      siteId,
    },
  });

  return toSectionTime(result);
}

/**
 * Get section times within a date range
 */
export async function getSectionTimes(
  startDate?: string,
  endDate?: string
): Promise<SectionTime[]> {
  const siteId = getCurrentSiteId();
  const dateFilter = buildDateFilter(startDate, endDate);

  const times = await prisma.analyticsEvent.findMany({
    where: {
      siteId,
      type: EventType.SECTION_TIME,
      ...dateFilter,
    },
    orderBy: { createdAt: "desc" },
  });

  return times.map(toSectionTime);
}

/**
 * Get aggregated section time statistics
 */
export async function getSectionTimeStats(
  startDate?: string,
  endDate?: string
): Promise<Array<{
  section: string;
  totalTime: number;
  avgTime: number;
  viewCount: number;
  uniqueSessions: number;
}>> {
  const siteId = getCurrentSiteId();
  const dateFilter = buildDateFilter(startDate, endDate);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      siteId,
      type: EventType.SECTION_TIME,
      ...dateFilter,
    },
    select: {
      name: true,
      sessionId: true,
      data: true,
    },
  });

  // Aggregate by section
  const sectionStats = new Map<string, {
    totalTime: number;
    count: number;
    sessions: Set<string>;
  }>();

  for (const event of events) {
    const section = event.name || "unknown";
    const data = (event.data as Record<string, unknown>) || {};
    const timeSpent = extractFromData<number>(data, "timeSpent", 0);

    const stats = sectionStats.get(section) || {
      totalTime: 0,
      count: 0,
      sessions: new Set<string>(),
    };

    stats.totalTime += timeSpent;
    stats.count++;
    if (event.sessionId) {
      stats.sessions.add(event.sessionId);
    }

    sectionStats.set(section, stats);
  }

  // Convert to array
  return Array.from(sectionStats.entries())
    .map(([section, stats]) => ({
      section,
      totalTime: stats.totalTime,
      avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
      viewCount: stats.count,
      uniqueSessions: stats.sessions.size,
    }))
    .sort((a, b) => b.totalTime - a.totalTime);
}
