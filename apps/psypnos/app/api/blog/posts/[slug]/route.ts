/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { withAdminAuth } from "../../../auth/middleware";
import {
  getBlogPostBySlug,
  updateBlogPost,
  deleteBlogPost,
  validateSlug,
} from "../../prisma-store";

// GET - Retrieve a specific post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Check for admin access (to see unpublished posts)
    const searchParams = request.nextUrl.searchParams;
    const includeUnpublished = searchParams.get("includeUnpublished") === "true";

    const post = await getBlogPostBySlug(slug, includeUnpublished);

    if (!post) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }

    // Cache the post for 1 hour
    return NextResponse.json(post, {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'article" },
      { status: 500 }
    );
  }
}

// PUT - Update a post (protected by authentication)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Verify authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { slug } = await params;

    // Validate slug
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return NextResponse.json(
        { error: slugValidation.error },
        { status: 400 }
      );
    }

    const body = await request.json();

    // If changing slug, validate new slug
    if (body.slug && body.slug !== slug) {
      const newSlugValidation = validateSlug(body.slug);
      if (!newSlugValidation.valid) {
        return NextResponse.json(
          { error: newSlugValidation.error },
          { status: 400 }
        );
      }
    }

    // Use oldSlug if provided (for slug change)
    const actualOldSlug = body.oldSlug || slug;

    const updated = await updateBlogPost(actualOldSlug, body);

    if (!updated) {
      return NextResponse.json(
        { error: "Article introuvable" },
        { status: 404 }
      );
    }

    // Invalidate cache - include homepage for featured articles
    revalidatePath("/api/blog/posts");
    revalidatePath("/blog");
    revalidatePath(`/blog/${actualOldSlug}`);
    revalidatePath("/");
    if (body.slug && body.slug !== actualOldSlug) {
      revalidatePath(`/blog/${body.slug}`);
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la mise à jour";
    console.error("Error updating post:", error);

    // Check for duplicate slug error
    if (message.includes("existe déjà")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Delete a post (protected by authentication)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Verify authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { slug } = await params;

    // Validate slug
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return NextResponse.json(
        { error: slugValidation.error },
        { status: 400 }
      );
    }

    const deleted = await deleteBlogPost(slug);

    if (!deleted) {
      return NextResponse.json(
        { error: "Article introuvable" },
        { status: 404 }
      );
    }

    // Invalidate cache - include homepage for featured articles
    revalidatePath("/api/blog/posts");
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    revalidatePath("/admin/blog");
    revalidatePath("/");

    return NextResponse.json(
      {
        message: "Article supprimé avec succès",
        slug: slug,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'article" },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (e.g., published/featured status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Verify authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { slug } = await params;
    const body = await request.json();

    // Only allow specific fields for PATCH
    const allowedFields: Record<string, boolean> = {};
    if ("published" in body) {
      allowedFields.published = Boolean(body.published);
    }
    if ("featured" in body) {
      allowedFields.featured = Boolean(body.featured);
    }

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ valide à mettre à jour" },
        { status: 400 }
      );
    }

    const updated = await updateBlogPost(slug, allowedFields);

    if (!updated) {
      return NextResponse.json(
        { error: "Article introuvable" },
        { status: 404 }
      );
    }

    // Invalidate cache - include homepage for featured changes
    revalidatePath("/api/blog/posts");
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    revalidatePath("/");

    return NextResponse.json({
      message: "Article mis à jour avec succès",
      slug: slug,
      published: updated.published,
      featured: updated.featured,
    });
  } catch (error) {
    console.error("Error patching post:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'article" },
      { status: 500 }
    );
  }
}
