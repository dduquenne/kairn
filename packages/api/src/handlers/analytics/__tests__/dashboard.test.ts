/**
 * Analytics Dashboard Handler Tests
 *
 * Tests for the dashboard data handler including:
 * - Date range calculation for different periods
 * - Query parameter validation
 * - Data fetching and response formatting
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@kairn/core', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { handleDashboard } from '../dashboard';
import type { AnalyticsHandlerConfig, DashboardData } from '../types';
import type { ApiRequest } from '../../../middleware/types';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Create a mock dashboard request
 */
function createMockRequest(url: string): ApiRequest {
  return {
    url,
    method: 'GET',
    headers: { get: () => null },
    json: () => Promise.reject(new Error('No body')),
    clone: () => ({
      headers: { get: () => null },
      json: () => Promise.reject(new Error('No body')),
      formData: () => Promise.reject(new Error('not implemented')),
    }),
  };
}

/**
 * Create mock dashboard data
 */
function createMockDashboardData(): DashboardData {
  return {
    metrics: {
      totalVisits: 1500,
      uniqueVisitors: 800,
      pageViews: 3200,
      avgSessionDuration: 180,
      bounceRate: 45.2,
      pagesPerSession: 2.1,
      changes: {
        totalVisits: 12.5,
        uniqueVisitors: 8.3,
        pageViews: 15.0,
        avgSessionDuration: -5.2,
        bounceRate: -2.1,
        pagesPerSession: 3.0,
      },
    },
    topPages: [],
    trafficSources: [],
    deviceBreakdown: [],
    geoData: [],
    visitsByDay: [],
    pageViewsByDay: [],
  };
}

/**
 * Create a mock analytics config
 */
function createMockConfig(overrides: Partial<AnalyticsHandlerConfig> = {}): AnalyticsHandlerConfig {
  return {
    siteId: 'site-1',
    trackPageVisit: vi.fn(),
    trackCustomEvent: vi.fn(),
    getDashboardData: vi.fn().mockResolvedValue(createMockDashboardData()),
    ...overrides,
  };
}

// =============================================================================
// handleDashboard
// =============================================================================

describe('handleDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return dashboard data with default period (7d)', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/analytics/dashboard');

    const result = await handleDashboard(request, config);

    expect(result.statusCode).toBe(200);
    expect(result.response.success).toBe(true);
    if (result.response.success) {
      expect(result.response.data.metrics.totalVisits).toBe(1500);
    }
  });

  it('should pass correct date range for "today" period', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/analytics/dashboard?period=today');

    await handleDashboard(request, config);

    expect(config.getDashboardData).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: 'site-1',
      })
    );

    const call = vi.mocked(config.getDashboardData).mock.calls[0][0];
    const start = call.startDate;
    const end = call.endDate;

    // Start and end should be the same day
    expect(start.getDate()).toBe(end.getDate());
    expect(start.getHours()).toBe(0);
    expect(end.getHours()).toBe(23);
  });

  it('should handle "30d" period', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/analytics/dashboard?period=30d');

    await handleDashboard(request, config);

    const call = vi.mocked(config.getDashboardData).mock.calls[0][0];
    const diffDays = (call.endDate.getTime() - call.startDate.getTime()) / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThan(31);
  });

  it('should handle "90d" period', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/analytics/dashboard?period=90d');

    await handleDashboard(request, config);

    const call = vi.mocked(config.getDashboardData).mock.calls[0][0];
    const diffDays = (call.endDate.getTime() - call.startDate.getTime()) / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeGreaterThanOrEqual(89);
    expect(diffDays).toBeLessThan(91);
  });

  it('should handle custom date range', async () => {
    const config = createMockConfig();
    const request = createMockRequest(
      'https://example.com/api/analytics/dashboard?period=custom&startDate=2025-01-01&endDate=2025-01-31'
    );

    await handleDashboard(request, config);

    const call = vi.mocked(config.getDashboardData).mock.calls[0][0];
    expect(call.startDate.toISOString()).toContain('2025-01-01');
    expect(call.endDate.toISOString()).toContain('2025-01-31');
  });

  it('should fallback to 7d when custom period has no dates', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/analytics/dashboard?period=custom');

    await handleDashboard(request, config);

    const call = vi.mocked(config.getDashboardData).mock.calls[0][0];
    const diffDays = (call.endDate.getTime() - call.startDate.getTime()) / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThan(8);
  });

  it('should set private cache header', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/analytics/dashboard');

    const result = await handleDashboard(request, config);

    expect(result.headers['Cache-Control']).toBe('private, max-age=300');
  });

  it('should return 400 for invalid query params', async () => {
    const config = createMockConfig();
    const request = createMockRequest('https://example.com/api/analytics/dashboard?period=invalid');

    const result = await handleDashboard(request, config);

    expect(result.statusCode).toBe(400);
  });

  it('should return 500 when getDashboardData throws', async () => {
    const config = createMockConfig({
      getDashboardData: vi.fn().mockRejectedValue(new Error('DB Error')),
    });
    const request = createMockRequest('https://example.com/api/analytics/dashboard');

    const result = await handleDashboard(request, config);

    expect(result.statusCode).toBe(500);
    expect(result.response.success).toBe(false);
  });

  it('should pass siteId to getDashboardData', async () => {
    const config = createMockConfig({ siteId: 'custom-site' });
    const request = createMockRequest('https://example.com/api/analytics/dashboard');

    await handleDashboard(request, config);

    expect(config.getDashboardData).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'custom-site' })
    );
  });
});
