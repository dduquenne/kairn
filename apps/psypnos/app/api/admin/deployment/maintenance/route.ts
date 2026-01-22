// @ts-nocheck
// TODO: Migration - Deployment model not available in Kairn schema
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/app/api/auth/middleware";
import { isTokenValid } from "@/lib/deployment/utils";
import { setMaintenanceActive, setMaintenanceInactive } from "@/lib/maintenance-flag";

export const dynamic = "force-dynamic";

const MAINTENANCE_ID = "singleton";

/**
 * GET /api/admin/deployment/maintenance
 * Get maintenance mode status (admin only)
 */
export async function GET(): Promise<NextResponse> {
  // Check admin auth
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const maintenance = await prisma.maintenanceMode.findFirst();

    if (!maintenance) {
      return NextResponse.json({
        isActive: false,
        reason: null,
        message: null,
        activatedBy: null,
        activatedAt: null,
        estimatedEnd: null,
      });
    }

    return NextResponse.json({
      isActive: maintenance.isActive,
      reason: maintenance.reason,
      message: maintenance.message,
      activatedBy: maintenance.activatedBy,
      activatedAt: maintenance.activatedAt?.toISOString() ?? null,
      estimatedEnd: maintenance.estimatedEnd?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("[Maintenance] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get maintenance status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/deployment/maintenance
 * Toggle maintenance mode (admin or deploy script)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check for deploy token (from deploy script)
    const deployToken = request.headers.get("X-Deploy-Token");
    let activatedBy = "system";

    if (deployToken) {
      // Verify deploy token
      const deployment = await prisma.deployment.findUnique({
        where: { deployToken },
      });

      if (deployment && isTokenValid(deployment.tokenExpiresAt)) {
        activatedBy = deployment.triggeredBy;
        return handleMaintenanceToggle(request, activatedBy);
      }
    }

    // If not authorized via token, check admin auth
    const authResult = await withAdminAuth();
    if (authResult.error) return authResult.error;
    const adminUser = authResult.user!;

    return handleMaintenanceToggle(request, adminUser.email);
  } catch (error) {
    console.error("[Maintenance] Toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle maintenance mode" },
      { status: 500 }
    );
  }
}

async function handleMaintenanceToggle(
  request: NextRequest,
  activatedBy: string
): Promise<NextResponse> {
  const body = await request.json();
  const { active, reason, message, estimatedMinutes } = body as {
    active: boolean;
    reason?: string;
    message?: string;
    estimatedMinutes?: number;
  };

  // Calculate estimated end time
  let estimatedEnd: Date | null = null;
  if (active && estimatedMinutes && estimatedMinutes > 0) {
    estimatedEnd = new Date(Date.now() + estimatedMinutes * 60 * 1000);
  }

  // Upsert maintenance record
  const maintenance = await prisma.maintenanceMode.upsert({
    where: { id: MAINTENANCE_ID },
    create: {
      id: MAINTENANCE_ID,
      isActive: active,
      reason: reason || (active ? "manual" : null),
      message: message || null,
      activatedBy: active ? activatedBy : null,
      activatedAt: active ? new Date() : null,
      estimatedEnd,
    },
    update: {
      isActive: active,
      reason: active ? reason || "manual" : null,
      message: active ? message : null,
      activatedBy: active ? activatedBy : null,
      activatedAt: active ? new Date() : null,
      estimatedEnd: active ? estimatedEnd : null,
    },
  });

  // Écrire le fichier de flag statique pour le middleware
  // Ce fichier est servi directement sans passer par le middleware
  try {
    if (active) {
      await setMaintenanceActive({
        reason: reason || "manual",
        message: message || undefined,
        activatedBy,
        estimatedEnd,
      });
    } else {
      await setMaintenanceInactive();
    }
  } catch (flagError) {
    console.error("[Maintenance] Flag file error:", flagError);
    // Continue même si le fichier échoue - la DB reste la source de vérité
  }

  console.log(
    `[Maintenance] Mode ${active ? "activated" : "deactivated"} by ${activatedBy}`
  );

  return NextResponse.json({
    success: true,
    isActive: maintenance.isActive,
    message: active ? "Mode maintenance activé" : "Mode maintenance désactivé",
  });
}
