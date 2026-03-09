/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest } from "next/server";

import { getMarketingAttribution } from "../store-index";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/attribution
 * Get marketing attribution analysis with multiple models
 *
 * Attribution models:
 * - First-touch: 100% credit to first touchpoint
 * - Last-touch: 100% credit to last touchpoint
 * - Linear: Equal credit to all touchpoints
 * - Time-decay: More recent touchpoints get more credit (half-life 7 days)
 * - U-shaped: 40% first, 40% last, 20% distributed among middle
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const attribution = await getMarketingAttribution(startDate, endDate);

    // Calculate totals for each model
    const totals = {
      firstTouch: attribution.reduce((sum, a) => sum + a.firstTouchConversions, 0),
      lastTouch: attribution.reduce((sum, a) => sum + a.lastTouchConversions, 0),
      linear: attribution.reduce((sum, a) => sum + a.linearConversions, 0),
      timeDecay: attribution.reduce((sum, a) => sum + a.timeDecayConversions, 0),
      uShaped: attribution.reduce((sum, a) => sum + a.uShapedConversions, 0),
    };

    return Response.json({
      attribution,
      totals,
      modelDescriptions: {
        firstTouch: "100% du crédit au premier point de contact",
        lastTouch: "100% du crédit au dernier point de contact",
        linear: "Crédit réparti également entre tous les points de contact",
        timeDecay: "Plus de crédit aux points de contact récents (demi-vie 7 jours)",
        uShaped: "40% premier, 40% dernier, 20% répartis au milieu",
      },
    });
  } catch (error) {
    console.error("Error fetching attribution analysis:", error);
    return Response.json({ error: "Failed to fetch attribution analysis" }, { status: 500 });
  }
}
