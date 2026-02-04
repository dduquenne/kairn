/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Deployment model not available in Kairn schema
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { isTokenValid, sanitizeLogs } from "@/lib/deployment/utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/deployment/webhook/log
 * Append logs to deployment (called by deploy script)
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

    if (!isTokenValid(deployment.tokenExpiresAt)) {
      return NextResponse.json(
        { error: "Deployment token expired" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { log, deploymentId } = body as {
      log?: string;
      deploymentId?: string;
    };

    if (!log) {
      return NextResponse.json(
        { error: "Log content required" },
        { status: 400 }
      );
    }

    // Sanitize and append logs
    const sanitizedLog = sanitizeLogs(log);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}]\n${sanitizedLog}\n`;

    await prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        logs: (deployment.logs || "") + logEntry,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Deployment Webhook Log] Error:", error);
    return NextResponse.json(
      { error: "Log append failed" },
      { status: 500 }
    );
  }
}
