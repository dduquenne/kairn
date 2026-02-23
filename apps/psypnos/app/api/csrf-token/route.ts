/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from 'next/server';

import { generateCSRFToken, getCSRFCookieConfig } from '../common/csrf-middleware';

export const dynamic = 'force-dynamic';

/**
 * Route API pour générer et fournir un token CSRF
 * GET /api/csrf-token
 *
 * Cette route génère un nouveau token CSRF, le stocke dans un cookie httpOnly
 * et le retourne dans la réponse pour être utilisé dans les formulaires.
 *
 * Le cookie est défini directement sur l'objet NextResponse pour garantir
 * que le header Set-Cookie est bien inclus dans la réponse (plus fiable
 * que cookies() de next/headers dans les Route Handlers sur Vercel).
 */
export async function GET() {
  try {
    // Générer un nouveau token CSRF
    const token = generateCSRFToken();

    // Créer la réponse
    const response = NextResponse.json(
      {
        token,
        success: true,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      }
    );

    // Stocker le token dans un cookie httpOnly directement sur la réponse
    const { cookieName, cookieOptions } = getCSRFCookieConfig();
    response.cookies.set(cookieName, token, cookieOptions);

    return response;
  } catch (error) {
    console.error('Erreur lors de la génération du token CSRF:', error);

    return NextResponse.json(
      {
        message: 'Impossible de générer le token CSRF. Veuillez réessayer.',
        success: false,
      },
      { status: 500 }
    );
  }
}
