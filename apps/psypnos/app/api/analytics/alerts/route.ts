/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  createAlert,
  getAlerts,
  getAlert,
  updateAlert,
  deleteAlert,
  getAlertHistory,
  type Alert,
} from "../store-index";

export const dynamic = "force-dynamic";

// Validation schemas
const createAlertSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  type: z.enum(["threshold", "anomaly", "trend"]),
  metric: z.enum(["visits", "sessions", "conversions", "conversion_rate", "avg_time", "bounce_rate"]),
  condition: z.enum(["greater_than", "less_than", "equals", "change_percent"]),
  threshold: z.number(),
  timeWindow: z.enum(["hour", "day", "week", "month"]),
  channels: z.array(z.enum(["email", "webhook"])),
  emailRecipients: z.array(z.string().email()).optional(),
  webhookUrl: z.string().url().optional(),
  enabled: z.boolean().default(true),
});

const updateAlertSchema = createAlertSchema.partial();

// GET - List all alerts or get specific alert
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const enabledOnly = searchParams.get("enabledOnly") === "true";
    const includeHistory = searchParams.get("includeHistory") === "true";

    if (id) {
      const alert = await getAlert(id);
      if (!alert) {
        return NextResponse.json(
          { error: "Alerte non trouvee" },
          { status: 404 }
        );
      }

      let history: Awaited<ReturnType<typeof getAlertHistory>> = [];
      if (includeHistory) {
        history = await getAlertHistory(id);
      }

      return NextResponse.json({ alert, history });
    }

    const alerts = await getAlerts(enabledOnly);
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des alertes" },
      { status: 500 }
    );
  }
}

// POST - Create a new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAlertSchema.parse(body);

    // Validate that email recipients are provided if email channel is selected
    if (
      validatedData.channels.includes("email") &&
      (!validatedData.emailRecipients || validatedData.emailRecipients.length === 0)
    ) {
      return NextResponse.json(
        { error: "Des destinataires email sont requis pour le canal email" },
        { status: 400 }
      );
    }

    // Validate that webhook URL is provided if webhook channel is selected
    if (validatedData.channels.includes("webhook") && !validatedData.webhookUrl) {
      return NextResponse.json(
        { error: "Une URL webhook est requise pour le canal webhook" },
        { status: 400 }
      );
    }

    const alert = await createAlert(validatedData);
    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de l'alerte" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing alert
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de l'alerte requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateAlertSchema.parse(body);

    // Validate channels and their required fields if being updated
    if (validatedData.channels) {
      if (
        validatedData.channels.includes("email") &&
        validatedData.emailRecipients !== undefined &&
        validatedData.emailRecipients.length === 0
      ) {
        return NextResponse.json(
          { error: "Des destinataires email sont requis pour le canal email" },
          { status: 400 }
        );
      }

      if (
        validatedData.channels.includes("webhook") &&
        validatedData.webhookUrl === undefined
      ) {
        // Need to check if webhook URL exists in the current alert
        const existingAlert = await getAlert(id);
        if (existingAlert && !existingAlert.webhookUrl) {
          return NextResponse.json(
            { error: "Une URL webhook est requise pour le canal webhook" },
            { status: 400 }
          );
        }
      }
    }

    const alert = await updateAlert(id, validatedData);
    if (!alert) {
      return NextResponse.json(
        { error: "Alerte non trouvee" },
        { status: 404 }
      );
    }

    return NextResponse.json({ alert });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour de l'alerte" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an alert
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de l'alerte requis" },
        { status: 400 }
      );
    }

    const deleted = await deleteAlert(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Alerte non trouvee" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Alerte supprimee" });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'alerte" },
      { status: 500 }
    );
  }
}
