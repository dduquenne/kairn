/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";

import { slugExists } from "../../prisma-store";

/**
 * GET - Vérifie si un slug existe et propose un slug unique si nécessaire
 *
 * Query params:
 *   - slug: le slug à vérifier
 *
 * Response:
 *   - exists: boolean - true si le slug existe déjà
 *   - suggestedSlug: string - slug unique suggéré (avec suffixe si nécessaire)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Le paramètre 'slug' est requis" },
        { status: 400 }
      );
    }

    // Vérifier si le slug existe
    const exists = await slugExists(slug);

    if (!exists) {
      // Le slug est disponible
      return NextResponse.json({
        exists: false,
        suggestedSlug: slug,
      });
    }

    // Le slug existe, trouver un slug unique avec un suffixe numérique
    let suffix = 2;
    let suggestedSlug = `${slug}-${suffix}`;

    // Chercher un slug disponible en incrémentant le suffixe
    while (await slugExists(suggestedSlug)) {
      suffix++;
      suggestedSlug = `${slug}-${suffix}`;

      // Limite de sécurité pour éviter une boucle infinie
      if (suffix > 100) {
        // Utiliser un timestamp comme fallback
        suggestedSlug = `${slug}-${Date.now()}`;
        break;
      }
    }

    return NextResponse.json({
      exists: true,
      suggestedSlug,
    });
  } catch (error) {
    console.error("Error checking slug:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification du slug" },
      { status: 500 }
    );
  }
}
