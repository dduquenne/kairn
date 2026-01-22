// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Page Visit Operations
 */

import type { PageVisit } from "./types";
import { readAnalyticsData, writeAnalyticsData, generateId } from "./cache";

export async function trackPageVisit(pageVisit: Omit<PageVisit, "id">): Promise<PageVisit> {
  const data = await readAnalyticsData();
  const id = generateId("pv");
  const newVisit = { ...pageVisit, id };
  data.pageVisits.push(newVisit);
  await writeAnalyticsData(data);
  return newVisit;
}

export async function getPageVisits(
  startDate?: string,
  endDate?: string,
): Promise<PageVisit[]> {
  const data = await readAnalyticsData();
  let visits = data.pageVisits;

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    visits = visits.filter((v) => {
      const vTime = new Date(v.timestamp).getTime();
      return vTime >= start && vTime <= end;
    });
  }

  return visits;
}
