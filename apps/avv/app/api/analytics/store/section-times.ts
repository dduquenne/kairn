/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Section Time Operations
 */

import { readAnalyticsData, writeAnalyticsData, generateId } from "./cache";
import type { SectionTime } from "./types";

export async function trackSectionTime(sectionTime: Omit<SectionTime, "id">): Promise<SectionTime> {
  const data = await readAnalyticsData();
  const id = generateId("st");
  const newRecord = { ...sectionTime, id };
  data.sectionTimes.push(newRecord);
  await writeAnalyticsData(data);
  return newRecord;
}

export async function getSectionTimes(
  startDate?: string,
  endDate?: string,
): Promise<SectionTime[]> {
  const data = await readAnalyticsData();
  let times = data.sectionTimes;

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    times = times.filter((t) => {
      const tTime = new Date(t.timestamp).getTime();
      return tTime >= start && tTime <= end;
    });
  }

  return times;
}
