/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * Cron Snapshot Social Accounts API Route
 *
 * Capture quotidiennement un snapshot des métriques de chaque compte social
 * (followers, following, postsCount). Permet le suivi historique de la
 * croissance des audiences.
 *
 * Fréquence recommandée: 1x par jour à 6h00 (0 6 * * *)
 *
 * Security: QStash signature or CRON_SECRET
 */

import { verifyCronAuth } from "@kairn/core/scheduler";
import { NextRequest, NextResponse } from "next/server";

import { captureAllSnapshots } from "@/lib/social/snapshots";

export async function POST(request: NextRequest) {
  // Vérifier l'authentification CRON
  const authResult = verifyCronAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    console.log("[Cron:snapshot-social-accounts] Démarrage de la capture des snapshots...");

    const result = await captureAllSnapshots();

    console.log(
      `[Cron:snapshot-social-accounts] Terminé: ${result.captured} capturés, ${result.failed} échoués`
    );

    if (result.errors.length > 0) {
      console.warn(
        "[Cron:snapshot-social-accounts] Erreurs:",
        result.errors.map((e) => `${e.accountId}: ${e.error}`).join(", ")
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[Cron:snapshot-social-accounts] Erreur fatale:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur interne",
      },
      { status: 500 }
    );
  }
}

// Support GET for manual triggering
export async function GET(request: NextRequest) {
  return POST(request);
}
