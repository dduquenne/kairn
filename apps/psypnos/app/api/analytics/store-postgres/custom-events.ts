// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * PostgreSQL Custom Event Operations
 */

import { prisma } from "@/lib/db/prisma";
import type { CustomEvent } from "../store/types";
import { toPrismaJson } from "./utils";

// Type alias for where input (workaround for ungenerated Prisma client)
type CustomEventWhereInput = {
  timestamp?: { gte?: Date; lte?: Date };
  category?: string;
  action?: string;
};

/**
 * Prisma CustomEvent record type.
 * Prisma uses `null` for absent optional values, while our CustomEvent type uses `undefined`.
 */
interface CustomEventRecord {
  id: string;
  timestamp: Date;
  sessionId: string;
  category: string;
  action: string;
  label: string | null;
  value: number | null;
  metadata: unknown;
}

/**
 * Convert a Prisma CustomEventRecord to our application CustomEvent type.
 * This handles the null → undefined conversion for optional fields.
 */
function toCustomEvent(record: CustomEventRecord): CustomEvent {
  return {
    id: record.id,
    timestamp: record.timestamp.toISOString(),
    sessionId: record.sessionId,
    category: record.category,
    action: record.action,
    label: record.label ?? undefined,
    value: record.value ?? undefined,
    metadata: (record.metadata as Record<string, unknown>) ?? undefined,
  };
}

export async function trackCustomEvent(event: {
  timestamp: string;
  sessionId: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}): Promise<CustomEvent> {
  const result = await prisma.customEvent.create({
    data: {
      timestamp: new Date(event.timestamp),
      sessionId: event.sessionId,
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value,
      metadata: toPrismaJson(event.metadata),
    },
  });

  return toCustomEvent(result as CustomEventRecord);
}

export async function getCustomEvents(
  startDate?: string,
  endDate?: string,
  category?: string,
  action?: string,
): Promise<CustomEvent[]> {
  const where: CustomEventWhereInput = {};

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  if (category) where.category = category;
  if (action) where.action = action;

  const events = await prisma.customEvent.findMany({
    where,
    orderBy: { timestamp: "desc" },
  });

  return (events as CustomEventRecord[]).map(toCustomEvent);
}

export async function getCustomEventsSummary(startDate?: string, endDate?: string) {
  const events = await getCustomEvents(startDate, endDate);

  const uniqueSessions = new Set(events.map((e) => e.sessionId)).size;

  const byCategory: Record<string, { count: number; value: number }> = {};
  const byAction: Record<string, { count: number; value: number }> = {};
  const eventCounts = new Map<
    string,
    { count: number; totalValue: number; category: string; action: string; label?: string }
  >();

  events.forEach((event) => {
    if (!byCategory[event.category]) {
      byCategory[event.category] = { count: 0, value: 0 };
    }
    byCategory[event.category].count++;
    byCategory[event.category].value += event.value || 0;

    if (!byAction[event.action]) {
      byAction[event.action] = { count: 0, value: 0 };
    }
    byAction[event.action].count++;
    byAction[event.action].value += event.value || 0;

    const key = `${event.category}|${event.action}|${event.label || ""}`;
    const current = eventCounts.get(key) || {
      count: 0,
      totalValue: 0,
      category: event.category,
      action: event.action,
      label: event.label ?? undefined,
    };
    current.count++;
    current.totalValue += event.value || 0;
    eventCounts.set(key, current);
  });

  const topEvents = Array.from(eventCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEvents: events.length,
    uniqueSessions,
    byCategory,
    byAction,
    topEvents,
  };
}
