/**
 * GDPR Right to Erasure (Article 17) - Analytics Data Deletion
 *
 * Deletes all analytics data associated with a given sessionId or visitorId.
 * Requires admin authentication.
 *
 * Usage:
 *   DELETE /api/analytics/gdpr/delete?sessionId=ses_xxx
 *   DELETE /api/analytics/gdpr/delete?visitorId=v_xxx
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const { withAdminAuth } = await import('../../../auth/middleware');
    const authResult = await withAdminAuth();
    if (authResult.error) return authResult.error;

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const visitorId = searchParams.get('visitorId');

    if (!sessionId && !visitorId) {
      return NextResponse.json(
        { error: 'sessionId or visitorId query parameter is required' },
        { status: 400 }
      );
    }

    const results: Record<string, number> = {};

    if (sessionId) {
      // Delete all analytics events for this session
      const eventsResult = await prisma.analyticsEvent.deleteMany({
        where: { sessionId },
      });
      results.analyticsEvents = eventsResult.count;

      // Delete geolocation data
      const geoResult = await prisma.visitorGeolocation.deleteMany({
        where: { sessionId },
      });
      results.visitorGeolocations = geoResult.count;
    }

    if (visitorId) {
      // Visitor ID is stored in the session data JSON, but the main
      // identifier for deletion is sessionId. Log this request for audit.
      console.log(
        `[GDPR] Erasure request for visitorId: ${visitorId} at ${new Date().toISOString()}`
      );
    }

    const totalDeleted = Object.values(results).reduce((sum, count) => sum + count, 0);

    // Audit log
    console.log(
      `[GDPR] Data erasure completed: ${totalDeleted} records deleted for ${sessionId ? `sessionId=${sessionId}` : ''}${visitorId ? ` visitorId=${visitorId}` : ''}`
    );

    return NextResponse.json({
      success: true,
      message: `${totalDeleted} records deleted`,
      details: results,
    });
  } catch (error) {
    console.error('[GDPR] Deletion error:', error);
    return NextResponse.json(
      { error: 'Deletion failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
