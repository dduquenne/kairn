// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { trackConversionEvent } from "../store-index";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, eventType, stepName, completed, metadata } = body;

    if (!sessionId || !eventType || !stepName || completed === undefined) {
      return Response.json(
        {
          error: "Missing required fields: sessionId, eventType, stepName, completed",
        },
        { status: 400 },
      );
    }

    const event = await trackConversionEvent({
      timestamp: new Date().toISOString(),
      sessionId,
      eventType,
      stepName,
      completed,
      metadata,
    });

    return Response.json(event, { status: 201 });
  } catch (error) {
    console.error("Error tracking conversion event:", error);
    return Response.json(
      { error: "Failed to track conversion event" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const { getConversionEvents } = await import("../store-index");
    const events = await getConversionEvents(
      startDate || undefined,
      endDate || undefined,
    );

    return Response.json(events, { status: 200 });
  } catch (error) {
    console.error("Error fetching conversion events:", error);
    return Response.json(
      { error: "Failed to fetch conversion events" },
      { status: 500 },
    );
  }
}
