import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateCSSVariables, customizationConfigSchema } from "@kairn/config";

export const dynamic = "force-dynamic";

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
 * GET - Generate CSS variables from customization config
 * This can be used to dynamically inject styles into the page
 */
export async function GET() {
  try {
    const site = await ensureSiteExists();

    const config = site.config as Record<string, unknown> | null;
    const customization = config?.customization;

    if (!customization) {
      return new NextResponse("/* No customization configured */", {
        headers: { "Content-Type": "text/css" },
      });
    }

    // Validate and generate CSS
    const validatedConfig = customizationConfigSchema.parse(customization);
    const css = generateCSSVariables(validatedConfig);

    return new NextResponse(css, {
      headers: {
        "Content-Type": "text/css",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error generating CSS:", error);
    return new NextResponse("/* Error generating CSS */", {
      headers: { "Content-Type": "text/css" },
    });
  }
}
