/**
 * PostgreSQL Scheduled Reports Operations
 *
 * Uses the AnalyticsScheduledReport model for report configurations.
 */

import { prisma } from "@/lib/db/prisma";
import { ReportFrequency } from "@prisma/client";
import type { ScheduledReport } from "../store/types";
import { getCurrentSiteId, toPrismaJson } from "./utils";

/**
 * Maps internal frequency strings to Prisma ReportFrequency enum
 */
function toReportFrequency(frequency: string): ReportFrequency {
  const mapping: Record<string, ReportFrequency> = {
    daily: ReportFrequency.DAILY,
    weekly: ReportFrequency.WEEKLY,
    monthly: ReportFrequency.MONTHLY,
  };
  return mapping[frequency] || ReportFrequency.WEEKLY;
}

/**
 * Maps Prisma ReportFrequency enum to internal frequency string
 */
function fromReportFrequency(frequency: ReportFrequency): string {
  const mapping: Record<ReportFrequency, string> = {
    [ReportFrequency.DAILY]: "daily",
    [ReportFrequency.WEEKLY]: "weekly",
    [ReportFrequency.MONTHLY]: "monthly",
  };
  return mapping[frequency] || "weekly";
}

/**
 * Converts a Prisma AnalyticsScheduledReport record to ScheduledReport type
 */
function toScheduledReport(record: {
  id: string;
  name: string;
  frequency: ReportFrequency;
  recipients: string[];
  metrics: unknown;
  format: string;
  enabled: boolean;
  lastSentAt: Date | null;
  nextSendAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ScheduledReport {
  // Extract sections from metrics JSON
  const metrics = (record.metrics as Record<string, unknown>) || {};
  const sections = (metrics.sections as string[]) || [];

  return {
    id: record.id,
    name: record.name,
    frequency: fromReportFrequency(record.frequency) as "daily" | "weekly" | "monthly",
    dayOfWeek: (metrics.dayOfWeek as number) ?? undefined,
    dayOfMonth: (metrics.dayOfMonth as number) ?? undefined,
    timeOfDay: (metrics.timeOfDay as string) || "09:00",
    recipients: record.recipients,
    format: record.format as "email" | "pdf" | "both",
    sections: sections as Array<
      "summary" | "traffic" | "conversions" | "sections" | "devices" | "cohorts" | "insights"
    >,
    enabled: record.enabled,
    lastSent: record.lastSentAt?.toISOString(),
    nextScheduled: record.nextSendAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Create a scheduled report
 */
export async function createScheduledReport(report: {
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  recipients: string[];
  format: "email" | "pdf" | "both";
  sections: Array<
    "summary" | "traffic" | "conversions" | "sections" | "devices" | "cohorts" | "insights"
  >;
  enabled: boolean;
}): Promise<ScheduledReport> {
  const siteId = getCurrentSiteId();

  // Store extended data in the metrics JSON field
  const metrics = {
    sections: report.sections,
    dayOfWeek: report.dayOfWeek,
    dayOfMonth: report.dayOfMonth,
    timeOfDay: report.timeOfDay,
    description: report.description,
  };

  const result = await prisma.analyticsScheduledReport.create({
    data: {
      name: report.name,
      frequency: toReportFrequency(report.frequency),
      recipients: report.recipients,
      metrics: toPrismaJson(metrics) || {},
      format: report.format,
      enabled: report.enabled,
      siteId,
    },
  });

  return toScheduledReport(result);
}

/**
 * Get scheduled reports
 */
export async function getScheduledReports(
  enabledOnly: boolean = false
): Promise<ScheduledReport[]> {
  const siteId = getCurrentSiteId();

  const reports = await prisma.analyticsScheduledReport.findMany({
    where: {
      siteId,
      ...(enabledOnly ? { enabled: true } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return reports.map(toScheduledReport);
}

/**
 * Get a specific scheduled report
 */
export async function getScheduledReport(id: string): Promise<ScheduledReport | undefined> {
  const report = await prisma.analyticsScheduledReport.findUnique({
    where: { id },
  });

  if (!report) return undefined;

  return toScheduledReport(report);
}

/**
 * Update a scheduled report
 */
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
    sections: Array<
      "summary" | "traffic" | "conversions" | "sections" | "devices" | "cohorts" | "insights"
    >;
    enabled: boolean;
    lastSent?: string;
    nextScheduled?: string;
  }>
): Promise<ScheduledReport | null> {
  try {
    // Get existing report to merge metrics
    const existing = await prisma.analyticsScheduledReport.findUnique({
      where: { id },
    });

    if (!existing) return null;

    const existingMetrics = (existing.metrics as Record<string, unknown>) || {};

    // Build updated metrics
    const metrics = {
      ...existingMetrics,
      ...(updates.sections !== undefined && { sections: updates.sections }),
      ...(updates.dayOfWeek !== undefined && { dayOfWeek: updates.dayOfWeek }),
      ...(updates.dayOfMonth !== undefined && { dayOfMonth: updates.dayOfMonth }),
      ...(updates.timeOfDay !== undefined && { timeOfDay: updates.timeOfDay }),
      ...(updates.description !== undefined && { description: updates.description }),
    };

    // Build update data
    const data: Record<string, unknown> = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.frequency !== undefined) data.frequency = toReportFrequency(updates.frequency);
    if (updates.recipients !== undefined) data.recipients = updates.recipients;
    if (updates.format !== undefined) data.format = updates.format;
    if (updates.enabled !== undefined) data.enabled = updates.enabled;
    if (updates.lastSent !== undefined) data.lastSentAt = new Date(updates.lastSent);
    if (updates.nextScheduled !== undefined) data.nextSendAt = new Date(updates.nextScheduled);

    // Always update metrics if any related field changed
    if (
      updates.sections !== undefined ||
      updates.dayOfWeek !== undefined ||
      updates.dayOfMonth !== undefined ||
      updates.timeOfDay !== undefined ||
      updates.description !== undefined
    ) {
      data.metrics = toPrismaJson(metrics);
    }

    const result = await prisma.analyticsScheduledReport.update({
      where: { id },
      data,
    });

    return toScheduledReport(result);
  } catch {
    return null;
  }
}

/**
 * Delete a scheduled report
 */
export async function deleteScheduledReport(id: string): Promise<boolean> {
  try {
    await prisma.analyticsScheduledReport.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
