/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Route d'initiation OAuth Twitter/X
 *
 * GET /api/social/auth/twitter
 *
 * Redirige l'utilisateur vers la page d'autorisation Twitter.
 * Un state token est généré et stocké en session pour validation CSRF.
 * Twitter utilise OAuth 2.0 avec PKCE, donc un code_verifier est aussi généré.
 */

import { randomBytes } from 'crypto';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { getOAuthStateCookieOptions } from '@/lib/cookies';
import { twitter } from '@/lib/social/oauth';

// Durée de vie du state token (10 minutes)
const STATE_EXPIRY_MS = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin authentifié
    const authResult = await withAdminAuth();
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    // Vérifier la configuration Twitter
    const config = twitter.checkTwitterConfig();
    if (!config.valid) {
      return NextResponse.json(
        { error: config.error },
        { status: 500 }
      );
    }

    // Générer un state token unique pour CSRF protection
    const state = randomBytes(32).toString('hex');

    // Générer les paramètres PKCE
    const codeVerifier = twitter.generateCodeVerifier();
    const codeChallenge = twitter.generateCodeChallenge(codeVerifier);

    // Stocker le state et le code_verifier dans un cookie sécurisé
    const cookieStore = await cookies();
    const stateData = JSON.stringify({
      token: state,
      platform: 'twitter',
      codeVerifier, // Nécessaire pour PKCE
      expires: Date.now() + STATE_EXPIRY_MS,
      userId: user.sub,
    });

    cookieStore.set('social_oauth_state', stateData, getOAuthStateCookieOptions(STATE_EXPIRY_MS / 1000));

    // Construire l'URL de redirection
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/social/auth/callback`;

    // Générer l'URL d'autorisation Twitter avec PKCE
    const authUrl = twitter.getAuthorizationUrl(redirectUri, state, codeChallenge);

    console.log('[Twitter OAuth] Redirection vers:', authUrl);

    // Rediriger vers Twitter
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[Twitter OAuth] Erreur initiation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'initiation OAuth Twitter' },
      { status: 500 }
    );
  }
}
