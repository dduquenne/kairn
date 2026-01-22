// @ts-nocheck
// TODO: Migration - Prisma/type incompatibilities to fix
/**
 * Service de rafraîchissement automatique des tokens OAuth
 *
 * Ce module gère le renouvellement proactif des tokens d'accès
 * pour éviter les interruptions de service.
 *
 * Stratégies par plateforme:
 * - Facebook: Les Page Access Tokens n'expirent pas si dérivés d'un long-lived token
 * - LinkedIn: Tokens expirent après 60 jours, refresh token disponible
 * - Instagram: Utilise les Page Access Tokens Facebook (n'expirent pas)
 */

import { prisma } from '@/lib/db/prisma';
import { decryptToken, encryptToken } from '../crypto';
import { linkedin } from './index';
import type { SocialPlatform, SocialAccountFull } from '../types';

// Type for Prisma SocialAccount record
interface PrismaSocialAccount {
  id: string;
  platform: string;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiry: Date | null;
  scope: string[];
  metadata: unknown;
  isActive: boolean;
  lastUsed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Seuil de renouvellement (7 jours avant expiration)
const REFRESH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

// Nombre de tentatives de refresh
const MAX_REFRESH_ATTEMPTS = 3;

interface RefreshResult {
  accountId: string;
  platform: SocialPlatform;
  success: boolean;
  message: string;
  newExpiry?: Date;
}

interface RefreshBatchResult {
  total: number;
  refreshed: number;
  failed: number;
  skipped: number;
  results: RefreshResult[];
}

/**
 * Vérifie si un token doit être rafraîchi
 */
export function shouldRefreshToken(tokenExpiry: Date | null): boolean {
  if (!tokenExpiry) {
    // Pas d'expiration = pas besoin de refresh (Facebook/Instagram Page Tokens)
    return false;
  }

  const expiryTime = tokenExpiry.getTime();
  const refreshThreshold = Date.now() + REFRESH_THRESHOLD_MS;

  return expiryTime < refreshThreshold;
}

/**
 * Récupère tous les comptes nécessitant un refresh
 */
export async function getAccountsNeedingRefresh(): Promise<SocialAccountFull[]> {
  const thresholdDate = new Date(Date.now() + REFRESH_THRESHOLD_MS);

  const accounts = await prisma.socialAccount.findMany({
    where: {
      isActive: true,
      tokenExpiry: {
        lte: thresholdDate,
      },
    },
  });

  return accounts.map((account: PrismaSocialAccount) => ({
    id: account.id,
    platform: account.platform as SocialPlatform,
    accountId: account.accountId,
    accountName: account.accountName,
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    tokenExpiry: account.tokenExpiry,
    scope: account.scope || [],
    metadata: account.metadata as SocialAccountFull['metadata'],
    isActive: account.isActive,
    lastUsed: account.lastUsed,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }));
}

/**
 * Rafraîchit un token LinkedIn
 */
async function refreshLinkedInToken(account: SocialAccountFull): Promise<RefreshResult> {
  if (!account.refreshToken) {
    return {
      accountId: account.id,
      platform: 'LINKEDIN',
      success: false,
      message: 'Pas de refresh token disponible. Reconnexion nécessaire.',
    };
  }

  try {
    const decryptedRefreshToken = decryptToken(account.refreshToken);

    const newTokens = await linkedin.refreshAccessToken(decryptedRefreshToken);

    const newExpiry = linkedin.calculateTokenExpiry(newTokens.expiresIn);

    // Mettre à jour en base
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        accessToken: encryptToken(newTokens.accessToken),
        refreshToken: newTokens.refreshToken
          ? encryptToken(newTokens.refreshToken)
          : account.refreshToken,
        tokenExpiry: newExpiry,
        updatedAt: new Date(),
      },
    });

    return {
      accountId: account.id,
      platform: 'LINKEDIN',
      success: true,
      message: 'Token rafraîchi avec succès',
      newExpiry,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      accountId: account.id,
      platform: 'LINKEDIN',
      success: false,
      message: `Échec du rafraîchissement: ${message}`,
    };
  }
}

/**
 * Rafraîchit un token pour un compte spécifique
 */
export async function refreshAccountToken(account: SocialAccountFull): Promise<RefreshResult> {
  switch (account.platform) {
    case 'LINKEDIN':
      return refreshLinkedInToken(account);

    case 'FACEBOOK':
    case 'INSTAGRAM':
      // Les Page Access Tokens n'expirent pas
      return {
        accountId: account.id,
        platform: account.platform,
        success: true,
        message: 'Les tokens de page n\'expirent pas',
      };

    default:
      return {
        accountId: account.id,
        platform: account.platform,
        success: false,
        message: `Plateforme ${account.platform} non supportée pour le refresh`,
      };
  }
}

/**
 * Rafraîchit tous les tokens expirant bientôt
 */
export async function refreshAllExpiringTokens(): Promise<RefreshBatchResult> {
  const accounts = await getAccountsNeedingRefresh();

  const results: RefreshResult[] = [];
  let refreshed = 0;
  let failed = 0;
  let skipped = 0;

  for (const account of accounts) {
    // Skip les plateformes qui n'expirent pas
    if (account.platform === 'FACEBOOK' || account.platform === 'INSTAGRAM') {
      skipped++;
      continue;
    }

    let lastError: string | null = null;
    let success = false;

    // Tentatives de refresh avec retry
    for (let attempt = 1; attempt <= MAX_REFRESH_ATTEMPTS; attempt++) {
      try {
        const result = await refreshAccountToken(account);
        results.push(result);

        if (result.success) {
          refreshed++;
          success = true;
          console.log(
            `[TokenRefresh] ${account.platform}/${account.accountName}: Token rafraîchi`
          );
          break;
        } else {
          lastError = result.message;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Erreur inconnue';
      }

      // Attendre avant la prochaine tentative
      if (attempt < MAX_REFRESH_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    if (!success) {
      failed++;
      results.push({
        accountId: account.id,
        platform: account.platform,
        success: false,
        message: lastError || 'Échec après plusieurs tentatives',
      });
      console.error(
        `[TokenRefresh] ${account.platform}/${account.accountName}: Échec - ${lastError}`
      );
    }
  }

  return {
    total: accounts.length,
    refreshed,
    failed,
    skipped,
    results,
  };
}

/**
 * Vérifie la validité d'un token pour un compte
 */
export async function validateAccountToken(accountId: string): Promise<{
  valid: boolean;
  needsRefresh: boolean;
  expiresAt?: Date;
  message?: string;
}> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    return { valid: false, needsRefresh: false, message: 'Compte non trouvé' };
  }

  const needsRefresh = shouldRefreshToken(account.tokenExpiry);

  // Pour LinkedIn, vérifier avec l'API d'introspection
  if (account.platform === 'LINKEDIN' && account.accessToken) {
    try {
      const decryptedToken = decryptToken(account.accessToken);
      const introspection = await linkedin.introspectToken(decryptedToken);

      return {
        valid: introspection.active,
        needsRefresh,
        expiresAt: introspection.expiresAt || account.tokenExpiry || undefined,
      };
    } catch {
      return {
        valid: false,
        needsRefresh: true,
        message: 'Impossible de vérifier le token',
      };
    }
  }

  // Pour Facebook/Instagram, on suppose que le token est valide
  // car les Page Access Tokens n'expirent pas
  return {
    valid: true,
    needsRefresh: false,
    expiresAt: account.tokenExpiry || undefined,
  };
}

/**
 * Marque un compte comme nécessitant une reconnexion
 */
export async function markAccountForReconnection(accountId: string): Promise<void> {
  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      isActive: false,
      updatedAt: new Date(),
    },
  });
}
