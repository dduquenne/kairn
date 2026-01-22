// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest } from "next/server";
import { z } from "zod";
import { trackCustomEvent } from "../store-index";

export const dynamic = "force-dynamic";

const customEventSchema = z.object({
  sessionId: z.string(),
  timestamp: z.string().optional(),
  category: z.string(),
  action: z.string(),
  label: z.string().optional(),
  value: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Track custom events beyond standard conversions
 * Examples: CTA clicks, FAQ interactions, video play, file download, link clicks, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = customEventSchema.parse(body);

    // Track event via store-index (PostgreSQL)
    const event = await trackCustomEvent({
      timestamp: validated.timestamp || new Date().toISOString(),
      sessionId: validated.sessionId,
      category: validated.category,
      action: validated.action,
      label: validated.label,
      value: validated.value,
      metadata: validated.metadata,
    });

    return Response.json(event, { status: 201 });
  } catch (error) {
    console.error("Error tracking custom event:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return Response.json(
      { error: "Failed to track custom event" },
      { status: 500 }
    );
  }
}

/**
 * Get custom events with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const action = searchParams.get("action") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // Get events via store-index (PostgreSQL)
    const { getCustomEvents } = await import("../store-index");
    const events = await getCustomEvents(category, action, startDate, endDate);

    return Response.json(events, { status: 200 });
  } catch (error) {
    console.error("Error fetching custom events:", error);
    return Response.json(
      { error: "Failed to fetch custom events" },
      { status: 500 }
    );
  }
}
