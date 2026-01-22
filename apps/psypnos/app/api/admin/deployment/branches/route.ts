// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";
import { withAdminAuth } from "@/app/api/auth/middleware";
import { ALLOWED_REFS } from "@/lib/deployment/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/deployment/branches
 * Get list of allowed branches/tags for deployment
 */
export async function GET(): Promise<NextResponse> {
  // Check admin auth
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    // In production, this could fetch from Git
    // For now, return the static whitelist
    const branches = ALLOWED_REFS.map((ref) => ({
      name: ref,
      isDefault: ref === "main" || ref === "master",
      description: getBranchDescription(ref),
    }));

    return NextResponse.json({
      branches,
      allowedPatterns: [
        { pattern: "v*.*.*", description: "Tags de version (ex: v1.2.3)" },
        { pattern: "release/*", description: "Branches de release" },
        { pattern: "hotfix/*", description: "Branches de hotfix" },
      ],
    });
  } catch (error) {
    console.error("[Deployment Branches] Error:", error);
    return NextResponse.json(
      { error: "Failed to get branches" },
      { status: 500 }
    );
  }
}

function getBranchDescription(ref: string): string {
  const descriptions: Record<string, string> = {
    main: "Branche principale de production",
    master: "Branche principale de production",
    develop: "Branche de développement",
    staging: "Environnement de pré-production",
    production: "Production stable",
  };

  return descriptions[ref] || ref;
}
