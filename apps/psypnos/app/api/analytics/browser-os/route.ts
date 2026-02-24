/**
 * Browser/OS Analytics Endpoint
 *
 * Returns browser and OS distribution data for the dashboard.
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { withAdminAuth } = await import('../../auth/middleware');
    const authResult = await withAdminAuth();
    if (authResult.error) return authResult.error;

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get browser distribution
    const browserResults = await prisma.$queryRaw<Array<{
      browser: string;
      count: bigint;
    }>>`
      SELECT
        COALESCE(data->>'browser', 'Unknown') as browser,
        COUNT(DISTINCT "sessionId") as count
      FROM "AnalyticsEvent"
      WHERE "type" = 'PAGE_VIEW'
        AND "createdAt" >= ${startDate}
        AND (data->>'isBot' IS NULL OR data->>'isBot' != 'true')
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get OS distribution
    const osResults = await prisma.$queryRaw<Array<{
      os: string;
      count: bigint;
    }>>`
      SELECT
        COALESCE(data->>'os', 'Unknown') as os,
        COUNT(DISTINCT "sessionId") as count
      FROM "AnalyticsEvent"
      WHERE "type" = 'PAGE_VIEW'
        AND "createdAt" >= ${startDate}
        AND (data->>'isBot' IS NULL OR data->>'isBot' != 'true')
      GROUP BY os
      ORDER BY count DESC
      LIMIT 10
    `;

    const totalBrowser = browserResults.reduce((sum, r) => sum + Number(r.count), 0);
    const totalOS = osResults.reduce((sum, r) => sum + Number(r.count), 0);

    return NextResponse.json({
      browsers: browserResults.map(r => ({
        name: r.browser,
        sessions: Number(r.count),
        percentage: totalBrowser > 0 ? parseFloat(((Number(r.count) / totalBrowser) * 100).toFixed(1)) : 0,
      })),
      operatingSystems: osResults.map(r => ({
        name: r.os,
        sessions: Number(r.count),
        percentage: totalOS > 0 ? parseFloat(((Number(r.count) / totalOS) * 100).toFixed(1)) : 0,
      })),
    });
  } catch (error) {
    console.error('[Analytics:browser-os] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch browser/OS data' },
      { status: 500 }
    );
  }
}
