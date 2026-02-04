/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Deployment model not available in Kairn schema
import { NextRequest, NextResponse } from "next/server";

import { withAdminAuth } from "@/app/api/auth/middleware";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/deployment/cancel
 * Cancel a stuck deployment
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check admin auth
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;
  const adminUser = authResult.user!;

  try {
    const body = await request.json();
    const { deploymentId, reason } = body as {
      deploymentId?: string;
      reason?: string;
    };

    // Find the deployment to cancel
    let deployment;

    if (deploymentId) {
      deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
      });
    } else {
      // Find any active deployment
      deployment = await prisma.deployment.findFirst({
        where: {
          status: {
            in: ["pending", "in_progress"],
          },
        },
        orderBy: {
          triggeredAt: "desc",
        },
      });
    }

    if (!deployment) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucun déploiement actif trouvé",
          error: "NO_ACTIVE_DEPLOYMENT",
        },
        { status: 404 }
      );
    }

    // Check if deployment is still active
    if (!["pending", "in_progress"].includes(deployment.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Le déploiement est déjà terminé avec le statut: ${deployment.status}`,
          error: "DEPLOYMENT_ALREADY_COMPLETED",
        },
        { status: 400 }
      );
    }

    // Update deployment to failed/cancelled
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        status: "failed",
        errorMessage: `Annulé manuellement par ${adminUser.email}${reason ? `: ${reason}` : ""}`,
        completedAt: new Date(),
        logs: (deployment.logs || "") +
          `\n[${new Date().toISOString()}] ⚠️ Déploiement annulé manuellement par ${adminUser.email}\n` +
          (reason ? `[${new Date().toISOString()}] Raison: ${reason}\n` : ""),
      },
    });

    console.log(
      `[Deployment] Cancelled by ${adminUser.email}: ${deployment.targetRef} (ID: ${deployment.id})`
    );

    return NextResponse.json({
      success: true,
      message: `Déploiement vers ${deployment.targetRef} annulé`,
      deploymentId: deployment.id,
    });
  } catch (error) {
    console.error("[Deployment] Cancel error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de l'annulation du déploiement",
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
