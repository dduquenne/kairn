// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from 'next/server';
import { isMockMode, logDataMode } from '@/lib/pwaDataMode';

export const dynamic = 'force-dynamic';

/**
 * Interface pour les métriques Web Vitals
 * Basé sur la spécification web-vitals de Google
 */
interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  navigationType?: string;
  attribution?: Record<string, unknown>;
}

interface WebVitalsPayload extends WebVitalsMetric {
  pathname: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * POST /api/analytics/web-vitals
 * Enregistre les métriques Web Vitals pour l'analyse des performances
 */
export async function POST(request: NextRequest) {
  try {
    logDataMode();

    const body = await request.json() as WebVitalsPayload;
    const { name, value, rating, pathname } = body;

    // En mode mock, on ne fait qu'accepter les données sans les stocker
    if (isMockMode()) {
      console.log('📊 [Web Vitals] MOCK mode - Metric received but not stored:', {
        name,
        value,
        rating,
        pathname
      });
      return NextResponse.json({ success: true, mode: 'mock' }, { status: 200 });
    }

    // Mode réel - log les métriques pour analyse
    console.log('📊 [Web Vitals] Real mode - Metric received:', {
      name,
      value,
      rating,
      pathname,
      timestamp: new Date().toISOString()
    });

    // TODO: Stocker dans PostgreSQL si nécessaire
    // Pour l'instant, on accepte simplement les métriques
    // On pourrait créer une table WebVitals dans Prisma pour stocker ces données

    return NextResponse.json({
      success: true,
      mode: 'real',
      message: 'Web Vitals metric logged successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing web vitals:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process web vitals metric'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/web-vitals
 * Récupère les métriques Web Vitals agrégées (optionnel, pour futur dashboard)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pathname = searchParams.get('pathname');

    logDataMode();

    // En mode mock, retourner des données simulées
    if (isMockMode()) {
      console.log('📊 [Web Vitals] Using MOCK data');

      const mockMetrics = {
        CLS: { value: 0.05, rating: 'good' as const },
        FID: { value: 45, rating: 'good' as const },
        FCP: { value: 1200, rating: 'good' as const },
        LCP: { value: 1800, rating: 'good' as const },
        TTFB: { value: 250, rating: 'good' as const },
        INP: { value: 150, rating: 'good' as const }
      };

      return NextResponse.json({
        pathname: pathname || 'all',
        metrics: mockMetrics,
        sampleSize: 100,
        mode: 'mock'
      }, { status: 200 });
    }

    // Mode réel - retourner des métriques vides pour l'instant
    console.log('📊 [Web Vitals] Using REAL data');

    return NextResponse.json({
      pathname: pathname || 'all',
      metrics: {},
      sampleSize: 0,
      mode: 'real',
      message: 'Web Vitals aggregation not yet implemented'
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching web vitals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch web vitals' },
      { status: 500 }
    );
  }
}
