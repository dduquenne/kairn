/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * API pour rafraîchir les analytics depuis les APIs sociales
 *
 * POST /api/social/analytics/refresh - Rafraîchit les analytics
 */

import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { refreshPostAnalytics, refreshRecentAnalytics } from '@/lib/social/analytics';

// ===========================================
// POST - Rafraîchir les analytics
// ===========================================

export async function POST(request: NextRequest) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json().catch(() => ({}));
    const postId = body.postId;
    const hoursBack = body.hoursBack || 48;

    if (postId) {
      // Rafraîchir un post spécifique
      const analytics = await refreshPostAnalytics(postId);

      if (!analytics) {
        return NextResponse.json(
          { error: 'Impossible de rafraîchir les analytics pour ce post' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Analytics rafraîchis',
        analytics,
      });
    } else {
      // Rafraîchir tous les posts récents
      const result = await refreshRecentAnalytics(hoursBack);

      return NextResponse.json({
        success: true,
        message: `${result.refreshed} posts rafraîchis, ${result.failed} échecs`,
        ...result,
      });
    }
  } catch (error) {
    console.error('[Social Analytics Refresh API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
