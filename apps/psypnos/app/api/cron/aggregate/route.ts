// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Cron Aggregation API Route
 * Phase 4: Scalability & Performance
 *
 * Endpoint to trigger daily aggregations.
 * Can be called by Vercel Cron, GitHub Actions, or external schedulers.
 *
 * Security: Requires CRON_SECRET in Authorization header
 */

import { NextRequest, NextResponse } from "next/server";
import { runDailyAggregations, backfillAggregations } from "@/lib/analytics/aggregation";
import { runAnomalyDetection } from "@/app/api/analytics/store-index";

// Verify cron secret
function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Parse optional parameters
    const body = await request.json().catch(() => ({}));
    const { date, backfillFrom, runAnomalies } = body as {
      date?: string;
      backfillFrom?: string;
      runAnomalies?: boolean;
    };

    const results: Record<string, unknown> = {};

    // Run aggregations
    if (backfillFrom) {
      // Backfill mode
      const fromDate = new Date(backfillFrom);
      const toDate = date ? new Date(date) : new Date();
      await backfillAggregations(fromDate, toDate);
      results.backfill = {
        from: fromDate.toISOString().split("T")[0],
        to: toDate.toISOString().split("T")[0],
      };
    } else {
      // Single day mode
      const targetDate = date ? new Date(date) : new Date();
      await runDailyAggregations(targetDate);
      results.aggregation = {
        date: targetDate.toISOString().split("T")[0],
      };
    }

    // Optionally run anomaly detection
    if (runAnomalies !== false) {
      const anomalies = await runAnomalyDetection("medium");
      results.anomalies = {
        detected: anomalies.length,
        items: anomalies.map((a) => ({
          metric: a.metric,
          type: a.type,
          severity: a.severity,
        })),
      };
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      results,
    });
  } catch (error) {
    console.error("[Cron] Aggregation error:", error);
    return NextResponse.json(
      {
        error: "Aggregation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support GET for simple triggers (with query params)
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");

  const startTime = Date.now();

  try {
    const targetDate = date ? new Date(date) : new Date();
    await runDailyAggregations(targetDate);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      date: targetDate.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("[Cron] Aggregation error:", error);
    return NextResponse.json(
      {
        error: "Aggregation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
