/**
 * Unit tests for analytics conversion rate calculation and funnel building.
 *
 * Verifies that:
 * - conversionRate is calculated as convertedSessions / uniqueSessions (not events)
 * - Per-type rate uses uniqueSessions as denominator
 * - Funnel steps are built from session counts
 * - Funnel percentages in useAnalytics are relative to the first step
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies before importing the module under test ────────

const mockGroupBy = vi.fn();
const mockCount = vi.fn();
const mockFindMany = vi.fn();

vi.mock('@prisma/client', () => ({
  EventType: {
    PAGE_VIEW: 'PAGE_VIEW',
    PAGE_EXIT: 'PAGE_EXIT',
    SECTION_TIME: 'SECTION_TIME',
    CONVERSION: 'CONVERSION',
    FUNNEL_STEP: 'FUNNEL_STEP',
    CUSTOM: 'CUSTOM',
    SCROLL_DEPTH: 'SCROLL_DEPTH',
  },
  Prisma: {
    raw: (str: string) => str,
  },
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    analyticsEvent: {
      groupBy: (...args: unknown[]) => mockGroupBy(...args),
      count: (...args: unknown[]) => mockCount(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

vi.mock('@/lib/cache/redis', () => ({
  getCached: (_key: string, fn: () => Promise<unknown>) => fn(),
  CACHE_KEYS: { SUMMARY: 'summary' },
  CACHE_TTL: { MEDIUM: 300 },
  buildCacheKey: (prefix: string, params: Record<string, string | undefined>) =>
    `${prefix}:${JSON.stringify(params)}`,
}));

vi.mock('../../app/api/analytics/store-postgres/utils', () => ({
  buildDateFilter: () => ({ createdAt: { gte: new Date(), lte: new Date() } }),
  getCurrentSiteId: () => Promise.resolve('site-1'),
}));

import { getAnalyticsSummary } from '../../app/api/analytics/store-postgres/analytics';

// ── Helpers ─────────────────────────────────────────────────────────

/** Build a groupBy result row for session-based queries */
function sessionRow(sessionId: string) {
  return { sessionId };
}

/** Build a groupBy result row for name-based queries with count */
function nameCountRow(name: string, count: number) {
  return { name, _count: { id: count } };
}

/** Build a groupBy result row for session-based queries with count */
function sessionCountRow(sessionId: string, count: number) {
  return { sessionId, _count: { id: count } };
}

// ── Tests ───────────────────────────────────────────────────────────

describe('getAnalyticsSummary — conversion rate fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Configure mocks for a scenario with known session and conversion counts.
   *
   * The Promise.all in getAnalyticsSummary issues 7 queries + 1 extra groupBy
   * for completedConversions. We mock them in order:
   * 1. pageViewStats (groupBy sessionId)
   * 2. bounceStats (count)
   * 3. pageExitStats (findMany)
   * 4. sectionTimeStats (findMany)
   * 5. conversionStats (groupBy name)
   * 6. conversionSessionStats (groupBy sessionId)
   * 7. completedSessionStats (groupBy sessionId)
   * 8. completedConversions (separate groupBy by name — called after Promise.all)
   */
  function setupMocks(params: {
    uniqueSessions: number;
    totalPageViews: number;
    conversionEventsByType: Record<string, number>;
    completedByType: Record<string, number>;
    engagedSessions: number;
    convertedSessions: number;
  }) {
    const {
      uniqueSessions,
      totalPageViews,
      conversionEventsByType,
      completedByType,
      engagedSessions,
      convertedSessions,
    } = params;

    // Build session rows for pageViewStats (query 1)
    const pageViewSessionRows = Array.from({ length: uniqueSessions }, (_, i) =>
      sessionCountRow(`s-${i}`, 2)
    );

    // Build conversionStats rows (query 5)
    const conversionStatsRows = Object.entries(conversionEventsByType).map(([name, count]) =>
      nameCountRow(name, count)
    );

    // Build conversionSessionStats rows (query 6)
    const engagedSessionRows = Array.from({ length: engagedSessions }, (_, i) =>
      sessionRow(`s-${i}`)
    );

    // Build completedSessionStats rows (query 7)
    const completedSessionRows = Array.from({ length: convertedSessions }, (_, i) =>
      sessionRow(`s-${i}`)
    );

    // Build completedConversions rows (separate query after Promise.all)
    const completedConversionRows = Object.entries(completedByType).map(([name, count]) =>
      nameCountRow(name, count)
    );

    // Mock the 7 Promise.all calls in order
    // groupBy is called for queries 1, 5, 6, 7, and then the extra completedConversions
    let groupByCallIndex = 0;
    mockGroupBy.mockImplementation(() => {
      const responses = [
        pageViewSessionRows, // 1. pageViewStats
        conversionStatsRows, // 5. conversionStats
        engagedSessionRows, // 6. conversionSessionStats
        completedSessionRows, // 7. completedSessionStats
        completedConversionRows, // 8. completedConversions (after Promise.all)
      ];
      return Promise.resolve(responses[groupByCallIndex++] || []);
    });

    // count is called for query 2 (bounceStats)
    mockCount.mockResolvedValue(totalPageViews);

    // findMany is called for queries 3 and 4
    mockFindMany.mockResolvedValue([]);
  }

  it('should calculate conversionRate as convertedSessions / uniqueSessions', async () => {
    setupMocks({
      uniqueSessions: 200,
      totalPageViews: 500,
      conversionEventsByType: { contact_form: 8, appointment_request: 5 },
      completedByType: { contact_form: 8, appointment_request: 5 },
      engagedSessions: 15,
      convertedSessions: 10,
    });

    const result = await getAnalyticsSummary();

    // conversionRate = 10 convertedSessions / 200 uniqueSessions * 100 = 5%
    // NOT 13/13 = 100% (old broken formula)
    expect(result.conversionRate).toBeCloseTo(5.0, 1);
  });

  it('should calculate per-type rate as completed / uniqueSessions', async () => {
    setupMocks({
      uniqueSessions: 100,
      totalPageViews: 300,
      conversionEventsByType: { contact_form: 6, appointment_request: 4 },
      completedByType: { contact_form: 3, appointment_request: 2 },
      engagedSessions: 8,
      convertedSessions: 5,
    });

    const result = await getAnalyticsSummary();

    // contact_form rate = 3 / 100 * 100 = 3%
    expect(result.conversionByType['contact_form']!.rate).toBeCloseTo(3.0, 1);
    // appointment_request rate = 2 / 100 * 100 = 2%
    expect(result.conversionByType['appointment_request']!.rate).toBeCloseTo(2.0, 1);
  });

  it('should build funnelSteps with 3 steps from session counts', async () => {
    setupMocks({
      uniqueSessions: 500,
      totalPageViews: 1200,
      conversionEventsByType: { contact_form: 10 },
      completedByType: { contact_form: 7 },
      engagedSessions: 30,
      convertedSessions: 20,
    });

    const result = await getAnalyticsSummary();

    expect(result.funnelSteps).toHaveLength(3);
    expect(result.funnelSteps![0]).toEqual({ name: 'Visiteurs', visitors: 500 });
    expect(result.funnelSteps![1]).toEqual({ name: 'Intéressés', visitors: 30 });
    expect(result.funnelSteps![2]).toEqual({ name: 'Convertis', visitors: 20 });
  });

  it('should return 0% conversionRate when no sessions', async () => {
    setupMocks({
      uniqueSessions: 0,
      totalPageViews: 0,
      conversionEventsByType: {},
      completedByType: {},
      engagedSessions: 0,
      convertedSessions: 0,
    });

    const result = await getAnalyticsSummary();

    expect(result.conversionRate).toBe(0);
    expect(result.funnelSteps![0]!.visitors).toBe(0);
  });

  it('should return 0% per-type rate when no sessions', async () => {
    setupMocks({
      uniqueSessions: 0,
      totalPageViews: 0,
      conversionEventsByType: { contact_form: 3 },
      completedByType: { contact_form: 2 },
      engagedSessions: 0,
      convertedSessions: 0,
    });

    const result = await getAnalyticsSummary();

    expect(result.conversionByType['contact_form']!.rate).toBe(0);
  });
});

describe('useAnalytics funnel percentage calculation', () => {
  /**
   * Mirrors the funnel transformation logic from useAnalytics.ts.
   * Tests that percentages are calculated relative to the first step,
   * not to totalVisits (page views).
   */
  function buildFunnelSteps(rawFunnelSteps: Array<{ name: string; visitors: number }>) {
    if (rawFunnelSteps.length === 0) return [];

    const firstStepVisitors = rawFunnelSteps[0]?.visitors || 0;
    return rawFunnelSteps.map((step, i) => {
      const percentage = firstStepVisitors > 0 ? (step.visitors / firstStepVisitors) * 100 : 0;
      const prevPercentage =
        i > 0 && firstStepVisitors > 0
          ? (rawFunnelSteps[i - 1]!.visitors / firstStepVisitors) * 100
          : 100;
      return {
        name: step.name,
        visitors: step.visitors,
        percentage: Math.round(percentage * 10) / 10,
        dropoff: Math.round((prevPercentage - percentage) * 10) / 10,
      };
    });
  }

  it('should compute percentages relative to the first step', () => {
    const steps = buildFunnelSteps([
      { name: 'Visiteurs', visitors: 500 },
      { name: 'Intéressés', visitors: 50 },
      { name: 'Convertis', visitors: 10 },
    ]);

    expect(steps[0]!.percentage).toBe(100);
    expect(steps[0]!.dropoff).toBe(0);
    expect(steps[1]!.percentage).toBe(10);
    expect(steps[1]!.dropoff).toBe(90);
    expect(steps[2]!.percentage).toBe(2);
    expect(steps[2]!.dropoff).toBe(8);
  });

  it('should handle zero visitors gracefully', () => {
    const steps = buildFunnelSteps([
      { name: 'Visiteurs', visitors: 0 },
      { name: 'Intéressés', visitors: 0 },
      { name: 'Convertis', visitors: 0 },
    ]);

    expect(steps[0]!.percentage).toBe(0);
    expect(steps[1]!.percentage).toBe(0);
    expect(steps[2]!.percentage).toBe(0);
  });

  it('should handle single step funnel', () => {
    const steps = buildFunnelSteps([{ name: 'Visiteurs', visitors: 100 }]);

    expect(steps).toHaveLength(1);
    expect(steps[0]!.percentage).toBe(100);
    expect(steps[0]!.dropoff).toBe(0);
  });

  it('should handle empty funnel', () => {
    const steps = buildFunnelSteps([]);
    expect(steps).toHaveLength(0);
  });
});
