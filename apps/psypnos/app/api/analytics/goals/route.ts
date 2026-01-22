// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  getGoalsSummary,
} from "../store-index";

export const dynamic = "force-dynamic";

const createGoalSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['destination', 'event', 'duration', 'pages_per_session']),
  destinationUrl: z.string().optional(),
  eventCategory: z.string().optional(),
  eventAction: z.string().optional(),
  eventLabel: z.string().optional(),
  durationSeconds: z.number().optional(),
  comparison: z.enum(['greater_than', 'less_than']).optional(),
  pagesCount: z.number().optional(),
  value: z.number().optional(),
  enabled: z.boolean().default(true),
});

const updateGoalSchema = createGoalSchema.partial();

/**
 * GET /api/analytics/goals
 * Get all goals or a specific goal by ID, or goals summary
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const summary = searchParams.get("summary") === "true";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    if (summary) {
      const goalsSummary = await getGoalsSummary(startDate, endDate);
      return Response.json(goalsSummary);
    }

    if (id) {
      const goal = await getGoal(id);
      if (!goal) {
        return Response.json({ error: "Goal not found" }, { status: 404 });
      }
      return Response.json(goal);
    }

    const goals = await getGoals();
    return Response.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return Response.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

/**
 * POST /api/analytics/goals
 * Create a new goal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createGoalSchema.parse(body);

    const goal = await createGoal(validated);
    return Response.json(goal, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return Response.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

/**
 * PUT /api/analytics/goals
 * Update an existing goal
 */
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Goal ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateGoalSchema.parse(body);

    const goal = await updateGoal(id, validated);
    if (!goal) {
      return Response.json({ error: "Goal not found" }, { status: 404 });
    }

    return Response.json(goal);
  } catch (error) {
    console.error("Error updating goal:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return Response.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

/**
 * DELETE /api/analytics/goals
 * Delete a goal
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Goal ID is required" }, { status: 400 });
    }

    const deleted = await deleteGoal(id);
    if (!deleted) {
      return Response.json({ error: "Goal not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return Response.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
