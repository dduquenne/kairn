/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest } from "next/server";
import { z } from "zod";

import { trackGoalCompletion, getGoalCompletions } from "../../store";

export const dynamic = "force-dynamic";

const completionSchema = z.object({
  sessionId: z.string(),
  goalId: z.string(),
  value: z.number().optional(),
  timestamp: z.string(),
});

/**
 * POST /api/analytics/goals/completion
 * Track a goal completion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = completionSchema.parse(body);

    const completion = await trackGoalCompletion(validated);
    return Response.json(completion, { status: 201 });
  } catch (error) {
    console.error("Error tracking goal completion:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return Response.json({ error: "Failed to track goal completion" }, { status: 500 });
  }
}

/**
 * GET /api/analytics/goals/completion
 * Get goal completions with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const goalId = searchParams.get("goalId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const completions = await getGoalCompletions(goalId, startDate, endDate);
    return Response.json(completions);
  } catch (error) {
    console.error("Error fetching goal completions:", error);
    return Response.json({ error: "Failed to fetch goal completions" }, { status: 500 });
  }
}
