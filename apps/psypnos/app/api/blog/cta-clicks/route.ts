// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isMockMode, generateMockCtaClicks, logDataMode } from '@/lib/pwaDataMode';

const prisma = new PrismaClient();

// Type for blog CTA click record (workaround for ungenerated Prisma client)
type BlogCtaClickRecord = {
  id: string;
  articleSlug: string;
  ctaType: string;
  sessionId: string;
  timestamp: Date;
};

// GET - Récupérer les statistiques des clics CTA
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleSlug = searchParams.get('articleSlug');

    // Log le mode de données
    logDataMode();

    // Si en mode mock, retourner des données simulées
    if (isMockMode()) {
      console.log('📊 [CTA Clicks] Using MOCK data');
      const mockData = generateMockCtaClicks(articleSlug || undefined);
      return NextResponse.json(mockData);
    }

    // Mode réel - récupérer les vraies données
    console.log('📊 [CTA Clicks] Using REAL data');

    // Récupérer tous les clics CTA depuis PostgreSQL
    const clicks = await prisma.blogCtaClick.findMany({
      where: articleSlug ? { articleSlug } : undefined,
      orderBy: { timestamp: 'desc' },
    }) as BlogCtaClickRecord[];

    // Construire le résumé par type de CTA
    const summary = {
      appointment: 0,
      seminar: 0,
    };

    clicks.forEach((click) => {
      if (click.ctaType === 'appointment') {
        summary.appointment += 1;
      } else if (click.ctaType === 'seminar') {
        summary.seminar += 1;
      }
    });

    return NextResponse.json({
      clicks: clicks.map((c: BlogCtaClickRecord) => ({
        type: c.ctaType,
        articleSlug: c.articleSlug,
        timestamp: c.timestamp.toISOString(),
      })),
      summary,
    });
  } catch (error) {
    console.error('Error fetching CTA clicks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CTA clicks' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Enregistrer un clic CTA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, articleSlug, sessionId } = body;

    if (!type || !['appointment', 'seminar'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid type (appointment or seminar) is required' },
        { status: 400 }
      );
    }

    if (!articleSlug) {
      return NextResponse.json(
        { error: 'articleSlug is required' },
        { status: 400 }
      );
    }

    // Enregistrer le clic dans PostgreSQL
    const click = await prisma.blogCtaClick.create({
      data: {
        articleSlug,
        ctaType: type,
        sessionId: sessionId || 'anonymous',
        timestamp: new Date(),
      },
    }) as BlogCtaClickRecord;

    // Calculer le résumé après insertion
    const allClicks = await prisma.blogCtaClick.findMany({
      select: { ctaType: true },
    }) as Array<{ ctaType: string }>;

    const summary = {
      appointment: allClicks.filter(c => c.ctaType === 'appointment').length,
      seminar: allClicks.filter(c => c.ctaType === 'seminar').length,
    };

    return NextResponse.json({
      success: true,
      click: {
        id: click.id,
        type: click.ctaType,
        articleSlug: click.articleSlug,
        timestamp: click.timestamp.toISOString(),
      },
      summary,
    });
  } catch (error) {
    console.error('Error tracking CTA click:', error);
    return NextResponse.json(
      { error: 'Failed to track CTA click' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Réinitialiser les statistiques
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleSlug = searchParams.get('articleSlug');

    if (articleSlug) {
      // Supprimer les clics pour un article spécifique
      const result = await prisma.blogCtaClick.deleteMany({
        where: { articleSlug },
      });

      return NextResponse.json({
        message: `CTA clicks for ${articleSlug} deleted`,
        deletedCount: result.count,
      });
    } else {
      // Supprimer tous les clics CTA
      const result = await prisma.blogCtaClick.deleteMany({});

      return NextResponse.json({
        message: 'All CTA clicks data deleted',
        deletedCount: result.count,
      });
    }
  } catch (error) {
    console.error('Error deleting CTA clicks data:', error);
    return NextResponse.json(
      { error: 'Failed to delete CTA clicks data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
