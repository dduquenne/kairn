/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * Cron Cleanup Jobs API Route
 *
 * Nettoie les jobs de génération de blog orphelins ou anciens.
 *
 * Fonctionnalités:
 * - Marque les jobs PROCESSING depuis plus de 30 min comme FAILED
 * - Supprime les jobs COMPLETED/FAILED de plus de 7 jours
 * - Nettoie les logs de génération sociale anciens
 *
 * Fréquence recommandée: tous les jours à 4h (0 4 * * *)
 *
 * Security: QStash signature or CRON_SECRET
 */

import { verifyCronAuth } from "@kairn/core/scheduler";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

// Configuration
const ORPHAN_TIMEOUT_MINUTES = 30;
const RETENTION_DAYS = 7;
const SOCIAL_LOG_RETENTION_DAYS = 30;

export async function GET(request: NextRequest) {
  // Verify authentication (QStash signature or CRON_SECRET)
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: Record<string, unknown> = {
    orphanedJobs: 0,
    deletedJobs: 0,
    deletedSocialLogs: 0,
  };

  try {
    // 1. Marquer les jobs PROCESSING orphelins comme FAILED
    const orphanCutoff = new Date(Date.now() - ORPHAN_TIMEOUT_MINUTES * 60 * 1000);

    const orphanedJobs = await prisma.blogGenerationJob.updateMany({
      where: {
        status: "PROCESSING",
        startedAt: {
          lt: orphanCutoff,
        },
      },
      data: {
        status: "FAILED",
        error: `Job orphelin - timeout après ${ORPHAN_TIMEOUT_MINUTES} minutes sans activité`,
        completedAt: new Date(),
      },
    });
    results.orphanedJobs = orphanedJobs.count;

    if (orphanedJobs.count > 0) {
      console.log(`[Cron:cleanup-jobs] ${orphanedJobs.count} jobs orphelins marqués comme FAILED`);
    }

    // 2. Supprimer les vieux jobs COMPLETED ou FAILED
    const retentionCutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const deletedJobs = await prisma.blogGenerationJob.deleteMany({
      where: {
        status: {
          in: ["COMPLETED", "FAILED"],
        },
        completedAt: {
          lt: retentionCutoff,
        },
      },
    });
    results.deletedJobs = deletedJobs.count;

    if (deletedJobs.count > 0) {
      console.log(`[Cron:cleanup-jobs] ${deletedJobs.count} vieux jobs supprimés (>${RETENTION_DAYS} jours)`);
    }

    // 3. Supprimer les anciens logs de génération sociale
    const socialLogCutoff = new Date(Date.now() - SOCIAL_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const deletedSocialLogs = await prisma.socialGenerationLog.deleteMany({
      where: {
        createdAt: {
          lt: socialLogCutoff,
        },
      },
    });
    results.deletedSocialLogs = deletedSocialLogs.count;

    if (deletedSocialLogs.count > 0) {
      console.log(`[Cron:cleanup-jobs] ${deletedSocialLogs.count} logs de génération sociale supprimés (>${SOCIAL_LOG_RETENTION_DAYS} jours)`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      message: "Nettoyage des jobs terminé",
      duration: `${duration}s`,
      processed: orphanedJobs.count + deletedJobs.count + deletedSocialLogs.count,
      results,
    });
  } catch (error) {
    console.error("[Cron:cleanup-jobs] Erreur:", error);
    return NextResponse.json(
      {
        error: "Cleanup failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
