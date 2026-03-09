/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";

import {
  getAnomalies,
  runAnomalyDetection,
  acknowledgeAnomaly,
  calculateBaseline,
} from "../store-index";

export const dynamic = "force-dynamic";

// GET - List anomalies or run detection
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const acknowledgedOnly = searchParams.get("acknowledged");
    const metric = searchParams.get("metric");
    const sensitivity = (searchParams.get("sensitivity") as "low" | "medium" | "high") || "medium";

    // Run anomaly detection
    if (action === "detect") {
      const detectedAnomalies = await runAnomalyDetection(sensitivity);
      return NextResponse.json({
        detected: detectedAnomalies.length,
        anomalies: detectedAnomalies,
      });
    }

    // Get baseline statistics for a metric
    if (action === "baseline" && metric) {
      const days = parseInt(searchParams.get("days") || "30", 10);
      const baseline = await calculateBaseline(metric, days);
      return NextResponse.json({
        metric,
        days,
        baseline: {
          mean: baseline.mean,
          stdDev: baseline.stdDev,
          min: Math.min(...baseline.values),
          max: Math.max(...baseline.values),
          dataPoints: baseline.values.length,
        },
      });
    }

    // List anomalies
    const acknowledged = acknowledgedOnly === "true" ? true : acknowledgedOnly === "false" ? false : undefined;
    const anomalies = await getAnomalies(startDate, endDate, acknowledged);

    // Group by severity for summary
    const summary = {
      total: anomalies.length,
      high: anomalies.filter(a => a.severity === "high").length,
      medium: anomalies.filter(a => a.severity === "medium").length,
      low: anomalies.filter(a => a.severity === "low").length,
      unacknowledged: anomalies.filter(a => !a.acknowledged).length,
    };

    return NextResponse.json({ anomalies, summary });
  } catch (error) {
    console.error("Error fetching anomalies:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des anomalies" },
      { status: 500 }
    );
  }
}

// POST - Acknowledge an anomaly
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, acknowledgedBy } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de l'anomalie requis" },
        { status: 400 }
      );
    }

    const anomaly = await acknowledgeAnomaly(id, acknowledgedBy);
    if (!anomaly) {
      return NextResponse.json(
        { error: "Anomalie non trouvee" },
        { status: 404 }
      );
    }

    return NextResponse.json({ anomaly });
  } catch (error) {
    console.error("Error acknowledging anomaly:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'acquittement de l'anomalie" },
      { status: 500 }
    );
  }
}
