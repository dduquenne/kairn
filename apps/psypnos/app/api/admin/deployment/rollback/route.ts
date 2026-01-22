// @ts-nocheck
// TODO: Migration - Deployment model not available in Kairn schema
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/app/api/auth/middleware";
import { generateDeployToken, getTokenExpiration } from "@/lib/deployment/utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/deployment/rollback
 * Trigger a rollback to the previous stable version
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check admin auth
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;
  const adminUser = authResult.user!;

  try {
    const body = await request.json().catch(() => ({}));
    const { deploymentId, reason } = body as {
      deploymentId?: string;
      reason?: string;
    };

    // Check for active deployment
    const activeDeployment = await prisma.deployment.findFirst({
      where: {
        status: {
          in: ["pending", "in_progress"],
        },
      },
    });

    if (activeDeployment) {
      return NextResponse.json(
        {
          success: false,
          message: "Impossible de rollback pendant un déploiement en cours",
          error: "DEPLOYMENT_IN_PROGRESS",
        },
        { status: 409 }
      );
    }

    // Get the last successful deployment
    const lastSuccessful = await prisma.deployment.findFirst({
      where: {
        status: "success",
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    if (!lastSuccessful) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucune version stable trouvée pour le rollback",
          error: "NO_STABLE_VERSION",
        },
        { status: 404 }
      );
    }

    // Generate new deployment for rollback
    const deployToken = generateDeployToken();
    const tokenExpiresAt = getTokenExpiration();

    const rollbackDeployment = await prisma.deployment.create({
      data: {
        status: "pending",
        targetRef: lastSuccessful.targetRef,
        targetCommit: lastSuccessful.targetCommit,
        previousCommit: lastSuccessful.previousCommit,
        triggeredBy: adminUser.email,
        deployToken,
        tokenExpiresAt,
        progress: 0,
        rollbackReason: reason || "Manual rollback requested",
      },
    });

    // If a specific deployment was marked as failed, update it
    if (deploymentId) {
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          rolledBackAt: new Date(),
          rollbackReason: reason || "Manual rollback requested",
        },
      });
    }

    console.log(
      `[Deployment] Rollback triggered by ${adminUser.email}: ${lastSuccessful.targetRef} (ID: ${rollbackDeployment.id})`
    );

    return NextResponse.json({
      success: true,
      deploymentId: rollbackDeployment.id,
      message: `Rollback vers ${lastSuccessful.targetRef} (${lastSuccessful.targetCommit?.substring(0, 7) || "unknown"}) initié`,
      targetRef: lastSuccessful.targetRef,
      targetCommit: lastSuccessful.targetCommit,
    });
  } catch (error) {
    console.error("[Deployment] Rollback error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors du déclenchement du rollback",
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
