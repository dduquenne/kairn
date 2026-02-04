/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Deployment model not available in Kairn schema
import { spawn } from "child_process";
import * as path from "path";

import { NextRequest, NextResponse } from "next/server";

import { withAdminAuth } from "@/app/api/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import {
  DeploymentTriggerRequest,
  DeploymentTriggerResponse,
  isAllowedRef,
} from "@/lib/deployment/types";
import { generateDeployToken, getTokenExpiration } from "@/lib/deployment/utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/deployment/trigger
 * Trigger a new deployment
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check admin auth
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;
  const adminUser = authResult.user!;

  try {
    const body: DeploymentTriggerRequest = await request.json();
    const { targetRef, force = false } = body;

    // Validate target ref
    if (!targetRef || typeof targetRef !== "string") {
      return NextResponse.json<DeploymentTriggerResponse>(
        {
          success: false,
          message: "La branche ou le tag cible est requis",
          error: "MISSING_TARGET_REF",
        },
        { status: 400 }
      );
    }

    // Validate ref is allowed
    if (!isAllowedRef(targetRef)) {
      return NextResponse.json<DeploymentTriggerResponse>(
        {
          success: false,
          message: `La référence "${targetRef}" n'est pas autorisée pour le déploiement`,
          error: "INVALID_REF",
        },
        { status: 400 }
      );
    }

    // Check for active deployment
    const activeDeployment = await prisma.deployment.findFirst({
      where: {
        status: {
          in: ["pending", "in_progress"],
        },
      },
      orderBy: {
        triggeredAt: "desc",
      },
    });

    if (activeDeployment && !force) {
      return NextResponse.json<DeploymentTriggerResponse>(
        {
          success: false,
          message: "Un déploiement est déjà en cours",
          error: "DEPLOYMENT_IN_PROGRESS",
          deploymentId: activeDeployment.id,
        },
        { status: 409 }
      );
    }

    // Get current commit for rollback reference
    let previousCommit: string | null = null;
    try {
      const lastSuccessful = await prisma.deployment.findFirst({
        where: { status: "success" },
        orderBy: { completedAt: "desc" },
        select: { targetCommit: true },
      });
      previousCommit = lastSuccessful?.targetCommit ?? null;
    } catch {
      // Ignore if we can't get previous commit
    }

    // Generate deployment token
    const deployToken = generateDeployToken();
    const tokenExpiresAt = getTokenExpiration();

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        status: "pending",
        targetRef,
        previousCommit,
        triggeredBy: adminUser.email,
        deployToken,
        tokenExpiresAt,
        progress: 0,
      },
    });

    // Log the deployment trigger
    console.log(
      `[Deployment] Triggered by ${adminUser.email}: ${targetRef} (ID: ${deployment.id})`
    );

    // Launch the deployment script in background
    const scriptPath = path.join(process.cwd(), "scripts", "deploy-api.sh");
    const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;

    try {
      const deployProcess = spawn(scriptPath, [targetRef, deployToken, apiBaseUrl], {
        cwd: process.cwd(),
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, PATH: process.env.PATH },
      });

      // Log output for debugging
      deployProcess.stdout?.on("data", (data) => {
        console.log(`[Deployment ${deployment.id}] ${data.toString().trim()}`);
      });

      deployProcess.stderr?.on("data", (data) => {
        console.error(`[Deployment ${deployment.id}] ERROR: ${data.toString().trim()}`);
      });

      deployProcess.on("error", (error) => {
        console.error(`[Deployment ${deployment.id}] Process error:`, error);
      });

      // Detach the process so it continues after response
      deployProcess.unref();

      console.log(`[Deployment] Script launched for ${targetRef} (PID: ${deployProcess.pid})`);
    } catch (scriptError) {
      console.error("[Deployment] Failed to launch script:", scriptError);
      // Update deployment status to failed
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: "failed",
          errorMessage: `Échec du lancement du script: ${scriptError instanceof Error ? scriptError.message : "Erreur inconnue"}`,
          completedAt: new Date(),
        },
      });

      return NextResponse.json<DeploymentTriggerResponse>(
        {
          success: false,
          deploymentId: deployment.id,
          message: "Erreur lors du lancement du script de déploiement",
          error: "SCRIPT_LAUNCH_FAILED",
        },
        { status: 500 }
      );
    }

    return NextResponse.json<DeploymentTriggerResponse>({
      success: true,
      deploymentId: deployment.id,
      message: `Déploiement vers ${targetRef} initié avec succès`,
    });
  } catch (error) {
    console.error("[Deployment] Trigger error:", error);
    return NextResponse.json<DeploymentTriggerResponse>(
      {
        success: false,
        message: "Erreur lors du déclenchement du déploiement",
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
