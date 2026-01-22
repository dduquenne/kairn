/**
 * Analytics Export Handler
 *
 * Exports analytics data in various formats.
 */

import type { ApiRequest } from '../../middleware/types';
import { withQueryValidation } from '../../middleware/with-validation';
import { error } from '../../utils/response';

import { exportQuerySchema, type AnalyticsHandlerConfig } from './types';

/**
 * Export handler result
 */
export type ExportResult =
  | { success: true; data: Buffer; filename: string; contentType: string }
  | {
      success: false;
      response: { success: false; error: { code: string; message: string; details?: unknown } };
      statusCode: number;
      headers: Record<string, string>;
    };

/**
 * Content type mapping
 */
const CONTENT_TYPES: Record<string, string> = {
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

/**
 * Handle export request
 *
 * @param request - The incoming request
 * @param config - Handler configuration
 * @returns Export result with binary data or error
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const authResult = await withAdmin(request, { getCookies: () => cookies() });
 *   if (!authResult.success) {
 *     return NextResponse.json(authResult.error, { status: authResult.error.statusCode });
 *   }
 *
 *   const result = await handleExport(request, {
 *     exportData: async ({ startDate, endDate, format, type }) => {
 *       // Generate export
 *       return { data: buffer, filename: 'analytics.csv', contentType: 'text/csv' };
 *     },
 *   });
 *
 *   if (!result.success) {
 *     return NextResponse.json(result.response, {
 *       status: result.statusCode,
 *       headers: result.headers,
 *     });
 *   }
 *
 *   return new Response(result.data, {
 *     headers: {
 *       'Content-Type': result.contentType,
 *       'Content-Disposition': `attachment; filename="${result.filename}"`,
 *     },
 *   });
 * }
 * ```
 */
export async function handleExport(
  request: ApiRequest,
  config: AnalyticsHandlerConfig
): Promise<ExportResult> {
  const { exportData, siteId: configSiteId } = config;

  if (!exportData) {
    return {
      success: false,
      response: error('NOT_IMPLEMENTED', 'Export non disponible'),
      statusCode: 501,
      headers: {},
    };
  }

  // Parse query parameters
  const queryResult = withQueryValidation(request, exportQuerySchema);

  if (!queryResult.success) {
    return {
      success: false,
      response: error('VALIDATION_ERROR', 'Paramètres de requête invalides', {
        details: queryResult.error.details,
      }),
      statusCode: 400,
      headers: {},
    };
  }

  const { startDate, endDate, format, type, siteId: querySiteId } = queryResult.query;

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      success: false,
      response: error('VALIDATION_ERROR', 'Dates invalides'),
      statusCode: 400,
      headers: {},
    };
  }

  if (start > end) {
    return {
      success: false,
      response: error('VALIDATION_ERROR', 'La date de début doit être antérieure à la date de fin'),
      statusCode: 400,
      headers: {},
    };
  }

  // Limit export range to 1 year
  const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
  if (end.getTime() - start.getTime() > maxRange) {
    return {
      success: false,
      response: error('VALIDATION_ERROR', "La plage d'export ne peut pas dépasser 1 an"),
      statusCode: 400,
      headers: {},
    };
  }

  try {
    const result = await exportData({
      startDate: start,
      endDate: end,
      format,
      type,
      siteId: querySiteId || configSiteId,
    });

    return {
      success: true,
      data: result.data,
      filename: result.filename,
      contentType: result.contentType || CONTENT_TYPES[format] || 'application/octet-stream',
    };
  } catch (e) {
    console.error('[Export API] Error:', e);
    return {
      success: false,
      response: error('INTERNAL_ERROR', "Erreur lors de la génération de l'export"),
      statusCode: 500,
      headers: {},
    };
  }
}

/**
 * Create export handler with preset configuration
 */
export function createExportHandler(config: AnalyticsHandlerConfig) {
  return (request: ApiRequest) => handleExport(request, config);
}
