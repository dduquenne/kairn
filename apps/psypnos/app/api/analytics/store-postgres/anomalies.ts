// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * PostgreSQL Anomaly Operations
 */

import { prisma } from "@/lib/db/prisma";
import type { Anomaly } from "../store/types";

// Type alias for where input (workaround for ungenerated Prisma client)
type AnomalyWhereInput = {
  timestamp?: { gte?: Date; lte?: Date };
  acknowledged?: boolean;
};

/**
 * Prisma Anomaly record type.
 * Prisma uses `null` for absent optional values, while our Anomaly type uses `undefined`.
 */
interface AnomalyRecord {
  id: string;
  timestamp: Date;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: string;
  type: string;
  message: string;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
}

/**
 * Convert a Prisma AnomalyRecord to our application Anomaly type.
 * This handles the null → undefined conversion for optional fields.
 */
function toAnomaly(record: AnomalyRecord): Anomaly {
  return {
    id: record.id,
    timestamp: record.timestamp.toISOString(),
    metric: record.metric,
    expectedValue: record.expectedValue,
    actualValue: record.actualValue,
    deviation: record.deviation,
    severity: record.severity as "low" | "medium" | "high",
    type: record.type as "spike" | "drop" | "unusual_pattern",
    message: record.message,
    acknowledged: record.acknowledged,
    acknowledgedAt: record.acknowledgedAt?.toISOString(),
    acknowledgedBy: record.acknowledgedBy ?? undefined,
  };
}

export async function getAnomalies(
  startDate?: string,
  endDate?: string,
  acknowledgedOnly?: boolean,
): Promise<Anomaly[]> {
  const where: AnomalyWhereInput = {};

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  if (acknowledgedOnly !== undefined) {
    where.acknowledged = acknowledgedOnly;
  }

  const anomalies = await prisma.anomaly.findMany({
    where,
    orderBy: { timestamp: "desc" },
  });

  return (anomalies as AnomalyRecord[]).map(toAnomaly);
}

export async function acknowledgeAnomaly(id: string, acknowledgedBy?: string): Promise<Anomaly | null> {
  try {
    const result = await prisma.anomaly.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy,
      },
    });

    return toAnomaly(result as AnomalyRecord);
  } catch {
    return null;
  }
}

// Re-export helper functions from the JSON store
// These are stateless utility functions that work the same way
export { getMetricValue, evaluateAlertCondition } from "../store/alerts";
export { calculateBaseline, detectAnomaly, runAnomalyDetection } from "../store/anomalies";
