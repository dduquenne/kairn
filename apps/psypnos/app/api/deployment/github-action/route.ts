// @ts-nocheck
// TODO: Migration - Deployment model not available in Kairn schema
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateDeployToken, getTokenExpiration, isTokenValid } from "@/lib/deployment/utils";
import type { DeploymentStatus, DeploymentPhase } from "@/lib/deployment/types";

export const dynamic = "force-dynamic";

/**
 * API endpoint for GitHub Actions to track deployments in Supabase
 *
 * Authentication: X-Deployment-Secret header must match DEPLOYMENT_SECRET env var
 *
 * Actions:
 * - create: Create a new deployment record
 * - update: Update an existing deployment (uses deployToken)
 */

interface CreateDeploymentBody {
  action: "create";
  targetRef: string;
  targetCommit: string;
  triggeredBy: string;
  buildId?: string;
}

interface UpdateDeploymentBody {
  action: "update";
  deployToken: string;
  status?: DeploymentStatus;
  phase?: DeploymentPhase;
  progress?: number;
  message?: string;
  errorMessage?: string;
  healthCheckPassed?: boolean;
}

type RequestBody = CreateDeploymentBody | UpdateDeploymentBody;

function validateSecret(request: NextRequest): boolean {
  const secret = request.headers.get("X-Deployment-Secret");
  const expectedSecret = process.env.DEPLOYMENT_SECRET;

  if (!expectedSecret) {
    console.error("[GitHub Action API] DEPLOYMENT_SECRET not configured");
    return false;
  }

  return secret === expectedSecret;
}

export async function POST(request: NextRequest) {
  try {
    // Validate secret
    if (!validateSecret(request)) {
      return NextResponse.json(
        { error: "Invalid or missing deployment secret" },
        { status: 401 }
      );
    }

    const body: RequestBody = await request.json();

    if (body.action === "create") {
      return handleCreate(body);
    } else if (body.action === "update") {
      return handleUpdate(body);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'create' or 'update'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[GitHub Action API] Error:", error);
    return NextResponse.json(
      {
        error: "Request processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleCreate(body: CreateDeploymentBody) {
  const { targetRef, targetCommit, triggeredBy, buildId } = body;

  if (!targetRef || !targetCommit || !triggeredBy) {
    return NextResponse.json(
      { error: "Missing required fields: targetRef, targetCommit, triggeredBy" },
      { status: 400 }
    );
  }

  // Check for active deployment
  const activeDeployment = await prisma.deployment.findFirst({
    where: {
      status: { in: ["pending", "in_progress"] },
    },
    orderBy: { triggeredAt: "desc" },
  });

  if (activeDeployment) {
    // Mark previous deployment as failed if it's stuck
    const stuckThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
    if (activeDeployment.triggeredAt < stuckThreshold) {
      await prisma.deployment.update({
        where: { id: activeDeployment.id },
        data: {
          status: "failed",
          errorMessage: "Déploiement abandonné - nouveau déploiement initié depuis GitHub Actions",
          completedAt: new Date(),
        },
      });
    } else {
      return NextResponse.json(
        {
          error: "Deployment already in progress",
          activeDeploymentId: activeDeployment.id,
        },
        { status: 409 }
      );
    }
  }

  // Get previous successful commit for rollback reference
  let previousCommit: string | null = null;
  const lastSuccessful = await prisma.deployment.findFirst({
    where: { status: "success" },
    orderBy: { completedAt: "desc" },
    select: { targetCommit: true },
  });
  previousCommit = lastSuccessful?.targetCommit ?? null;

  // Generate deployment token (expires in 60 minutes for GitHub Actions)
  const deployToken = generateDeployToken();
  const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Create deployment record
  const deployment = await prisma.deployment.create({
    data: {
      status: "pending",
      targetRef,
      targetCommit,
      previousCommit,
      triggeredBy: `github-actions:${triggeredBy}`,
      deployToken,
      tokenExpiresAt,
      progress: 0,
      logs: buildId
        ? `[${new Date().toISOString()}] Déploiement initié depuis GitHub Actions (Build: ${buildId})\n`
        : `[${new Date().toISOString()}] Déploiement initié depuis GitHub Actions\n`,
    },
  });

  console.log(`[GitHub Action API] Deployment created: ${deployment.id} for ${targetRef}`);

  return NextResponse.json({
    success: true,
    deploymentId: deployment.id,
    deployToken,
    message: `Deployment created for ${targetRef}`,
  });
}

async function handleUpdate(body: UpdateDeploymentBody) {
  const { deployToken, status, phase, progress, message, errorMessage, healthCheckPassed } = body;

  if (!deployToken) {
    return NextResponse.json(
      { error: "Missing deployToken" },
      { status: 400 }
    );
  }

  // Find deployment by token
  const deployment = await prisma.deployment.findUnique({
    where: { deployToken },
  });

  if (!deployment) {
    return NextResponse.json(
      { error: "Invalid deployment token" },
      { status: 401 }
    );
  }

  // Check token expiration
  if (!isTokenValid(deployment.tokenExpiresAt)) {
    return NextResponse.json(
      { error: "Deployment token expired" },
      { status: 401 }
    );
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (status) {
    updateData.status = status;

    // Set timestamps based on status
    if (status === "in_progress" && !deployment.startedAt) {
      updateData.startedAt = new Date();
    }

    if (["success", "failed", "rolled_back"].includes(status)) {
      updateData.completedAt = new Date();
    }

    if (status === "success") {
      updateData.healthCheckPassed = true;
    }

    if (status === "rolled_back") {
      updateData.rolledBackAt = new Date();
    }
  }

  if (phase) {
    updateData.currentPhase = phase;
  }

  if (typeof progress === "number") {
    updateData.progress = Math.min(100, Math.max(0, progress));
  }

  if (typeof healthCheckPassed === "boolean") {
    updateData.healthCheckPassed = healthCheckPassed;
  }

  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }

  // Append to logs if message provided
  if (message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    updateData.logs = (deployment.logs || "") + logEntry;
  }

  // Update deployment
  await prisma.deployment.update({
    where: { id: deployment.id },
    data: updateData,
  });

  console.log(`[GitHub Action API] Deployment ${deployment.id} updated: phase=${phase}, progress=${progress}, status=${status}`);

  return NextResponse.json({
    success: true,
    deploymentId: deployment.id,
  });
}

/**
 * GET endpoint to check deployment status
 */
export async function GET(request: NextRequest) {
  // Validate secret
  if (!validateSecret(request)) {
    return NextResponse.json(
      { error: "Invalid or missing deployment secret" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const deploymentId = searchParams.get("id");

  if (deploymentId) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: {
        id: true,
        status: true,
        currentPhase: true,
        progress: true,
        healthCheckPassed: true,
        errorMessage: true,
      },
    });

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    return NextResponse.json(deployment);
  }

  // Get most recent deployment
  const deployment = await prisma.deployment.findFirst({
    orderBy: { triggeredAt: "desc" },
    select: {
      id: true,
      status: true,
      targetRef: true,
      targetCommit: true,
      currentPhase: true,
      progress: true,
      triggeredAt: true,
      completedAt: true,
    },
  });

  return NextResponse.json(deployment || { message: "No deployments found" });
}
