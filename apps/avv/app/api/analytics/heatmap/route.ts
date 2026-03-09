/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import type { NextRequest } from "next/server";

import { getSectionHeatmap } from "../store-index";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await getSectionHeatmap(startDate, endDate);

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching section heatmap:", error);
    return Response.json(
      { error: "Failed to fetch section heatmap" },
      { status: 500 }
    );
  }
}
