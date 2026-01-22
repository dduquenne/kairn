/**
 * Analytics Dashboard Handler
 *
 * Returns aggregated analytics data for the dashboard.
 */

import type { ApiRequest } from '../../middleware/types';
import { withQueryValidation } from '../../middleware/with-validation';
import { error, success } from '../../utils/response';

import { dashboardQuerySchema, type DashboardData, type AnalyticsHandlerConfig } from './types';

/**
 * Dashboard handler result
 */
export interface DashboardResult {
  response:
    | { success: true; data: DashboardData }
    | { success: false; error: { code: string; message: string; details?: unknown } };
  statusCode: number;
  headers: Record<string, string>;
}

/**
 * Calculate date range from period
 */
function calculateDateRange(
  period: string,
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start: Date;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;

    case '7d':
      start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;

    case '30d':
      start = new Date(end);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;

    case '90d':
      start = new Date(end);
      start.setDate(start.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      break;

    case 'custom':
      if (customStart && customEnd) {
        start = new Date(customStart);
        return { start, end: new Date(customEnd) };
      }
      // Fallback to 7 days
      start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;

    default:
      start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

/**
 * Handle dashboard data request
 *
 * @param request - The incoming request
 * @param config - Handler configuration
 * @returns Dashboard data result
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const authResult = await withAdmin(request, { getCookies: () => cookies() });
 *   if (!authResult.success) {
 *     return NextResponse.json(authResult.error, { status: authResult.error.statusCode });
 *   }
 *
 *   const result = await handleDashboard(request, {
 *     getDashboardData: async ({ startDate, endDate }) => {
 *       // Fetch data from database
 *       return dashboardData;
 *     },
 *   });
 *
 *   return NextResponse.json(result.response, {
 *     status: result.statusCode,
 *     headers: result.headers,
 *   });
 * }
 * ```
 */
export async function handleDashboard(
  request: ApiRequest,
  config: AnalyticsHandlerConfig
): Promise<DashboardResult> {
  const { getDashboardData, siteId: configSiteId } = config;

  // Parse query parameters
  const queryResult = withQueryValidation(request, dashboardQuerySchema);

  if (!queryResult.success) {
    return {
      response: error('VALIDATION_ERROR', 'Paramètres de requête invalides', {
        details: queryResult.error.details,
      }),
      statusCode: 400,
      headers: {},
    };
  }

  const { period, startDate, endDate, siteId: querySiteId } = queryResult.query;

  // Calculate date range
  const { start, end } = calculateDateRange(period, startDate, endDate);

  try {
    const dashboardData = await getDashboardData({
      startDate: start,
      endDate: end,
      siteId: querySiteId || configSiteId,
    });

    // Cache for 5 minutes (admin data)
    return {
      response: success(dashboardData),
      statusCode: 200,
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    };
  } catch (e) {
    console.error('[Dashboard API] Error:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la récupération des données'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Create dashboard handler with preset configuration
 */
export function createDashboardHandler(config: AnalyticsHandlerConfig) {
  return (request: ApiRequest) => handleDashboard(request, config);
}
