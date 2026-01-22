// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * @module /api/blog/jobs/[id]
 * @description API endpoint pour consulter le statut d'un job de génération spécifique
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "../../../auth/middleware";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/blog/jobs/[id]
 *
 * Retourne le statut complet d'un job de génération.
 * Utilisé pour le polling depuis le frontend.
 *
 * Réponse:
 * - status: PENDING | PROCESSING | COMPLETED | FAILED
 * - progress: 0-100
 * - currentStep: description de l'étape en cours
 * - result: article généré (si COMPLETED)
 * - error: message d'erreur (si FAILED)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Vérifier l'authentification admin
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { message: "ID de job invalide" },
      { status: 400 }
    );
  }

  try {
    const job = await prisma.blogGenerationJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { message: "Job non trouvé" },
        { status: 404 }
      );
    }

    // Construire la réponse selon le statut
    const response: {
      id: string;
      status: string;
      progress: number;
      currentStep: string | null;
      totalSteps: number;
      createdAt: Date;
      updatedAt: Date;
      startedAt: Date | null;
      completedAt: Date | null;
      usedAt: Date | null;
      articleSlug: string | null;
      result?: any;
      error?: string | null;
      input?: any;
    } = {
      id: job.id,
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep,
      totalSteps: job.totalSteps,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      usedAt: job.usedAt,
      articleSlug: job.articleSlug,
    };

    // Inclure le résultat si le job est terminé
    if (job.status === "COMPLETED" && job.result) {
      response.result = job.result;
    }

    // Inclure l'erreur si le job a échoué
    if (job.status === "FAILED") {
      response.error = job.error;
      // Inclure aussi l'input pour permettre de réessayer
      response.input = job.input;
    }

    // Inclure le topic de l'input pour l'affichage
    if (job.input) {
      response.input = {
        topic: (job.input as any)?.topic || "Sans titre",
        category: (job.input as any)?.category,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error(`[BlogJob] Erreur récupération job ${id}:`, error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du job" },
      { status: 500 }
    );
  }
}
