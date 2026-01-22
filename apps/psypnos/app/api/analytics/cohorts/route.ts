// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest } from "next/server";
import { getCohortAnalysis } from "../store-index";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/cohorts
 * Get cohort analysis with retention and conversion data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cohortBy = (searchParams.get("cohortBy") as 'week' | 'month' | 'utm_source' | 'referrer' | 'device') || 'week';
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const cohorts = await getCohortAnalysis(cohortBy, startDate, endDate);

    return Response.json({
      cohortBy,
      cohorts,
      summary: {
        totalCohorts: cohorts.length,
        totalUsers: cohorts.reduce((sum, c) => sum + c.userCount, 0),
        avgConversionRate: cohorts.length > 0
          ? cohorts.reduce((sum, c) => sum + c.conversionRate, 0) / cohorts.length
          : 0,
        avgRetentionDay7: cohorts.length > 0
          ? cohorts.reduce((sum, c) => sum + c.retentionDay7, 0) / cohorts.length
          : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching cohort analysis:", error);
    return Response.json({ error: "Failed to fetch cohort analysis" }, { status: 500 });
  }
}
