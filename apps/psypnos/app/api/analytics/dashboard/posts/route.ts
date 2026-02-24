/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
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
import {
  getDashboardStats,
  getStatsByPlatform,
  getTopPerformingPosts,
  getTrendData,
  getComparisonStats,
  getBestPostingTimes,
  getPostTypeStats,
} from '@/lib/social/analytics';
import { getTotalFollowersByPlatform } from '@/lib/social/snapshots';

// Platform display config
const PLATFORM_CONFIG: Record<
  string,
  { name: string; icon: string; color: string }
> = {
  FACEBOOK: { name: 'Facebook', icon: 'facebook', color: '#1877F2' },
  INSTAGRAM: { name: 'Instagram', icon: 'instagram', color: '#E4405F' },
  LINKEDIN: { name: 'LinkedIn', icon: 'linkedin', color: '#0A66C2' },
  TWITTER: { name: 'Twitter', icon: 'twitter', color: '#1DA1F2' },
  THREADS: { name: 'Threads', icon: 'threads', color: '#000000' },
};

export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const days = searchParams.get('days');

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
    ] = await Promise.all([
      getDashboardStats(startDate, endDate),
      getStatsByPlatform(startDate, endDate),
      getTopPerformingPosts(12, startDate, endDate),
      getTrendData(30, startDate, endDate),
      startDate && endDate
        ? getComparisonStats(startDate, endDate)
        : Promise.resolve({ postsChange: 0, reachChange: 0, engagementChange: 0, engagementRateChange: 0 }),
      getBestPostingTimes(startDate, endDate),
      getPostTypeStats(startDate, endDate),
      getTotalFollowersByPlatform(),
    ]);

    // Format platform stats for PostsPanel
    const platforms = platformStats.map((p) => {
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
    const formattedTopPosts = topPosts.map((p) => ({
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

    // Format trend data
    const engagementTrends = trendData.map((t) => ({
      label: t.date,
      reach: t.impressions, // Using impressions as reach proxy
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
      platforms,
      topPosts: formattedTopPosts,
      postTypes: postTypes.map((pt) => ({
        type: pt.type,
        count: pt.count,
        avgEngagement: pt.avgEngagement,
        percentage: pt.percentage,
      })),
      engagementTrends,
      bestPostingTimes: bestTimes.map((bt) => ({
        day: bt.day,
        hour: bt.hour,
        engagement: bt.engagement,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Dashboard Posts API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
