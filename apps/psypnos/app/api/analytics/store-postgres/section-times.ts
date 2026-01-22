// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * PostgreSQL Section Time Operations
 */

import { prisma } from "@/lib/db/prisma";
import type { SectionTime } from "../store/types";

// Type alias for where input (workaround for ungenerated Prisma client)
type SectionTimeWhereInput = {
  timestamp?: { gte?: Date; lte?: Date };
};

/**
 * Prisma SectionTime record type.
 */
interface SectionTimeRecord {
  id: string;
  timestamp: Date;
  sessionId: string;
  section: string;
  timeSpent: number;
}

/**
 * Convert a Prisma SectionTimeRecord to our application SectionTime type.
 */
function toSectionTime(record: SectionTimeRecord): SectionTime {
  return {
    id: record.id,
    timestamp: record.timestamp.toISOString(),
    sessionId: record.sessionId,
    section: record.section,
    timeSpent: record.timeSpent,
  };
}

export async function trackSectionTime(sectionTime: {
  timestamp: string;
  sessionId: string;
  section: string;
  timeSpent: number;
}): Promise<SectionTime> {
  const result = await prisma.sectionTime.create({
    data: {
      timestamp: new Date(sectionTime.timestamp),
      sessionId: sectionTime.sessionId,
      section: sectionTime.section,
      timeSpent: sectionTime.timeSpent,
    },
  });

  return toSectionTime(result as SectionTimeRecord);
}

export async function getSectionTimes(
  startDate?: string,
  endDate?: string,
): Promise<SectionTime[]> {
  const where: SectionTimeWhereInput = {};

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const times = await prisma.sectionTime.findMany({
    where,
    orderBy: { timestamp: "desc" },
  });

  return (times as SectionTimeRecord[]).map(toSectionTime);
}
