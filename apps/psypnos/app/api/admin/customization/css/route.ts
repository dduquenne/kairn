import { NextResponse } from "next/server";
// eslint-disable-next-line import/no-unresolved
import { prisma } from "@kairn/db";
import { generateCSSVariables, customizationConfigSchema } from "@kairn/config";

export const dynamic = "force-dynamic";

const SITE_SLUG = "psypnos";

/**
 * GET - Generate CSS variables from customization config
 * This can be used to dynamically inject styles into the page
 */
export async function GET() {
  try {
    const site = await prisma.site.findUnique({
      where: { slug: SITE_SLUG },
      select: { config: true },
    });

    if (!site) {
      return new NextResponse("/* Site not found */", {
        headers: { "Content-Type": "text/css" },
      });
    }

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
