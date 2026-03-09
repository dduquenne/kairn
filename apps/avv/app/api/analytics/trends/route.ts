/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import type { NextRequest } from "next/server";

import { getVisitsByPeriod } from "../store-index";

export async function GET(request: NextRequest) {
  try {
    // Get last 7 days of visitor data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 to include today as day 7
    const startDate = sevenDaysAgo.toISOString().split("T")[0];

    const data = await getVisitsByPeriod("day", startDate, undefined);

    // Ensure we have exactly 7 days, filling in any missing days with 0
    const today = new Date();
    const last7Days: Array<{ period: string; visits: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const existingData = data.find((d) => d.period === dateStr);
      last7Days.push({
        period: dateStr,
        visits: existingData?.visits || 0,
      });
    }

    return Response.json(last7Days, { status: 200 });
  } catch (error) {
    console.error("Error fetching visitor trends:", error);
    return Response.json(
      { error: "Failed to fetch visitor trends" },
      { status: 500 }
    );
  }
}
