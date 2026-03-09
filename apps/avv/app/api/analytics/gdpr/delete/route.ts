/**
 * GDPR Right to Erasure (Article 17) - Analytics Data Deletion
 *
 * Deletes all analytics data associated with a given sessionId or visitorId.
 * Requires admin authentication.
 * Uses the centralized @kairn/api GDPR handler.
 *
 * Usage:
 *   DELETE /api/analytics/gdpr/delete?sessionId=ses_xxx
 *   DELETE /api/analytics/gdpr/delete?visitorId=v_xxx
 */

import { handleGdprDelete, gdprDeleteSchema } from '@kairn/api';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const { withAdminAuth } = await import('../../../auth/middleware');
    const authResult = await withAdminAuth();
    if (authResult.error) return authResult.error;

    const searchParams = request.nextUrl.searchParams;
    const params = {
      sessionId: searchParams.get('sessionId') || undefined,
      visitorId: searchParams.get('visitorId') || undefined,
    };

    const parsed = gdprDeleteSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    const siteId = await getSiteId();
    const result = await handleGdprDelete(parsed.data, { prisma, siteId });

    return NextResponse.json({
      success: true,
      message: `${result.totalDeleted} records deleted`,
      details: result.details,
    });
  } catch (error) {
    console.error('[GDPR] Deletion error:', error);
    return NextResponse.json(
      {
        error: 'Deletion failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
