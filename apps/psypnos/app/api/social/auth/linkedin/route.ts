/**
 * Route d'initiation OAuth LinkedIn
 *
 * GET /api/social/auth/linkedin
 *
 * Redirige l'utilisateur vers la page d'autorisation LinkedIn.
 * Un state token est généré et stocké en session pour validation CSRF.
 */

import { randomBytes } from 'crypto';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { getOAuthStateCookieOptions } from '@/lib/cookies';
import { linkedin } from '@/lib/social/oauth';

// Durée de vie du state token (10 minutes)
const STATE_EXPIRY_MS = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin authentifié
    const authResult = await withAdminAuth();
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    // Vérifier la configuration LinkedIn
    const config = linkedin.checkLinkedInConfig();
    if (!config.valid) {
      return NextResponse.json({ error: config.error }, { status: 500 });
    }

    // Générer un state token unique pour CSRF protection
    const state = randomBytes(32).toString('hex');

    // Stocker le state dans un cookie sécurisé avec indication de la plateforme
    const cookieStore = await cookies();
    const stateData = JSON.stringify({
      token: state,
      platform: 'linkedin',
      expires: Date.now() + STATE_EXPIRY_MS,
      userId: user.sub,
    });

    cookieStore.set(
      'social_oauth_state',
      stateData,
      getOAuthStateCookieOptions(STATE_EXPIRY_MS / 1000)
    );

    // Construire l'URL de redirection
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/social/auth/callback`;

    // Générer l'URL d'autorisation LinkedIn
    const authUrl = linkedin.getAuthorizationUrl(redirectUri, state);

    // Rediriger vers LinkedIn
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[LinkedIn OAuth] Erreur initiation:', error);
    return NextResponse.json({ error: "Erreur lors de l'initiation OAuth" }, { status: 500 });
  }
}
