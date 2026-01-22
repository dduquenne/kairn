// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  trackFunnelStep,
  getFunnelSteps,
  getFunnelAnalysis,
  getAvailableFunnels,
} from "../store-index";

export const dynamic = "force-dynamic";

const funnelStepSchema = z.object({
  sessionId: z.string(),
  funnelName: z.string(),
  stepName: z.string(),
  stepOrder: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * GET /api/analytics/funnel
 * Get funnel analysis or list available funnels
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const funnelName = searchParams.get("funnelName");
    const listFunnels = searchParams.get("list") === "true";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // List all available funnels
    if (listFunnels) {
      const funnels = await getAvailableFunnels(startDate, endDate);
      return Response.json({ funnels });
    }

    // Get specific funnel analysis
    if (funnelName) {
      const analysis = await getFunnelAnalysis(funnelName, startDate, endDate);
      return Response.json(analysis);
    }

    // Get all funnel steps
    const steps = await getFunnelSteps(undefined, startDate, endDate);
    return Response.json(steps);
  } catch (error) {
    console.error("Error fetching funnel data:", error);
    return Response.json({ error: "Failed to fetch funnel data" }, { status: 500 });
  }
}

/**
 * POST /api/analytics/funnel
 * Track a funnel step
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = funnelStepSchema.parse(body);

    const step = await trackFunnelStep({
      ...validated,
      timestamp: new Date().toISOString(),
    });

    return Response.json(step, { status: 201 });
  } catch (error) {
    console.error("Error tracking funnel step:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return Response.json({ error: "Failed to track funnel step" }, { status: 500 });
  }
}
