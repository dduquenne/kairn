/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Deployment model not available in Kairn schema
import { NextRequest, NextResponse } from "next/server";

import { withAdminAuth } from "@/app/api/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import type { DeploymentInfo } from "@/lib/deployment/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/deployment/history
 * Get deployment history with pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Check admin auth
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status && ["success", "failed", "rolled_back"].includes(status)) {
      where.status = status;
    }

    // Get deployments
    const [deployments, total] = await Promise.all([
      prisma.deployment.findMany({
        where,
        orderBy: {
          triggeredAt: "desc",
        },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          targetRef: true,
          targetCommit: true,
          previousCommit: true,
          triggeredBy: true,
          triggeredAt: true,
          startedAt: true,
          completedAt: true,
          currentPhase: true,
          progress: true,
          errorMessage: true,
          healthCheckPassed: true,
          rolledBackAt: true,
          rollbackReason: true,
        },
      }),
      prisma.deployment.count({ where }),
    ]);

    // Map to response type
    const items: DeploymentInfo[] = deployments.map((d: typeof deployments[number]) => ({
      id: d.id,
      status: d.status as DeploymentInfo["status"],
      targetRef: d.targetRef,
      targetCommit: d.targetCommit,
      previousCommit: d.previousCommit,
      triggeredBy: d.triggeredBy,
      triggeredAt: d.triggeredAt.toISOString(),
      startedAt: d.startedAt?.toISOString() ?? null,
      completedAt: d.completedAt?.toISOString() ?? null,
      currentPhase: d.currentPhase as DeploymentInfo["currentPhase"],
      progress: d.progress,
      errorMessage: d.errorMessage,
      healthCheckPassed: d.healthCheckPassed,
      rolledBackAt: d.rolledBackAt?.toISOString() ?? null,
      rollbackReason: d.rollbackReason,
    }));

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Deployment] History error:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération de l'historique",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
