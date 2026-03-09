/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * @module /api/blog/jobs/[id]/step
 * @description Endpoint step-by-step pour la génération d'articles IA.
 *
 * Chaque appel POST exécute UNE SEULE étape de génération,
 * permettant de rester dans la limite de 60s du plan Hobby Vercel.
 * Le frontend orchestre les appels séquentiels.
 */

import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '../../../../auth/middleware';
import { executeNextStep } from '../../step-executor';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/blog/jobs/[id]/step
 *
 * Exécute la prochaine étape de génération pour le job donné.
 *
 * Retourne :
 * - status: PROCESSING | COMPLETED | FAILED
 * - progress: 0-100
 * - currentStep: description de l'étape en cours
 * - currentStepIndex: index de la prochaine étape (0-based)
 * - totalSteps: nombre total d'étapes
 * - result: article généré (si COMPLETED)
 * - error: message d'erreur (si FAILED)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Vérifier l'authentification admin
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ message: 'ID de job invalide' }, { status: 400 });
  }

  try {
    const result = await executeNextStep(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`[BlogJob] Erreur step pour job ${id}:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erreur lors de l'exécution de l'étape" },
      { status: 500 }
    );
  }
}
