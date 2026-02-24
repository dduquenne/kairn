/**
 * PostgreSQL Custom Event Operations
 *
 * Uses the unified AnalyticsEvent model with EventType.CUSTOM
 * Custom event data is stored in the `data` JSON field.
 */

import { EventType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type { CustomEvent } from "../store/types";

import {
  toPrismaJson,
  buildCustomEventData,
  buildDateFilter,
  extractFromData,
  getCurrentSiteId,
} from "./utils";

/**
 * Converts an AnalyticsEvent record to CustomEvent type
 */
function toCustomEvent(record: {
  id: string;
  createdAt: Date;
  sessionId: string | null;
  name: string | null;
  data: unknown;
}): CustomEvent {
  const data = (record.data as Record<string, unknown>) || {};

  return {
    id: record.id,
    timestamp: record.createdAt.toISOString(),
    sessionId: record.sessionId || "",
    category: extractFromData<string>(data, "category", "unknown"),
    action: extractFromData<string>(data, "action", "unknown"),
    label: extractFromData<string | undefined>(data, "label", undefined),
    value: extractFromData<number | undefined>(data, "value", undefined),
    metadata: extractFromData<Record<string, unknown> | undefined>(data, "metadata", undefined),
  };
}

/**
 * Track a custom event
 */
export async function trackCustomEvent(event: {
  timestamp: string;
  sessionId: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}): Promise<CustomEvent> {
  const siteId = await getCurrentSiteId();

  // Build the data object for JSON storage
  const eventData = buildCustomEventData({
    category: event.category,
    action: event.action,
    label: event.label,
    value: event.value,
    metadata: event.metadata,
  });

  const result = await prisma.analyticsEvent.create({
    data: {
      type: EventType.CUSTOM,
      path: "/",
      name: `${event.category}:${event.action}`,
      sessionId: event.sessionId,
      data: toPrismaJson(eventData),
      createdAt: new Date(event.timestamp),
      siteId,
    },
  });

  return toCustomEvent(result);
}

/**
 * Get custom events within a date range
 */
export async function getCustomEvents(
  startDate?: string,
  endDate?: string,
  category?: string,
  action?: string
): Promise<CustomEvent[]> {
  const siteId = await getCurrentSiteId();
  const dateFilter = buildDateFilter(startDate, endDate);

  // Build base query
  const events = await prisma.analyticsEvent.findMany({
    where: {
      siteId,
      type: EventType.CUSTOM,
      ...dateFilter,
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by category/action if specified (need to check data JSON)
  let filteredEvents = events;

  if (category || action) {
    filteredEvents = events.filter((event) => {
      const data = (event.data as Record<string, unknown>) || {};
      const eventCategory = extractFromData<string>(data, "category", "");
      const eventAction = extractFromData<string>(data, "action", "");

      if (category && eventCategory !== category) return false;
      if (action && eventAction !== action) return false;
      return true;
    });
  }

  return filteredEvents.map(toCustomEvent);
}

/**
 * Get custom events summary
 */
export async function getCustomEventsSummary(
  startDate?: string,
  endDate?: string
): Promise<{
  totalEvents: number;
  uniqueSessions: number;
  byCategory: Record<string, { count: number; value: number }>;
  byAction: Record<string, { count: number; value: number }>;
  topEvents: Array<{
    category: string;
    action: string;
    label?: string;
    count: number;
    totalValue: number;
  }>;
}> {
  const events = await getCustomEvents(startDate, endDate);

  const uniqueSessions = new Set(events.map((e) => e.sessionId)).size;

  const byCategory: Record<string, { count: number; value: number }> = {};
  const byAction: Record<string, { count: number; value: number }> = {};
  const eventCounts = new Map<
    string,
    { count: number; totalValue: number; category: string; action: string; label?: string }
  >();

  for (const event of events) {
    // By category
    if (!byCategory[event.category]) {
      byCategory[event.category] = { count: 0, value: 0 };
    }
    const catData = byCategory[event.category];
    if (catData) {
      catData.count++;
      catData.value += event.value || 0;
    }

    // By action
    if (!byAction[event.action]) {
      byAction[event.action] = { count: 0, value: 0 };
    }
    const actData = byAction[event.action];
    if (actData) {
      actData.count++;
      actData.value += event.value || 0;
    }

    // Unique event combinations
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
  }

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
