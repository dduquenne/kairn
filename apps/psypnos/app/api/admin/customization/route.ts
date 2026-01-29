import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// eslint-disable-next-line import/no-unresolved
import { prisma } from "@kairn/db";
import { customizationConfigSchema } from "@kairn/config";

export const dynamic = "force-dynamic";

// Site ID for Psypnos (in a real multi-tenant setup, this would come from context)
const SITE_SLUG = "psypnos";

/**
 * GET - Retrieve current customization settings
 */
export async function GET() {
  try {
    const site = await prisma.site.findUnique({
      where: { slug: SITE_SLUG },
      select: { config: true },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site non trouve" },
        { status: 404 }
      );
    }

    // Extract customization from site config
    const config = site.config as Record<string, unknown> | null;
    const customization = config?.customization || null;

    return NextResponse.json({
      customization,
      updatedAt: config?.customizationUpdatedAt || null,
    });
  } catch (error) {
    console.error("Error fetching customization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des parametres" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update customization settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the customization config
    const validatedConfig = customizationConfigSchema.parse(body);

    // Get current site config
    const site = await prisma.site.findUnique({
      where: { slug: SITE_SLUG },
      select: { id: true, config: true },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site non trouve" },
        { status: 404 }
      );
    }

    // Merge with existing config
    const existingConfig = (site.config as Record<string, unknown>) || {};
    const updatedConfig = {
      ...existingConfig,
      customization: validatedConfig,
      customizationUpdatedAt: new Date().toISOString(),
    };

    // Update site config
    await prisma.site.update({
      where: { slug: SITE_SLUG },
      data: { config: updatedConfig },
    });

    return NextResponse.json({
      success: true,
      message: "Parametres de personnalisation enregistres",
      customization: validatedConfig,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Configuration invalide", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating customization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde des parametres" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Reset customization to default
 */
export async function DELETE() {
  try {
    const site = await prisma.site.findUnique({
      where: { slug: SITE_SLUG },
      select: { id: true, config: true },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site non trouve" },
        { status: 404 }
      );
    }

    // Remove customization from config (destructure to exclude, underscore prefix to avoid lint error)
    const existingConfig = (site.config as Record<string, unknown>) || {};
    const { customization: _customization, customizationUpdatedAt: _updatedAt, ...restConfig } = existingConfig;
    void _customization;
    void _updatedAt;

    await prisma.site.update({
      where: { slug: SITE_SLUG },
      data: { config: restConfig },
    });

    return NextResponse.json({
      success: true,
      message: "Parametres de personnalisation reinitialises",
    });
  } catch (error) {
    console.error("Error resetting customization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la reinitialisation" },
      { status: 500 }
    );
  }
}
