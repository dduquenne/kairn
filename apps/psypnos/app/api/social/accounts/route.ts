/**
 * API REST pour la gestion des comptes sociaux
 *
 * GET /api/social/accounts - Liste tous les comptes
 * POST /api/social/accounts - Créer un compte (usage interne)
 *
 * Protégé par authentification admin
 */

import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { getAllSocialAccounts, getActiveAccountsByPlatform } from '@/lib/social/store';
import type { SocialPlatform } from '@/lib/social/types';

/**
 * GET /api/social/accounts
 *
 * Liste tous les comptes sociaux.
 * Query params:
 * - platform: Filtrer par plateforme (FACEBOOK, LINKEDIN, INSTAGRAM)
 * - active: Filtrer par statut actif (true/false)
 */
export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') as SocialPlatform | null;
    const activeOnly = searchParams.get('active') === 'true';

    let accounts;

    if (platform && activeOnly) {
      accounts = await getActiveAccountsByPlatform(platform);
    } else {
      accounts = await getAllSocialAccounts();

      // Filtrer manuellement si nécessaire
      if (platform) {
        accounts = accounts.filter(a => a.platform === platform);
      }
      if (activeOnly) {
        accounts = accounts.filter(a => a.isActive);
      }
    }

    // Calculer des statistiques
    const stats = {
      total: accounts.length,
      active: accounts.filter(a => a.isActive).length,
      byPlatform: {
        FACEBOOK: accounts.filter(a => a.platform === 'FACEBOOK').length,
        LINKEDIN: accounts.filter(a => a.platform === 'LINKEDIN').length,
        INSTAGRAM: accounts.filter(a => a.platform === 'INSTAGRAM').length,
      },
      expiringSoon: accounts.filter(a => {
        if (!a.tokenExpiry) return false;
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return a.tokenExpiry < sevenDaysFromNow;
      }).length,
    };

    return NextResponse.json({
      accounts,
      stats,
    });
  } catch (error) {
    console.error('[Social Accounts API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des comptes' },
      { status: 500 }
    );
  }
}
