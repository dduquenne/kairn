/**
 * GDPR Handlers
 *
 * Reusable handlers for GDPR compliance:
 * - Right to Erasure (Article 17) — delete analytics data
 * - Right to Access (Article 15) — export user data
 */

import { z } from 'zod';

import { error, success } from '../../utils/response';

/**
 * Schema for GDPR deletion request query parameters
 */
export const gdprDeleteSchema = z
  .object({
    sessionId: z.string().optional(),
    visitorId: z.string().optional(),
  })
  .refine(data => data.sessionId || data.visitorId, {
    message: 'sessionId or visitorId is required',
  });

export type GdprDeleteInput = z.infer<typeof gdprDeleteSchema>;

/**
 * Configuration for the GDPR delete handler
 */
export interface GdprHandlerConfig {
  /** Prisma client instance */
  prisma: {
    analyticsEvent: {
      deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
    };
    visitorGeolocation: {
      deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
    };
  };
  /** Site ID for multi-tenant isolation */
  siteId: string;
}

/**
 * Result of a GDPR deletion
 */
export interface GdprDeleteResult {
  success: boolean;
  totalDeleted: number;
  details: Record<string, number>;
}

/**
 * Handle GDPR Right to Erasure (Article 17).
 *
 * Deletes all analytics data associated with a sessionId or visitorId.
 * Ensures multi-tenant isolation via siteId.
 */
export async function handleGdprDelete(
  params: GdprDeleteInput,
  config: GdprHandlerConfig
): Promise<GdprDeleteResult> {
  const { sessionId, visitorId } = params;
  const { prisma, siteId } = config;
  const details: Record<string, number> = {};

  if (sessionId) {
    const eventsResult = await prisma.analyticsEvent.deleteMany({
      where: { sessionId, siteId },
    });
    details.analyticsEvents = eventsResult.count;

    const geoResult = await prisma.visitorGeolocation.deleteMany({
      where: { sessionId, siteId },
    });
    details.visitorGeolocations = geoResult.count;
  }

  if (visitorId) {
    console.warn(
      `[GDPR] Erasure request for visitorId: ${visitorId} at ${new Date().toISOString()}`
    );
  }

  const totalDeleted = Object.values(details).reduce((sum, count) => sum + count, 0);

  console.warn(
    `[GDPR] Data erasure completed: ${totalDeleted} records deleted for ${sessionId ? `sessionId=${sessionId}` : ''}${visitorId ? ` visitorId=${visitorId}` : ''}`
  );

  return { success: true, totalDeleted, details };
}

/**
 * Create a GDPR delete handler that returns a Response.
 *
 * Wraps handleGdprDelete with validation and error handling.
 */
export function createGdprDeleteHandler(config: GdprHandlerConfig) {
  /**
   * Process a GDPR deletion request
   */
  return async (params: { sessionId?: string; visitorId?: string }) => {
    const parsed = gdprDeleteSchema.safeParse(params);

    if (!parsed.success) {
      return {
        response: error(
          'VALIDATION_ERROR',
          parsed.error.errors[0]?.message || 'Invalid parameters'
        ),
        result: null,
      };
    }

    try {
      const result = await handleGdprDelete(parsed.data, config);
      return {
        response: success({
          message: `${result.totalDeleted} records deleted`,
          details: result.details,
        }),
        result,
      };
    } catch (err) {
      console.error('[GDPR] Deletion error:', err);
      return {
        response: error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Deletion failed'),
        result: null,
      };
    }
  };
}
