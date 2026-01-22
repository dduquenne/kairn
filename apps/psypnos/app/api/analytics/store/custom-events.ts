// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Custom Event Operations
 */

import type { CustomEvent } from "./types";
import { readAnalyticsData, writeAnalyticsData, generateId } from "./cache";

export async function trackCustomEvent(event: Omit<CustomEvent, "id">): Promise<CustomEvent> {
  const data = await readAnalyticsData();
  const id = generateId("evt");
  const newEvent = { ...event, id };
  data.customEvents.push(newEvent);
  await writeAnalyticsData(data);
  return newEvent;
}

export async function getCustomEvents(
  startDate?: string,
  endDate?: string,
  category?: string,
  action?: string,
): Promise<CustomEvent[]> {
  const data = await readAnalyticsData();
  let events = data.customEvents;

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    events = events.filter((e) => {
      const eTime = new Date(e.timestamp).getTime();
      return eTime >= start && eTime <= end;
    });
  }

  if (category) {
    events = events.filter((e) => e.category === category);
  }

  if (action) {
    events = events.filter((e) => e.action === action);
  }

  return events;
}

export async function getCustomEventsSummary(
  startDate?: string,
  endDate?: string,
): Promise<{
  totalEvents: number;
  uniqueSessions: number;
  byCategory: Record<string, { count: number; value: number }>;
  byAction: Record<string, { count: number; value: number }>;
  topEvents: Array<{ category: string; action: string; label?: string; count: number; totalValue: number }>;
}> {
  const events = await getCustomEvents(startDate, endDate);

  const uniqueSessions = new Set(events.map((e) => e.sessionId)).size;

  const byCategory: Record<string, { count: number; value: number }> = {};
  const byAction: Record<string, { count: number; value: number }> = {};
  const eventCounts = new Map<string, { count: number; totalValue: number; category: string; action: string; label?: string }>();

  events.forEach((event) => {
    // By category
    if (!byCategory[event.category]) {
      byCategory[event.category] = { count: 0, value: 0 };
    }
    byCategory[event.category].count++;
    byCategory[event.category].value += event.value || 0;

    // By action
    if (!byAction[event.action]) {
      byAction[event.action] = { count: 0, value: 0 };
    }
    byAction[event.action].count++;
    byAction[event.action].value += event.value || 0;

    // Top events (category + action + label combination)
    const key = `${event.category}|${event.action}|${event.label || ''}`;
    const current = eventCounts.get(key) || { count: 0, totalValue: 0, category: event.category, action: event.action, label: event.label };
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
