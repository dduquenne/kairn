/**
 * Analytics Aggregation — Psypnos Bridge
 *
 * Delegates to @kairn/analytics/server after ensuring the server is initialized.
 */

// Side-effect: ensure analytics server context is initialized
import '@/lib/analytics-server-init';

export {
  computeDailySummary,
  runDailyAggregations,
  backfillAggregations,
  getDailySummaries,
} from '@kairn/analytics/server';
