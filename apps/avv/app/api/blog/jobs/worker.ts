/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * @module Worker de génération d'articles de blog
 * @description Exécute la génération d'articles en arrière-plan
 *
 * Ce worker est appelé de manière asynchrone après la création d'un job.
 * Il met à jour le statut du job en base de données à chaque étape.
 */

import { prisma } from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

import {
  generateArticleSectional,
  type GenerationProgress,
  type SectionalGenerationOptions,
} from '../../common/claude-article-generator-sectional';

import type { CreateJobInput } from './route';

/**
 * Met à jour la progression d'un job dans la base de données
 */
async function updateJobProgress(
  jobId: string,
  progress: number,
  currentStep: string
): Promise<void> {
  try {
    await prisma.blogGenerationJob.update({
      where: { id: jobId },
      data: {
        progress,
        currentStep,
        updatedAt: new Date(),
      },
    });
    console.log(`[BlogJob:${jobId}] Progression: ${progress}% - ${currentStep}`);
  } catch (error) {
    console.error(`[BlogJob:${jobId}] Erreur mise à jour progression:`, error);
  }
}

/**
 * Marque un job comme en cours de traitement
 */
async function markJobAsProcessing(jobId: string): Promise<void> {
  await prisma.blogGenerationJob.update({
    where: { id: jobId },
    data: {
      status: 'PROCESSING',
      startedAt: new Date(),
      currentStep: 'Démarrage de la génération...',
    },
  });
  console.log(`[BlogJob:${jobId}] Job démarré (PROCESSING)`);
}

/**
 * Marque un job comme terminé avec succès
 */
async function markJobAsCompleted(jobId: string, result: any): Promise<void> {
  await prisma.blogGenerationJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      progress: 100,
      currentStep: 'Génération terminée',
      result: result,
      completedAt: new Date(),
    },
  });
  console.log(`[BlogJob:${jobId}] Job terminé avec succès (COMPLETED)`);
}

/**
 * Marque un job comme échoué
 */
async function markJobAsFailed(jobId: string, error: string): Promise<void> {
  await prisma.blogGenerationJob.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      currentStep: 'Échec de la génération',
      error: error,
      completedAt: new Date(),
    },
  });
  console.log(`[BlogJob:${jobId}] Job échoué (FAILED): ${error}`);
}

/**
 * Exécute le worker de génération pour un job donné
 *
 * Cette fonction:
 * 1. Récupère le job et ses paramètres
 * 2. Met le job en statut PROCESSING
 * 3. Exécute la génération avec callbacks de progression
 * 4. Met à jour le job avec le résultat (COMPLETED) ou l'erreur (FAILED)
 */
export async function runBlogGenerationWorker(jobId: string, apiKey: string): Promise<void> {
  console.log(`[BlogJob:${jobId}] Démarrage du worker de génération`);

  try {
    const siteId = await getSiteId();

    // Récupérer le job
    const job = await prisma.blogGenerationJob.findFirst({
      where: { id: jobId, siteId },
    });

    if (!job) {
      console.error(`[BlogJob:${jobId}] Job non trouvé`);
      return;
    }

    // Vérifier que le job est toujours en attente
    if (job.status !== 'PENDING') {
      console.warn(`[BlogJob:${jobId}] Job déjà traité (status: ${job.status})`);
      return;
    }

    // Extraire les paramètres d'entrée
    const input = job.input as CreateJobInput;

    // Fusionner les champs pour rétrocompatibilité
    const allTones = input.preferredTones || input.tones || [];

    // Construire les options de génération
    const options: SectionalGenerationOptions = {
      topic: input.topic || input.subject || '',
      category: input.category,
      editorialCategory: input.editorialCategory || input.category,
      targetLength: input.targetLength,
      seoQuery: input.seoQuery || input.seoKeyword || '',
      searchIntent: input.searchIntent || input.searchIntention || '',
      readerPersona: input.readerPersona || input.persona || '',
      preferredTones: allTones,
      useAvvStyle: input.useAvvStyle,
      // Callback de progression pour mettre à jour le job
      onProgress: async (progress: GenerationProgress) => {
        const progressPercent = Math.round((progress.step / progress.totalSteps) * 100);

        // Construire le message de progression
        let stepMessage = progress.name;
        if (progress.message) {
          stepMessage = progress.message;
        }
        if (progress.substep) {
          stepMessage = `${progress.name} (${progress.substep.current}/${progress.substep.total})`;
        }

        await updateJobProgress(jobId, progressPercent, stepMessage);
      },
    };

    // Marquer comme en cours de traitement
    await markJobAsProcessing(jobId);

    // Exécuter la génération
    const result = await generateArticleSectional(options, apiKey);

    // Vérifier le résultat
    if (!result.success && !result.content) {
      // Échec complet
      await markJobAsFailed(jobId, result.error || "Erreur lors de la génération de l'article");
      return;
    }

    // Succès (complet ou partiel)
    const articleData = {
      success: result.success,
      article: {
        title: result.title,
        description: result.description,
        content: result.content,
        category: result.category || input.category,
        tags: result.tags,
        faq: result.faq,
        imagePrompt: result.imagePrompt,
      },
      generationMetadata: result.generationMetadata,
      // Avertissement si génération partielle
      ...(result.success === false &&
        result.content && {
          warning: 'Génération partielle - certaines étapes ont échoué',
          error: result.error,
        }),
    };

    await markJobAsCompleted(jobId, articleData);
  } catch (error) {
    console.error(`[BlogJob:${jobId}] Erreur worker:`, error);
    await markJobAsFailed(
      jobId,
      error instanceof Error ? error.message : 'Erreur inconnue lors de la génération'
    );
  }
}

/**
 * Récupère et retraite les jobs orphelins (PROCESSING sans mise à jour récente)
 *
 * Cette fonction est appelée au démarrage du serveur pour gérer les cas où:
 * - Le serveur a redémarré pendant une génération
 * - Un job est resté bloqué en PROCESSING
 *
 * Les jobs orphelins sont marqués comme FAILED avec un message explicatif.
 */
export async function cleanupOrphanedJobs(maxAgeMinutes: number = 30): Promise<number> {
  console.log('[BlogJob] Nettoyage des jobs orphelins...');

  try {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const siteId = await getSiteId();

    // Trouver les jobs PROCESSING qui n'ont pas été mis à jour depuis longtemps
    const orphanedJobs = await prisma.blogGenerationJob.findMany({
      where: {
        siteId,
        status: 'PROCESSING',
        updatedAt: {
          lt: cutoffTime,
        },
      },
    });

    if (orphanedJobs.length === 0) {
      console.log('[BlogJob] Aucun job orphelin trouvé');
      return 0;
    }

    // Marquer les jobs orphelins comme FAILED
    const result = await prisma.blogGenerationJob.updateMany({
      where: {
        id: {
          in: orphanedJobs.map((j: (typeof orphanedJobs)[number]) => j.id),
        },
      },
      data: {
        status: 'FAILED',
        error: `Job interrompu - le serveur a redémarré ou le job est resté bloqué pendant plus de ${maxAgeMinutes} minutes`,
        completedAt: new Date(),
      },
    });

    console.log(`[BlogJob] ${result.count} jobs orphelins marqués comme FAILED`);

    return result.count;
  } catch (error) {
    console.error('[BlogJob] Erreur nettoyage jobs orphelins:', error);
    return 0;
  }
}
