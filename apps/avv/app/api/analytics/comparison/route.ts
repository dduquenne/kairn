/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import type { NextRequest } from "next/server";

import { getAnalyticsSummaryWithComparison } from "../store-index";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get("timeRange") || "day";

    if (!["day", "week", "month", "year"].includes(timeRange)) {
      return Response.json(
        { error: "Invalid timeRange. Must be: day, week, month, or year" },
        { status: 400 }
      );
    }

    const data = await getAnalyticsSummaryWithComparison(
      timeRange as "day" | "week" | "month" | "year"
    );

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching analytics comparison:", error);
    return Response.json(
      { error: "Failed to fetch analytics comparison" },
      { status: 500 }
    );
  }
}
