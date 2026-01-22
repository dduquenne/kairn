// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  getAllTestimonials,
  createTestimonial,
  testimonialPayloadSchema,
} from "./prisma-store";
import { withAdminAuth } from "../auth/middleware";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");

  try {
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const validLimit =
      typeof limit === "number" && Number.isFinite(limit) && limit > 0
        ? limit
        : undefined;

    const testimonials = await getAllTestimonials(validLimit);

    // Cache testimonials for 1 hour
    return NextResponse.json(testimonials, {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des témoignages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Verify authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const payload = await request.json();
    const parsed = testimonialPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue?.message ?? "Validation error" }, { status: 400 });
    }

    const testimonial = await createTestimonial(parsed.data);

    // Invalidate cache after creation
    revalidatePath("/api/testimonials");

    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Données invalides";
    console.error("Error creating testimonial:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
