/**
 * Implémentation de l'interface PostStorage pour Prisma
 *
 * Fait le pont entre le PostScheduler mutualisé (@kairn/social)
 * et la couche de données Prisma de l'application.
 *
 * Gère le mapping bidirectionnel des statuts :
 * - PostScheduler (minuscules) : 'pending' | 'processing' | 'published' | 'failed'
 * - Prisma (majuscules) : 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED'
 */

import type { SocialAccountMetadata } from '@kairn/social';
import type { PostStorage, ScheduledPost } from '@kairn/social/posting';

import {
  getScheduledPosts,
  getSocialAccountById,
  claimPostForPublishing,
  markPostAsPublished,
  markPostAsFailed,
  incrementRetryCount,
  updateSocialPost,
  markAccountAsUsed,
} from './store';

/** Mapping statut Prisma → statut PostScheduler */
const PRISMA_TO_SCHEDULER_STATUS = {
  SCHEDULED: 'pending',
  PUBLISHING: 'processing',
  PUBLISHED: 'published',
  FAILED: 'failed',
} as const;

/** Mapping statut PostScheduler → statut Prisma */
const SCHEDULER_TO_PRISMA_STATUS = {
  pending: 'SCHEDULED',
  processing: 'PUBLISHING',
  published: 'PUBLISHED',
  failed: 'FAILED',
} as const;

/**
 * Implémentation PostStorage basée sur Prisma
 *
 * Inclut la gestion des posts stuck (PUBLISHING depuis >10 min)
 * et le verrouillage atomique via claimPostForPublishing.
 */
export class PrismaPostStorage implements PostStorage {
  private stuckTimeoutMinutes: number;

  /**
   * @param stuckTimeoutMinutes - Délai en minutes pour considérer un post PUBLISHING comme bloqué
   */
  constructor(stuckTimeoutMinutes = 10) {
    this.stuckTimeoutMinutes = stuckTimeoutMinutes;
  }

  /**
   * Récupère les posts à publier (schedulés + stuck en PUBLISHING)
   *
   * Mappe les statuts Prisma vers les statuts PostScheduler.
   */
  async getPostsDueForPublishing(): Promise<ScheduledPost[]> {
    const now = new Date();
    const prismaPosts = await getScheduledPosts(now, this.stuckTimeoutMinutes);

    return prismaPosts.map(post => ({
      id: post.id,
      platform: post.platform,
      accountId: post.accountId,
      content: post.content,
      mediaUrls: post.mediaUrls,
      hashtags: post.hashtags,
      linkUrl: post.linkUrl,
      scheduledAt: post.scheduledAt ?? new Date(),
      status:
        PRISMA_TO_SCHEDULER_STATUS[post.status as keyof typeof PRISMA_TO_SCHEDULER_STATUS] ??
        'pending',
      retryCount: post.retryCount,
      errorMessage: post.errorMessage ?? undefined,
    }));
  }

  /**
   * Met à jour le statut d'un post avec gestion spéciale du claim atomique
   *
   * Quand le statut passe à 'processing', utilise claimPostForPublishing
   * pour le verrouillage atomique (empêche les doublons en cas de CRON concurrents).
   */
  async updatePostStatus(
    postId: string,
    status: ScheduledPost['status'],
    data?: {
      externalPostId?: string;
      platformUrl?: string;
      errorMessage?: string;
      retryCount?: number;
      publishedAt?: Date;
    }
  ): Promise<void> {
    if (status === 'processing') {
      // Verrouillage atomique via updateMany
      await claimPostForPublishing(postId);
      return;
    }

    if (status === 'published') {
      await markPostAsPublished(postId, data?.externalPostId ?? '', data?.platformUrl);
      return;
    }

    if (status === 'failed') {
      // Incrémenter retryCount si fourni (avant markPostAsFailed qui ne le fait pas)
      if (data?.retryCount !== undefined) {
        await incrementRetryCount(postId);
      }
      await markPostAsFailed(postId, data?.errorMessage ?? 'Erreur inconnue');
      return;
    }

    // status === 'pending' → remettre en SCHEDULED pour le prochain cycle
    const prismaStatus = SCHEDULER_TO_PRISMA_STATUS[status];
    const updateData: Record<string, unknown> = { status: prismaStatus };

    if (data?.errorMessage !== undefined) {
      updateData.errorMessage = data.errorMessage;
    }
    if (data?.retryCount !== undefined) {
      await incrementRetryCount(postId);
    }

    await updateSocialPost(postId, updateData);
  }

  /**
   * Récupère les informations d'un compte social pour la publication
   *
   * Déchiffre le token d'accès et retourne les métadonnées du compte.
   * Retourne null si le compte n'existe pas ou est désactivé.
   */
  async getAccountForPublishing(
    accountId: string
  ): Promise<{ accessToken: string; metadata: SocialAccountMetadata | null } | null> {
    try {
      const account = await getSocialAccountById(accountId);

      if (!account) {
        return null;
      }

      if (!account.isActive) {
        return null;
      }

      // Marquer le compte comme utilisé
      await markAccountAsUsed(account.id);

      return {
        accessToken: account.accessToken,
        metadata: account.metadata,
      };
    } catch {
      // decryptToken peut échouer si le token est corrompu
      console.error(`[PrismaPostStorage] Erreur lors de la récupération du compte ${accountId}`);
      return null;
    }
  }
}
