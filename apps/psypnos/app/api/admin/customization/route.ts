import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { customizationConfigSchema } from "@kairn/config";

export const dynamic = "force-dynamic";

// Site ID for Psypnos (in a real multi-tenant setup, this would come from context)
const SITE_SLUG = "psypnos";
const SITE_DOMAIN = "psypnos.fr";
const SITE_NAME = "Psypnos";

/**
 * Ensures the site exists in the database, creating it if necessary
 */
async function ensureSiteExists() {
  return prisma.site.upsert({
    where: { slug: SITE_SLUG },
    update: {}, // Don't update anything if it exists
    create: {
      slug: SITE_SLUG,
      name: SITE_NAME,
      domain: SITE_DOMAIN,
      isActive: true,
      config: {},
    },
    select: { id: true, config: true },
  });
}

/**
 * GET - Retrieve current customization settings
 */
export async function GET() {
  try {
    const site = await ensureSiteExists();

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

    // Get or create site
    const site = await ensureSiteExists();

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
      data: { config: updatedConfig as Prisma.InputJsonValue },
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
    // Get or create site
    const site = await ensureSiteExists();

    // Remove customization from config (destructure to exclude, underscore prefix to avoid lint error)
    const existingConfig = (site.config as Record<string, unknown>) || {};
    const { customization: _customization, customizationUpdatedAt: _updatedAt, ...restConfig } = existingConfig;
    void _customization;
    void _updatedAt;

    await prisma.site.update({
      where: { slug: SITE_SLUG },
      data: { config: restConfig as Prisma.InputJsonValue },
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
