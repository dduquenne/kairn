/**
 * Cron job pour la publication automatique des posts sur les réseaux sociaux
 *
 * Déclenchement principal : Vercel CRON toutes les minutes (vercel.json)
 * Déclenchement secondaire : QStash one-shot lors de la création d'un post
 *
 * Sécurité : Vérifie CRON_SECRET (Vercel CRON) ou signature QStash
 *
 * Délègue la logique de publication au PostScheduler mutualisé (@kairn/social)
 * via PrismaPostStorage qui gère :
 * - Le mapping des statuts Prisma ↔ PostScheduler
 * - Le verrouillage atomique (claimPostForPublishing)
 * - La récupération des posts stuck (PUBLISHING > 10 min)
 */

import { verifyCronAuth } from '@kairn/core/scheduler';
import { PostScheduler } from '@kairn/social/posting';
import { NextRequest, NextResponse } from 'next/server';

import { PrismaPostStorage } from '@/lib/social/prisma-post-storage';
import { getSocialPostById } from '@/lib/social/store';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dduquenne@appreciezvotrevie.fr';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// ===========================================
// Notification par email
// ===========================================

/**
 * Envoie un email de notification d'échec définitif de publication.
 *
 * @param postId - L'ID du post qui a échoué
 * @param error - Le message d'erreur
 */
async function sendFailureNotification(postId: string, error: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn(
      '[Cron Social Publish] RESEND_API_KEY not configured - skipping email notification'
    );
    return;
  }

  const post = await getSocialPostById(postId);
  if (!post) {
    console.warn(`[Cron Social Publish] Post ${postId} introuvable pour notification`);
    return;
  }

  const html = `
    <h2>Échec de publication automatique</h2>
    <p>La publication programmée suivante a échoué après ${post.retryCount} tentative(s) :</p>

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
      Ce message a été envoyé automatiquement par le système de publication Appréciez Votre Vie.
    </p>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.REPORT_EMAIL_FROM || 'Appréciez Votre Vie <notifications@appreciezvotrevie.fr>',
        to: ADMIN_EMAIL,
        subject: `[Appréciez Votre Vie] Échec de publication sur ${post.platform}`,
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
  const invocationId = Math.random().toString(36).substring(2, 10);
  const startTime = Date.now();

  console.log(
    `[Cron Social Publish][${invocationId}] ▶ Invocation démarrée à ${new Date().toISOString()}`
  );

  // Vérifier l'authentification (CRON_SECRET Vercel ou signature QStash)
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    console.warn(
      `[Cron Social Publish][${invocationId}] ✗ Accès non autorisé (source: ${authResult.source}): ${authResult.error}`
    );
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  console.log(`[Cron Social Publish][${invocationId}] Auth OK via ${authResult.source}`);

  try {
    // Créer le storage Prisma et le scheduler
    const storage = new PrismaPostStorage();
    const scheduler = new PostScheduler(storage, {
      maxRetries: 3,
      onPublished: (postId, result) => {
        console.log(
          `[Cron Social Publish][${invocationId}] ✓ Post ${postId} publié → ${result.externalPostId}`
        );
      },
      onFailed: async (postId, error) => {
        console.error(
          `[Cron Social Publish][${invocationId}] ✗ Post ${postId} échec définitif: ${error}`
        );
        await sendFailureNotification(postId, error);
      },
    });

    // Déléguer au PostScheduler mutualisé
    const batchResult = await scheduler.processDuePosts();

    const duration = Date.now() - startTime;

    if (batchResult.total === 0) {
      console.log(`[Cron Social Publish][${invocationId}] ◀ Aucun post à publier (${duration}ms)`);
      return NextResponse.json({
        success: true,
        message: 'Aucun post à publier',
        processed: 0,
        duration,
      });
    }

    console.log(
      `[Cron Social Publish][${invocationId}] ◀ Terminé en ${duration}ms: ` +
        `${batchResult.published} publié(s), ${batchResult.failed} échoué(s), ${batchResult.skipped} ignoré(s)`
    );

    return NextResponse.json({
      success: true,
      message: `Publication terminée: ${batchResult.published} réussi(s), ${batchResult.failed} échoué(s), ${batchResult.skipped} ignoré(s)`,
      processed: batchResult.total,
      published: batchResult.published,
      failed: batchResult.failed,
      skipped: batchResult.skipped,
      results: batchResult.results,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[Cron Social Publish][${invocationId}] ✗ Erreur critique après ${duration}ms:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur critique',
        duration,
      },
      { status: 500 }
    );
  }
}

// Accepter aussi POST car QStash envoie POST par défaut
export { GET as POST };

// Configuration pour Vercel Cron
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 secondes max pour le cron
