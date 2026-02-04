/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Scheduled Reports Operations
 */

import { readAnalyticsData, writeAnalyticsData, generateId } from "./cache";
import type { ScheduledReport } from "./types";

export async function createScheduledReport(report: Omit<ScheduledReport, "id" | "createdAt" | "updatedAt">): Promise<ScheduledReport> {
  const data = await readAnalyticsData();
  const id = generateId("report");
  const now = new Date().toISOString();
  const newReport: ScheduledReport = {
    ...report,
    id,
    createdAt: now,
    updatedAt: now,
  };
  data.scheduledReports.push(newReport);
  await writeAnalyticsData(data);
  return newReport;
}

export async function getScheduledReports(enabledOnly: boolean = false): Promise<ScheduledReport[]> {
  const data = await readAnalyticsData();
  if (enabledOnly) {
    return data.scheduledReports.filter((r) => r.enabled);
  }
  return data.scheduledReports;
}

export async function getScheduledReport(id: string): Promise<ScheduledReport | undefined> {
  const data = await readAnalyticsData();
  return data.scheduledReports.find((r) => r.id === id);
}

export async function updateScheduledReport(id: string, updates: Partial<Omit<ScheduledReport, "id" | "createdAt">>): Promise<ScheduledReport | null> {
  const data = await readAnalyticsData();
  const index = data.scheduledReports.findIndex((r) => r.id === id);
  if (index === -1) return null;

  data.scheduledReports[index] = {
    ...data.scheduledReports[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeAnalyticsData(data);
  return data.scheduledReports[index];
}

export async function deleteScheduledReport(id: string): Promise<boolean> {
  const data = await readAnalyticsData();
  const index = data.scheduledReports.findIndex((r) => r.id === id);
  if (index === -1) return false;

  data.scheduledReports.splice(index, 1);
  await writeAnalyticsData(data);
  return true;
}
