/**
 * Shared utilities for chart date formatting and bucket generation.
 * Used by both useAnalytics and SimulationContext to ensure consistency.
 */

import type { PeriodType } from '../PeriodSelector';

// ============================================================================
// Date Formatting Functions
// ============================================================================

/**
 * Format time in HH:mm format
 */
export const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format short weekday and day (e.g., "lun. 5")
 */
export const formatShortDate = (date: Date): string => {
  const weekdays = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${weekday} ${day}`;
};

/**
 * Format day and month (e.g., "15 jan.")
 */
export const formatDayMonth = (date: Date): string => {
  const months = [
    'jan.',
    'fév.',
    'mar.',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'août',
    'sept.',
    'oct.',
    'nov.',
    'déc.',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${day} ${month}`;
};

/**
 * Format ISO week number (e.g., "Sem. 12")
 * Uses ISO week numbering (week starts on Monday)
 */
export const formatWeek = (date: Date): string => {
  // Get the ISO week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Sunday = 0, Thursday = 4)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate week number
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `Sem. ${weekNumber}`;
};

/**
 * Format month name (e.g., "janvier")
 */
export const formatMonth = (date: Date): string => {
  const months = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];
  return months[date.getMonth()] ?? 'janvier';
};

// ============================================================================
// Bucket Key Functions
// ============================================================================

/**
 * Get the bucket key (label) for a date based on the period type.
 * This determines how the date will be displayed on the X-axis.
 */
export const getBucketKey = (date: Date, period: PeriodType): string => {
  switch (period) {
    case 'realtime':
    case 'today':
    case 'yesterday':
      return formatTime(date);
    case 'last7days':
      return formatShortDate(date);
    case 'last30days':
    case 'thisMonth':
    case 'lastMonth':
    case 'custom':
      return formatDayMonth(date);
    case 'last3months':
      return formatWeek(date);
    case 'thisYear':
      return formatMonth(date);
    default:
      return formatDayMonth(date);
  }
};

// ============================================================================
// Date Normalization Functions
// ============================================================================

/**
 * Normalize a date to the start of its bucket based on the period type.
 * This is CRITICAL for correct aggregation - all dates within a bucket
 * must normalize to the same timestamp.
 */
export const normalizeToBucketStart = (date: Date, period: PeriodType): Date => {
  const normalized = new Date(date);

  switch (period) {
    case 'realtime':
      // Round down to nearest 5-minute interval
      normalized.setMinutes(Math.floor(normalized.getMinutes() / 5) * 5);
      normalized.setSeconds(0);
      normalized.setMilliseconds(0);
      break;

    case 'today':
    case 'yesterday':
      // Round to start of hour
      normalized.setMinutes(0);
      normalized.setSeconds(0);
      normalized.setMilliseconds(0);
      break;

    case 'last7days':
    case 'last30days':
    case 'thisMonth':
    case 'lastMonth':
    case 'custom':
      // Round to start of day
      normalized.setHours(0, 0, 0, 0);
      break;

    case 'last3months': {
      // Round to start of ISO week (Monday)
      const dayOfWeek = normalized.getDay();
      // Adjust to Monday (Sunday = 0 -> -6, Mon = 1 -> 0, Tue = 2 -> -1, etc.)
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      normalized.setDate(normalized.getDate() + diff);
      normalized.setHours(0, 0, 0, 0);
      break;
    }

    case 'thisYear':
      // Round to start of month
      normalized.setDate(1);
      normalized.setHours(0, 0, 0, 0);
      break;

    default:
      normalized.setHours(0, 0, 0, 0);
  }

  return normalized;
};

// ============================================================================
// Bucket Generation
// ============================================================================

export interface ChartBucket {
  label: string;
  timestamp: number; // Normalized timestamp for this bucket
  value: number;
  previousValue?: number;
}

/**
 * Generate all chart buckets for a given period.
 * Returns buckets with their labels and normalized timestamps for aggregation.
 */
export const generateChartBuckets = (period: PeriodType): ChartBucket[] => {
  const now = new Date();
  const buckets: ChartBucket[] = [];

  switch (period) {
    case 'realtime': {
      // Last 12 intervals of 5 minutes
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMinutes(date.getMinutes() - i * 5);
        const normalized = normalizeToBucketStart(date, period);
        buckets.push({
          label: formatTime(normalized),
          timestamp: normalized.getTime(),
          value: 0,
        });
      }
      break;
    }

    case 'today':
    case 'yesterday': {
      // 24 hours
      const baseDate = new Date(now);
      if (period === 'yesterday') baseDate.setDate(baseDate.getDate() - 1);
      baseDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < 24; i++) {
        const date = new Date(baseDate);
        date.setHours(i);
        buckets.push({
          label: formatTime(date),
          timestamp: date.getTime(),
          value: 0,
        });
      }
      break;
    }

    case 'last7days': {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        buckets.push({
          label: formatShortDate(date),
          timestamp: date.getTime(),
          value: 0,
        });
      }
      break;
    }

    case 'last30days': {
      // Last 30 days - ALL days, then we'll sample for display
      const allDayBuckets: ChartBucket[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        allDayBuckets.push({
          label: formatDayMonth(date),
          timestamp: date.getTime(),
          value: 0,
        });
      }
      return allDayBuckets;
    }

    case 'thisMonth': {
      // From 1st of current month to today
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const allDayBuckets: ChartBucket[] = [];
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const current = new Date(startDate);
      while (current <= today) {
        allDayBuckets.push({
          label: formatDayMonth(current),
          timestamp: current.getTime(),
          value: 0,
        });
        current.setDate(current.getDate() + 1);
      }
      return allDayBuckets;
    }

    case 'lastMonth': {
      // Full last month
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
      const allDayBuckets: ChartBucket[] = [];

      const current = new Date(startDate);
      while (current <= endDate) {
        allDayBuckets.push({
          label: formatDayMonth(current),
          timestamp: current.getTime(),
          value: 0,
        });
        current.setDate(current.getDate() + 1);
      }
      return allDayBuckets;
    }

    case 'last3months': {
      // ~13 weeks
      const seenWeeks = new Set<string>();
      for (let i = 12; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 7);
        const normalized = normalizeToBucketStart(date, period);
        const weekKey = formatWeek(normalized);

        // Avoid duplicate weeks
        if (!seenWeeks.has(weekKey)) {
          seenWeeks.add(weekKey);
          buckets.push({
            label: weekKey,
            timestamp: normalized.getTime(),
            value: 0,
          });
        }
      }
      break;
    }

    case 'thisYear': {
      // From January to current month
      const currentMonth = now.getMonth();
      for (let i = 0; i <= currentMonth; i++) {
        const date = new Date(now.getFullYear(), i, 1);
        buckets.push({
          label: formatMonth(date),
          timestamp: date.getTime(),
          value: 0,
        });
      }
      break;
    }

    default: {
      // Fallback: last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        buckets.push({
          label: formatShortDate(date),
          timestamp: date.getTime(),
          value: 0,
        });
      }
    }
  }

  return buckets;
};

/**
 * Sample buckets for display to limit the number of points on the chart.
 * Aggregates values when sampling.
 */
export const sampleBucketsForDisplay = (
  buckets: ChartBucket[],
  maxPoints: number = 15
): ChartBucket[] => {
  if (buckets.length <= maxPoints) {
    return buckets;
  }

  const step = Math.ceil(buckets.length / maxPoints);
  const sampled: ChartBucket[] = [];

  for (let i = 0; i < buckets.length; i += step) {
    // Aggregate values from this bucket and the next (step-1) buckets
    const endIndex = Math.min(i + step, buckets.length);
    let aggregatedValue = 0;
    let aggregatedPreviousValue = 0;
    let hasPreviousValue = false;

    for (let j = i; j < endIndex; j++) {
      aggregatedValue += buckets[j]!.value;
      if (buckets[j]!.previousValue !== undefined) {
        aggregatedPreviousValue += buckets[j]!.previousValue!;
        hasPreviousValue = true;
      }
    }

    sampled.push({
      label: buckets[i]!.label,
      timestamp: buckets[i]!.timestamp,
      value: aggregatedValue,
      ...(hasPreviousValue ? { previousValue: aggregatedPreviousValue } : {}),
    });
  }

  return sampled;
};

// ============================================================================
// Visit Aggregation
// ============================================================================

export interface Visit {
  timestamp?: string | Date;
  period?: string;
  visits?: number;
}

/**
 * Aggregate visits into chart buckets based on period.
 * Returns buckets with aggregated values.
 */
export const aggregateVisitsIntoBuckets = (
  buckets: ChartBucket[],
  visits: Visit[],
  period: PeriodType
): ChartBucket[] => {
  if (!visits || visits.length === 0) {
    return buckets;
  }

  // Clone buckets to avoid mutation
  const result = buckets.map(b => ({ ...b }));

  // Create a timestamp-to-index map for O(1) lookups
  const timestampToIndex = new Map<number, number>();
  result.forEach((bucket, index) => {
    timestampToIndex.set(bucket.timestamp, index);
  });

  // Aggregate visits
  visits.forEach(visit => {
    const visitTimestamp = visit.timestamp || visit.period;
    if (!visitTimestamp) return;

    const visitDate = new Date(visitTimestamp);
    if (isNaN(visitDate.getTime())) return;

    // Normalize the visit date to its bucket start
    const normalizedDate = normalizeToBucketStart(visitDate, period);
    const bucketIndex = timestampToIndex.get(normalizedDate.getTime());

    if (bucketIndex !== undefined && result[bucketIndex]) {
      result[bucketIndex].value += visit.visits || 1;
    }
  });

  return result;
};

/**
 * Format chart data from visits array for a given period.
 * This is the main function to use for chart data generation.
 */
export const formatChartDataForPeriod = (
  visits: Visit[],
  period: PeriodType,
  maxDisplayPoints: number = 15
): ChartBucket[] => {
  // Generate all buckets
  let buckets = generateChartBuckets(period);

  // Aggregate visits
  buckets = aggregateVisitsIntoBuckets(buckets, visits, period);

  // Sample for display if needed (only for day-based periods with many points)
  if (period === 'last30days' || period === 'thisMonth' || period === 'lastMonth') {
    buckets = sampleBucketsForDisplay(buckets, maxDisplayPoints);
  }

  return buckets;
};
