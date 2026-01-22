// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Route d'initiation OAuth Facebook
 *
 * GET /api/social/auth/facebook
 *
 * Redirige l'utilisateur vers la page d'autorisation Facebook.
 * Un state token est généré et stocké en session pour validation CSRF.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { withAdminAuth } from '@/app/api/auth/middleware';
import { facebook } from '@/lib/social/oauth';
import { getOAuthStateCookieOptions } from '@/lib/cookies';

// Durée de vie du state token (10 minutes)
const STATE_EXPIRY_MS = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin authentifié
    const authResult = await withAdminAuth();
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    // Vérifier la configuration Facebook
    const config = facebook.checkFacebookConfig();
    if (!config.valid) {
      return NextResponse.json(
        { error: config.error },
        { status: 500 }
      );
    }

    // Générer un state token unique pour CSRF protection
    const state = randomBytes(32).toString('hex');

    // Stocker le state dans un cookie sécurisé
    const cookieStore = await cookies();
    const stateData = JSON.stringify({
      token: state,
      expires: Date.now() + STATE_EXPIRY_MS,
      userId: user.sub,
    });

    cookieStore.set('social_oauth_state', stateData, getOAuthStateCookieOptions(STATE_EXPIRY_MS / 1000));

    // Construire l'URL de redirection
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/social/auth/callback`;

    // Générer l'URL d'autorisation Facebook
    const authUrl = facebook.getAuthorizationUrl(redirectUri, state);

    // Rediriger vers Facebook
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[Facebook OAuth] Erreur initiation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'initiation OAuth' },
      { status: 500 }
    );
  }
}
