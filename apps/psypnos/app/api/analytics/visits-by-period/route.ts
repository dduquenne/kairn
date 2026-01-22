// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { getVisitsByPeriod } from "../store-index";
import type { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "day";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    if (!["day", "week", "month", "year"].includes(period)) {
      return Response.json(
        { error: "Invalid period. Must be: day, week, month, or year" },
        { status: 400 }
      );
    }

    const data = await getVisitsByPeriod(
      period as "day" | "week" | "month" | "year",
      startDate,
      endDate
    );

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching visits by period:", error);
    return Response.json(
      { error: "Failed to fetch visits by period" },
      { status: 500 }
    );
  }
}
