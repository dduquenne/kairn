/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";

import {
  generateCSRFToken,
  setCSRFCookie,
} from "../common/csrf-middleware";

export const dynamic = 'force-dynamic';

/**
 * Route API pour générer et fournir un token CSRF
 * GET /api/csrf-token
 *
 * Cette route génère un nouveau token CSRF, le stocke dans un cookie httpOnly
 * et le retourne dans la réponse pour être utilisé dans les formulaires.
 */
export async function GET() {
  try {
    // Générer un nouveau token CSRF
    const token = generateCSRFToken();

    // Stocker le token dans un cookie httpOnly
    await setCSRFCookie(token);

    // Retourner le token dans la réponse
    return NextResponse.json(
      {
        token,
        success: true,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
        },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la génération du token CSRF:", error);

    return NextResponse.json(
      {
        message:
          "Impossible de générer le token CSRF. Veuillez réessayer.",
        success: false,
      },
      { status: 500 }
    );
  }
}
