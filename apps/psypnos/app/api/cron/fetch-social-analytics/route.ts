/**
 * Cron Fetch Social Analytics API Route
 *
 * Récupère les analytics des posts sociaux publiés depuis les APIs
 * des différentes plateformes (Facebook, LinkedIn, Instagram, etc.)
 *
 * Fonctionnalités:
 * - Rafraîchit les analytics des posts publiés récemment (48h par défaut)
 * - Rafraîchit également les posts "populaires" plus anciens (7 jours)
 * - Gère le rate limiting avec des délais entre les appels
 * - Enregistre les métriques: impressions, reach, engagements, likes, etc.
 *
 * Fréquence recommandée: toutes les 4 heures
 *
 * Security: QStash signature or CRON_SECRET
 */

import { verifyCronAuth } from '@kairn/core/scheduler';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { refreshPostAnalytics } from '@/lib/social/analytics';

// Configuration
const RECENT_HOURS = 48; // Posts des dernières 48h
const POPULAR_DAYS = 7; // Posts populaires des 7 derniers jours
const DELAY_MS = 500; // Délai entre les appels API

interface RefreshResult {
  postId: string;
  platform: string;
  success: boolean;
  impressions?: number;
  engagements?: number;
  error?: string;
}

export async function GET(request: NextRequest) {
  // Verify authentication (QStash signature or CRON_SECRET)
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: RefreshResult[] = [];
  let refreshed = 0;
  let failed = 0;

  try {
    // 1. Récupérer les posts publiés récemment (dernières 48h)
    const recentCutoff = new Date(Date.now() - RECENT_HOURS * 60 * 60 * 1000);

    const recentPosts = await prisma.socialPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: recentCutoff,
        },
        externalPostId: {
          not: null,
        },
      },
      select: {
        id: true,
        platform: true,
        externalPostId: true,
        publishedAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    console.log(`[Cron:fetch-social-analytics] ${recentPosts.length} posts récents à rafraîchir`);

    // 2. Récupérer les posts plus anciens mais populaires (avec engagement > 0)
    const popularCutoff = new Date(Date.now() - POPULAR_DAYS * 24 * 60 * 60 * 1000);

    const popularPosts = await prisma.socialPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: popularCutoff,
          lt: recentCutoff,
        },
        externalPostId: {
          not: null,
        },
        analytics: {
          engagements: {
            gt: 0,
          },
        },
      },
      select: {
        id: true,
        platform: true,
        externalPostId: true,
        publishedAt: true,
      },
      orderBy: {
        analytics: {
          engagements: 'desc',
        },
      },
      take: 20, // Limiter aux 20 plus engageants
    });

    console.log(
      `[Cron:fetch-social-analytics] ${popularPosts.length} posts populaires à rafraîchir`
    );

    // 3. Combiner et dédupliquer
    const allPosts = [...recentPosts, ...popularPosts];
    const uniquePosts = Array.from(new Map(allPosts.map(p => [p.id, p])).values());

    if (uniquePosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun post à rafraîchir',
        processed: 0,
        results: {
          refreshed: 0,
          failed: 0,
          recentPosts: 0,
          popularPosts: 0,
        },
      });
    }

    // 4. Rafraîchir chaque post
    for (const post of uniquePosts) {
      try {
        const analytics = await refreshPostAnalytics(post.id);

        if (analytics) {
          refreshed++;
          results.push({
            postId: post.id,
            platform: post.platform,
            success: true,
            impressions: analytics.impressions,
            engagements: analytics.engagements,
          });
        } else {
          failed++;
          results.push({
            postId: post.id,
            platform: post.platform,
            success: false,
            error: 'Impossible de récupérer les analytics',
          });
        }
      } catch (error) {
        failed++;
        results.push({
          postId: post.id,
          platform: post.platform,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }

      // Délai pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Log summary
    console.log(
      `[Cron:fetch-social-analytics] Terminé: ${refreshed} rafraîchis, ${failed} échoués en ${duration}s`
    );

    // Calculer les totaux d'impressions et engagements
    const totalImpressions = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.impressions || 0), 0);
    const totalEngagements = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.engagements || 0), 0);

    return NextResponse.json({
      success: true,
      message: `Analytics rafraîchis pour ${refreshed}/${uniquePosts.length} posts`,
      duration: `${duration}s`,
      processed: uniquePosts.length,
      results: {
        refreshed,
        failed,
        recentPosts: recentPosts.length,
        popularPosts: popularPosts.length,
        totalImpressions,
        totalEngagements,
      },
    });
  } catch (error) {
    console.error('[Cron:fetch-social-analytics] Erreur:', error);
    return NextResponse.json(
      {
        error: 'Analytics fetch failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Rafraîchir un post spécifique ou avec des options
 */
export async function POST(request: NextRequest) {
  // Verify authentication (QStash signature or CRON_SECRET)
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { postId, hoursBack, platform } = body as {
      postId?: string;
      hoursBack?: number;
      platform?: string;
    };

    // Si un postId spécifique est fourni, rafraîchir uniquement ce post
    if (postId) {
      const analytics = await refreshPostAnalytics(postId);

      if (analytics) {
        return NextResponse.json({
          success: true,
          message: 'Analytics rafraîchis',
          postId,
          analytics: {
            impressions: analytics.impressions,
            reach: analytics.reach,
            engagements: analytics.engagements,
            likes: analytics.likes,
            comments: analytics.comments,
            shares: analytics.shares,
          },
        });
      } else {
        return NextResponse.json(
          { error: 'Impossible de rafraîchir les analytics pour ce post' },
          { status: 400 }
        );
      }
    }

    // Sinon, rafraîchir les posts selon les critères
    const hours = hoursBack || RECENT_HOURS;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const whereClause: Record<string, unknown> = {
      status: 'PUBLISHED',
      publishedAt: { gte: cutoff },
      externalPostId: { not: null },
    };

    if (platform) {
      whereClause.platform = platform.toUpperCase();
    }

    const posts = await prisma.socialPost.findMany({
      where: whereClause,
      select: { id: true, platform: true },
    });

    let refreshed = 0;
    let failed = 0;

    for (const post of posts) {
      const result = await refreshPostAnalytics(post.id);
      if (result) {
        refreshed++;
      } else {
        failed++;
      }
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }

    return NextResponse.json({
      success: true,
      message: `${refreshed}/${posts.length} posts rafraîchis`,
      refreshed,
      failed,
      hoursBack: hours,
      platform: platform || 'all',
    });
  } catch (error) {
    console.error('[Cron:fetch-social-analytics] Erreur:', error);
    return NextResponse.json(
      {
        error: 'Analytics fetch failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
