import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  getSeminarById,
  updateSeminar,
  deleteSeminar,
  seminarPayloadSchema,
} from "../prisma-store";
import { withAdminAuth } from "../../auth/middleware";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Get a seminar by ID
 */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const seminar = await getSeminarById(id);

    if (!seminar) {
      return NextResponse.json(
        { error: "Séminaire introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(seminar);
  } catch (error) {
    console.error("Error fetching seminar:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du séminaire" },
      { status: 500 }
    );
  }
}

/**
 * Update a seminar by ID
 */
export async function PUT(request: Request, { params }: RouteContext) {
  // Verify authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const payload = await request.json();
    const parsed = seminarPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue?.message ?? "Validation error" }, { status: 400 });
    }

    const updated = await updateSeminar(id, parsed.data);

    if (!updated) {
      return NextResponse.json(
        { error: "Séminaire introuvable" },
        { status: 404 }
      );
    }

    // Invalidate cache after update
    revalidatePath("/api/seminars");
    revalidatePath(`/api/seminars/${id}`);

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Données invalides";
    console.error("Error updating seminar:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * Delete a seminar by ID
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  // Verify authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const deleted = await deleteSeminar(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Séminaire introuvable" },
        { status: 404 }
      );
    }

    // Invalidate cache after deletion
    revalidatePath("/api/seminars");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting seminar:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du séminaire" },
      { status: 500 }
    );
  }
}
