// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Anomaly Detection
 */

import type { Anomaly } from "./types";
import { readAnalyticsData, writeAnalyticsData, generateId } from "./cache";
import { getAnalyticsSummary } from "./analytics";

// Calculate baseline statistics for a metric
export async function calculateBaseline(
  metric: string,
  days: number = 30,
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
  const avgSquaredDiff = squaredDiffs.length > 0 ? squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length : 0;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return { mean, stdDev, values };
}

// Detect anomaly using Z-score
export function detectAnomaly(
  actualValue: number,
  baseline: { mean: number; stdDev: number },
  sensitivity: 'low' | 'medium' | 'high' = 'medium',
): { isAnomaly: boolean; deviation: number; type: 'spike' | 'drop' | 'unusual_pattern'; severity: 'low' | 'medium' | 'high' } | null {
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

// Run anomaly detection on all metrics
export async function runAnomalyDetection(
  sensitivity: 'low' | 'medium' | 'high' = 'medium',
): Promise<Anomaly[]> {
  const data = await readAnalyticsData();
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
        actualValue = Object.values(todaySummary.conversionByType).reduce((sum, v) => sum + v.completed, 0);
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

      const anomaly: Anomaly = {
        id: generateId("anomaly"),
        timestamp: now.toISOString(),
        metric,
        expectedValue: baseline.mean,
        actualValue,
        deviation: result.deviation,
        severity: result.severity,
        type: result.type,
        message: `${metricLabels[metric]} ${result.type === 'spike' ? 'anormalement haut' : 'anormalement bas'}: ${actualValue.toFixed(1)} (attendu: ${baseline.mean.toFixed(1)}, ecart: ${result.deviation.toFixed(1)} sigma)`,
        acknowledged: false,
      };

      detectedAnomalies.push(anomaly);
    }
  }

  // Store new anomalies
  for (const anomaly of detectedAnomalies) {
    const existingToday = data.anomalies.find(
      (a) => a.metric === anomaly.metric &&
             new Date(a.timestamp).toDateString() === now.toDateString()
    );

    if (!existingToday) {
      data.anomalies.push(anomaly);
    }
  }

  // Keep only last 90 days of anomalies
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  data.anomalies = data.anomalies.filter(
    (a) => new Date(a.timestamp) > ninetyDaysAgo
  );

  await writeAnalyticsData(data);

  return detectedAnomalies;
}

export async function getAnomalies(
  startDate?: string,
  endDate?: string,
  acknowledgedOnly?: boolean,
): Promise<Anomaly[]> {
  const data = await readAnalyticsData();
  let anomalies = data.anomalies;

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    anomalies = anomalies.filter((a) => {
      const aTime = new Date(a.timestamp).getTime();
      return aTime >= start && aTime <= end;
    });
  }

  if (acknowledgedOnly !== undefined) {
    anomalies = anomalies.filter((a) => a.acknowledged === acknowledgedOnly);
  }

  return anomalies.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function acknowledgeAnomaly(id: string, acknowledgedBy?: string): Promise<Anomaly | null> {
  const data = await readAnalyticsData();
  const index = data.anomalies.findIndex((a) => a.id === id);
  if (index === -1) return null;

  data.anomalies[index] = {
    ...data.anomalies[index],
    acknowledged: true,
    acknowledgedAt: new Date().toISOString(),
    acknowledgedBy,
  };

  await writeAnalyticsData(data);
  return data.anomalies[index];
}
