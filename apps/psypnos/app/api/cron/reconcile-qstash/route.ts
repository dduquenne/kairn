/**
 * Cron de réconciliation QStash pour les posts sociaux planifiés
 *
 * Détecte les posts en statut SCHEDULED dont le scheduledAt est dans le futur
 * et renvoie un trigger QStash one-shot pour chacun d'eux.
 *
 * Cas couverts :
 * - Le trigger QStash initial a échoué silencieusement lors de la création du post
 * - Le message QStash a été perdu côté Upstash (rare, mais possible)
 * - Le post a été re-programmé (PUT) sans que le trigger soit renvoyé
 *
 * Sécurité :
 * - Le PostScheduler utilise claimPostForPublishing (verrou atomique)
 *   donc même si deux triggers QStash arrivent, le post ne sera publié qu'une fois.
 * - Le deduplicationId `social-post-{id}` évite les doublons dans la fenêtre
 *   de déduplication QStash (~10 min).
 */

import { publishDelayed, verifyCronAuth } from '@kairn/core/scheduler';
import { NextRequest, NextResponse } from 'next/server';

import { getFutureScheduledPosts } from '@/lib/social/store';

const LOG_PREFIX = '[Cron Reconcile QStash]';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Authentification
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    console.warn(`${LOG_PREFIX} Accès non autorisé: ${authResult.error}`);
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      console.error(`${LOG_PREFIX} NEXT_PUBLIC_SITE_URL non défini`);
      return NextResponse.json({ error: 'NEXT_PUBLIC_SITE_URL non configuré' }, { status: 500 });
    }

    // Récupérer tous les posts SCHEDULED avec scheduledAt dans le futur
    const posts = await getFutureScheduledPosts();

    if (posts.length === 0) {
      console.log(`${LOG_PREFIX} Aucun post planifié dans le futur`);
      return NextResponse.json({
        success: true,
        message: 'Aucun post planifié dans le futur',
        total: 0,
        triggered: 0,
        failed: 0,
        duration: Date.now() - startTime,
      });
    }

    console.log(`${LOG_PREFIX} ${posts.length} post(s) planifié(s) à réconcilier`);

    let triggered = 0;
    let failed = 0;
    const results: Array<{
      postId: string;
      platform: string;
      scheduledAt: string;
      status: 'triggered' | 'failed';
      messageId?: string;
      error?: string;
    }> = [];

    for (const post of posts) {
      try {
        const result = await publishDelayed({
          destination: `${baseUrl}/api/cron/social-publish`,
          notBefore: post.scheduledAt!,
          body: { triggeredBy: 'reconcile-qstash', postId: post.id },
          retries: 3,
          deduplicationId: `social-post-${post.id}`,
        });

        triggered++;
        results.push({
          postId: post.id,
          platform: post.platform,
          scheduledAt: post.scheduledAt!.toISOString(),
          status: 'triggered',
          messageId: result.messageId,
        });

        console.log(
          `${LOG_PREFIX} ✓ Trigger envoyé pour post ${post.id} (${post.platform}) → ${post.scheduledAt!.toISOString()} (messageId: ${result.messageId})`
        );
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          postId: post.id,
          platform: post.platform,
          scheduledAt: post.scheduledAt!.toISOString(),
          status: 'failed',
          error: errorMessage,
        });

        console.error(
          `${LOG_PREFIX} ✗ Échec du trigger pour post ${post.id} (${post.platform}): ${errorMessage}`
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `${LOG_PREFIX} Terminé en ${duration}ms : ${triggered} trigger(s), ${failed} échec(s)`
    );

    return NextResponse.json({
      success: true,
      message: `Réconciliation terminée : ${triggered} trigger(s) envoyé(s), ${failed} échec(s)`,
      total: posts.length,
      triggered,
      failed,
      results,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`${LOG_PREFIX} Erreur critique après ${duration}ms:`, error);

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

// QStash envoie des POST par défaut
export { GET as POST };

export const runtime = 'nodejs';
export const maxDuration = 30;
