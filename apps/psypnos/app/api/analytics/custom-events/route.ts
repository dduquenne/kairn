/**
 * Custom Events Analytics Endpoint
 *
 * Returns custom events grouped by category/action for the dashboard.
 * Requires admin authentication.
 */

import { EventType } from '@prisma/client';
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

    // Get custom events grouped by category and action
    const results = await prisma.$queryRaw<Array<{
      category: string;
      action: string;
      count: bigint;
      last_seen: Date;
    }>>`
      SELECT
        COALESCE(data->>'category', 'Unknown') as category,
        COALESCE(data->>'action', 'unknown') as action,
        COUNT(*) as count,
        MAX("createdAt") as last_seen
      FROM "AnalyticsEvent"
      WHERE "type" = 'CUSTOM'
        AND "createdAt" >= ${startDate}
      GROUP BY category, action
      ORDER BY count DESC
      LIMIT 100
    `;

    const events = results.map(r => ({
      category: r.category,
      action: r.action,
      count: Number(r.count),
      lastSeen: r.last_seen.toISOString(),
    }));

    const totalEvents = events.reduce((sum, e) => sum + e.count, 0);
    const uniqueCategories = new Set(events.map(e => e.category)).size;

    return NextResponse.json({
      events,
      totalEvents,
      uniqueCategories,
    });
  } catch (error) {
    console.error('[Analytics:custom-events] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom events' },
      { status: 500 }
    );
  }
}
