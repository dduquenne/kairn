import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';
import { isMockMode, logDataMode } from '@/lib/pwaDataMode';

export const dynamic = 'force-dynamic';

/**
 * Interface pour les articles avec leur titre
 */
interface ArticleWithTitle {
  slug: string;
  title: string;
  views: number;
}

/**
 * Récupère les titres des articles depuis la base de données, filtrés par siteId.
 */
async function getArticleTitles(siteId: string): Promise<Map<string, string>> {
  const articlesMap = new Map<string, string>();

  try {
    const posts = await prisma.blogPost.findMany({
      where: { siteId },
      select: {
        slug: true,
        title: true,
      },
    });

    for (const post of posts) {
      articlesMap.set(post.slug, post.title);
    }
  } catch (error) {
    console.error('Error reading article titles from database:', error);
  }

  return articlesMap;
}

/**
 * Génère des données mockées pour les statistiques blog PWA.
 */
async function generateMockBlogStats(siteId: string) {
  const articlesMap = await getArticleTitles(siteId);
  const articleSlugs = Array.from(articlesMap.keys());

  const articlesWithViews = articleSlugs.map(slug => ({
    slug,
    title: articlesMap.get(slug) || slug,
    views: Math.floor(Math.random() * 450) + 50,
  }));

  articlesWithViews.sort((a, b) => b.views - a.views);

  const totalArticles = articlesWithViews.length;
  const totalViews = articlesWithViews.reduce((sum, a) => sum + a.views, 0);
  const avgReadTime = Math.floor(Math.random() * 240) + 180;

  return {
    totalArticles,
    totalViews,
    avgReadTime,
    topArticles: articlesWithViews.slice(0, 10),
  };
}

/**
 * GET /api/analytics/blog/stats
 * Récupère les statistiques blog pour la PWA.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('range') || '7d';
    const siteId = await getSiteId();

    logDataMode();

    if (isMockMode()) {
      const mockData = await generateMockBlogStats(siteId);
      return NextResponse.json(mockData, { status: 200 });
    }

    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const blogViews = await prisma.blogAnalytics.findMany({
      where: {
        siteId,
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        articleSlug: true,
        sessionId: true,
        timestamp: true,
      },
    });

    const viewsByArticle: Record<string, number> = {};
    for (const view of blogViews) {
      viewsByArticle[view.articleSlug] = (viewsByArticle[view.articleSlug] ?? 0) + 1;
    }

    const articlesMap = await getArticleTitles(siteId);
    const totalArticles = articlesMap.size;

    const articlesWithViews: ArticleWithTitle[] = Object.entries(viewsByArticle)
      .map(([slug, views]) => ({
        slug,
        title: articlesMap.get(slug) || slug,
        views,
      }))
      .sort((a, b) => b.views - a.views);

    const totalViews = articlesWithViews.reduce((sum, a) => sum + a.views, 0);
    const avgReadTime = 250;

    return NextResponse.json(
      {
        totalArticles,
        totalViews,
        avgReadTime,
        topArticles: articlesWithViews.slice(0, 10),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    return NextResponse.json({ error: 'Failed to fetch blog stats' }, { status: 500 });
  }
}
