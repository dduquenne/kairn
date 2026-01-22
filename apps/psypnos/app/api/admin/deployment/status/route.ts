// @ts-nocheck
// TODO: Migration - Deployment model not available in Kairn schema
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/app/api/auth/middleware";
import type { DeploymentInfo } from "@/lib/deployment/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/deployment/status
 * Get current deployment status (latest active or most recent)
 */
export async function GET(): Promise<NextResponse> {
  // Check admin auth
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    // First check for active deployment
    let deployment = await prisma.deployment.findFirst({
      where: {
        status: {
          in: ["pending", "in_progress"],
        },
      },
      orderBy: {
        triggeredAt: "desc",
      },
    });

    // If no active, get most recent
    if (!deployment) {
      deployment = await prisma.deployment.findFirst({
        orderBy: {
          triggeredAt: "desc",
        },
      });
    }

    if (!deployment) {
      return NextResponse.json({
        hasDeployment: false,
        message: "Aucun déploiement trouvé",
      });
    }

    // Map to response type (exclude sensitive token)
    const response: DeploymentInfo & { hasDeployment: boolean } = {
      hasDeployment: true,
      id: deployment.id,
      status: deployment.status as DeploymentInfo["status"],
      targetRef: deployment.targetRef,
      targetCommit: deployment.targetCommit,
      previousCommit: deployment.previousCommit,
      triggeredBy: deployment.triggeredBy,
      triggeredAt: deployment.triggeredAt.toISOString(),
      startedAt: deployment.startedAt?.toISOString() ?? null,
      completedAt: deployment.completedAt?.toISOString() ?? null,
      currentPhase: deployment.currentPhase as DeploymentInfo["currentPhase"],
      progress: deployment.progress,
      logs: deployment.logs,
      errorMessage: deployment.errorMessage,
      healthCheckPassed: deployment.healthCheckPassed,
      rolledBackAt: deployment.rolledBackAt?.toISOString() ?? null,
      rollbackReason: deployment.rollbackReason,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Deployment] Status error:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération du statut",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
