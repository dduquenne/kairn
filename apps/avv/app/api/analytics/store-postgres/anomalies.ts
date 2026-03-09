/**
 * PostgreSQL Anomaly Operations
 *
 * Uses the AnalyticsAnomaly model for storing detected anomalies.
 */

import { prisma } from "@/lib/db/prisma";

import type { Anomaly } from "../store/types";

import { getCurrentSiteId } from "./utils";

/**
 * Converts a Prisma AnalyticsAnomaly record to Anomaly type
 */
function toAnomaly(record: {
  id: string;
  detectedAt: Date;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: string;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
}): Anomaly {
  // Determine anomaly type based on deviation
  const type: "spike" | "drop" | "unusual_pattern" =
    record.actualValue > record.expectedValue ? "spike" : "drop";

  // Generate message based on data
  const percentChange = Math.abs(
    ((record.actualValue - record.expectedValue) / record.expectedValue) * 100
  );
  const message = `${type === "spike" ? "Increase" : "Decrease"} of ${percentChange.toFixed(1)}% detected in ${record.metric}`;

  return {
    id: record.id,
    timestamp: record.detectedAt.toISOString(),
    metric: record.metric,
    expectedValue: record.expectedValue,
    actualValue: record.actualValue,
    deviation: record.deviation,
    severity: record.severity as "low" | "medium" | "high",
    type,
    message,
    acknowledged: record.acknowledged,
    acknowledgedAt: record.acknowledgedAt?.toISOString(),
    acknowledgedBy: record.acknowledgedBy ?? undefined,
  };
}

/**
 * Get anomalies within a date range
 */
export async function getAnomalies(
  startDate?: string,
  endDate?: string,
  acknowledgedOnly?: boolean
): Promise<Anomaly[]> {
  const siteId = await getCurrentSiteId();

  const where: {
    siteId: string;
    detectedAt?: { gte?: Date; lte?: Date };
    acknowledged?: boolean;
  } = { siteId };

  if (startDate || endDate) {
    where.detectedAt = {};
    if (startDate) where.detectedAt.gte = new Date(startDate);
    if (endDate) where.detectedAt.lte = new Date(endDate);
  }

  if (acknowledgedOnly !== undefined) {
    where.acknowledged = acknowledgedOnly;
  }

  const anomalies = await prisma.analyticsAnomaly.findMany({
    where,
    orderBy: { detectedAt: "desc" },
  });

  return anomalies.map(toAnomaly);
}

/**
 * Acknowledge an anomaly
 */
export async function acknowledgeAnomaly(
  id: string,
  acknowledgedBy?: string
): Promise<Anomaly | null> {
  try {
    const result = await prisma.analyticsAnomaly.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy,
      },
    });

    return toAnomaly(result);
  } catch {
    return null;
  }
}

/**
 * Record a new anomaly
 */
export async function recordAnomaly(anomaly: {
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: "low" | "medium" | "high";
}): Promise<Anomaly> {
  const siteId = await getCurrentSiteId();

  const result = await prisma.analyticsAnomaly.create({
    data: {
      metric: anomaly.metric,
      expectedValue: anomaly.expectedValue,
      actualValue: anomaly.actualValue,
      deviation: anomaly.deviation,
      severity: anomaly.severity,
      siteId,
    },
  });

  return toAnomaly(result);
}

// Re-export helper functions from the JSON store
// These are stateless utility functions that work the same way
export { getMetricValue, evaluateAlertCondition } from "../store/alerts";
export { calculateBaseline, detectAnomaly, runAnomalyDetection } from "../store/anomalies";
