// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  getAllBlogPosts,
  createBlogPost,
  blogPostPayloadSchema,
  validateSlug,
} from "../prisma-store";
import { withAdminAuth } from "../../auth/middleware";

// GET - Retrieve all posts or filter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeUnpublished = searchParams.get("includeUnpublished") === "true";
    const category = searchParams.get("category") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const featuredParam = searchParams.get("featured");
    const featured = featuredParam === "true" ? true : featuredParam === "false" ? false : undefined;
    const featuredFirst = searchParams.get("featuredFirst") === "true";

    const posts = await getAllBlogPosts({
      includeUnpublished,
      category,
      limit: limit && !isNaN(limit) ? limit : undefined,
      featured,
      featuredFirst,
    });

    // Cache strategy based on context
    // If includeUnpublished=true (admin), no cache to see changes immediately
    // Otherwise cache public posts for 5 minutes
    const cacheControl = includeUnpublished
      ? "private, no-cache, no-store, must-revalidate"
      : "public, max-age=300, stale-while-revalidate=3600";

    return NextResponse.json(posts, {
      headers: {
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des articles" },
      { status: 500 }
    );
  }
}

// POST - Create a new post (protected by authentication)
export async function POST(request: NextRequest) {
  // Verify authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();

    // Validate slug format first
    if (body.slug) {
      const slugValidation = validateSlug(body.slug);
      if (!slugValidation.valid) {
        return NextResponse.json(
          { error: slugValidation.error },
          { status: 400 }
        );
      }
    }

    // Validate payload with Zod
    const parsed = blogPostPayloadSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue?.message ?? "Validation error" }, { status: 400 });
    }

    const post = await createBlogPost(parsed.data);

    // Invalidate cache after creation - include homepage for featured articles
    revalidatePath("/api/blog/posts");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/");

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la création";
    console.error("Error creating post:", error);

    // Check for duplicate slug error
    if (message.includes("existe déjà")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
