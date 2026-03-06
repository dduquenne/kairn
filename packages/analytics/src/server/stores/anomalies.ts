/**
 * PostgreSQL Anomaly Operations
 *
 * Uses the AnalyticsAnomaly model for storing detected anomalies.
 * Includes pure utility functions for anomaly detection via Z-score analysis.
 */

import { getAnalyticsContext } from '../context';
import type { Anomaly } from '../types';

import { getAnalyticsSummary } from './analytics';

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
  const type: 'spike' | 'drop' | 'unusual_pattern' =
    record.actualValue > record.expectedValue ? 'spike' : 'drop';

  // Generate message based on data
  const percentChange = Math.abs(
    ((record.actualValue - record.expectedValue) / record.expectedValue) * 100
  );
  const message = `${type === 'spike' ? 'Increase' : 'Decrease'} of ${percentChange.toFixed(1)}% detected in ${record.metric}`;

  return {
    id: record.id,
    timestamp: record.detectedAt.toISOString(),
    metric: record.metric,
    expectedValue: record.expectedValue,
    actualValue: record.actualValue,
    deviation: record.deviation,
    severity: record.severity as 'low' | 'medium' | 'high',
    type,
    message,
    acknowledged: record.acknowledged,
    acknowledgedAt: record.acknowledgedAt?.toISOString(),
    acknowledgedBy: record.acknowledgedBy ?? undefined,
  };
}

/** Get anomalies within a date range */
export async function getAnomalies(
  startDate?: string,
  endDate?: string,
  acknowledgedOnly?: boolean
): Promise<Anomaly[]> {
  const { prisma, getSiteId } = getAnalyticsContext();
  const siteId = await getSiteId();

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
    orderBy: { detectedAt: 'desc' },
  });

  return anomalies.map(toAnomaly);
}

/** Acknowledge an anomaly */
export async function acknowledgeAnomaly(
  id: string,
  acknowledgedBy?: string
): Promise<Anomaly | null> {
  const { prisma } = getAnalyticsContext();

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

/** Record a new anomaly */
export async function recordAnomaly(anomaly: {
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
}): Promise<Anomaly> {
  const { prisma, getSiteId } = getAnalyticsContext();
  const siteId = await getSiteId();

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

/** Calculate baseline statistics for a metric over a number of days */
export async function calculateBaseline(
  metric: string,
  days: number = 30
): Promise<{ mean: number; stdDev: number; values: number[] }> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const values: number[] = [];

  for (let i = 0; i < days; i++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(startDate.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const summary = await getAnalyticsSummary(dayStart.toISOString(), dayEnd.toISOString());

    let value = 0;
    switch (metric) {
      case 'visits':
        value = summary.totalVisits;
        break;
      case 'sessions':
        value = summary.uniqueSessions;
        break;
      case 'conversions':
        value = Object.values(summary.conversionByType).reduce((sum, v) => sum + v.completed, 0);
        break;
      case 'conversion_rate':
        value = summary.conversionRate;
        break;
      case 'avg_time':
        value = summary.averageTimeOnSite / 1000;
        break;
    }
    values.push(value);
  }

  const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff =
    squaredDiffs.length > 0 ? squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length : 0;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return { mean, stdDev, values };
}

/** Detect anomaly using Z-score */
export function detectAnomaly(
  actualValue: number,
  baseline: { mean: number; stdDev: number },
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): {
  isAnomaly: boolean;
  deviation: number;
  type: 'spike' | 'drop' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high';
} | null {
  const thresholds = {
    low: 3.0,
    medium: 2.5,
    high: 2.0,
  };

  const threshold = thresholds[sensitivity];

  if (baseline.stdDev === 0) {
    if (Math.abs(actualValue - baseline.mean) > baseline.mean * 0.5) {
      return {
        isAnomaly: true,
        deviation: actualValue > baseline.mean ? 100 : -100,
        type: actualValue > baseline.mean ? 'spike' : 'drop',
        severity: 'high',
      };
    }
    return null;
  }

  const zScore = (actualValue - baseline.mean) / baseline.stdDev;

  if (Math.abs(zScore) < threshold) {
    return null;
  }

  let severity: 'low' | 'medium' | 'high';
  if (Math.abs(zScore) >= 4) {
    severity = 'high';
  } else if (Math.abs(zScore) >= 3) {
    severity = 'medium';
  } else {
    severity = 'low';
  }

  return {
    isAnomaly: true,
    deviation: zScore,
    type: zScore > 0 ? 'spike' : 'drop',
    severity,
  };
}

/** Run anomaly detection on all metrics */
export async function runAnomalyDetection(
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): Promise<Anomaly[]> {
  const metrics = ['visits', 'sessions', 'conversions', 'conversion_rate', 'avg_time'] as const;
  const detectedAnomalies: Anomaly[] = [];

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todaySummary = await getAnalyticsSummary(today.toISOString(), now.toISOString());

  for (const metric of metrics) {
    const baseline = await calculateBaseline(metric, 30);

    let actualValue = 0;
    switch (metric) {
      case 'visits':
        actualValue = todaySummary.totalVisits;
        break;
      case 'sessions':
        actualValue = todaySummary.uniqueSessions;
        break;
      case 'conversions':
        actualValue = Object.values(todaySummary.conversionByType).reduce(
          (sum, v) => sum + v.completed,
          0
        );
        break;
      case 'conversion_rate':
        actualValue = todaySummary.conversionRate;
        break;
      case 'avg_time':
        actualValue = todaySummary.averageTimeOnSite / 1000;
        break;
    }

    const result = detectAnomaly(actualValue, baseline, sensitivity);

    if (result && result.isAnomaly) {
      const metricLabels: Record<string, string> = {
        visits: 'Visites',
        sessions: 'Sessions',
        conversions: 'Conversions',
        conversion_rate: 'Taux de conversion',
        avg_time: 'Temps moyen',
      };

      const anomaly = await recordAnomaly({
        metric,
        expectedValue: baseline.mean,
        actualValue,
        deviation: result.deviation,
        severity: result.severity,
      });

      // Override the auto-generated message with a more descriptive one
      const enrichedAnomaly: Anomaly = {
        ...anomaly,
        message: `${metricLabels[metric]} ${result.type === 'spike' ? 'anormalement haut' : 'anormalement bas'}: ${actualValue.toFixed(1)} (attendu: ${baseline.mean.toFixed(1)}, ecart: ${result.deviation.toFixed(1)} sigma)`,
      };

      detectedAnomalies.push(enrichedAnomaly);
    }
  }

  return detectedAnomalies;
}
