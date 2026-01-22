// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * API pour les analytics des réseaux sociaux
 *
 * GET /api/social/analytics - Récupère les statistiques du dashboard
 * POST /api/social/analytics/refresh - Rafraîchit les analytics depuis les APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/api/auth/middleware';
import {
  getDashboardStats,
  getStatsByPlatform,
  getTopPerformingPosts,
  getTrendData,
  getRecentPosts,
} from '@/lib/social/analytics';

// ===========================================
// GET - Récupérer les statistiques
// ===========================================

export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);

    // Paramètres de date optionnels
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

    // Si ni startDate ni endDate, utiliser les X derniers jours
    if (!startDate && !endDate && days) {
      const daysNum = parseInt(days, 10);
      endDate = new Date();
      startDate = new Date(endDate.getTime() - daysNum * 24 * 60 * 60 * 1000);
    }

    // Récupérer toutes les données en parallèle
    const [stats, platformStats, topPosts, trendData, recentPosts] = await Promise.all([
      getDashboardStats(startDate, endDate),
      getStatsByPlatform(startDate, endDate),
      getTopPerformingPosts(10, startDate, endDate),
      getTrendData(30, startDate, endDate),
      getRecentPosts(20),
    ]);

    return NextResponse.json({
      stats,
      platformStats,
      topPosts,
      trendData,
      recentPosts,
    });
  } catch (error) {
    console.error('[Social Analytics API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
