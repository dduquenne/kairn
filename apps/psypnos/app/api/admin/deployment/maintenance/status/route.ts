// @ts-nocheck
// TODO: Migration - Deployment model not available in Kairn schema
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/deployment/maintenance/status
 * Public endpoint for middleware to check maintenance status
 * This endpoint is intentionally lightweight and public
 */
export async function GET(request: NextRequest) {
  try {
    // Verify internal request header for security
    const isInternalRequest = request.headers.get("X-Internal-Request") === "true";

    // Allow both internal requests and direct access
    // (middleware needs this, admins might check it too)

    const maintenance = await prisma.maintenanceMode.findFirst({
      select: {
        isActive: true,
        reason: true,
        estimatedEnd: true,
      },
    });

    if (!maintenance) {
      return NextResponse.json(
        { isActive: false },
        {
          headers: {
            "Cache-Control": "public, max-age=5, stale-while-revalidate=10",
          },
        }
      );
    }

    return NextResponse.json(
      {
        isActive: maintenance.isActive,
        reason: maintenance.reason,
        estimatedEnd: maintenance.estimatedEnd?.toISOString() ?? null,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    // In case of database error, don't block traffic
    console.error("[Maintenance Status] Error:", error);
    return NextResponse.json(
      { isActive: false },
      { status: 200 } // Return 200 with inactive to not block traffic
    );
  }
}
