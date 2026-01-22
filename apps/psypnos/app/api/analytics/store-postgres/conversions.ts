// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * PostgreSQL Conversion Event Operations
 */

import { prisma } from "@/lib/db/prisma";
import { invalidateDashboardCache } from "@/lib/cache/redis";
import type { ConversionEvent } from "../store/types";
import { toPrismaJson } from "./utils";

// Type alias for where input (workaround for ungenerated Prisma client)
type ConversionEventWhereInput = {
  timestamp?: { gte?: Date; lte?: Date };
};

/**
 * Prisma ConversionEvent record type.
 * Prisma uses `null` for absent optional values, while our ConversionEvent type uses `undefined`.
 */
interface ConversionEventRecord {
  id: string;
  timestamp: Date;
  sessionId: string;
  eventType: string;
  stepName: string;
  completed: boolean;
  metadata: unknown;
}

/**
 * Convert a Prisma ConversionEventRecord to our application ConversionEvent type.
 * This handles the null → undefined conversion for optional fields.
 */
function toConversionEvent(record: ConversionEventRecord): ConversionEvent {
  return {
    id: record.id,
    timestamp: record.timestamp.toISOString(),
    sessionId: record.sessionId,
    eventType: record.eventType as "appointment_request" | "seminar_registration" | "contact_form",
    stepName: record.stepName,
    completed: record.completed,
    metadata: (record.metadata as Record<string, unknown>) ?? undefined,
  };
}

export async function trackConversionEvent(event: {
  timestamp: string;
  sessionId: string;
  eventType: "appointment_request" | "seminar_registration" | "contact_form";
  stepName: string;
  completed: boolean;
  metadata?: Record<string, unknown>;
}): Promise<ConversionEvent> {
  const result = await prisma.conversionEvent.create({
    data: {
      timestamp: new Date(event.timestamp),
      sessionId: event.sessionId,
      eventType: event.eventType,
      stepName: event.stepName,
      completed: event.completed,
      metadata: toPrismaJson(event.metadata),
    },
  });

  await invalidateDashboardCache();

  return toConversionEvent(result as ConversionEventRecord);
}

export async function getConversionEvents(
  startDate?: string,
  endDate?: string,
): Promise<ConversionEvent[]> {
  const where: ConversionEventWhereInput = {};

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const events = await prisma.conversionEvent.findMany({
    where,
    orderBy: { timestamp: "desc" },
  });

  return (events as ConversionEventRecord[]).map(toConversionEvent);
}
