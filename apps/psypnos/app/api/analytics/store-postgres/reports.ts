// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * PostgreSQL Scheduled Reports Operations
 */

import { prisma } from "@/lib/db/prisma";
import type { ScheduledReport } from "../store/types";

// Type aliases for where/update input (workaround for ungenerated Prisma client)
type ScheduledReportWhereInput = {
  enabled?: boolean;
};

type ScheduledReportUpdateInput = Record<string, unknown>;

/**
 * Prisma ScheduledReport record type.
 * Prisma uses `null` for absent optional values, while our ScheduledReport type uses `undefined`.
 */
interface ScheduledReportRecord {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  timeOfDay: string;
  recipients: string[];
  format: string;
  sections: unknown;
  enabled: boolean;
  lastSent: Date | null;
  nextScheduled: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert a Prisma ScheduledReportRecord to our application ScheduledReport type.
 * This handles the null → undefined conversion for optional fields.
 */
function toScheduledReport(record: ScheduledReportRecord): ScheduledReport {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? undefined,
    frequency: record.frequency as "daily" | "weekly" | "monthly",
    dayOfWeek: record.dayOfWeek ?? undefined,
    dayOfMonth: record.dayOfMonth ?? undefined,
    timeOfDay: record.timeOfDay,
    recipients: record.recipients,
    format: record.format as "email" | "pdf" | "both",
    sections: record.sections as Array<"summary" | "traffic" | "conversions" | "sections" | "devices" | "cohorts" | "insights">,
    enabled: record.enabled,
    lastSent: record.lastSent?.toISOString(),
    nextScheduled: record.nextScheduled?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function createScheduledReport(report: {
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  recipients: string[];
  format: "email" | "pdf" | "both";
  sections: Array<"summary" | "traffic" | "conversions" | "sections" | "devices" | "cohorts" | "insights">;
  enabled: boolean;
}): Promise<ScheduledReport> {
  const result = await prisma.scheduledReport.create({
    data: {
      name: report.name,
      description: report.description,
      frequency: report.frequency,
      dayOfWeek: report.dayOfWeek,
      dayOfMonth: report.dayOfMonth,
      timeOfDay: report.timeOfDay,
      recipients: report.recipients,
      format: report.format,
      sections: report.sections,
      enabled: report.enabled,
    },
  });

  return toScheduledReport(result as ScheduledReportRecord);
}

export async function getScheduledReports(enabledOnly: boolean = false): Promise<ScheduledReport[]> {
  const where: ScheduledReportWhereInput = enabledOnly ? { enabled: true } : {};

  const reports = await prisma.scheduledReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return (reports as ScheduledReportRecord[]).map(toScheduledReport);
}

export async function getScheduledReport(id: string): Promise<ScheduledReport | undefined> {
  const report = await prisma.scheduledReport.findUnique({ where: { id } });

  if (!report) return undefined;

  return toScheduledReport(report as ScheduledReportRecord);
}

export async function updateScheduledReport(
  id: string,
  updates: Partial<{
    name: string;
    description?: string;
    frequency: "daily" | "weekly" | "monthly";
    dayOfWeek?: number;
    dayOfMonth?: number;
    timeOfDay: string;
    recipients: string[];
    format: "email" | "pdf" | "both";
    sections: Array<"summary" | "traffic" | "conversions" | "sections" | "devices" | "cohorts" | "insights">;
    enabled: boolean;
    lastSent?: string;
    nextScheduled?: string;
  }>,
): Promise<ScheduledReport | null> {
  try {
    const data: ScheduledReportUpdateInput = { ...updates };
    if (updates.lastSent) data.lastSent = new Date(updates.lastSent);
    if (updates.nextScheduled) data.nextScheduled = new Date(updates.nextScheduled);

    const result = await prisma.scheduledReport.update({
      where: { id },
      data,
    });

    return toScheduledReport(result as ScheduledReportRecord);
  } catch {
    return null;
  }
}

export async function deleteScheduledReport(id: string): Promise<boolean> {
  try {
    await prisma.scheduledReport.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
