/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * @module /api/blog/jobs
 * @description API endpoints pour la gestion des jobs de génération d'articles
 *
 * POST - Créer un nouveau job de génération
 * GET - Lister les jobs récents
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

import { withAdminAuth } from '../../auth/middleware';

/**
 * Schéma de validation pour les paramètres de génération
 */
const createJobSchema = z.object({
  topic: z.string().trim().min(1, 'Le sujet est requis'),
  category: z.enum(['Comprendre', 'Traverser', 'Découvrir', 'Cheminer']),
  targetLength: z.enum(['short', 'medium', 'long']).optional().default('medium'),
  editorialCategory: z.enum(['Comprendre', 'Traverser', 'Découvrir', 'Cheminer']).optional(),
  preferredTones: z.array(z.string()).optional(),
  tones: z.array(z.string()).optional(),
  seoQuery: z.string().trim().optional(),
  searchIntent: z.string().trim().optional(),
  readerPersona: z.string().optional(),
  useAvvStyle: z.boolean().optional().default(true),
  // Rétrocompatibilité
  subject: z.string().trim().optional(),
  seoKeyword: z.string().trim().optional(),
  searchIntention: z.string().trim().optional(),
  persona: z.string().optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

/**
 * POST /api/blog/jobs
 *
 * Crée un nouveau job de génération d'article en base de données.
 * Le frontend pilote ensuite l'exécution via POST /api/blog/jobs/[id]/step.
 * Retourne immédiatement l'ID du job.
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification admin
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  let input: CreateJobInput;

  try {
    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstError?.message ?? 'Données invalides.' },
        { status: 400 }
      );
    }

    input = parsed.data;
  } catch (error) {
    return NextResponse.json({ message: 'Données invalides.' }, { status: 400 });
  }

  try {
    const siteId = await getSiteId();

    // Créer le job en base de données
    // Le frontend pilotera l'exécution via POST /api/blog/jobs/[id]/step
    const job = await prisma.blogGenerationJob.create({
      data: {
        status: 'PENDING',
        input: input as any, // JSON
        progress: 0,
        currentStep: 'En attente de traitement',
        currentStepIndex: 0,
        totalSteps: 9,
        siteId,
      },
    });

    console.log(`[BlogJob] Job créé: ${job.id}`);

    // Retourner l'ID du job — le frontend enchaînera les appels step-by-step
    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      message: 'Job de génération créé avec succès',
    });
  } catch (error) {
    console.error('[BlogJob] Erreur création job:', error);
    return NextResponse.json({ message: 'Erreur lors de la création du job' }, { status: 500 });
  }
}

/**
 * GET /api/blog/jobs
 *
 * Liste les jobs de génération récents pour l'interface admin.
 * Paramètres optionnels:
 * - limit: nombre de jobs à retourner (défaut: 20)
 * - status: filtrer par statut
 */
export async function GET(request: NextRequest) {
  // Vérifier l'authentification admin
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const searchParams = request.nextUrl.searchParams;
  const limitParam = searchParams.get('limit');
  const statusParam = searchParams.get('status');

  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;
  const status = statusParam as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;

  try {
    const siteId = await getSiteId();

    const jobs = await prisma.blogGenerationJob.findMany({
      where: { siteId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        progress: true,
        currentStep: true,
        totalSteps: true,
        input: true,
        error: true,
        createdAt: true,
        updatedAt: true,
        startedAt: true,
        completedAt: true,
        usedAt: true,
        articleSlug: true,
        // Ne pas inclure le résultat complet dans la liste (trop volumineux)
      },
    });

    // Extraire le topic de l'input pour l'affichage
    const jobsWithTopic = jobs.map((job: (typeof jobs)[number]) => ({
      ...job,
      topic: (job.input as Record<string, unknown>)?.topic || 'Sans titre',
    }));

    return NextResponse.json({
      jobs: jobsWithTopic,
      total: jobsWithTopic.length,
    });
  } catch (error) {
    console.error('[BlogJob] Erreur liste jobs:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des jobs' },
      { status: 500 }
    );
  }
}
