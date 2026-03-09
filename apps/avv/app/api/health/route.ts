/**
 * Health Check API Route
 *
 * Provides system health status including:
 * - Database connectivity (PostgreSQL via Prisma)
 * - Redis connectivity (if configured)
 * - Process memory usage
 */

import { NextResponse } from 'next/server';

import { checkRedisHealth } from '@/lib/cache/redis';
import { isDatabaseConnected } from '@/lib/db/prisma';

interface ServiceCheck {
  status: 'up' | 'down' | 'disabled';
  latencyMs?: number;
  error?: string;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: ServiceCheck;
    redis: ServiceCheck;
    memory: {
      heapUsedMB: number;
      rssMB: number;
    };
  };
}

/**
 * GET /api/health — Liveness + basic readiness probe
 */
export async function GET(): Promise<NextResponse<HealthStatus>> {
  const timestamp = new Date().toISOString();

  // Check database
  let dbStatus: ServiceCheck;
  const dbStart = Date.now();
  try {
    const connected = await isDatabaseConnected();
    dbStatus = {
      status: connected ? 'up' : 'down',
      latencyMs: Date.now() - dbStart,
    };
  } catch (err) {
    dbStatus = {
      status: 'down',
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  // Check Redis
  let redisStatus: ServiceCheck;
  if (!process.env.REDIS_URL) {
    redisStatus = { status: 'disabled' };
  } else {
    const redisHealth = await checkRedisHealth();
    redisStatus = {
      status: redisHealth.available ? 'up' : 'down',
      latencyMs: redisHealth.latencyMs,
      error: redisHealth.error,
    };
  }

  // Process memory (safe in Serverless environment)
  const memUsage = process.memoryUsage();
  const memory = {
    heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
    rssMB: Math.round(memUsage.rss / 1024 / 1024),
  };

  // Determine overall status
  let overallStatus: HealthStatus['status'] = 'healthy';
  if (dbStatus.status === 'down') {
    overallStatus = 'unhealthy';
  } else if (
    (dbStatus.latencyMs && dbStatus.latencyMs > 1000) ||
    (redisStatus.status === 'down' && process.env.REDIS_URL)
  ) {
    overallStatus = 'degraded';
  }

  const response: HealthStatus = {
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: dbStatus,
      redis: redisStatus,
      memory,
    },
  };

  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
