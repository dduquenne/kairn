// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * API pour publier immédiatement un post
 *
 * POST /api/social/posts/[id]/publish - Publier maintenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/api/auth/middleware';
import {
  getSocialPostById,
  getSocialAccountById,
  updateSocialPost,
  markPostAsPublished,
  markPostAsFailed,
  markAccountAsUsed,
} from '@/lib/social/store';
import { getSocialClient } from '@/lib/social/clients';

// ===========================================
// POST - Publier immédiatement
// ===========================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;

    // Récupérer le post
    const post = await getSocialPostById(id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le post peut être publié
    if (post.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Ce post est déjà publié' },
        { status: 400 }
      );
    }

    if (post.status === 'PUBLISHING') {
      return NextResponse.json(
        { error: 'Ce post est en cours de publication' },
        { status: 400 }
      );
    }

    // Récupérer le compte avec les tokens
    const account = await getSocialAccountById(post.accountId);
    if (!account) {
      return NextResponse.json(
        { error: 'Compte social non trouvé' },
        { status: 404 }
      );
    }

    if (!account.isActive) {
      return NextResponse.json(
        { error: 'Le compte social est désactivé' },
        { status: 400 }
      );
    }

    // Marquer comme en cours de publication
    await updateSocialPost(id, { status: 'PUBLISHING' });

    try {
      // Obtenir le client de publication
      const client = getSocialClient(post.platform);

      // Publier
      const result = await client.publish({
        content: post.content,
        mediaUrls: post.mediaUrls,
        hashtags: post.hashtags,
        linkUrl: post.linkUrl,
        accessToken: account.accessToken,
        accountMetadata: account.metadata,
      });

      if (result.success && result.externalPostId) {
        // Succès
        await markPostAsPublished(id, result.externalPostId, result.platformUrl);
        await markAccountAsUsed(account.id);

        console.log(`[Social Publish] Published post ${id} to ${post.platform} -> ${result.externalPostId} (${result.platformUrl || 'no url'})`);

        return NextResponse.json({
          success: true,
          externalPostId: result.externalPostId,
          platformUrl: result.platformUrl,
        });
      } else {
        // Échec
        await markPostAsFailed(id, result.error || 'Erreur inconnue');

        console.error(`[Social Publish] Failed to publish post ${id}: ${result.error}`);

        return NextResponse.json(
          { error: result.error || 'Échec de la publication' },
          { status: 500 }
        );
      }
    } catch (publishError) {
      // Erreur lors de la publication
      const errorMessage = publishError instanceof Error
        ? publishError.message
        : 'Erreur inconnue lors de la publication';

      await markPostAsFailed(id, errorMessage);

      console.error(`[Social Publish] Error publishing post ${id}:`, publishError);

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Social Publish API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
