/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  createDashboardConfig,
  getDashboardConfigs,
  getDashboardConfig,
  getDefaultDashboardConfig,
  updateDashboardConfig,
  deleteDashboardConfig,
  getDefaultWidgets,
} from "../store-index";

export const dynamic = "force-dynamic";

// Widget position schema
const widgetPositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  w: z.number().min(1),
  h: z.number().min(1),
});

// Widget schema
const widgetSchema = z.object({
  id: z.string(),
  type: z.enum([
    "stat_card",
    "line_chart",
    "bar_chart",
    "funnel",
    "heatmap",
    "table",
    "cohort",
    "attribution",
    "ai_insights",
    "anomalies",
    "alerts",
  ]),
  title: z.string(),
  position: widgetPositionSchema,
  config: z.record(z.unknown()),
});

// Create dashboard config schema
const createConfigSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  isDefault: z.boolean().default(false),
  widgets: z.array(widgetSchema),
});

const updateConfigSchema = createConfigSchema.partial().omit({ userId: true });

// GET - List configs or get specific config
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const getDefault = searchParams.get("default") === "true";
    const getDefaultWidgetsConfig = searchParams.get("defaultWidgets") === "true";

    // Get default widget configuration template
    if (getDefaultWidgetsConfig) {
      const widgets = getDefaultWidgets();
      return NextResponse.json({ widgets });
    }

    // Get specific config by ID
    if (id) {
      const config = await getDashboardConfig(id);
      if (!config) {
        return NextResponse.json(
          { error: "Configuration non trouvee" },
          { status: 404 }
        );
      }
      return NextResponse.json({ config });
    }

    // Get default config for user
    if (userId && getDefault) {
      const config = await getDefaultDashboardConfig(userId);
      if (!config) {
        // Return default widgets if no config exists
        const widgets = getDefaultWidgets();
        return NextResponse.json({
          config: null,
          defaultWidgets: widgets,
        });
      }
      return NextResponse.json({ config });
    }

    // List all configs for user
    const configs = await getDashboardConfigs(userId || undefined);
    return NextResponse.json({ configs });
  } catch (error) {
    console.error("Error fetching dashboard config:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation de la configuration" },
      { status: 500 }
    );
  }
}

// POST - Create a new config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createConfigSchema.parse(body);

    const config = await createDashboardConfig(validatedData);
    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating dashboard config:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de la configuration" },
      { status: 500 }
    );
  }
}

// PUT - Update a config
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de la configuration requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateConfigSchema.parse(body);

    const config = await updateDashboardConfig(id, validatedData);
    if (!config) {
      return NextResponse.json(
        { error: "Configuration non trouvee" },
        { status: 404 }
      );
    }

    return NextResponse.json({ config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating dashboard config:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour de la configuration" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a config
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de la configuration requis" },
        { status: 400 }
      );
    }

    const deleted = await deleteDashboardConfig(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Configuration non trouvee" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Configuration supprimee" });
  } catch (error) {
    console.error("Error deleting dashboard config:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la configuration" },
      { status: 500 }
    );
  }
}
