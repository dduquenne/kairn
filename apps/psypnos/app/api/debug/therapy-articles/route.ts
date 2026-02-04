/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * API de diagnostic pour visualiser les articles filtrés par type de thérapie
 *
 * GET /api/debug/therapy-articles
 *
 * Retourne les articles qui s'afficheront sur chaque page de thérapie
 * avec leur score de pertinence et les détails des correspondances.
 *
 * UTILITÉ : Diagnostiquer pourquoi certains articles ne s'affichent pas
 * sur les pages de thérapie
 */

import { NextResponse } from "next/server";

import { getAllPostsAsync } from "@/lib/blog";
import {
  filterPsychotherapyPosts,
  filterHypnosisPosts,
  filterHolotropicPosts,
  getDetailedScores,
  PSYCHOTHERAPY_KEYWORDS,
  HYPNOSIS_KEYWORDS,
  HOLOTROPIC_BREATHING_KEYWORDS,
} from "@/lib/therapy-articles";

export async function GET() {
  const startTime = Date.now();

  try {
    console.log("[debug/therapy-articles] Démarrage du diagnostic");

    // Récupérer tous les articles publiés
    const allPosts = await getAllPostsAsync();

    console.log(
      `[debug/therapy-articles] ${allPosts.length} articles récupérés`
    );

    if (allPosts.length === 0) {
      return NextResponse.json(
        {
          error: "Aucun article trouvé dans la base de données",
          diagnostic: {
            message:
              "La base de données ne contient aucun article publié ou il y a un problème de connexion",
            suggestions: [
              "Vérifier la connexion à la base de données",
              "Vérifier que des articles sont publiés (published: true)",
              "Vérifier que la date des articles est <= aujourd'hui",
            ],
          },
        },
        { status: 200 }
      );
    }

    // Obtenir les scores détaillés pour chaque type de thérapie
    const psychotherapyScores = getDetailedScores(allPosts, "psychotherapy");
    const hypnosisScores = getDetailedScores(allPosts, "hypnosis");
    const holotropicScores = getDetailedScores(allPosts, "holotropic");

    // Filtrer les articles (ce qui sera réellement affiché)
    const psychotherapyPosts = filterPsychotherapyPosts(allPosts, 50);
    const hypnosisPosts = filterHypnosisPosts(allPosts, 50);
    const holotropicPosts = filterHolotropicPosts(allPosts, 50);

    // Identifier les articles qui ne matchent pour AUCUNE thérapie
    const unmatchedArticles = allPosts.filter((post) => {
      const psyScore =
        psychotherapyScores.find((sp) => sp.post.slug === post.slug)?.score ||
        0;
      const hypScore =
        hypnosisScores.find((sp) => sp.post.slug === post.slug)?.score || 0;
      const holoScore =
        holotropicScores.find((sp) => sp.post.slug === post.slug)?.score || 0;
      return psyScore < 5 && hypScore < 5 && holoScore < 5;
    });

    // Formater la réponse
    const response = {
      diagnostic: {
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        databaseStatus: "OK",
      },
      summary: {
        totalArticles: allPosts.length,
        psychotherapie: {
          displayed: psychotherapyPosts.length,
          keywordsCount: PSYCHOTHERAPY_KEYWORDS.length,
        },
        hypnose: {
          displayed: hypnosisPosts.length,
          keywordsCount: HYPNOSIS_KEYWORDS.length,
        },
        respirationHolotropique: {
          displayed: holotropicPosts.length,
          keywordsCount: HOLOTROPIC_BREATHING_KEYWORDS.length,
        },
        unmatchedArticles: unmatchedArticles.length,
      },
      allArticles: allPosts.map((post) => ({
        slug: post.slug,
        title: post.title,
        tags: post.tags,
        category: post.category,
      })),
      psychotherapie: {
        count: psychotherapyPosts.length,
        willDisplay: psychotherapyPosts.map((p) => p.title),
        topScores: psychotherapyScores.slice(0, 30).map((sp) => ({
          title: sp.post.title,
          slug: sp.post.slug,
          score: sp.score,
          tags: sp.post.tags,
          matchDetails: sp.matchDetails,
          willDisplay: sp.score >= 5,
        })),
      },
      hypnose: {
        count: hypnosisPosts.length,
        willDisplay: hypnosisPosts.map((p) => p.title),
        topScores: hypnosisScores.slice(0, 30).map((sp) => ({
          title: sp.post.title,
          slug: sp.post.slug,
          score: sp.score,
          tags: sp.post.tags,
          matchDetails: sp.matchDetails,
          willDisplay: sp.score >= 5,
        })),
      },
      respirationHolotropique: {
        count: holotropicPosts.length,
        willDisplay: holotropicPosts.map((p) => p.title),
        topScores: holotropicScores.slice(0, 30).map((sp) => ({
          title: sp.post.title,
          slug: sp.post.slug,
          score: sp.score,
          tags: sp.post.tags,
          matchDetails: sp.matchDetails,
          willDisplay: sp.score >= 5,
        })),
      },
      unmatchedArticles:
        unmatchedArticles.length > 0
          ? unmatchedArticles.map((p) => ({
              title: p.title,
              slug: p.slug,
              tags: p.tags,
              category: p.category,
              suggestion:
                "Cet article n'apparaîtra sur aucune page de thérapie. Ajoutez des tags pertinents.",
            }))
          : [],
    };

    console.log(
      `[debug/therapy-articles] Diagnostic terminé en ${Date.now() - startTime}ms`
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[debug/therapy-articles] ERREUR:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du diagnostic",
        details: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
