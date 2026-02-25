/**
 * Shared utilities for chart date formatting and bucket generation.
 * Used by both useAnalytics and SimulationContext to ensure consistency.
 *
 * IMPORTANT: All date operations use UTC to stay aligned with PostgreSQL's
 * date_trunc() which also operates in UTC. This prevents timezone-related
 * discrepancies between the database aggregations and the chart display.
 */

import type { PeriodType } from '../PeriodSelector';

// ============================================================================
// Period Date Range Utilities
// ============================================================================

/**
 * Returns the correct start and end dates for a given period.
 * This is the SINGLE SOURCE OF TRUTH for period date calculations.
 *
 * All dates are computed in UTC so that they align with PostgreSQL's
 * date_trunc() boundaries and the bucket timestamps generated below.
 */
export const getPeriodDateRange = (
  period: PeriodType,
  customStart?: string,
  customEnd?: string
): { startDate: Date; endDate: Date } => {
  const now = new Date();

  if (period === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(customEnd);
    end.setUTCHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  let startDate: Date;
  let endDate: Date = new Date(now); // Default to now

  switch (period) {
    case 'realtime':
      startDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      break;

    case 'today':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      break;

    case 'yesterday':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 23, 59, 59, 999));
      break;

    case 'last7days':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));
      break;

    case 'last30days':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29));
      break;

    case 'thisMonth':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      break;

    case 'lastMonth':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
      break;

    case 'last3months':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 90));
      break;

    case 'thisYear':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      break;

    default:
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));
  }

  return { startDate, endDate };
};

/**
 * Determines the best period type to use for a custom date range.
 * This ensures custom periods get appropriate label formatting based on their span.
 */
export const getEffectivePeriodForCustomRange = (startDate: Date, endDate: Date): PeriodType => {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);

  if (diffDays <= 1) {
    return 'today'; // Use hourly labels
  } else if (diffDays <= 7) {
    return 'last7days'; // Use weekday + day labels
  } else if (diffDays <= 60) {
    return 'last30days'; // Use day + month labels
  } else if (diffDays <= 120) {
    return 'last3months'; // Use week labels
  } else {
    return 'thisYear'; // Use month labels
  }
};

// ============================================================================
// Date Formatting Functions (all use UTC)
// ============================================================================

/**
 * Format time in HH:mm format (UTC)
 */
export const formatTime = (date: Date): string => {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format short weekday and day (e.g., "lun. 5") (UTC)
 */
export const formatShortDate = (date: Date): string => {
  const weekdays = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const day = date.getUTCDate();
  const weekday = weekdays[date.getUTCDay()];
  return `${weekday} ${day}`;
};

/**
 * Format day and month (e.g., "15 jan.") (UTC)
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
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  return `${day} ${month}`;
};

/**
 * Format ISO week number (e.g., "Sem. 12")
 * Uses ISO week numbering (week starts on Monday) — already UTC-based.
 */
export const formatWeek = (date: Date): string => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `Sem. ${weekNumber}`;
};

/**
 * Format month name (e.g., "janvier") (UTC)
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
  return months[date.getUTCMonth()] ?? 'janvier';
};

// ============================================================================
// Bucket Key Functions
// ============================================================================

/**
 * Get the bucket key (label) for a date based on the period type.
 * This determines how the date will be displayed on the X-axis.
 *
 * For custom periods, pass customStartDate and customEndDate to determine
 * the appropriate label format based on the date range span.
 */
export const getBucketKey = (
  date: Date,
  period: PeriodType,
  customStartDate?: string,
  customEndDate?: string
): string => {
  // For custom period, determine effective period based on date span
  if (period === 'custom' && customStartDate && customEndDate) {
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    const effectivePeriod = getEffectivePeriodForCustomRange(startDate, endDate);
    return getBucketKey(date, effectivePeriod); // Recursive call with effective period
  }

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
      return formatDayMonth(date);
    case 'last3months':
      return formatWeek(date);
    case 'thisYear':
      return formatMonth(date);
    case 'custom':
      // Fallback for custom without date range - use day+month
      return formatDayMonth(date);
    default:
      return formatDayMonth(date);
  }
};

// ============================================================================
// Date Normalization Functions (all use UTC)
// ============================================================================

/**
 * Normalize a date to the start of its bucket based on the period type.
 * This is CRITICAL for correct aggregation - all dates within a bucket
 * must normalize to the same timestamp.
 *
 * Uses UTC throughout to match PostgreSQL's date_trunc() behavior.
 */
export const normalizeToBucketStart = (
  date: Date,
  period: PeriodType,
  customStartDate?: string,
  customEndDate?: string
): Date => {
  const normalized = new Date(date);

  // For custom period, determine effective period based on date span
  let effectivePeriod = period;
  if (period === 'custom' && customStartDate && customEndDate) {
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    effectivePeriod = getEffectivePeriodForCustomRange(startDate, endDate);
  }

  switch (effectivePeriod) {
    case 'realtime':
      // Round down to nearest 5-minute interval (UTC)
      normalized.setUTCMinutes(Math.floor(normalized.getUTCMinutes() / 5) * 5);
      normalized.setUTCSeconds(0);
      normalized.setUTCMilliseconds(0);
      break;

    case 'today':
    case 'yesterday':
      // Round to start of hour (UTC)
      normalized.setUTCMinutes(0);
      normalized.setUTCSeconds(0);
      normalized.setUTCMilliseconds(0);
      break;

    case 'last7days':
    case 'last30days':
    case 'thisMonth':
    case 'lastMonth':
      // Round to start of day (UTC)
      normalized.setUTCHours(0, 0, 0, 0);
      break;

    case 'last3months': {
      // Round to start of ISO week (Monday, UTC)
      const dayOfWeek = normalized.getUTCDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      normalized.setUTCDate(normalized.getUTCDate() + diff);
      normalized.setUTCHours(0, 0, 0, 0);
      break;
    }

    case 'thisYear':
      // Round to start of month (UTC)
      normalized.setUTCDate(1);
      normalized.setUTCHours(0, 0, 0, 0);
      break;

    case 'custom':
      // Fallback for custom without date range - use day start (UTC)
      normalized.setUTCHours(0, 0, 0, 0);
      break;

    default:
      normalized.setUTCHours(0, 0, 0, 0);
  }

  return normalized;
};

// ============================================================================
// Bucket Generation (all use UTC)
// ============================================================================

export interface ChartBucket {
  label: string;
  timestamp: number; // Normalized UTC timestamp for this bucket
  value: number;
  previousValue?: number;
}

/**
 * Generate all chart buckets for a given period.
 * Returns buckets with their labels and normalized UTC timestamps for aggregation.
 *
 * All timestamps are UTC-aligned to match PostgreSQL's date_trunc().
 */
export const generateChartBuckets = (
  period: PeriodType,
  customStartDate?: string,
  customEndDate?: string
): ChartBucket[] => {
  const now = new Date();
  const buckets: ChartBucket[] = [];

  // Handle custom period — determine effective period based on date span
  if (period === 'custom' && customStartDate && customEndDate) {
    const startDate = new Date(customStartDate);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(customEndDate);
    endDate.setUTCHours(23, 59, 59, 999);

    const effectivePeriod = getEffectivePeriodForCustomRange(startDate, endDate);

    switch (effectivePeriod) {
      case 'today': {
        const current = new Date(startDate);
        while (current <= endDate) {
          buckets.push({
            label: formatTime(current),
            timestamp: current.getTime(),
            value: 0,
          });
          current.setUTCHours(current.getUTCHours() + 1);
        }
        break;
      }
      case 'last7days': {
        const current = new Date(startDate);
        while (current <= endDate) {
          buckets.push({
            label: formatShortDate(current),
            timestamp: current.getTime(),
            value: 0,
          });
          current.setUTCDate(current.getUTCDate() + 1);
        }
        break;
      }
      case 'last30days': {
        const current = new Date(startDate);
        while (current <= endDate) {
          buckets.push({
            label: formatDayMonth(current),
            timestamp: current.getTime(),
            value: 0,
          });
          current.setUTCDate(current.getUTCDate() + 1);
        }
        break;
      }
      case 'last3months': {
        const seenWeeks = new Set<string>();
        const current = new Date(startDate);
        // Align to Monday (UTC)
        const dayOfWeek = current.getUTCDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        current.setUTCDate(current.getUTCDate() + diff);
        current.setUTCHours(0, 0, 0, 0);

        while (current <= endDate) {
          const weekKey = formatWeek(current);
          if (!seenWeeks.has(weekKey)) {
            seenWeeks.add(weekKey);
            buckets.push({
              label: weekKey,
              timestamp: current.getTime(),
              value: 0,
            });
          }
          current.setUTCDate(current.getUTCDate() + 7);
        }
        break;
      }
      case 'thisYear': {
        const current = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
        while (current <= endDate) {
          buckets.push({
            label: formatMonth(current),
            timestamp: current.getTime(),
            value: 0,
          });
          current.setUTCMonth(current.getUTCMonth() + 1);
        }
        break;
      }
    }

    return buckets;
  }

  switch (period) {
    case 'realtime': {
      // Last 12 intervals of 5 minutes
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setUTCMinutes(date.getUTCMinutes() - i * 5);
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
      // 24 hourly buckets (UTC)
      const baseDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      if (period === 'yesterday') baseDate.setUTCDate(baseDate.getUTCDate() - 1);

      for (let i = 0; i < 24; i++) {
        const date = new Date(baseDate);
        date.setUTCHours(i);
        buckets.push({
          label: formatTime(date),
          timestamp: date.getTime(),
          value: 0,
        });
      }
      break;
    }

    case 'last7days': {
      // Last 7 days (UTC)
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
        buckets.push({
          label: formatShortDate(date),
          timestamp: date.getTime(),
          value: 0,
        });
      }
      break;
    }

    case 'last30days': {
      // Last 30 days — ALL days returned, no forced sampling
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
        buckets.push({
          label: formatDayMonth(date),
          timestamp: date.getTime(),
          value: 0,
        });
      }
      return buckets;
    }

    case 'thisMonth': {
      // From 1st of current month to today (UTC)
      const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      const current = new Date(startDate);
      while (current <= today) {
        buckets.push({
          label: formatDayMonth(current),
          timestamp: current.getTime(),
          value: 0,
        });
        current.setUTCDate(current.getUTCDate() + 1);
      }
      return buckets;
    }

    case 'lastMonth': {
      // Full last month (UTC)
      const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)); // Last day of prev month

      const current = new Date(startDate);
      while (current <= endDate) {
        buckets.push({
          label: formatDayMonth(current),
          timestamp: current.getTime(),
          value: 0,
        });
        current.setUTCDate(current.getUTCDate() + 1);
      }
      return buckets;
    }

    case 'last3months': {
      // ~13 weeks (UTC)
      const seenWeeks = new Set<string>();
      for (let i = 12; i >= 0; i--) {
        const date = new Date(now);
        date.setUTCDate(date.getUTCDate() - i * 7);
        const normalized = normalizeToBucketStart(date, period);
        const weekKey = formatWeek(normalized);

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
      // January to current month (UTC)
      const currentMonth = now.getUTCMonth();
      for (let i = 0; i <= currentMonth; i++) {
        const date = new Date(Date.UTC(now.getUTCFullYear(), i, 1));
        buckets.push({
          label: formatMonth(date),
          timestamp: date.getTime(),
          value: 0,
        });
      }
      break;
    }

    default: {
      // Fallback: last 7 days (UTC)
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
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
 * Aggregates values when sampling and generates range labels (e.g. "3-4 fév.").
 */
export const sampleBucketsForDisplay = (
  buckets: ChartBucket[],
  maxPoints: number = 31
): ChartBucket[] => {
  if (buckets.length <= maxPoints) {
    return buckets;
  }

  const step = Math.ceil(buckets.length / maxPoints);
  const sampled: ChartBucket[] = [];

  for (let i = 0; i < buckets.length; i += step) {
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

    // If step > 1, create a range label to make the aggregation visible
    let label = buckets[i]!.label;
    if (step > 1 && endIndex - 1 > i && buckets[endIndex - 1]) {
      const lastLabel = buckets[endIndex - 1]!.label;
      if (lastLabel !== label) {
        label = `${label} – ${lastLabel}`;
      }
    }

    sampled.push({
      label,
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
 *
 * Uses UTC normalization to match PostgreSQL's date_trunc() and the
 * UTC-based bucket timestamps.
 */
export const aggregateVisitsIntoBuckets = (
  buckets: ChartBucket[],
  visits: Visit[],
  period: PeriodType,
  customStartDate?: string,
  customEndDate?: string
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

    // Normalize the visit date to its bucket start (UTC)
    const normalizedDate = normalizeToBucketStart(
      visitDate,
      period,
      customStartDate,
      customEndDate
    );
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
 *
 * maxDisplayPoints defaults to 31 so that monthly periods (28-31 days)
 * are NEVER sampled — each point represents exactly one day.
 * Sampling only kicks in for custom ranges that exceed the threshold.
 */
export const formatChartDataForPeriod = (
  visits: Visit[],
  period: PeriodType,
  maxDisplayPoints: number = 31,
  customStartDate?: string,
  customEndDate?: string
): ChartBucket[] => {
  // Generate all buckets
  let buckets = generateChartBuckets(period, customStartDate, customEndDate);

  // Aggregate visits
  buckets = aggregateVisitsIntoBuckets(buckets, visits, period, customStartDate, customEndDate);

  // Sample ONLY when there are genuinely too many points.
  // Standard periods (last30days, thisMonth, lastMonth) have at most 31 points
  // which is perfectly fine for chart rendering — no sampling needed.
  if (buckets.length > maxDisplayPoints) {
    buckets = sampleBucketsForDisplay(buckets, maxDisplayPoints);
  }

  return buckets;
};
