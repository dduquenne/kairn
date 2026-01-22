// @ts-nocheck
// TODO: Migration - BotVisit model not available in Kairn schema
/**
 * Bot Tracking API
 *
 * This endpoint receives bot visit data from the middleware
 * and stores it in the database for SEO analytics.
 *
 * @endpoint POST /api/analytics/bots/track
 */

import { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Validation schema
const BotVisitSchema = z.object({
  botName: z.string().min(1),
  botType: z.enum(["search_engine", "social", "seo_tool", "monitor", "other"]),
  userAgent: z.string().optional(),
  page: z.string().min(1),
  referrer: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  ipHash: z.string().optional(),
});

// Country code to name mapping
const COUNTRY_NAMES: Record<string, string> = {
  FR: "France",
  BE: "Belgique",
  CH: "Suisse",
  CA: "Canada",
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  ES: "Spain",
  IT: "Italy",
  PT: "Portugal",
  NL: "Netherlands",
  LU: "Luxembourg",
};

export async function POST(request: NextRequest) {
  // Only accept internal requests
  const isInternal = request.headers.get("X-Internal-Request") === "true";
  if (!isInternal) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validationResult = BotVisitSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        { error: "Invalid payload", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Import Prisma dynamically
    const { prisma } = await import("@/lib/db/prisma");

    // Determine country code and name
    let countryCode: string | undefined;
    let countryName: string | undefined;

    if (data.country) {
      if (data.country.length === 2) {
        countryCode = data.country.toUpperCase();
        countryName = COUNTRY_NAMES[countryCode] || countryCode;
      } else {
        countryName = data.country;
        // Try to find the code
        const entry = Object.entries(COUNTRY_NAMES).find(
          ([, name]) => name.toLowerCase() === data.country?.toLowerCase()
        );
        countryCode = entry?.[0];
      }
    }

    // Store the bot visit
    await prisma.botVisit.create({
      data: {
        botName: data.botName,
        botType: data.botType,
        userAgent: data.userAgent,
        page: data.page,
        referrer: data.referrer || undefined,
        country: countryName,
        countryCode: countryCode,
        city: data.city || undefined,
        ipHash: data.ipHash,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[Bot Track API] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
