/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * API pour rafraîchir le token d'un compte social
 *
 * POST /api/social/accounts/[id]/refresh
 *
 * Force le rafraîchissement du token d'accès d'un compte.
 * Utile pour les tokens LinkedIn qui expirent.
 */

import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { refreshAccountToken } from '@/lib/social/oauth/refresh';
import { getSocialAccountById } from '@/lib/social/store';
import type { SocialAccountFull } from '@/lib/social/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/social/accounts/[id]/refresh
 *
 * Rafraîchit manuellement le token d'un compte
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;

    // Récupérer le compte avec les tokens
    const account = await getSocialAccountById(id);
    if (!account) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 });
    }

    // Les comptes Facebook/Instagram n'ont pas besoin de refresh
    if (account.platform === 'FACEBOOK' || account.platform === 'INSTAGRAM') {
      return NextResponse.json({
        success: true,
        message: 'Les tokens de page Facebook/Instagram n\'expirent pas',
        needsRefresh: false,
      });
    }

    // Convertir en SocialAccountFull pour le refresh
    // Note: Dans un vrai scénario, on devrait récupérer les tokens directement de la DB
    const fullAccount: SocialAccountFull = {
      ...account,
      accessToken: account.accessToken || '',
      refreshToken: account.refreshToken || null,
      metadata: account.metadata || null,
    };

    // Tenter le refresh
    const result = await refreshAccountToken(fullAccount);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        newExpiry: result.newExpiry,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          needsReconnection: true,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Social Account Refresh] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors du rafraîchissement du token' },
      { status: 500 }
    );
  }
}
