// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  isMockMode,
  generateMockBlogAnalytics,
  generateMockBlogArticleStats,
  logDataMode
} from '@/lib/pwaDataMode';

// Type for blog analytics record (workaround for ungenerated Prisma client)
type BlogAnalyticsRecord = {
  id: string;
  articleSlug: string;
  sessionId: string;
  timestamp: Date;
  scrollDepthPercent?: number | null;
  timeOnPage?: number | null;
  completed?: boolean;
};

function hashVisitorId(userAgent: string, ip: string): string {
  // Simple hash for visitor identification
  const combined = `${userAgent}-${ip}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// GET - Récupérer les statistiques des articles du blog
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Calculate date filters
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    let startDate = startDateParam ? new Date(startDateParam) : new Date();

    if (!startDateParam) {
      // Default: last 30 days
      startDate.setDate(endDate.getDate() - 30);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Build date filter for Prisma queries
    const dateFilter = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Log le mode de données
    logDataMode();

    // Si en mode mock, retourner des données simulées
    if (isMockMode()) {
      console.log('📊 [Blog Analytics] Using MOCK data');

      if (slug) {
        // Retourner les stats d'un article spécifique
        const mockStats = generateMockBlogArticleStats(slug);
        return NextResponse.json(mockStats);
      }

      // Retourner toutes les stats
      const mockData = generateMockBlogAnalytics();
      return NextResponse.json(mockData);
    }

    // Mode réel - récupérer les vraies données
    console.log('📊 [Blog Analytics] Using REAL data');

    if (slug) {
      // Retourner les stats d'un article spécifique
      const stats = await prisma.blogAnalytics.findMany({
        where: { articleSlug: slug, ...dateFilter },
        orderBy: { timestamp: 'desc' },
      }) as BlogAnalyticsRecord[];

      const views = stats.length;
      const uniqueVisitors = new Set(stats.map(s => s.sessionId)).size;
      const lastViewed = stats[0]?.timestamp || null;

      // Calculate engagement metrics
      const validScrollDepths = stats
        .map(s => s.scrollDepthPercent)
        .filter((v): v is number => v !== null && v !== undefined);
      const validTimesOnPage = stats
        .map(s => s.timeOnPage)
        .filter((v): v is number => v !== null && v !== undefined);
      const completedReads = stats.filter(s => s.completed).length;

      const avgScrollDepth = validScrollDepths.length > 0
        ? Math.round(validScrollDepths.reduce((a, b) => a + b, 0) / validScrollDepths.length)
        : null;
      const avgTimeOnPage = validTimesOnPage.length > 0
        ? Math.round(validTimesOnPage.reduce((a, b) => a + b, 0) / validTimesOnPage.length)
        : null;
      const completionRate = views > 0
        ? Math.round((completedReads / views) * 100)
        : null;

      return NextResponse.json({
        slug,
        views,
        uniqueVisitors,
        lastViewed: lastViewed?.toISOString() || null,
        engagement: {
          avgScrollDepth,
          avgTimeOnPage,
          completedReads,
          completionRate,
        },
      });
    }

    // Retourner toutes les stats triées par nombre de vues (filtrées par période)
    const allAnalytics = await prisma.blogAnalytics.findMany({
      where: dateFilter,
      select: {
        articleSlug: true,
        sessionId: true,
        timestamp: true,
        scrollDepthPercent: true,
        timeOnPage: true,
        completed: true,
      },
    }) as Array<{
      articleSlug: string;
      sessionId: string;
      timestamp: Date;
      scrollDepthPercent: number | null;
      timeOnPage: number | null;
      completed: boolean;
    }>;

    // Grouper par articleSlug
    const groupedBySlug = allAnalytics.reduce((acc, record) => {
      if (!acc[record.articleSlug]) {
        acc[record.articleSlug] = {
          views: 0,
          sessions: new Set<string>(),
          lastViewed: record.timestamp,
          scrollDepths: [] as number[],
          timesOnPage: [] as number[],
          completedReads: 0,
        };
      }
      acc[record.articleSlug].views += 1;
      acc[record.articleSlug].sessions.add(record.sessionId);
      if (record.timestamp > acc[record.articleSlug].lastViewed) {
        acc[record.articleSlug].lastViewed = record.timestamp;
      }
      if (record.scrollDepthPercent !== null) {
        acc[record.articleSlug].scrollDepths.push(record.scrollDepthPercent);
      }
      if (record.timeOnPage !== null) {
        acc[record.articleSlug].timesOnPage.push(record.timeOnPage);
      }
      if (record.completed) {
        acc[record.articleSlug].completedReads += 1;
      }
      return acc;
    }, {} as Record<string, {
      views: number;
      sessions: Set<string>;
      lastViewed: Date;
      scrollDepths: number[];
      timesOnPage: number[];
      completedReads: number;
    }>);

    // Transformer en array avec métriques calculées
    const articlesWithMetrics = Object.entries(groupedBySlug)
      .map(([slug, data]) => {
        const avgScrollDepth = data.scrollDepths.length > 0
          ? Math.round(data.scrollDepths.reduce((a, b) => a + b, 0) / data.scrollDepths.length)
          : null;
        const avgTimeOnPage = data.timesOnPage.length > 0
          ? Math.round(data.timesOnPage.reduce((a, b) => a + b, 0) / data.timesOnPage.length)
          : null;
        const completionRate = data.views > 0
          ? Math.round((data.completedReads / data.views) * 100)
          : null;

        return {
          slug,
          views: data.views,
          uniqueVisitors: data.sessions.size,
          averageViews: data.sessions.size > 0 ? (data.views / data.sessions.size).toFixed(2) : '0.00',
          lastViewed: data.lastViewed.toISOString(),
          engagement: {
            avgScrollDepth,
            avgTimeOnPage,
            completedReads: data.completedReads,
            completionRate,
          },
        };
      });

    // Calculer les maximums pour la normalisation du score
    const maxViews = Math.max(...articlesWithMetrics.map(a => a.views), 1);
    const maxUniqueVisitors = Math.max(...articlesWithMetrics.map(a => a.uniqueVisitors), 1);
    const maxTimeOnPage = Math.max(...articlesWithMetrics.map(a => a.engagement.avgTimeOnPage || 0), 1);
    const maxScrollDepth = 100; // Le scroll depth est déjà en pourcentage

    // Calculer le score composite pour chaque article
    // Score = (vues * 0.25) + (visiteurs * 0.20) + (durée * 0.25) + (lecture * 0.30)
    const allStats = articlesWithMetrics.map(article => {
      const viewsScore = (article.views / maxViews) * 25;
      const visitorsScore = (article.uniqueVisitors / maxUniqueVisitors) * 20;
      const timeScore = ((article.engagement.avgTimeOnPage || 0) / maxTimeOnPage) * 25;
      const readScore = ((article.engagement.avgScrollDepth || 0) / maxScrollDepth) * 30;

      const score = Math.round(viewsScore + visitorsScore + timeScore + readScore);

      return {
        ...article,
        score,
      };
    }).sort((a, b) => b.score - a.score);

    // Calculer les totaux
    const totalViews = allStats.reduce((sum, stat) => sum + stat.views, 0);
    const allUniqueSessions = new Set(allAnalytics.map(a => a.sessionId));

    return NextResponse.json({
      articles: allStats,
      totalViews,
      totalUniqueVisitors: allUniqueSessions.size,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// POST - Enregistrer une visite d'article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, sessionId } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    // Générer un sessionId si non fourni
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const finalSessionId = sessionId || hashVisitorId(userAgent, ip);

    // Enregistrer la visite dans PostgreSQL
    await prisma.blogAnalytics.create({
      data: {
        articleSlug: slug,
        sessionId: finalSessionId,
        timestamp: new Date(),
      },
    });

    // Calculer les stats après insertion
    const allViews = await prisma.blogAnalytics.findMany({
      where: { articleSlug: slug },
      select: { sessionId: true },
    }) as Array<{ sessionId: string }>;

    const views = allViews.length;
    const uniqueVisitors = new Set(allViews.map(v => v.sessionId)).size;

    return NextResponse.json({
      slug,
      views,
      uniqueVisitors,
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}

// DELETE - Réinitialiser les stats
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (slug) {
      // Réinitialiser les stats d'un article spécifique
      const result = await prisma.blogAnalytics.deleteMany({
        where: { articleSlug: slug },
      });

      return NextResponse.json({
        message: `Stats for ${slug} deleted`,
        deletedCount: result.count,
      });
    } else {
      // Réinitialiser toutes les stats
      // Cette action devrait être protégée en production
      const result = await prisma.blogAnalytics.deleteMany({});

      return NextResponse.json({
        message: 'All blog analytics stats deleted',
        deletedCount: result.count,
      });
    }
  } catch (error) {
    console.error('Error deleting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to delete analytics' },
      { status: 500 }
    );
  }
}
