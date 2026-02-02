// @ts-nocheck
// TODO: Migration - BlogAnalytics model not available in Kairn schema
/**
 * Cron Cleanup Data API Route
 *
 * Purge les données analytiques anciennes pour optimiser les performances
 * de la base de données.
 *
 * Stratégie de rétention:
 * - PageVisit: 90 jours (données brutes de visites)
 * - BlogAnalytics: 90 jours (données brutes de lectures)
 * - BotVisit: 30 jours (visites de robots)
 * - SectionTime: 60 jours (temps passé par section)
 * - AlertHistory: 60 jours (historique des alertes)
 * - VisitorGeolocation: 60 jours (géolocalisation)
 *
 * Note: Les données agrégées (DailySummary, etc.) sont conservées plus longtemps.
 *
 * Fréquence recommandée: tous les jours à 3h (0 3 * * *)
 *
 * Security: QStash signature or CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyCronAuth } from "@kairn/core/scheduler";

// Configuration de rétention (en jours)
const RETENTION_CONFIG = {
  pageVisit: 90,
  blogAnalytics: 90,
  blogCtaClick: 90,
  blogFaqClick: 90,
  botVisit: 30,
  sectionTime: 60,
  alertHistory: 60,
  visitorGeolocation: 60,
  customEvents: 60,
  conversionEvents: 90,
};

interface CleanupResult {
  table: string;
  deleted: number;
  retentionDays: number;
}

export async function GET(request: NextRequest) {
  // Verify authentication (QStash signature or CRON_SECRET)
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: CleanupResult[] = [];
  let totalDeleted = 0;

  try {
    // 1. Nettoyer PageVisit
    const pageVisitCutoff = new Date(Date.now() - RETENTION_CONFIG.pageVisit * 24 * 60 * 60 * 1000);
    const pageVisitResult = await prisma.pageVisit.deleteMany({
      where: { timestamp: { lt: pageVisitCutoff } },
    });
    results.push({ table: "PageVisit", deleted: pageVisitResult.count, retentionDays: RETENTION_CONFIG.pageVisit });
    totalDeleted += pageVisitResult.count;

    // 2. Nettoyer BlogAnalytics
    const blogAnalyticsCutoff = new Date(Date.now() - RETENTION_CONFIG.blogAnalytics * 24 * 60 * 60 * 1000);
    const blogAnalyticsResult = await prisma.blogAnalytics.deleteMany({
      where: { timestamp: { lt: blogAnalyticsCutoff } },
    });
    results.push({ table: "BlogAnalytics", deleted: blogAnalyticsResult.count, retentionDays: RETENTION_CONFIG.blogAnalytics });
    totalDeleted += blogAnalyticsResult.count;

    // 3. Nettoyer BlogCtaClick
    const blogCtaClickCutoff = new Date(Date.now() - RETENTION_CONFIG.blogCtaClick * 24 * 60 * 60 * 1000);
    const blogCtaClickResult = await prisma.blogCtaClick.deleteMany({
      where: { timestamp: { lt: blogCtaClickCutoff } },
    });
    results.push({ table: "BlogCtaClick", deleted: blogCtaClickResult.count, retentionDays: RETENTION_CONFIG.blogCtaClick });
    totalDeleted += blogCtaClickResult.count;

    // 4. Nettoyer BlogFaqClick
    const blogFaqClickCutoff = new Date(Date.now() - RETENTION_CONFIG.blogFaqClick * 24 * 60 * 60 * 1000);
    const blogFaqClickResult = await prisma.blogFaqClick.deleteMany({
      where: { timestamp: { lt: blogFaqClickCutoff } },
    });
    results.push({ table: "BlogFaqClick", deleted: blogFaqClickResult.count, retentionDays: RETENTION_CONFIG.blogFaqClick });
    totalDeleted += blogFaqClickResult.count;

    // 5. Nettoyer BotVisit
    const botVisitCutoff = new Date(Date.now() - RETENTION_CONFIG.botVisit * 24 * 60 * 60 * 1000);
    const botVisitResult = await prisma.botVisit.deleteMany({
      where: { timestamp: { lt: botVisitCutoff } },
    });
    results.push({ table: "BotVisit", deleted: botVisitResult.count, retentionDays: RETENTION_CONFIG.botVisit });
    totalDeleted += botVisitResult.count;

    // 6. Nettoyer SectionTime
    const sectionTimeCutoff = new Date(Date.now() - RETENTION_CONFIG.sectionTime * 24 * 60 * 60 * 1000);
    const sectionTimeResult = await prisma.sectionTime.deleteMany({
      where: { timestamp: { lt: sectionTimeCutoff } },
    });
    results.push({ table: "SectionTime", deleted: sectionTimeResult.count, retentionDays: RETENTION_CONFIG.sectionTime });
    totalDeleted += sectionTimeResult.count;

    // 7. Nettoyer AlertHistory
    const alertHistoryCutoff = new Date(Date.now() - RETENTION_CONFIG.alertHistory * 24 * 60 * 60 * 1000);
    const alertHistoryResult = await prisma.alertHistory.deleteMany({
      where: { triggeredAt: { lt: alertHistoryCutoff } },
    });
    results.push({ table: "AlertHistory", deleted: alertHistoryResult.count, retentionDays: RETENTION_CONFIG.alertHistory });
    totalDeleted += alertHistoryResult.count;

    // 8. Nettoyer VisitorGeolocation
    const geolocationCutoff = new Date(Date.now() - RETENTION_CONFIG.visitorGeolocation * 24 * 60 * 60 * 1000);
    const geolocationResult = await prisma.visitorGeolocation.deleteMany({
      where: { timestamp: { lt: geolocationCutoff } },
    });
    results.push({ table: "VisitorGeolocation", deleted: geolocationResult.count, retentionDays: RETENTION_CONFIG.visitorGeolocation });
    totalDeleted += geolocationResult.count;

    // 9. Nettoyer CustomEvent
    const customEventCutoff = new Date(Date.now() - RETENTION_CONFIG.customEvents * 24 * 60 * 60 * 1000);
    const customEventResult = await prisma.customEvent.deleteMany({
      where: { timestamp: { lt: customEventCutoff } },
    });
    results.push({ table: "CustomEvent", deleted: customEventResult.count, retentionDays: RETENTION_CONFIG.customEvents });
    totalDeleted += customEventResult.count;

    // 10. Nettoyer ConversionEvent
    const conversionEventCutoff = new Date(Date.now() - RETENTION_CONFIG.conversionEvents * 24 * 60 * 60 * 1000);
    const conversionEventResult = await prisma.conversionEvent.deleteMany({
      where: { timestamp: { lt: conversionEventCutoff } },
    });
    results.push({ table: "ConversionEvent", deleted: conversionEventResult.count, retentionDays: RETENTION_CONFIG.conversionEvents });
    totalDeleted += conversionEventResult.count;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Log summary
    if (totalDeleted > 0) {
      console.log(`[Cron:cleanup-data] ${totalDeleted} enregistrements supprimés en ${duration}s`);
      results.forEach((r) => {
        if (r.deleted > 0) {
          console.log(`  - ${r.table}: ${r.deleted} (>${r.retentionDays} jours)`);
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Nettoyage terminé: ${totalDeleted} enregistrements supprimés`,
      duration: `${duration}s`,
      processed: totalDeleted,
      results,
    });
  } catch (error) {
    console.error("[Cron:cleanup-data] Erreur:", error);
    return NextResponse.json(
      {
        error: "Cleanup failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Nettoyage avec paramètres personnalisés
 */
export async function POST(request: NextRequest) {
  // Verify authentication (QStash signature or CRON_SECRET)
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { table, retentionDays } = body as {
      table?: string;
      retentionDays?: number;
    };

    if (!table || !retentionDays) {
      return NextResponse.json(
        { error: "table et retentionDays sont requis" },
        { status: 400 }
      );
    }

    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    let deleted = 0;

    switch (table.toLowerCase()) {
      case "pagevisit":
        const pv = await prisma.pageVisit.deleteMany({ where: { timestamp: { lt: cutoff } } });
        deleted = pv.count;
        break;
      case "bloganalytics":
        const ba = await prisma.blogAnalytics.deleteMany({ where: { timestamp: { lt: cutoff } } });
        deleted = ba.count;
        break;
      case "botvisit":
        const bv = await prisma.botVisit.deleteMany({ where: { timestamp: { lt: cutoff } } });
        deleted = bv.count;
        break;
      case "sectiontime":
        const st = await prisma.sectionTime.deleteMany({ where: { timestamp: { lt: cutoff } } });
        deleted = st.count;
        break;
      case "alerthistory":
        const ah = await prisma.alertHistory.deleteMany({ where: { triggeredAt: { lt: cutoff } } });
        deleted = ah.count;
        break;
      case "visitorgeolocation":
        const vg = await prisma.visitorGeolocation.deleteMany({ where: { timestamp: { lt: cutoff } } });
        deleted = vg.count;
        break;
      default:
        return NextResponse.json(
          { error: `Table "${table}" non supportée pour le nettoyage` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${deleted} enregistrements supprimés de ${table}`,
      table,
      deleted,
      retentionDays,
    });
  } catch (error) {
    console.error("[Cron:cleanup-data] Erreur:", error);
    return NextResponse.json(
      {
        error: "Cleanup failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
