/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — pre-existing type issues in refreshPostAnalytics (social client interface)
/**
 * Service d'analytics pour les réseaux sociaux
 *
 * Agrège les données de performance des publications sur les différentes plateformes
 */

import { prisma } from '@/lib/db/prisma';

import { getSocialClient } from './clients';
import { getSocialAccountById, updatePostAnalytics } from './store';
import type { SocialPlatform, SocialPostAnalytics } from './types';

// ===========================================
// Types
// ===========================================

export interface SocialDashboardStats {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  failedPosts: number;
  draftPosts: number;
  totalImpressions: number;
  totalReach: number;
  totalEngagements: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  averageEngagementRate: number;
}

export interface PlatformStats {
  platform: SocialPlatform;
  postsCount: number;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

export interface PostPerformance {
  id: string;
  platform: SocialPlatform;
  content: string;
  blogTitle: string | null;
  publishedAt: Date | null;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  mediaType: 'text' | 'image' | 'video' | 'carousel' | 'reel' | 'story';
  mediaUrls: string[];
}

export interface TrendDataPoint {
  date: string;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  posts: number;
}

export interface RecentPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  blogTitle: string | null;
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  externalPostId: string | null;
  errorMessage: string | null;
  accountName: string;
}

// ===========================================
// Media Type Classification
// ===========================================

type MediaType = 'text' | 'image' | 'video' | 'carousel' | 'reel' | 'story';

const VIDEO_EXTENSIONS = /\.(mp4|mov|avi|webm|mkv|m4v|3gp)(\?|$)/i;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif|heic)(\?|$)/i;

/**
 * Classifie le type de média d'un post à partir de ses mediaUrls
 * et de sa plateforme (pour détecter reels/stories).
 */
export function classifyMediaType(
  mediaUrls: unknown,
  platform?: string,
  content?: string
): MediaType {
  const urls = Array.isArray(mediaUrls) ? mediaUrls.map(String) : [];

  if (urls.length === 0) return 'text';
  if (urls.length > 1) return 'carousel';

  const url = urls[0] || '';

  // Check if it's a video
  if (VIDEO_EXTENSIONS.test(url)) {
    // Instagram reels detection: short-form video on Instagram
    if (platform === 'INSTAGRAM' || platform === 'instagram') {
      // Heuristic: if URL contains "reel" or content mentions reel
      if (/reel/i.test(url) || (content && /\breel\b/i.test(content))) {
        return 'reel';
      }
    }
    return 'video';
  }

  if (IMAGE_EXTENSIONS.test(url)) {
    // Story detection: ephemeral content (typically indicated in metadata/URL)
    if (/story|stories/i.test(url)) {
      return 'story';
    }
    return 'image';
  }

  // Fallback: if URL exists but no extension match, try content-type heuristic
  return 'image';
}

// ===========================================
// Dashboard Stats
// ===========================================

/**
 * Récupère les statistiques globales du dashboard
 */
export async function getDashboardStats(
  startDate?: Date,
  endDate?: Date
): Promise<SocialDashboardStats> {
  console.log('[PostsPanel:Debug][getDashboardStats] Appelé avec:', {
    startDate: startDate?.toISOString() ?? 'undefined',
    endDate: endDate?.toISOString() ?? 'undefined',
  });

  // Post counts use createdAt (includes drafts/scheduled without publishedAt)
  const createdFilter = buildDateFilter(startDate, endDate, 'createdAt');
  // Analytics aggregate uses publishedAt (only published posts have analytics)
  const publishedFilter = buildDateFilter(startDate, endDate);

  console.log('[PostsPanel:Debug][getDashboardStats] Filtres Prisma:', {
    createdFilter: JSON.stringify(createdFilter),
    publishedFilter: JSON.stringify(publishedFilter),
  });

  // Compter les posts par statut
  const postCounts = await prisma.socialPost.groupBy({
    by: ['status'],
    _count: { _all: true },
    where: createdFilter,
  });

  const countByStatus = Object.fromEntries(
    postCounts.map((c: { status: string; _count: { _all: number } }) => [c.status, c._count._all])
  );

  console.log('[PostsPanel:Debug][getDashboardStats] Posts par statut:', countByStatus);

  // Vérifier aussi le nombre total de posts sans filtre de date
  const totalPostsNoFilter = await prisma.socialPost.count();
  console.log(
    '[PostsPanel:Debug][getDashboardStats] Total posts en base (sans filtre):',
    totalPostsNoFilter
  );

  // Récupérer les analytics agrégés
  const analyticsAgg = await prisma.socialPostAnalytics.aggregate({
    _sum: {
      impressions: true,
      reach: true,
      engagements: true,
      likes: true,
      comments: true,
      shares: true,
      saves: true,
    },
    where: {
      post: publishedFilter,
    },
  });

  console.log('[PostsPanel:Debug][getDashboardStats] Analytics agrégés:', {
    impressions: analyticsAgg._sum.impressions,
    reach: analyticsAgg._sum.reach,
    engagements: analyticsAgg._sum.engagements,
    likes: analyticsAgg._sum.likes,
    comments: analyticsAgg._sum.comments,
    shares: analyticsAgg._sum.shares,
    saves: analyticsAgg._sum.saves,
  });

  // Vérifier aussi le nombre d'analytics en base
  const totalAnalyticsNoFilter = await prisma.socialPostAnalytics.count();
  console.log(
    '[PostsPanel:Debug][getDashboardStats] Total analytics en base (sans filtre):',
    totalAnalyticsNoFilter
  );

  const totalPosts =
    (countByStatus.PUBLISHED || 0) +
    (countByStatus.SCHEDULED || 0) +
    (countByStatus.DRAFT || 0) +
    (countByStatus.FAILED || 0);

  const publishedPosts = countByStatus.PUBLISHED || 0;
  const totalImpressions = analyticsAgg._sum.impressions || 0;
  const totalEngagements = analyticsAgg._sum.engagements || 0;

  const result = {
    totalPosts,
    publishedPosts,
    scheduledPosts: countByStatus.SCHEDULED || 0,
    failedPosts: countByStatus.FAILED || 0,
    draftPosts: countByStatus.DRAFT || 0,
    totalImpressions,
    totalReach: analyticsAgg._sum.reach || 0,
    totalEngagements,
    totalLikes: analyticsAgg._sum.likes || 0,
    totalComments: analyticsAgg._sum.comments || 0,
    totalShares: analyticsAgg._sum.shares || 0,
    totalSaves: analyticsAgg._sum.saves || 0,
    averageEngagementRate: totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0,
  };

  console.log('[PostsPanel:Debug][getDashboardStats] Résultat final:', result);
  return result;
}

// ===========================================
// Platform Stats
// ===========================================

/**
 * Récupère les statistiques par plateforme
 */
export async function getStatsByPlatform(
  startDate?: Date,
  endDate?: Date
): Promise<PlatformStats[]> {
  const dateFilter = buildDateFilter(startDate, endDate);

  console.log('[PostsPanel:Debug][getStatsByPlatform] Filtre date:', JSON.stringify(dateFilter));

  // Récupérer les posts avec leurs analytics groupés par plateforme
  const platformData = await prisma.socialPost.groupBy({
    by: ['platform'],
    _count: true,
    where: {
      ...dateFilter,
      status: 'PUBLISHED',
    },
  });

  console.log(
    '[PostsPanel:Debug][getStatsByPlatform] Plateformes trouvées:',
    platformData.length,
    platformData.map(p => `${p.platform}=${p._count}`)
  );

  const results: PlatformStats[] = [];

  for (const platform of platformData) {
    // Récupérer les analytics pour cette plateforme
    const analytics = await prisma.socialPostAnalytics.aggregate({
      _sum: {
        impressions: true,
        reach: true,
        engagements: true,
        likes: true,
        comments: true,
        shares: true,
      },
      where: {
        post: {
          ...dateFilter,
          platform: platform.platform,
          status: 'PUBLISHED',
        },
      },
    });

    const impressions = analytics._sum.impressions || 0;
    const engagements = analytics._sum.engagements || 0;

    console.log(`[PostsPanel:Debug][getStatsByPlatform] ${platform.platform}:`, {
      posts: platform._count,
      impressions,
      reach: analytics._sum.reach,
      engagements,
    });

    results.push({
      platform: platform.platform as SocialPlatform,
      postsCount: platform._count,
      impressions,
      reach: analytics._sum.reach || 0,
      engagements,
      likes: analytics._sum.likes || 0,
      comments: analytics._sum.comments || 0,
      shares: analytics._sum.shares || 0,
      engagementRate: impressions > 0 ? (engagements / impressions) * 100 : 0,
    });
  }

  console.log('[PostsPanel:Debug][getStatsByPlatform] Total résultats:', results.length);
  return results;
}

// ===========================================
// Top Performing Posts
// ===========================================

/**
 * Récupère les posts les plus performants
 */
export async function getTopPerformingPosts(
  limit = 10,
  startDate?: Date,
  endDate?: Date
): Promise<PostPerformance[]> {
  const dateFilter = buildDateFilter(startDate, endDate);

  console.log(
    '[PostsPanel:Debug][getTopPerformingPosts] Filtre:',
    JSON.stringify(dateFilter),
    'limit:',
    limit
  );

  const posts: Array<{
    id: string;
    platform: string;
    content: string;
    blogTitle: string | null;
    publishedAt: Date | null;
    mediaUrls: unknown;
    analytics: {
      impressions: number;
      reach: number;
      engagements: number;
      likes: number;
      comments: number;
      shares: number;
      saves: number;
    } | null;
  }> = await prisma.socialPost.findMany({
    where: {
      ...dateFilter,
      status: 'PUBLISHED',
    },
    include: {
      analytics: true,
    },
    orderBy: {
      analytics: {
        engagements: 'desc',
      },
    },
    take: limit,
  });

  console.log(
    '[PostsPanel:Debug][getTopPerformingPosts] Posts trouvés:',
    posts.length,
    posts.length > 0
      ? `Premier: id=${posts[0]?.id}, platform=${posts[0]?.platform}, hasAnalytics=${!!posts[0]?.analytics}`
      : '(aucun)'
  );

  return posts.map((post: (typeof posts)[number]) => {
    const impressions = post.analytics?.impressions || 0;
    const engagements = post.analytics?.engagements || 0;
    const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls.map(String) : [];

    return {
      id: post.id,
      platform: post.platform as SocialPlatform,
      content: post.content,
      blogTitle: post.blogTitle,
      publishedAt: post.publishedAt,
      impressions,
      reach: post.analytics?.reach || 0,
      engagements,
      likes: post.analytics?.likes || 0,
      comments: post.analytics?.comments || 0,
      shares: post.analytics?.shares || 0,
      saves: post.analytics?.saves || 0,
      engagementRate: impressions > 0 ? (engagements / impressions) * 100 : 0,
      mediaType: classifyMediaType(post.mediaUrls, post.platform, post.content),
      mediaUrls,
    };
  });
}

// ===========================================
// Trend Data
// ===========================================

/**
 * Récupère les données de tendance pour les graphiques
 */
export async function getTrendData(
  days = 30,
  startDate?: Date,
  endDate?: Date
): Promise<TrendDataPoint[]> {
  const end = endDate || new Date();
  const start = startDate || new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  console.log('[PostsPanel:Debug][getTrendData] Période:', {
    start: start.toISOString(),
    end: end.toISOString(),
    days,
  });

  // Récupérer les posts publiés dans la période
  const posts = await prisma.socialPost.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      analytics: true,
    },
    orderBy: {
      publishedAt: 'asc',
    },
  });

  console.log(
    '[PostsPanel:Debug][getTrendData] Posts publiés dans la période:',
    posts.length,
    posts.length > 0 ? `(avec analytics: ${posts.filter(p => p.analytics).length})` : ''
  );

  // Grouper par jour
  const dataByDate: Map<string, TrendDataPoint> = new Map();

  // Initialiser tous les jours de la période
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateKey = currentDate.toISOString().split('T')[0];
    dataByDate.set(dateKey, {
      date: dateKey,
      impressions: 0,
      reach: 0,
      engagements: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      posts: 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Agréger les données des posts
  for (const post of posts) {
    if (!post.publishedAt) continue;

    const dateKey = post.publishedAt.toISOString().split('T')[0];
    const existing = dataByDate.get(dateKey);

    if (existing) {
      existing.impressions += post.analytics?.impressions || 0;
      existing.reach += post.analytics?.reach || 0;
      existing.engagements += post.analytics?.engagements || 0;
      existing.likes += post.analytics?.likes || 0;
      existing.comments += post.analytics?.comments || 0;
      existing.shares += post.analytics?.shares || 0;
      existing.posts += 1;
    }
  }

  const trendResults = Array.from(dataByDate.values());
  const nonZeroDays = trendResults.filter(d => d.posts > 0 || d.engagements > 0);
  console.log(
    '[PostsPanel:Debug][getTrendData] Jours générés:',
    trendResults.length,
    'Jours avec données:',
    nonZeroDays.length
  );
  return trendResults;
}

// ===========================================
// Recent Posts
// ===========================================

/**
 * Récupère les publications récentes avec leur statut
 */
export async function getRecentPosts(limit = 20): Promise<RecentPost[]> {
  const posts: Array<{
    id: string;
    platform: string;
    content: string;
    blogTitle: string | null;
    status: string;
    scheduledAt: Date | null;
    publishedAt: Date | null;
    externalPostId: string | null;
    errorMessage: string | null;
    account: { accountName: string };
  }> = await prisma.socialPost.findMany({
    include: {
      account: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: limit,
  });

  return posts.map((post: (typeof posts)[number]) => ({
    id: post.id,
    platform: post.platform as SocialPlatform,
    content: post.content,
    blogTitle: post.blogTitle,
    status: post.status,
    scheduledAt: post.scheduledAt,
    publishedAt: post.publishedAt,
    externalPostId: post.externalPostId,
    errorMessage: post.errorMessage,
    accountName: post.account.accountName,
  }));
}

// ===========================================
// Refresh Analytics from APIs
// ===========================================

/**
 * Rafraîchit les analytics d'un post depuis l'API de la plateforme
 */
export async function refreshPostAnalytics(postId: string): Promise<SocialPostAnalytics | null> {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: { account: true },
  });

  if (!post || !post.externalPostId || post.status !== 'PUBLISHED') {
    return null;
  }

  try {
    // Récupérer les tokens du compte
    const account = await getSocialAccountById(post.accountId);
    if (!account) {
      console.error(`[Analytics] Account not found: ${post.accountId}`);
      return null;
    }

    // Obtenir le client de la plateforme
    const client = getSocialClient(post.platform as SocialPlatform);

    // Récupérer les analytics depuis l'API
    const result = await client.getAnalytics({
      externalPostId: post.externalPostId,
      accessToken: account.accessToken,
      accountMetadata: account.metadata,
    });

    if (!result.success) {
      console.error(`[Analytics] Failed to fetch analytics: ${result.error}`);
      return null;
    }

    // Mettre à jour les analytics en base
    const analytics = await updatePostAnalytics(postId, {
      impressions: result.impressions,
      reach: result.reach,
      engagements: result.engagements,
      likes: result.likes,
      comments: result.comments,
      shares: result.shares,
      saves: result.saves,
      clicks: result.clicks,
      rawData: result.rawData,
    });

    return analytics;
  } catch (error) {
    console.error(`[Analytics] Error refreshing analytics for post ${postId}:`, error);
    return null;
  }
}

/**
 * Rafraîchit les analytics de tous les posts publiés récemment
 */
export async function refreshRecentAnalytics(
  hoursBack = 48
): Promise<{ refreshed: number; failed: number }> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const posts = await prisma.socialPost.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        gte: since,
      },
      externalPostId: {
        not: null,
      },
    },
    select: { id: true },
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

    // Petit délai pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { refreshed, failed };
}

// ===========================================
// Comparison Stats (current vs previous period)
// ===========================================

export interface ComparisonStats {
  postsChange: number;
  reachChange: number;
  engagementChange: number;
  engagementRateChange: number;
}

/**
 * Calcule les variations en % entre la période courante et la période précédente
 * de même durée. Ex: si startDate-endDate = 30 jours, on compare avec les 30 jours
 * précédents.
 */
export async function getComparisonStats(startDate: Date, endDate: Date): Promise<ComparisonStats> {
  const durationMs = endDate.getTime() - startDate.getTime();
  const prevStart = new Date(startDate.getTime() - durationMs);
  const prevEnd = new Date(startDate.getTime());

  console.log(
    '[PostsPanel:Debug][getComparisonStats] Période courante:',
    startDate.toISOString(),
    '->',
    endDate.toISOString()
  );
  console.log(
    '[PostsPanel:Debug][getComparisonStats] Période précédente:',
    prevStart.toISOString(),
    '->',
    prevEnd.toISOString()
  );

  const [currentStats, previousStats] = await Promise.all([
    getDashboardStats(startDate, endDate),
    getDashboardStats(prevStart, prevEnd),
  ]);

  const pctChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const compResult = {
    postsChange: pctChange(currentStats.publishedPosts, previousStats.publishedPosts),
    reachChange: pctChange(currentStats.totalReach, previousStats.totalReach),
    engagementChange: pctChange(currentStats.totalEngagements, previousStats.totalEngagements),
    engagementRateChange: currentStats.averageEngagementRate - previousStats.averageEngagementRate,
  };

  console.log('[PostsPanel:Debug][getComparisonStats] Résultat:', compResult);
  return compResult;
}

// ===========================================
// Best Posting Times
// ===========================================

export interface BestPostingTimeData {
  day: string;
  hour: number;
  engagement: number;
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/**
 * Calcule les meilleurs moments pour poster à partir des données historiques
 * d'engagement. Agrège par jour de la semaine et créneau horaire.
 */
export async function getBestPostingTimes(
  startDate?: Date,
  endDate?: Date
): Promise<BestPostingTimeData[]> {
  const dateFilter = buildDateFilter(startDate, endDate);

  console.log('[PostsPanel:Debug][getBestPostingTimes] Filtre:', JSON.stringify(dateFilter));

  const posts: Array<{
    publishedAt: Date | null;
    analytics: { engagements: number } | null;
  }> = await prisma.socialPost.findMany({
    where: {
      ...dateFilter,
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
    select: {
      publishedAt: true,
      analytics: {
        select: { engagements: true },
      },
    },
  });

  console.log('[PostsPanel:Debug][getBestPostingTimes] Posts trouvés:', posts.length);

  // Aggregate engagements by day/hour bucket
  const buckets: Map<string, { total: number; count: number }> = new Map();

  for (const post of posts) {
    if (!post.publishedAt) continue;
    const dayLabel = DAY_LABELS[post.publishedAt.getDay()] ?? 'Lun';
    // Round to nearest display hour (9, 12, 15, 18, 21)
    const rawHour = post.publishedAt.getHours();
    const displayHours = [9, 12, 15, 18, 21];
    const nearestHour = displayHours.reduce((prev, curr) =>
      Math.abs(curr - rawHour) < Math.abs(prev - rawHour) ? curr : prev
    );

    const key = `${dayLabel}-${nearestHour}`;
    const existing = buckets.get(key) || { total: 0, count: 0 };
    existing.total += post.analytics?.engagements || 0;
    existing.count += 1;
    buckets.set(key, existing);
  }

  const results: BestPostingTimeData[] = [];
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const hours = [9, 12, 15, 18, 21];

  for (const day of days) {
    for (const hour of hours) {
      const bucket = buckets.get(`${day}-${hour}`);
      results.push({
        day,
        hour,
        engagement: bucket ? Math.round(bucket.total / bucket.count) : 0,
      });
    }
  }

  return results;
}

// ===========================================
// Post Type Stats
// ===========================================

export interface PostTypeStatsData {
  type: string;
  count: number;
  avgEngagement: number;
  percentage: number;
}

/**
 * Agrège les stats par type de contenu (image, video, carousel, etc.)
 * Se base sur le champ mediaUrls pour déduire le type.
 */
export async function getPostTypeStats(
  startDate?: Date,
  endDate?: Date
): Promise<PostTypeStatsData[]> {
  const dateFilter = buildDateFilter(startDate, endDate);

  console.log('[PostsPanel:Debug][getPostTypeStats] Filtre:', JSON.stringify(dateFilter));

  const posts: Array<{
    platform: string;
    mediaUrls: unknown;
    content: string;
    analytics: { engagements: number; impressions: number } | null;
  }> = await prisma.socialPost.findMany({
    where: {
      ...dateFilter,
      status: 'PUBLISHED',
    },
    select: {
      platform: true,
      mediaUrls: true,
      content: true,
      analytics: {
        select: { engagements: true, impressions: true },
      },
    },
  });

  console.log('[PostsPanel:Debug][getPostTypeStats] Posts trouvés:', posts.length);

  const typeBuckets: Map<string, { count: number; totalEngRate: number }> = new Map();

  for (const post of posts) {
    const type = classifyMediaType(post.mediaUrls, post.platform, post.content);

    const impressions = post.analytics?.impressions || 0;
    const engagements = post.analytics?.engagements || 0;
    const engRate = impressions > 0 ? (engagements / impressions) * 100 : 0;

    const existing = typeBuckets.get(type) || { count: 0, totalEngRate: 0 };
    existing.count += 1;
    existing.totalEngRate += engRate;
    typeBuckets.set(type, existing);
  }

  const totalPosts = posts.length || 1;
  const results: PostTypeStatsData[] = [];

  for (const [type, bucket] of typeBuckets) {
    results.push({
      type,
      count: bucket.count,
      avgEngagement: bucket.count > 0 ? bucket.totalEngRate / bucket.count : 0,
      percentage: (bucket.count / totalPosts) * 100,
    });
  }

  // Sort by count descending
  results.sort((a, b) => b.count - a.count);

  console.log(
    '[PostsPanel:Debug][getPostTypeStats] Types trouvés:',
    results.map(r => `${r.type}=${r.count}`)
  );
  return results;
}

// ===========================================
// Hashtag Performance Analysis
// ===========================================

export interface HashtagPerformance {
  hashtag: string;
  usageCount: number;
  avgEngagementRate: number;
  totalReach: number;
  totalEngagements: number;
}

/**
 * Extrait les hashtags d'un contenu textuel
 */
function extractHashtags(content: string): string[] {
  const matches = content.match(/#[\w\u00C0-\u024F]+/g);
  if (!matches) return [];
  return [...new Set(matches.map(h => h.toLowerCase()))];
}

/**
 * Analyse la performance des hashtags utilisés dans les posts.
 * Retourne les hashtags triés par taux d'engagement moyen décroissant.
 */
export async function getHashtagPerformance(
  startDate?: Date,
  endDate?: Date,
  limit = 20
): Promise<HashtagPerformance[]> {
  const dateFilter = buildDateFilter(startDate, endDate);

  console.log(
    '[PostsPanel:Debug][getHashtagPerformance] Filtre:',
    JSON.stringify(dateFilter),
    'limit:',
    limit
  );

  const posts: Array<{
    content: string;
    analytics: {
      impressions: number;
      reach: number;
      engagements: number;
    } | null;
  }> = await prisma.socialPost.findMany({
    where: {
      ...dateFilter,
      status: 'PUBLISHED',
    },
    select: {
      content: true,
      analytics: {
        select: { impressions: true, reach: true, engagements: true },
      },
    },
  });

  console.log('[PostsPanel:Debug][getHashtagPerformance] Posts trouvés:', posts.length);

  const hashtagBuckets: Map<
    string,
    { count: number; totalEngRate: number; totalReach: number; totalEngagements: number }
  > = new Map();

  for (const post of posts) {
    const hashtags = extractHashtags(post.content);
    if (hashtags.length === 0) continue;

    const impressions = post.analytics?.impressions || 0;
    const reach = post.analytics?.reach || 0;
    const engagements = post.analytics?.engagements || 0;
    const engRate = impressions > 0 ? (engagements / impressions) * 100 : 0;

    for (const tag of hashtags) {
      const existing = hashtagBuckets.get(tag) || {
        count: 0,
        totalEngRate: 0,
        totalReach: 0,
        totalEngagements: 0,
      };
      existing.count += 1;
      existing.totalEngRate += engRate;
      existing.totalReach += reach;
      existing.totalEngagements += engagements;
      hashtagBuckets.set(tag, existing);
    }
  }

  const results: HashtagPerformance[] = [];

  for (const [hashtag, bucket] of hashtagBuckets) {
    results.push({
      hashtag,
      usageCount: bucket.count,
      avgEngagementRate: bucket.count > 0 ? bucket.totalEngRate / bucket.count : 0,
      totalReach: bucket.totalReach,
      totalEngagements: bucket.totalEngagements,
    });
  }

  // Sort by avgEngagementRate descending, then by usage count
  results.sort((a, b) => {
    const rateCompare = b.avgEngagementRate - a.avgEngagementRate;
    if (Math.abs(rateCompare) < 0.01) return b.usageCount - a.usageCount;
    return rateCompare;
  });

  const finalResults = results.slice(0, limit);
  console.log(
    '[PostsPanel:Debug][getHashtagPerformance] Hashtags uniques trouvés:',
    results.length,
    'Retournés (limit):',
    finalResults.length
  );
  return finalResults;
}

// ===========================================
// Helpers
// ===========================================

/**
 * Construit un filtre Prisma de plage de dates.
 *
 * @param startDate - Début de la plage (inclus)
 * @param endDate - Fin de la plage (inclus)
 * @param field - Champ de date à filtrer (défaut: 'publishedAt')
 */
function buildDateFilter(
  startDate?: Date,
  endDate?: Date,
  field: 'publishedAt' | 'createdAt' = 'publishedAt'
) {
  if (!startDate && !endDate) {
    return {};
  }

  const filter: Record<string, unknown> = {};

  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) {
      (filter[field] as Record<string, Date>).gte = startDate;
    }
    if (endDate) {
      (filter[field] as Record<string, Date>).lte = endDate;
    }
  }

  return filter;
}
