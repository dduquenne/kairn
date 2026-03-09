/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  createScheduledReport,
  getScheduledReports,
  getScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
} from "../store-index";

export const dynamic = "force-dynamic";

// Validation schemas
const createReportSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0 = Sunday
  dayOfMonth: z.number().min(1).max(31).optional(),
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:mm requis"),
  recipients: z.array(z.string().email()).min(1, "Au moins un destinataire requis"),
  format: z.enum(["email", "pdf", "both"]),
  sections: z.array(z.enum([
    "summary",
    "traffic",
    "conversions",
    "sections",
    "devices",
    "cohorts",
    "insights",
  ])).min(1, "Au moins une section requise"),
  enabled: z.boolean().default(true),
  nextScheduled: z.string().optional(),
});

const updateReportSchema = createReportSchema.partial();

// GET - List all scheduled reports or get specific report
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const enabledOnly = searchParams.get("enabledOnly") === "true";

    if (id) {
      const report = await getScheduledReport(id);
      if (!report) {
        return NextResponse.json(
          { error: "Rapport programme non trouve" },
          { status: 404 }
        );
      }
      return NextResponse.json({ report });
    }

    const reports = await getScheduledReports(enabledOnly);
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching scheduled reports:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des rapports programmes" },
      { status: 500 }
    );
  }
}

// POST - Create a new scheduled report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createReportSchema.parse(body);

    // Validate frequency-specific fields
    if (validatedData.frequency === "weekly" && validatedData.dayOfWeek === undefined) {
      return NextResponse.json(
        { error: "Le jour de la semaine est requis pour les rapports hebdomadaires" },
        { status: 400 }
      );
    }

    if (validatedData.frequency === "monthly" && validatedData.dayOfMonth === undefined) {
      return NextResponse.json(
        { error: "Le jour du mois est requis pour les rapports mensuels" },
        { status: 400 }
      );
    }

    // Calculate next scheduled time
    const nextScheduled = calculateNextScheduled(validatedData);

    const report = await createScheduledReport({
      ...validatedData,
      nextScheduled,
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating scheduled report:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation du rapport programme" },
      { status: 500 }
    );
  }
}

// PUT - Update a scheduled report
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID du rapport requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateReportSchema.parse(body);

    // Recalculate next scheduled if frequency-related fields changed
    let nextScheduled: string | undefined;
    if (validatedData.frequency || validatedData.timeOfDay || validatedData.dayOfWeek || validatedData.dayOfMonth) {
      const existingReport = await getScheduledReport(id);
      if (existingReport) {
        const mergedData = {
          ...existingReport,
          ...validatedData,
          dayOfWeek: (validatedData.dayOfWeek ?? existingReport.dayOfWeek) ?? undefined,
          dayOfMonth: (validatedData.dayOfMonth ?? existingReport.dayOfMonth) ?? undefined,
        };
        nextScheduled = calculateNextScheduled(mergedData as any);
      }
    }

    const report = await updateScheduledReport(id, {
      ...validatedData,
      ...(nextScheduled && { nextScheduled }),
    });

    if (!report) {
      return NextResponse.json(
        { error: "Rapport programme non trouve" },
        { status: 404 }
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating scheduled report:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour du rapport programme" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a scheduled report
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID du rapport requis" },
        { status: 400 }
      );
    }

    const deleted = await deleteScheduledReport(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Rapport programme non trouve" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Rapport programme supprime" });
  } catch (error) {
    console.error("Error deleting scheduled report:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du rapport programme" },
      { status: 500 }
    );
  }
}

// Helper function to calculate next scheduled time
function calculateNextScheduled(config: {
  frequency: "daily" | "weekly" | "monthly";
  timeOfDay: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}): string {
  const now = new Date();
  const [hours, minutes] = config.timeOfDay.split(":").map(Number);
  const next = new Date(now);

  next.setHours(hours, minutes, 0, 0);

  switch (config.frequency) {
    case "daily":
      // If time has passed today, schedule for tomorrow
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case "weekly":
      // Find next occurrence of the specified day
      const targetDay = config.dayOfWeek || 0;
      const currentDay = next.getDay();
      let daysUntilTarget = targetDay - currentDay;

      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && next <= now)) {
        daysUntilTarget += 7;
      }

      next.setDate(next.getDate() + daysUntilTarget);
      break;

    case "monthly":
      // Find next occurrence of the specified day of month
      const targetDate = config.dayOfMonth || 1;
      next.setDate(targetDate);

      // If date has passed this month, move to next month
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }

      // Handle months with fewer days
      while (next.getDate() !== targetDate) {
        next.setDate(0); // Last day of previous month
        next.setMonth(next.getMonth() + 1);
        next.setDate(Math.min(targetDate, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      }
      break;
  }

  return next.toISOString();
}
