/**
 * Analytics Realtime Handler
 *
 * Returns real-time visitor data.
 */

import { error, success } from '../../utils/response';

import { type RealtimeData, type AnalyticsHandlerConfig } from './types';

/**
 * Realtime handler result
 */
export interface RealtimeResult {
  response:
    | { success: true; data: RealtimeData }
    | { success: false; error: { code: string; message: string; details?: unknown } };
  statusCode: number;
  headers: Record<string, string>;
}

/**
 * Handle realtime data request
 *
 * @param config - Handler configuration
 * @returns Realtime data result
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const authResult = await withAdmin(request, { getCookies: () => cookies() });
 *   if (!authResult.success) {
 *     return NextResponse.json(authResult.error, { status: authResult.error.statusCode });
 *   }
 *
 *   const result = await handleRealtime({
 *     getRealtimeData: async () => {
 *       // Fetch realtime data
 *       return realtimeData;
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
export async function handleRealtime(config: AnalyticsHandlerConfig): Promise<RealtimeResult> {
  const { getRealtimeData, siteId } = config;

  if (!getRealtimeData) {
    return {
      response: error('NOT_IMPLEMENTED', 'Données temps réel non disponibles'),
      statusCode: 501,
      headers: {},
    };
  }

  try {
    const realtimeData = await getRealtimeData(siteId);

    // Very short cache (10 seconds) for realtime data
    return {
      response: success(realtimeData),
      statusCode: 200,
      headers: {
        'Cache-Control': 'private, max-age=10',
      },
    };
  } catch (e) {
    console.error('[Realtime API] Error:', e);
    return {
      response: error('INTERNAL_ERROR', 'Erreur lors de la récupération des données temps réel'),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Create realtime handler with preset configuration
 */
export function createRealtimeHandler(config: AnalyticsHandlerConfig) {
  return () => handleRealtime(config);
}
