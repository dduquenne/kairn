/**
 * API pour les opérations sur un post spécifique
 *
 * GET /api/social/posts/[id] - Récupérer un post
 * PUT /api/social/posts/[id] - Mettre à jour un post
 * DELETE /api/social/posts/[id] - Supprimer un post
 */

import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { getSocialPostById, updateSocialPost, deleteSocialPost } from '@/lib/social/store';
import type { PostStatus, UpdateSocialPostInput } from '@/lib/social/types';

// ===========================================
// GET - Récupérer un post
// ===========================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const post = await getSocialPostById(id);

    if (!post) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('[Social Posts API] Get error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}

// ===========================================
// PUT - Mettre à jour un post
// ===========================================

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Vérifier que le post existe
    const existingPost = await getSocialPostById(id);
    if (!existingPost) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    // Ne pas permettre la modification d'un post déjà publié
    if (existingPost.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Impossible de modifier un post déjà publié' },
        { status: 400 }
      );
    }

    // Construire les données de mise à jour
    const input: UpdateSocialPostInput = {};

    if (body.content !== undefined) input.content = body.content;
    if (body.mediaUrls !== undefined) input.mediaUrls = body.mediaUrls;
    if (body.hashtags !== undefined) input.hashtags = body.hashtags;
    if (body.linkUrl !== undefined) input.linkUrl = body.linkUrl;
    if (body.scheduledAt !== undefined) {
      input.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    }
    if (body.status !== undefined) {
      const validStatuses: PostStatus[] = ['DRAFT', 'SCHEDULED', 'CANCELLED'];
      if (validStatuses.includes(body.status)) {
        input.status = body.status;
      }
    }
    if (body.metadata !== undefined) input.metadata = body.metadata;

    const post = await updateSocialPost(id, input);

    console.log(`[Social Posts API] Updated post ${id}`);

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('[Social Posts API] Update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}

// ===========================================
// DELETE - Supprimer un post
// ===========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;

    // Vérifier que le post existe
    const existingPost = await getSocialPostById(id);
    if (!existingPost) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    // Ne pas permettre la suppression d'un post en cours de publication
    if (existingPost.status === 'PUBLISHING') {
      return NextResponse.json(
        { error: 'Impossible de supprimer un post en cours de publication' },
        { status: 400 }
      );
    }

    await deleteSocialPost(id);

    console.log(`[Social Posts API] Deleted post ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Social Posts API] Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
