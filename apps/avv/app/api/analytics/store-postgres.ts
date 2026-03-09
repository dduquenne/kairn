/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * PostgreSQL Analytics Store - Backward Compatibility Layer
 *
 * This file re-exports everything from the modular store-postgres for backward compatibility.
 * New code should import directly from "./store-postgres/index" or specific submodules.
 *
 * The store has been split into the following modules for better maintainability:
 * - store-postgres/page-visits.ts    - Page visit operations
 * - store-postgres/section-times.ts  - Section time operations
 * - store-postgres/conversions.ts    - Conversion event operations
 * - store-postgres/analytics.ts      - Summary and statistics
 * - store-postgres/custom-events.ts  - Custom event operations
 * - store-postgres/goals.ts          - Goal management
 * - store-postgres/funnels.ts        - Funnel analysis
 * - store-postgres/cohorts.ts        - Cohort analysis
 * - store-postgres/attribution.ts    - Marketing attribution
 * - store-postgres/alerts.ts         - Alert system
 * - store-postgres/anomalies.ts      - Anomaly detection
 * - store-postgres/reports.ts        - Scheduled reports
 * - store-postgres/dashboard.ts      - Dashboard configuration
 */

export * from "./store-postgres/index";
