import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { withAdminAuth } from "../../auth/middleware";
import {
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  testimonialPayloadSchema,
} from "../prisma-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Get a testimonial by ID
 */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const testimonial = await getTestimonialById(id);

    if (!testimonial) {
      return NextResponse.json(
        { error: "Témoignage introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(testimonial);
  } catch (error) {
    console.error("Error fetching testimonial:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du témoignage" },
      { status: 500 }
    );
  }
}

/**
 * Update a testimonial by ID
 */
export async function PUT(request: Request, { params }: RouteContext) {
  // Verify authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const payload = await request.json();
    const parsed = testimonialPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue?.message ?? "Validation error" }, { status: 400 });
    }

    const updated = await updateTestimonial(id, parsed.data);

    if (!updated) {
      return NextResponse.json(
        { error: "Témoignage introuvable" },
        { status: 404 }
      );
    }

    // Invalidate cache after update
    revalidatePath("/api/testimonials");
    revalidatePath(`/api/testimonials/${id}`);

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Données invalides";
    console.error("Error updating testimonial:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * Delete a testimonial by ID
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  // Verify authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const deleted = await deleteTestimonial(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Témoignage introuvable" },
        { status: 404 }
      );
    }

    // Invalidate cache after deletion
    revalidatePath("/api/testimonials");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du témoignage" },
      { status: 500 }
    );
  }
}
