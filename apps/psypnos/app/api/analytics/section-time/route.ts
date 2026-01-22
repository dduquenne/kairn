// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { trackSectionTime } from "../store-index";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    let sessionId: string;
    let section: string;
    let timeSpent: number;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Handle JSON requests (from fetch with JSON body)
      const body = await request.json();
      sessionId = body.sessionId;
      section = body.section;
      timeSpent = body.timeSpent;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      // Handle FormData requests (from sendBeacon)
      const formData = await request.formData();
      sessionId = formData.get("sessionId") as string;
      section = formData.get("section") as string;
      timeSpent = parseInt(formData.get("timeSpent") as string, 10);
    } else {
      return Response.json(
        { error: "Unsupported content type" },
        { status: 400 },
      );
    }

    if (!sessionId || !section || isNaN(timeSpent)) {
      console.warn("Missing or invalid fields:", { sessionId, section, timeSpent });
      return Response.json(
        { error: "Missing required fields: sessionId, section, timeSpent" },
        { status: 400 },
      );
    }

    const record = await trackSectionTime({
      timestamp: new Date().toISOString(),
      sessionId,
      section,
      timeSpent,
    });

    return Response.json(record, { status: 201 });
  } catch (error) {
    console.error("Error tracking section time:", error);
    return Response.json(
      { error: "Failed to track section time" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const { getSectionTimes } = await import("../store-index");
    const times = await getSectionTimes(startDate || undefined, endDate || undefined);

    return Response.json(times, { status: 200 });
  } catch (error) {
    console.error("Error fetching section times:", error);
    return Response.json(
      { error: "Failed to fetch section times" },
      { status: 500 },
    );
  }
}
