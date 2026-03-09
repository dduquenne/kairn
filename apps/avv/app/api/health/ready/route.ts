/**
 * Readiness Probe API Route
 *
 * Returns 200 only when the application is ready to serve traffic.
 * Requires database connectivity to be considered ready.
 */

import { NextResponse } from 'next/server';

import { isDatabaseConnected } from '@/lib/db/prisma';

/**
 * GET /api/health/ready — Readiness probe for load balancers
 */
export async function GET(): Promise<NextResponse> {
  try {
    const dbReady = await isDatabaseConnected();

    if (!dbReady) {
      return NextResponse.json(
        { ready: false, reason: 'Database not available' },
        {
          status: 503,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    return NextResponse.json(
      { ready: true },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch {
    return NextResponse.json(
      { ready: false, reason: 'Health check failed' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
