/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Deployment model not available in Kairn schema
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import type { DeploymentStatus, DeploymentPhase } from "@/lib/deployment/types";
import { isTokenValid, sanitizeLogs } from "@/lib/deployment/utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/deployment/webhook
 * Webhook called by deployment script to update status
 */
export async function POST(request: NextRequest) {
  try {
    const deployToken = request.headers.get("X-Deploy-Token");

    if (!deployToken) {
      return NextResponse.json(
        { error: "Missing deployment token" },
        { status: 401 }
      );
    }

    // Verify token
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

    const body = await request.json();
    const {
      status,
      phase,
      progress,
      message,
      targetCommit,
      errorMessage,
    } = body as {
      status?: DeploymentStatus;
      phase?: DeploymentPhase;
      progress?: number;
      message?: string;
      targetCommit?: string;
      errorMessage?: string;
    };

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

    if (targetCommit) {
      updateData.targetCommit = targetCommit;
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Deployment Webhook] Error:", error);
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/deployment/[id]
 * Update specific deployment (for commit hash, etc.)
 */
