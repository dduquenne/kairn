/**
 * Simple diagnostic endpoint to test SSR Prisma queries
 */

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
  };

  // Create a fresh Prisma client for this test
  const testPrisma = new PrismaClient();

  try {
    // Test 1: Simple connection
    await testPrisma.$connect();
    results.connectionTest = { success: true };

    // Test 2: Query Site table
    const site = await testPrisma.site.findUnique({
      where: { slug: 'avv' },
      select: { id: true, name: true },
    });
    results.siteQuery = { success: true, data: site };

    // Test 3: Query seminars if site found
    if (site) {
      const seminars = await testPrisma.seminar.findMany({
        where: { siteId: site.id },
        take: 3,
        select: { id: true, title: true },
      });
      results.seminarsQuery = { success: true, count: seminars.length, data: seminars };
    }
  } catch (error) {
    results.error = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
  } finally {
    await testPrisma.$disconnect();
  }

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
