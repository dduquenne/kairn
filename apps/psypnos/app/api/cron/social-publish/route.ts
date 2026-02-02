// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Cron job pour la publication automatique des posts sur les réseaux sociaux
 *
 * Ce job est exécuté toutes les 5 minutes par QStash (Upstash)
 * Il publie les posts programmés dont l'heure est arrivée
 *
 * Sécurité : Vérifie la signature QStash ou CRON_SECRET (dev local)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getScheduledPosts,
  getSocialAccountById,
  updateSocialPost,
  markPostAsPublished,
  markPostAsFailed,
  incrementRetryCount,
  markAccountAsUsed,
} from '@/lib/social/store';
import { getSocialClient, DEFAULT_RETRY_CONFIG } from '@/lib/social/clients';
import { verifyCronAuth } from '@kairn/core/scheduler';
import type { SocialPost } from '@/lib/social/types';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact@psypnos.fr';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// ===========================================
// Publication avec retry
// ===========================================

async function publishPostWithRetry(post: SocialPost): Promise<{
  success: boolean;
  externalPostId?: string;
  platformUrl?: string;
  error?: string;
}> {
  // Récupérer le compte
  const account = await getSocialAccountById(post.accountId);
  if (!account) {
    return {
      success: false,
      error: 'Compte social non trouvé',
    };
  }

  if (!account.isActive) {
    return {
      success: false,
      error: 'Le compte social est désactivé',
    };
  }

  // Vérifier le nombre de retries
  if (post.retryCount >= DEFAULT_RETRY_CONFIG.maxRetries) {
    return {
      success: false,
      error: `Nombre maximum de tentatives atteint (${DEFAULT_RETRY_CONFIG.maxRetries})`,
    };
  }

  try {
    // Marquer comme en cours de publication
    await updateSocialPost(post.id, { status: 'PUBLISHING' });

    // Obtenir le client et publier
    const client = getSocialClient(post.platform);
    const result = await client.publish({
      content: post.content,
      mediaUrls: post.mediaUrls,
      hashtags: post.hashtags,
      linkUrl: post.linkUrl,
      accessToken: account.accessToken,
      accountMetadata: account.metadata,
    });

    if (result.success && result.externalPostId) {
      // Succès - sauvegarder aussi le platformUrl (lien vers le post publié)
      await markPostAsPublished(post.id, result.externalPostId, result.platformUrl);
      await markAccountAsUsed(account.id);

      return {
        success: true,
        externalPostId: result.externalPostId,
        platformUrl: result.platformUrl,
      };
    } else {
      // Échec - incrémenter le compteur de retry
      await incrementRetryCount(post.id);

      // Vérifier si on peut encore réessayer
      const updatedRetryCount = post.retryCount + 1;
      if (updatedRetryCount >= DEFAULT_RETRY_CONFIG.maxRetries) {
        // Plus de retries possibles - marquer comme échoué
        await markPostAsFailed(post.id, result.error || 'Erreur inconnue');
      } else {
        // Remettre en scheduled pour le prochain cycle
        await updateSocialPost(post.id, { status: 'SCHEDULED' });
      }

      return {
        success: false,
        error: result.error || 'Erreur inconnue',
      };
    }
  } catch (error) {
    // Erreur inattendue
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

    // Vérifier si c'est une erreur retryable
    const isRetryable = DEFAULT_RETRY_CONFIG.retryableErrors.some(
      (retryableError) => errorMessage.includes(retryableError)
    );

    await incrementRetryCount(post.id);

    const updatedRetryCount = post.retryCount + 1;
    if (!isRetryable || updatedRetryCount >= DEFAULT_RETRY_CONFIG.maxRetries) {
      await markPostAsFailed(post.id, errorMessage);
    } else {
      // Remettre en scheduled pour le prochain cycle avec délai exponentiel
      await updateSocialPost(post.id, { status: 'SCHEDULED' });
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ===========================================
// Notification par email
// ===========================================

async function sendFailureNotification(
  post: SocialPost,
  error: string
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('[Cron Social Publish] RESEND_API_KEY not configured - skipping email notification');
    return;
  }

  const html = `
    <h2>Échec de publication automatique</h2>
    <p>La publication programmée suivante a échoué après ${post.retryCount + 1} tentative(s) :</p>

    <h3>Détails du post</h3>
    <ul>
      <li><strong>Plateforme :</strong> ${post.platform}</li>
      <li><strong>ID :</strong> ${post.id}</li>
      <li><strong>Article lié :</strong> ${post.blogSlug || 'Aucun'}</li>
      <li><strong>Programmé pour :</strong> ${post.scheduledAt ? new Date(post.scheduledAt).toLocaleString('fr-FR') : 'N/A'}</li>
    </ul>

    <h3>Contenu</h3>
    <blockquote style="background: #f5f5f5; padding: 10px; border-left: 3px solid #333;">
      ${post.content.substring(0, 300)}${post.content.length > 300 ? '...' : ''}
    </blockquote>

    <h3>Erreur</h3>
    <pre style="background: #ffebee; padding: 10px; color: #c62828;">
${error}
    </pre>

    <p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/social/posts/${post.id}"
         style="display: inline-block; padding: 10px 20px; background: #1976d2; color: white; text-decoration: none; border-radius: 4px;">
        Voir le post dans l'admin
      </a>
    </p>

    <hr>
    <p style="color: #666; font-size: 12px;">
      Ce message a été envoyé automatiquement par le système de publication Psypnos.
    </p>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.REPORT_EMAIL_FROM || 'Psypnos <notifications@psypnos.fr>',
        to: ADMIN_EMAIL,
        subject: `[Psypnos] Échec de publication sur ${post.platform}`,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Cron Social Publish] Email sending failed:', errorText);
    } else {
      console.log(`[Cron Social Publish] Failure notification sent for post ${post.id}`);
    }
  } catch (emailError) {
    console.error('[Cron Social Publish] Failed to send notification email:', emailError);
  }
}

// ===========================================
// GET - Exécution du cron
// ===========================================

export async function GET(request: NextRequest) {
  // Vérifier l'authentification (QStash signature ou CRON_SECRET)
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    console.warn('[Cron Social Publish] Unauthorized access attempt:', authResult.error);
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: {
    postId: string;
    platform: string;
    success: boolean;
    externalPostId?: string;
    error?: string;
  }[] = [];

  try {
    // Récupérer les posts programmés dont l'heure est passée
    // + les posts bloqués en PUBLISHING depuis plus de 10 minutes
    const now = new Date();
    const posts = await getScheduledPosts(now);

    // Compter les posts par statut pour le logging
    const scheduledPosts = posts.filter((p) => p.status === 'SCHEDULED');
    const stuckPosts = posts.filter((p) => p.status === 'PUBLISHING');

    console.log(
      `[Cron Social Publish] Found ${posts.length} posts to publish ` +
        `(${scheduledPosts.length} scheduled, ${stuckPosts.length} stuck in PUBLISHING)`
    );

    if (stuckPosts.length > 0) {
      console.warn(
        `[Cron Social Publish] Recovering ${stuckPosts.length} stuck posts: ` +
          stuckPosts.map((p) => `${p.id} (${p.platform})`).join(', ')
      );
    }

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun post à publier',
        processed: 0,
        duration: Date.now() - startTime,
      });
    }

    // Publier chaque post
    for (const post of posts) {
      console.log(`[Cron Social Publish] Publishing post ${post.id} to ${post.platform}`);

      const result = await publishPostWithRetry(post);

      results.push({
        postId: post.id,
        platform: post.platform,
        success: result.success,
        externalPostId: result.externalPostId,
        error: result.error,
      });

      // Envoyer une notification si échec définitif
      if (!result.success && post.retryCount + 1 >= DEFAULT_RETRY_CONFIG.maxRetries) {
        await sendFailureNotification(post, result.error || 'Erreur inconnue');
      }

      // Petit délai entre les publications pour éviter le rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Résumé
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(
      `[Cron Social Publish] Completed: ${successCount} success, ${failCount} failed`
    );

    return NextResponse.json({
      success: true,
      message: `Publication terminée: ${successCount} réussi(s), ${failCount} échoué(s)`,
      processed: posts.length,
      scheduled: scheduledPosts.length,
      recovered: stuckPosts.length,
      results,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[Cron Social Publish] Critical error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur critique',
        results,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Configuration pour Vercel Cron
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 secondes max pour le cron
