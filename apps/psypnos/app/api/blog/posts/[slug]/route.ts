import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '../../../auth/middleware';
import {
  getBlogPostBySlug,
  updateBlogPost,
  deleteBlogPost,
  validateSlug,
} from '../../prisma-store';

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/blog/posts/[slug] - Récupérer un article par slug
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true';

    const post = await getBlogPostBySlug(slug, includeUnpublished);

    if (!post) {
      return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
    }

    const cacheHeaders = includeUnpublished
      ? { 'Cache-Control': 'private, no-store' }
      : { 'Cache-Control': 'public, s-maxage=3600, max-age=3600, stale-while-revalidate=86400' };

    return NextResponse.json(post, { headers: cacheHeaders });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'article" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/blog/posts/[slug] - Mettre à jour un article (auth admin requise)
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { slug } = await params;
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return NextResponse.json({ error: slugValidation.error }, { status: 400 });
    }

    const body = await request.json();

    if (body.slug && body.slug !== slug) {
      const newSlugValidation = validateSlug(body.slug);
      if (!newSlugValidation.valid) {
        return NextResponse.json({ error: newSlugValidation.error }, { status: 400 });
      }
    }

    const actualOldSlug = body.oldSlug || slug;
    const updated = await updateBlogPost(actualOldSlug, body);

    if (!updated) {
      return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
    }

    revalidatePath('/api/blog/posts');
    revalidatePath('/blog');
    revalidatePath(`/blog/${actualOldSlug}`);
    revalidatePath('/');
    if (body.slug && body.slug !== actualOldSlug) {
      revalidatePath(`/blog/${body.slug}`);
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
    // eslint-disable-next-line no-console
    console.error('Error updating post:', error);

    if (message.includes('existe déjà')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/blog/posts/[slug] - Supprimer un article (auth admin requise)
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { slug } = await params;
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return NextResponse.json({ error: slugValidation.error }, { status: 400 });
    }

    const deleted = await deleteBlogPost(slug);

    if (!deleted) {
      return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
    }

    revalidatePath('/api/blog/posts');
    revalidatePath('/blog');
    revalidatePath(`/blog/${slug}`);
    revalidatePath('/admin/blog');
    revalidatePath('/');

    return NextResponse.json(
      { message: 'Article supprimé avec succès', slug },
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'article" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/blog/posts/[slug] - Mise à jour partielle (published/featured)
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { slug } = await params;
    const body = await request.json();

    const allowedFields: Record<string, boolean> = {};
    if ('published' in body) {
      allowedFields.published = Boolean(body.published);
    }
    if ('featured' in body) {
      allowedFields.featured = Boolean(body.featured);
    }

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'Aucun champ valide à mettre à jour' }, { status: 400 });
    }

    const updated = await updateBlogPost(slug, allowedFields);

    if (!updated) {
      return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
    }

    revalidatePath('/api/blog/posts');
    revalidatePath('/blog');
    revalidatePath(`/blog/${slug}`);
    revalidatePath('/');

    return NextResponse.json({
      message: 'Article mis à jour avec succès',
      slug,
      published: updated.published,
      featured: updated.featured,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error patching post:', error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'article" },
      { status: 500 }
    );
  }
}
