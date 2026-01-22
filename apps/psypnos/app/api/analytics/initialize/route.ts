// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import {
  trackPageVisit,
  trackSectionTime,
  trackConversionEvent,
} from "../store-index";
import type { NextRequest } from "next/server";

// Generate realistic historical data for demo/testing
export async function POST(request: NextRequest) {
  try {
    const { days = 30 } = await request.json().catch(() => ({ days: 30 }));

    const sections = [
      "hero",
      "approche",
      "voyage",
      "psychotherapie",
      "respiration",
      "seminaires",
      "temoignages",
      "contact",
    ];
    const conversionTypes = [
      "appointment_request",
      "seminar_registration",
      "contact_form",
    ] as const;

    let generatedCount = 0;

    // Generate data for the last N days
    for (let d = days - 1; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(Math.floor(Math.random() * 24), 0, 0, 0);

      // 50-150 visits per day
      const dailyVisits = Math.floor(Math.random() * 100 + 50);

      for (let v = 0; v < dailyVisits; v++) {
        const sessionId = `demo_${date.getTime()}_${v}`;
        const visitDate = new Date(date);
        visitDate.setHours(
          Math.floor(Math.random() * 24),
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60),
        );

        // Track page visit
        await trackPageVisit({
          timestamp: visitDate.toISOString(),
          sessionId,
          page: "/",
          referrer: ["google", "direct", "facebook"].includes(
            Math.random() > 0.7 ? "google" : "direct",
          )
            ? "google"
            : undefined,
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        });

        // Track 2-5 sections per session
        const sectionCount = Math.floor(Math.random() * 4 + 2);
        for (let s = 0; s < sectionCount; s++) {
          const section = sections[Math.floor(Math.random() * sections.length)];
          const sectionTime = Math.random() * 120000 + 10000; // 10sec to 2min

          await trackSectionTime({
            timestamp: new Date(visitDate.getTime() + s * 30000).toISOString(),
            sessionId,
            section,
            timeSpent: Math.floor(sectionTime),
          });
        }

        // 10% chance of conversion event
        if (Math.random() < 0.1) {
          const eventType = conversionTypes[
            Math.floor(Math.random() * conversionTypes.length)
          ] as typeof conversionTypes[number];

          const stepName =
            eventType === "appointment_request"
              ? "Demande de rendez-vous"
              : eventType === "seminar_registration"
                ? "Inscription séminaire"
                : "Formulaire de contact";

          // 70% conversion rate
          const completed = Math.random() < 0.7;

          await trackConversionEvent({
            timestamp: new Date(
              visitDate.getTime() + sectionCount * 30000,
            ).toISOString(),
            sessionId,
            eventType,
            stepName,
            completed,
            metadata: {
              referrer: "organic",
              device: "desktop",
            },
          });
        }

        generatedCount++;
      }
    }

    return Response.json(
      {
        success: true,
        message: `Generated ${generatedCount} analytics events for ${days} days`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error initializing analytics:", error);
    return Response.json(
      { error: "Failed to initialize analytics" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json(
    {
      message: "POST with { days?: number } to generate historical data",
    },
    { status: 200 },
  );
}
