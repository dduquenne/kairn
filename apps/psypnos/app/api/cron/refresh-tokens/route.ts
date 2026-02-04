/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Cron Refresh Tokens API Route
 *
 * Rafraîchit automatiquement les tokens OAuth des comptes sociaux
 * qui expirent dans les 7 prochains jours.
 *
 * Fonctionnalités:
 * - Détecte les tokens LinkedIn expirant bientôt
 * - Rafraîchit automatiquement avec retry
 * - Envoie des alertes si reconnexion nécessaire
 *
 * Fréquence recommandée: toutes les heures (0 * * * *)
 *
 * Security: QStash signature or CRON_SECRET
 */

import { verifyCronAuth } from "@kairn/core/scheduler";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import {
  refreshAllExpiringTokens,
  getAccountsNeedingRefresh,
} from "@/lib/social/oauth/refresh";

/**
 * Envoie une notification pour les comptes nécessitant une reconnexion
 */
async function notifyAccountsNeedingReconnection(
  failedAccounts: Array<{ accountId: string; platform: string; message: string }>
): Promise<void> {
  if (failedAccounts.length === 0) return;

  const adminEmail = process.env.ADMIN_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!adminEmail || !resendApiKey) {
    console.warn("[Cron:refresh-tokens] Impossible d'envoyer la notification - ADMIN_EMAIL ou RESEND_API_KEY manquant");
    return;
  }

  try {
    const accountsList = failedAccounts
      .map((a) => `- ${a.platform}: ${a.message}`)
      .join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.ALERT_EMAIL_FROM || "Psypnos <notifications@psypnos.fr>",
        to: [adminEmail],
        subject: "⚠️ Psypnos - Comptes sociaux nécessitant reconnexion",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">🔐 Reconnexion nécessaire</h2>
            <p>Les comptes suivants ont besoin d'être reconnectés car leurs tokens n'ont pas pu être rafraîchis automatiquement:</p>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${accountsList}</pre>
            <p style="margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://psypnos.fr"}/admin/social/accounts"
                 style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Gérer les comptes
              </a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Ce message est envoyé automatiquement par le système de maintenance de Psypnos.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("[Cron:refresh-tokens] Erreur envoi email:", await response.text());
    }
  } catch (error) {
    console.error("[Cron:refresh-tokens] Erreur notification:", error);
  }
}

export async function GET(request: NextRequest) {
  // Verify authentication (QStash signature or CRON_SECRET)
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // 1. Vérifier combien de comptes ont besoin d'un refresh
    const accountsNeedingRefresh = await getAccountsNeedingRefresh();
    console.log(`[Cron:refresh-tokens] ${accountsNeedingRefresh.length} compte(s) à rafraîchir`);

    if (accountsNeedingRefresh.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun token à rafraîchir",
        processed: 0,
        results: {
          total: 0,
          refreshed: 0,
          failed: 0,
          skipped: 0,
        },
      });
    }

    // 2. Rafraîchir tous les tokens expirant bientôt
    const result = await refreshAllExpiringTokens();

    // 3. Identifier les comptes en échec qui nécessitent une reconnexion
    const failedAccounts = result.results
      .filter((r) => !r.success && r.platform !== "FACEBOOK" && r.platform !== "INSTAGRAM")
      .map((r) => ({
        accountId: r.accountId,
        platform: r.platform,
        message: r.message,
      }));

    // 4. Notifier l'admin si des comptes ont besoin d'une reconnexion
    if (failedAccounts.length > 0) {
      await notifyAccountsNeedingReconnection(failedAccounts);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      message: "Rafraîchissement des tokens terminé",
      duration: `${duration}s`,
      processed: result.total,
      results: {
        total: result.total,
        refreshed: result.refreshed,
        failed: result.failed,
        skipped: result.skipped,
        needsReconnection: failedAccounts.length,
      },
    });
  } catch (error) {
    console.error("[Cron:refresh-tokens] Erreur:", error);
    return NextResponse.json(
      {
        error: "Token refresh failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
