/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - BlogAnalytics model not available in Kairn schema
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { isMockMode, logDataMode } from '@/lib/pwaDataMode';

const prisma = new PrismaClient();

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
 * Récupère les titres des articles depuis la base de données
 */
async function getArticleTitles(): Promise<Map<string, string>> {
  const articlesMap = new Map<string, string>();

  try {
    const posts = await prisma.blogPost.findMany({
      select: {
        slug: true,
        title: true
      }
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
 * Génère des données mockées pour les statistiques blog PWA
 */
async function generateMockBlogStats(timeRange: string) {
  const articlesMap = await getArticleTitles();
  const articleSlugs = Array.from(articlesMap.keys());

  // Générer des vues aléatoires pour chaque article
  const articlesWithViews = articleSlugs.map(slug => ({
    slug,
    title: articlesMap.get(slug) || slug,
    views: Math.floor(Math.random() * 450) + 50 // Entre 50 et 500 vues
  }));

  // Trier par vues décroissantes
  articlesWithViews.sort((a, b) => b.views - a.views);

  const totalArticles = articlesWithViews.length;
  const totalViews = articlesWithViews.reduce((sum, a) => sum + a.views, 0);
  const avgReadTime = Math.floor(Math.random() * 240) + 180; // 3-7 minutes en secondes

  return {
    totalArticles,
    totalViews,
    avgReadTime,
    topArticles: articlesWithViews.slice(0, 10)
  };
}

/**
 * GET /api/analytics/blog/stats
 * Récupère les statistiques blog pour la PWA
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('range') || '7d';

    logDataMode();

    // Si en mode mock, retourner des données simulées
    if (isMockMode()) {
      console.log('📊 [Blog Stats PWA] Using MOCK data');
      const mockData = await generateMockBlogStats(timeRange);
      return NextResponse.json(mockData, { status: 200 });
    }

    // Mode réel - récupérer les vraies données
    console.log('📊 [Blog Stats PWA] Using REAL data');

    // Calculer la date de début en fonction du timeRange
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

    // Récupérer toutes les vues d'articles dans la période
    const blogViews = await prisma.blogAnalytics.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: now
        }
      },
      select: {
        articleSlug: true,
        sessionId: true,
        timestamp: true
      }
    });

    // Grouper par article et compter les vues
    const viewsByArticle = blogViews.reduce(
      (acc: Record<string, number>, view: { articleSlug: string; sessionId: string; timestamp: Date }) => {
        if (!acc[view.articleSlug]) {
          acc[view.articleSlug] = 0;
        }
        acc[view.articleSlug]++;
        return acc;
      },
      {} as Record<string, number>
    );

    // Récupérer les titres des articles depuis la base de données
    const articlesMap = await getArticleTitles();
    const totalArticles = articlesMap.size;

    // Créer le tableau des top articles avec titres
    const articlesWithViews: ArticleWithTitle[] = Object.entries(viewsByArticle)
      .map(([slug, views]) => ({
        slug,
        title: articlesMap.get(slug) || slug,
        views: views as number
      }))
      .sort((a, b) => b.views - a.views);

    const totalViews = articlesWithViews.reduce((sum, a) => sum + a.views, 0);

    // Calculer le temps de lecture moyen (estimation: 250 secondes en moyenne)
    const avgReadTime = 250;

    return NextResponse.json({
      totalArticles,
      totalViews,
      avgReadTime,
      topArticles: articlesWithViews.slice(0, 10)
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching blog stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog stats' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
