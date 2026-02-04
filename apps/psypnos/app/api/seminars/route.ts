import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { withAdminAuth } from "../auth/middleware";

import {
  getAllSeminars,
  getUpcomingSeminars,
  createSeminar,
  seminarPayloadSchema,
} from "./prisma-store";

/**
 * Get all seminars, optionally filtered by upcoming and limited
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const upcomingParam = searchParams.get("upcoming");

  try {
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const validLimit =
      typeof limit === "number" && Number.isFinite(limit) && limit > 0
        ? limit
        : undefined;

    let seminars;

    if (upcomingParam === "true") {
      // Get upcoming seminars
      const upcomingSeminars = await getUpcomingSeminars(validLimit);

      // If no upcoming seminars, fall back to all seminars
      if (upcomingSeminars.length === 0) {
        const allSeminars = await getAllSeminars();
        seminars = validLimit ? allSeminars.slice(0, validLimit) : allSeminars;
      } else {
        seminars = upcomingSeminars;
      }
    } else {
      // Get all seminars
      const allSeminars = await getAllSeminars();
      seminars = validLimit ? allSeminars.slice(0, validLimit) : allSeminars;
    }

    // Cache seminars for 1 hour
    return NextResponse.json(seminars, {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error fetching seminars:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des séminaires" },
      { status: 500 }
    );
  }
}

/**
 * Create a new seminar
 */
export async function POST(request: Request) {
  // Verify authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const payload = await request.json();
    const parsed = seminarPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue?.message ?? "Validation error" }, { status: 400 });
    }

    const seminar = await createSeminar(parsed.data);

    // Invalidate cache after creation
    revalidatePath("/api/seminars");

    return NextResponse.json(seminar, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Données invalides";
    console.error("Error creating seminar:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
