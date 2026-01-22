// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Conversion Event Operations
 */

import type { ConversionEvent } from "./types";
import { readAnalyticsData, writeAnalyticsData, generateId } from "./cache";

export async function trackConversionEvent(
  event: Omit<ConversionEvent, "id">,
): Promise<ConversionEvent> {
  const data = await readAnalyticsData();
  const id = generateId("ce");
  const newEvent = { ...event, id };
  data.conversionEvents.push(newEvent);
  await writeAnalyticsData(data);
  return newEvent;
}

export async function getConversionEvents(
  startDate?: string,
  endDate?: string,
): Promise<ConversionEvent[]> {
  const data = await readAnalyticsData();
  let events = data.conversionEvents;

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    events = events.filter((e) => {
      const eTime = new Date(e.timestamp).getTime();
      return eTime >= start && eTime <= end;
    });
  }

  return events;
}
