// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  testimonialPayloadSchema,
} from "../prisma-store";
import { withAdminAuth } from "../../auth/middleware";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const testimonial = await getTestimonialById(params.id);

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

export async function PUT(request: Request, { params }: RouteContext) {
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

    const updated = await updateTestimonial(params.id, parsed.data);

    if (!updated) {
      return NextResponse.json(
        { error: "Témoignage introuvable" },
        { status: 404 }
      );
    }

    // Invalidate cache after update
    revalidatePath("/api/testimonials");
    revalidatePath(`/api/testimonials/${params.id}`);

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Données invalides";
    console.error("Error updating testimonial:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  // Verify authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const deleted = await deleteTestimonial(params.id);

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
