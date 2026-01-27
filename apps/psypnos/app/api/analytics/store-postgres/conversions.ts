/**
 * PostgreSQL Conversion Event Operations
 *
 * Uses the unified AnalyticsEvent model with EventType.CONVERSION
 * Conversion data is stored in the `data` JSON field.
 */

import { prisma } from "@/lib/db/prisma";
import { EventType } from "@prisma/client";
import { invalidateDashboardCache } from "@/lib/cache/redis";
import type { ConversionEvent } from "../store/types";
import {
  toPrismaJson,
  buildConversionData,
  buildDateFilter,
  extractFromData,
  getCurrentSiteId,
} from "./utils";

/**
 * Converts an AnalyticsEvent record to ConversionEvent type
 */
function toConversionEvent(record: {
  id: string;
  createdAt: Date;
  sessionId: string | null;
  name: string | null;
  data: unknown;
}): ConversionEvent {
  const data = (record.data as Record<string, unknown>) || {};

  return {
    id: record.id,
    timestamp: record.createdAt.toISOString(),
    sessionId: record.sessionId || "",
    eventType: extractFromData<"appointment_request" | "seminar_registration" | "contact_form">(
      data,
      "conversionType",
      "contact_form"
    ),
    stepName: extractFromData<string>(data, "stepName", "unknown"),
    completed: extractFromData<boolean>(data, "completed", false),
    metadata: extractFromData<Record<string, unknown> | undefined>(data, "metadata", undefined),
  };
}

/**
 * Track a conversion event
 */
export async function trackConversionEvent(event: {
  timestamp: string;
  sessionId: string;
  eventType: "appointment_request" | "seminar_registration" | "contact_form";
  stepName: string;
  completed: boolean;
  metadata?: Record<string, unknown>;
}): Promise<ConversionEvent> {
  const siteId = getCurrentSiteId();

  // Build the data object for JSON storage
  const eventData = buildConversionData({
    conversionType: event.eventType,
    stepName: event.stepName,
    completed: event.completed,
    metadata: event.metadata,
  });

  const result = await prisma.analyticsEvent.create({
    data: {
      type: EventType.CONVERSION,
      path: "/",
      name: event.eventType,
      sessionId: event.sessionId,
      data: toPrismaJson(eventData),
      createdAt: new Date(event.timestamp),
      siteId,
    },
  });

  await invalidateDashboardCache();

  return toConversionEvent(result);
}

/**
 * Get conversion events within a date range
 */
export async function getConversionEvents(
  startDate?: string,
  endDate?: string
): Promise<ConversionEvent[]> {
  const siteId = getCurrentSiteId();
  const dateFilter = buildDateFilter(startDate, endDate);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      siteId,
      type: EventType.CONVERSION,
      ...dateFilter,
    },
    orderBy: { createdAt: "desc" },
  });

  return events.map(toConversionEvent);
}

/**
 * Get conversion statistics by type
 */
export async function getConversionStats(
  startDate?: string,
  endDate?: string
): Promise<{
  total: number;
  completed: number;
  byType: Record<string, { total: number; completed: number; rate: number }>;
}> {
  const siteId = getCurrentSiteId();
  const dateFilter = buildDateFilter(startDate, endDate);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      siteId,
      type: EventType.CONVERSION,
      ...dateFilter,
    },
    select: {
      name: true,
      data: true,
    },
  });

  const byType: Record<string, { total: number; completed: number }> = {};
  let total = 0;
  let completed = 0;

  for (const event of events) {
    const data = (event.data as Record<string, unknown>) || {};
    const conversionType = event.name || extractFromData<string>(data, "conversionType", "unknown");
    const isCompleted = extractFromData<boolean>(data, "completed", false);

    if (!byType[conversionType]) {
      byType[conversionType] = { total: 0, completed: 0 };
    }

    byType[conversionType].total++;
    total++;

    if (isCompleted) {
      byType[conversionType].completed++;
      completed++;
    }
  }

  // Calculate rates
  const byTypeWithRates: Record<string, { total: number; completed: number; rate: number }> = {};
  for (const [type, stats] of Object.entries(byType)) {
    byTypeWithRates[type] = {
      ...stats,
      rate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
    };
  }

  return {
    total,
    completed,
    byType: byTypeWithRates,
  };
}
