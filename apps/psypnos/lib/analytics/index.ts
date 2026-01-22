// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Analytics Library Index
 * Phase 4: Scalability & Performance
 *
 * Centralized exports for analytics utilities
 */

// Aggregation service
export {
  computeDailySummary,
  computeTrafficSourceSummary,
  computeSectionSummary,
  runDailyAggregations,
  backfillAggregations,
  getDailySummaries,
  getTrafficSourceSummaries,
  getSectionSummaries,
} from "./aggregation";
