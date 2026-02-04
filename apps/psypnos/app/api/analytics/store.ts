/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Analytics Store - Backward Compatibility Layer
 *
 * This file re-exports everything from the modular store for backward compatibility.
 * New code should import directly from "./store/index" or specific submodules.
 *
 * The store has been split into the following modules for better maintainability:
 * - store/types.ts          - Type definitions
 * - store/schemas.ts        - Zod validation schemas
 * - store/cache.ts          - File I/O and caching utilities
 * - store/page-visits.ts    - Page visit tracking
 * - store/section-times.ts  - Section time tracking
 * - store/conversions.ts    - Conversion event tracking
 * - store/custom-events.ts  - Custom event tracking
 * - store/analytics.ts      - Analytics summary functions
 * - store/goals.ts          - Goal management
 * - store/funnels.ts        - Funnel analysis
 * - store/cohorts.ts        - Cohort analysis
 * - store/attribution.ts    - Marketing attribution
 * - store/alerts.ts         - Alert system
 * - store/anomalies.ts      - Anomaly detection
 * - store/reports.ts        - Scheduled reports
 * - store/dashboard.ts      - Dashboard configuration
 */

export * from "./store/index";
