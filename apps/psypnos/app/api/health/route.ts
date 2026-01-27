// @ts-nocheck
/**
 * Health Check API Route
 * Phase 4: Monitoring & Observability
 *
 * Provides system health status including:
 * - Database connectivity
 * - Redis connectivity
 * - Memory usage
 * - Uptime
 */

import { NextResponse } from "next/server";
import os from "os";
import { isDatabaseConnected, prisma } from "@/lib/db/prisma";
import { checkRedisHealth } from "@/lib/cache/redis";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number | null;
  uptimeMessage?: string;
  version: string;
  checks: {
    database: {
      status: "up" | "down";
      latencyMs?: number;
      error?: string;
    };
    redis: {
      status: "up" | "down" | "disabled";
      latencyMs?: number;
      error?: string;
    };
    memory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
      percentUsed: number;
    };
  };
  analyticsMode: string;
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const timestamp = new Date().toISOString();

  // Récupérer l'uptime depuis le dernier déploiement réussi
  let uptime: number | null = null;
  let uptimeMessage: string | undefined;

  try {
    const lastSuccessfulDeployment = await prisma.deployment.findFirst({
      where: { status: "success" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    if (lastSuccessfulDeployment?.completedAt) {
      const now = new Date();
      uptime = Math.floor((now.getTime() - lastSuccessfulDeployment.completedAt.getTime()) / 1000);
    } else {
      uptimeMessage = "Aucun déploiement enregistré";
    }
  } catch {
    uptimeMessage = "Impossible de récupérer l'uptime";
  }

  // Check database
  let dbStatus: HealthStatus["checks"]["database"];
  const dbStart = Date.now();
  try {
    const connected = await isDatabaseConnected();
    dbStatus = {
      status: connected ? "up" : "down",
      latencyMs: Date.now() - dbStart,
    };
  } catch (error) {
    dbStatus = {
      status: "down",
      latencyMs: Date.now() - dbStart,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check Redis
  let redisStatus: HealthStatus["checks"]["redis"];
  if (!process.env.REDIS_URL) {
    redisStatus = { status: "disabled" };
  } else {
    const redisHealth = await checkRedisHealth();
    redisStatus = {
      status: redisHealth.available ? "up" : "down",
      latencyMs: redisHealth.latencyMs,
      error: redisHealth.error,
    };
  }

  // Memory usage - use system memory for VPS monitoring
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memory = {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
    rss: Math.round(memUsage.rss / 1024 / 1024),
    // Use system memory percentage for accurate VPS monitoring
    percentUsed: Math.round((usedMem / totalMem) * 100),
  };

  // Determine overall status
  let overallStatus: HealthStatus["status"] = "healthy";

  // If database mode is postgres and DB is down, it's unhealthy
  const analyticsMode = process.env.ANALYTICS_STORAGE_MODE || "json";
  if (analyticsMode === "postgres" && dbStatus.status === "down") {
    overallStatus = "unhealthy";
  } else if (
    (analyticsMode === "postgres" && dbStatus.latencyMs && dbStatus.latencyMs > 1000) ||
    (redisStatus.status === "down" && process.env.REDIS_URL) ||
    memory.percentUsed > 90
  ) {
    overallStatus = "degraded";
  }

  const response: HealthStatus = {
    status: overallStatus,
    timestamp,
    uptime,
    ...(uptimeMessage && { uptimeMessage }),
    version: process.env.npm_package_version || "1.0.0",
    checks: {
      database: dbStatus,
      redis: redisStatus,
      memory,
    },
    analyticsMode,
  };

  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(response, { status: httpStatus });
}
