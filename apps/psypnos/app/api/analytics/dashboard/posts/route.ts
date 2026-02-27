/**
 * API pour les analytics des réseaux sociaux formatées pour le PostsPanel
 *
 * GET /api/analytics/dashboard/posts - Retourne les données au format PostsPanelData
 *
 * Query params:
 *   - startDate: ISO date string
 *   - endDate: ISO date string
 *   - days: nombre de jours (fallback si pas de startDate/endDate)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import {
  getDashboardStats,
  getStatsByPlatform,
  getTopPerformingPosts,
  getTrendData,
  getComparisonStats,
  getBestPostingTimes,
  getPostTypeStats,
  getHashtagPerformance,
} from '@/lib/social/analytics';
import { getTotalFollowersByPlatform } from '@/lib/social/snapshots';

// Platform display config
const PLATFORM_CONFIG: Record<string, { name: string; icon: string; color: string }> = {
  FACEBOOK: { name: 'Facebook', icon: 'facebook', color: '#1877F2' },
  INSTAGRAM: { name: 'Instagram', icon: 'instagram', color: '#E4405F' },
  LINKEDIN: { name: 'LinkedIn', icon: 'linkedin', color: '#0A66C2' },
  TWITTER: { name: 'Twitter', icon: 'twitter', color: '#1DA1F2' },
  THREADS: { name: 'Threads', icon: 'threads', color: '#000000' },
};

export async function GET(request: NextRequest) {
  console.log('[PostsPanel:Debug][API] ══════════════════════════════════════');
  console.log('[PostsPanel:Debug][API] Début traitement GET /api/analytics/dashboard/posts');
  console.log('[PostsPanel:Debug][API] URL complète:', request.url);

  const authResult = await withAdminAuth();
  if (authResult.error) {
    console.error('[PostsPanel:Debug][API] ❌ Auth échouée — retour erreur 401/403');
    return authResult.error;
  }
  console.log(
    '[PostsPanel:Debug][API] ✅ Auth réussie, user:',
    authResult.user?.email ?? authResult.user?.sub ?? 'inconnu'
  );

  try {
    const { searchParams } = new URL(request.url);

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const days = searchParams.get('days');

    console.log('[PostsPanel:Debug][API] Params reçus:', { startDateStr, endDateStr, days });

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      startDate = new Date(startDateStr);
    }
    if (endDateStr) {
      endDate = new Date(endDateStr);
    }

    if (!startDate && !endDate && days) {
      const daysNum = parseInt(days, 10);
      endDate = new Date();
      startDate = new Date(endDate.getTime() - daysNum * 24 * 60 * 60 * 1000);
    }

    // Default to last 30 days
    if (!startDate && !endDate) {
      endDate = new Date();
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    console.log('[PostsPanel:Debug][API] Dates finales:', {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });

    // ── Fallback: si aucun post publié dans la période, élargir aux données existantes ──
    let dateRangeExpanded = false;
    if (startDate && endDate) {
      const postsInPeriod = await prisma.socialPost.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: { gte: startDate, lte: endDate },
        },
      });

      if (postsInPeriod === 0) {
        const dateRange = await prisma.socialPost.aggregate({
          _min: { publishedAt: true },
          _max: { publishedAt: true },
          where: { status: 'PUBLISHED', publishedAt: { not: null } },
        });

        if (dateRange._min.publishedAt && dateRange._max.publishedAt) {
          console.log(
            '[PostsPanel:Debug][API] ⚠️ Aucun post dans la période sélectionnée. Fallback sur la plage réelle:',
            dateRange._min.publishedAt.toISOString(),
            '→',
            dateRange._max.publishedAt.toISOString()
          );
          startDate = dateRange._min.publishedAt;
          endDate = dateRange._max.publishedAt;
          dateRangeExpanded = true;
        }
      }
    }

    console.log('[PostsPanel:Debug][API] Lancement des 9 requêtes service en parallèle...');
    const fetchStart = Date.now();

    // Fetch all data in parallel
    const [
      stats,
      platformStats,
      topPosts,
      trendData,
      comparison,
      bestTimes,
      postTypes,
      followersByPlatform,
      hashtagPerformance,
    ] = await Promise.all([
      getDashboardStats(startDate, endDate),
      getStatsByPlatform(startDate, endDate),
      getTopPerformingPosts(12, startDate, endDate),
      getTrendData(30, startDate, endDate),
      startDate && endDate
        ? getComparisonStats(startDate, endDate)
        : Promise.resolve({
            postsChange: 0,
            reachChange: 0,
            engagementChange: 0,
            engagementRateChange: 0,
          }),
      getBestPostingTimes(startDate, endDate),
      getPostTypeStats(startDate, endDate),
      getTotalFollowersByPlatform(),
      getHashtagPerformance(startDate, endDate, 20),
    ]);

    console.log(`[PostsPanel:Debug][API] 9 requêtes terminées en ${Date.now() - fetchStart}ms`);
    console.log('[PostsPanel:Debug][API] Résumé des résultats:', {
      'stats.publishedPosts': stats.publishedPosts,
      'stats.totalPosts': stats.totalPosts,
      'stats.totalImpressions': stats.totalImpressions,
      'stats.totalEngagements': stats.totalEngagements,
      'stats.totalReach': stats.totalReach,
      'platformStats.length': platformStats.length,
      'topPosts.length': topPosts.length,
      'trendData.length': trendData.length,
      comparison,
      'bestTimes.length': bestTimes.length,
      'postTypes.length': postTypes.length,
      'followersByPlatform.size': followersByPlatform.size,
      'hashtagPerformance.length': hashtagPerformance.length,
    });

    // Format platform stats for PostsPanel
    const platforms = platformStats.map(p => {
      const config = PLATFORM_CONFIG[p.platform] || {
        name: p.platform,
        icon: p.platform.toLowerCase(),
        color: '#666',
      };
      const followerData = followersByPlatform.get(p.platform) || { followers: 0, change: 0 };
      return {
        platform: config.name,
        icon: config.icon,
        followers: followerData.followers,
        followersChange: followerData.change,
        posts: p.postsCount,
        reach: p.reach,
        engagement: p.engagements,
        engagementRate: p.engagementRate,
        color: config.color,
      };
    });

    // Format top posts for PostsPanel
    const formattedTopPosts = topPosts.map(p => ({
      id: p.id,
      platform: p.platform.toLowerCase(),
      type: p.mediaType,
      content: p.content,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : new Date().toISOString(),
      reach: p.reach,
      impressions: p.impressions,
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      saves: p.saves,
      engagementRate: p.engagementRate,
    }));

    // Format trend data — use real reach when available, fallback to impressions
    const engagementTrends = trendData.map(t => ({
      label: t.date,
      reach: t.reach > 0 ? t.reach : t.impressions,
      engagement: t.engagements,
      posts: t.posts,
    }));

    const response = {
      totalPosts: stats.publishedPosts,
      postsChange: comparison.postsChange,
      totalReach: stats.totalReach,
      reachChange: comparison.reachChange,
      totalEngagement: stats.totalEngagements,
      engagementChange: comparison.engagementChange,
      avgEngagementRate: stats.averageEngagementRate,
      engagementRateChange: comparison.engagementRateChange,
      totalFollowers: platforms.reduce((sum, p) => sum + p.followers, 0),
      followersChange: platforms.reduce((sum, p) => sum + p.followersChange, 0),
      totalLikes: stats.totalLikes,
      totalComments: stats.totalComments,
      totalShares: stats.totalShares,
      totalSaves: stats.totalSaves,
      platforms,
      topPosts: formattedTopPosts,
      postTypes: postTypes.map(pt => ({
        type: pt.type,
        count: pt.count,
        avgEngagement: pt.avgEngagement,
        percentage: pt.percentage,
      })),
      engagementTrends,
      bestPostingTimes: bestTimes.map(bt => ({
        day: bt.day,
        hour: bt.hour,
        engagement: bt.engagement,
      })),
      hashtagPerformance: hashtagPerformance.map(h => ({
        hashtag: h.hashtag,
        usageCount: h.usageCount,
        avgEngagementRate: h.avgEngagementRate,
        totalReach: h.totalReach,
        totalEngagements: h.totalEngagements,
      })),
      ...(dateRangeExpanded && {
        dateRangeExpanded: true,
        effectiveDateRange: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      }),
    };

    console.log('[PostsPanel:Debug][API] Réponse finale construite:', {
      totalPosts: response.totalPosts,
      totalReach: response.totalReach,
      totalEngagement: response.totalEngagement,
      avgEngagementRate: response.avgEngagementRate,
      totalFollowers: response.totalFollowers,
      'platforms.length': response.platforms.length,
      'topPosts.length': response.topPosts.length,
      'postTypes.length': response.postTypes.length,
      'engagementTrends.length': response.engagementTrends.length,
      'bestPostingTimes.length': response.bestPostingTimes.length,
    });
    console.log('[PostsPanel:Debug][API] ✅ Retour HTTP 200');
    console.log('[PostsPanel:Debug][API] ══════════════════════════════════════');

    return NextResponse.json(response);
  } catch (error) {
    console.error('[PostsPanel:Debug][API] ❌ ERREUR CATCH GLOBAL:', error);
    console.error('[PostsPanel:Debug][API] Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('[PostsPanel:Debug][API] ══════════════════════════════════════');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
