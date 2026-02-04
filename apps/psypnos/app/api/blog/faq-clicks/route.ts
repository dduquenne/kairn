/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { isMockMode, generateMockFaqClicks, logDataMode } from '@/lib/pwaDataMode';

/**
 * Type local pour BlogFaqClick (évite les problèmes de génération Prisma)
 */
interface BlogFaqClickRecord {
  id: string;
  timestamp: Date;
  articleSlug: string;
  sessionId: string;
  faqIndex: number;
  question: string | null;
}

// GET - Récupérer les statistiques des clics FAQ
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleSlug = searchParams.get('articleSlug');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Calculate date filters
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date();

    if (!startDateParam) {
      // Default: last 30 days
      startDate.setDate(endDate.getDate() - 30);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Log le mode de données
    logDataMode();

    // Si en mode mock, retourner des données simulées
    if (isMockMode()) {
      console.log('📊 [FAQ Clicks] Using MOCK data');
      const mockData = generateMockFaqClicks(articleSlug || undefined);
      return NextResponse.json(mockData);
    }

    // Mode réel - récupérer les vraies données
    console.log('📊 [FAQ Clicks] Using REAL data');

    // Build where clause with date filter
    const whereClause: Record<string, unknown> = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };
    if (articleSlug) {
      whereClause.articleSlug = articleSlug;
    }

    // Récupérer tous les clics FAQ depuis PostgreSQL (filtrés par période)
    const clicks = await prisma.blogFaqClick.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    });

    // Construire le résumé par faqId (question + faqIndex)
    const summary: Record<string, { opens: number; closes: number }> = {};

    clicks.forEach((click: BlogFaqClickRecord) => {
      const faqId = `${click.articleSlug}-${click.faqIndex}`;
      if (!summary[faqId]) {
        summary[faqId] = { opens: 0, closes: 0 };
      }
      // Note: Dans le schéma actuel, on n'a pas d'action open/close
      // On compte simplement les clics
      summary[faqId].opens += 1;
    });

    return NextResponse.json({
      clicks: clicks.map((c: BlogFaqClickRecord) => ({
        faqId: `${c.articleSlug}-${c.faqIndex}`,
        articleSlug: c.articleSlug,
        faqIndex: c.faqIndex,
        question: c.question,
        timestamp: c.timestamp.toISOString(),
      })),
      summary,
    });
  } catch (error) {
    console.error('Error fetching FAQ clicks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQ clicks' },
      { status: 500 }
    );
  }
}

// POST - Enregistrer un clic FAQ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleSlug, faqIndex, question, sessionId } = body;

    if (!articleSlug || faqIndex === undefined) {
      return NextResponse.json(
        { error: 'articleSlug and faqIndex are required' },
        { status: 400 }
      );
    }

    // Enregistrer le clic dans PostgreSQL
    const click = await prisma.blogFaqClick.create({
      data: {
        articleSlug,
        faqIndex: parseInt(faqIndex),
        question: question || null,
        sessionId: sessionId || 'anonymous',
        timestamp: new Date(),
      },
    });

    // Calculer le résumé pour ce FAQ
    const totalClicks = await prisma.blogFaqClick.count({
      where: {
        articleSlug,
        faqIndex: parseInt(faqIndex),
      },
    });

    return NextResponse.json({
      success: true,
      click: {
        id: click.id,
        articleSlug: click.articleSlug,
        faqIndex: click.faqIndex,
        question: click.question,
        timestamp: click.timestamp.toISOString(),
      },
      summary: {
        opens: totalClicks,
        closes: 0, // Pour compatibilité avec l'ancienne API
      },
    });
  } catch (error) {
    console.error('Error tracking FAQ click:', error);
    return NextResponse.json(
      { error: 'Failed to track FAQ click' },
      { status: 500 }
    );
  }
}

// DELETE - Réinitialiser les statistiques
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleSlug = searchParams.get('articleSlug');

    if (articleSlug) {
      // Supprimer les clics pour un article spécifique
      const result = await prisma.blogFaqClick.deleteMany({
        where: { articleSlug },
      });

      return NextResponse.json({
        message: `FAQ clicks for ${articleSlug} deleted`,
        deletedCount: result.count,
      });
    } else {
      // Supprimer tous les clics FAQ
      const result = await prisma.blogFaqClick.deleteMany({});

      return NextResponse.json({
        message: 'All FAQ clicks data deleted',
        deletedCount: result.count,
      });
    }
  } catch (error) {
    console.error('Error deleting FAQ clicks data:', error);
    return NextResponse.json(
      { error: 'Failed to delete FAQ clicks data' },
      { status: 500 }
    );
  }
}
