/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — pre-existing type issues (SocialTemplate/SocialGenerationLog models, SocialAccount fields)
/**
 * Store pour les opérations CRUD sur les données des réseaux sociaux
 *
 * Ce module fournit toutes les opérations de base de données pour:
 * - Les comptes sociaux (avec chiffrement des tokens)
 * - Les posts sociaux (création, programmation, publication)
 * - Les analytics des posts
 * - Les templates de génération
 * - Les logs de génération IA
 */

import { prisma } from '@/lib/db/prisma';

import { encryptToken, decryptToken } from './crypto';
import type {
  SocialPlatform,
  PostStatus,
  SocialAccountPublic,
  SocialAccountFull,
  CreateSocialAccountInput,
  UpdateSocialAccountInput,
  SocialPost,
  SocialPostWithRelations,
  CreateSocialPostInput,
  UpdateSocialPostInput,
  SocialPostFilters,
  SocialPostAnalytics,
  UpdateSocialPostAnalyticsInput,
  SocialTemplate,
  CreateSocialTemplateInput,
  UpdateSocialTemplateInput,
  SocialGenerationLog,
  CreateSocialGenerationLogInput,
} from './types';

// Type for JSON values in Prisma
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaJsonValue = any;

// ===========================================
// Comptes Sociaux
// ===========================================

/**
 * Récupère tous les comptes sociaux (sans tokens déchiffrés)
 */
export async function getAllSocialAccounts(): Promise<SocialAccountPublic[]> {
  const accounts = await prisma.socialAccount.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return accounts.map(mapAccountToPublic);
}

/**
 * Récupère les comptes actifs pour une plateforme
 */
export async function getActiveAccountsByPlatform(
  platform: SocialPlatform
): Promise<SocialAccountPublic[]> {
  const accounts = await prisma.socialAccount.findMany({
    where: {
      platform,
      isActive: true,
    },
    orderBy: { lastUsed: 'desc' },
  });

  return accounts.map(mapAccountToPublic);
}

/**
 * Récupère un compte par son ID (avec tokens déchiffrés)
 */
export async function getSocialAccountById(id: string): Promise<SocialAccountFull | null> {
  const account = await prisma.socialAccount.findUnique({
    where: { id },
  });

  if (!account) return null;

  return {
    ...mapAccountToPublic(account),
    accessToken: decryptToken(account.accessToken),
    refreshToken: account.refreshToken ? decryptToken(account.refreshToken) : null,
    metadata: account.metadata as SocialAccountFull['metadata'],
  };
}

/**
 * Récupère un compte par plateforme et ID externe
 */
export async function getSocialAccountByPlatformId(
  platform: SocialPlatform,
  accountId: string
): Promise<SocialAccountPublic | null> {
  const account = await prisma.socialAccount.findUnique({
    where: {
      platform_accountId: { platform, accountId },
    },
  });

  return account ? mapAccountToPublic(account) : null;
}

/**
 * Crée un nouveau compte social
 */
export async function createSocialAccount(
  input: CreateSocialAccountInput
): Promise<SocialAccountPublic> {
  const account = await prisma.socialAccount.create({
    data: {
      platform: input.platform,
      accountId: input.accountId,
      accountName: input.accountName,
      accessToken: encryptToken(input.accessToken),
      refreshToken: input.refreshToken ? encryptToken(input.refreshToken) : null,
      tokenExpiry: input.tokenExpiry,
      scope: input.scope,
      metadata: input.metadata ? (input.metadata as PrismaJsonValue) : null,
    },
  });

  return mapAccountToPublic(account);
}

/**
 * Met à jour un compte social
 */
export async function updateSocialAccount(
  id: string,
  input: UpdateSocialAccountInput
): Promise<SocialAccountPublic> {
  const data: Record<string, unknown> = {};

  if (input.accountName !== undefined) data.accountName = input.accountName;
  if (input.accessToken !== undefined) data.accessToken = encryptToken(input.accessToken);
  if (input.refreshToken !== undefined) {
    data.refreshToken = input.refreshToken ? encryptToken(input.refreshToken) : null;
  }
  if (input.tokenExpiry !== undefined) data.tokenExpiry = input.tokenExpiry;
  if (input.scope !== undefined) data.scope = input.scope;
  if (input.metadata !== undefined) data.metadata = input.metadata;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const account = await prisma.socialAccount.update({
    where: { id },
    data,
  });

  return mapAccountToPublic(account);
}

/**
 * Marque un compte comme utilisé
 */
export async function markAccountAsUsed(id: string): Promise<void> {
  await prisma.socialAccount.update({
    where: { id },
    data: { lastUsed: new Date() },
  });
}

/**
 * Supprime un compte social (et tous ses posts)
 */
export async function deleteSocialAccount(id: string): Promise<void> {
  await prisma.socialAccount.delete({
    where: { id },
  });
}

// ===========================================
// Posts Sociaux
// ===========================================

/**
 * Récupère les posts avec filtres
 */
export async function getSocialPosts(filters: SocialPostFilters = {}): Promise<SocialPost[]> {
  const where: Record<string, unknown> = {};

  if (filters.platform) where.platform = filters.platform;
  if (filters.status) where.status = filters.status;
  if (filters.accountId) where.accountId = filters.accountId;
  if (filters.blogSlug) where.blogSlug = filters.blogSlug;

  if (filters.scheduledFrom || filters.scheduledTo) {
    where.scheduledAt = {};
    if (filters.scheduledFrom) {
      (where.scheduledAt as Record<string, Date>).gte = filters.scheduledFrom;
    }
    if (filters.scheduledTo) {
      (where.scheduledAt as Record<string, Date>).lte = filters.scheduledTo;
    }
  }

  const posts = await prisma.socialPost.findMany({
    where,
    orderBy: { scheduledAt: 'asc' },
    ...(filters.limit ? { take: filters.limit } : {}),
    ...(filters.offset ? { skip: filters.offset } : {}),
  });

  return posts.map(mapPost);
}

/**
 * Récupère les posts avec leurs relations
 */
export async function getSocialPostsWithRelations(
  filters: SocialPostFilters = {}
): Promise<SocialPostWithRelations[]> {
  const where: Record<string, unknown> = {};

  if (filters.platform) where.platform = filters.platform;
  if (filters.status) where.status = filters.status;
  if (filters.accountId) where.accountId = filters.accountId;
  if (filters.blogSlug) where.blogSlug = filters.blogSlug;

  if (filters.scheduledFrom || filters.scheduledTo) {
    where.scheduledAt = {};
    if (filters.scheduledFrom) {
      (where.scheduledAt as Record<string, Date>).gte = filters.scheduledFrom;
    }
    if (filters.scheduledTo) {
      (where.scheduledAt as Record<string, Date>).lte = filters.scheduledTo;
    }
  }

  const posts = await prisma.socialPost.findMany({
    where,
    include: {
      account: true,
      analytics: true,
    },
    orderBy: { scheduledAt: 'asc' },
    ...(filters.limit ? { take: filters.limit } : {}),
    ...(filters.offset ? { skip: filters.offset } : {}),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return posts.map((post: any) => ({
    ...mapPost(post),
    account: mapAccountToPublic(post.account),
    analytics: post.analytics ? mapAnalytics(post.analytics) : null,
  }));
}

/**
 * Récupère les posts à publier (scheduled et date passée)
 */
export async function getPostsToPublish(): Promise<SocialPostWithRelations[]> {
  const posts = await prisma.socialPost.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: {
        lte: new Date(),
      },
    },
    include: {
      account: true,
      analytics: true,
    },
    orderBy: { scheduledAt: 'asc' },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return posts.map((post: any) => ({
    ...mapPost(post),
    account: mapAccountToPublic(post.account),
    analytics: post.analytics ? mapAnalytics(post.analytics) : null,
  }));
}

/**
 * Récupère un post par son ID
 */
export async function getSocialPostById(id: string): Promise<SocialPostWithRelations | null> {
  const post = await prisma.socialPost.findUnique({
    where: { id },
    include: {
      account: true,
      analytics: true,
    },
  });

  if (!post) return null;

  return {
    ...mapPost(post),
    account: mapAccountToPublic(post.account),
    analytics: post.analytics ? mapAnalytics(post.analytics) : null,
  };
}

/**
 * Crée un nouveau post
 */
export async function createSocialPost(input: CreateSocialPostInput): Promise<SocialPost> {
  const post = await prisma.socialPost.create({
    data: {
      accountId: input.accountId,
      platform: input.platform,
      content: input.content,
      blogSlug: input.blogSlug,
      blogTitle: input.blogTitle,
      mediaUrls: input.mediaUrls || [],
      hashtags: input.hashtags || [],
      linkUrl: input.linkUrl,
      scheduledAt: input.scheduledAt,
      status: input.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      generatedBy: input.generatedBy,
      aiPrompt: input.aiPrompt,
      aiModel: input.aiModel,
      metadata: input.metadata ? (input.metadata as PrismaJsonValue) : null,
    },
  });

  return mapPost(post);
}

/**
 * Met à jour un post
 */
export async function updateSocialPost(
  id: string,
  input: UpdateSocialPostInput
): Promise<SocialPost> {
  const data: Record<string, unknown> = {};

  if (input.content !== undefined) data.content = input.content;
  if (input.mediaUrls !== undefined) data.mediaUrls = input.mediaUrls;
  if (input.hashtags !== undefined) data.hashtags = input.hashtags;
  if (input.linkUrl !== undefined) data.linkUrl = input.linkUrl;
  if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt;
  if (input.status !== undefined) data.status = input.status;
  if (input.externalPostId !== undefined) data.externalPostId = input.externalPostId;
  if (input.platformUrl !== undefined) data.platformUrl = input.platformUrl;
  if (input.errorMessage !== undefined) data.errorMessage = input.errorMessage;
  if (input.retryCount !== undefined) data.retryCount = input.retryCount;
  if (input.metadata !== undefined) data.metadata = input.metadata;

  const post = await prisma.socialPost.update({
    where: { id },
    data,
  });

  return mapPost(post);
}

/**
 * Marque un post comme publié
 */
export async function markPostAsPublished(
  id: string,
  externalPostId: string,
  platformUrl?: string
): Promise<SocialPost> {
  const post = await prisma.socialPost.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      externalPostId,
      platformUrl: platformUrl || null,
      errorMessage: null,
    },
  });

  return mapPost(post);
}

/**
 * Marque un post comme échoué
 *
 * Note : ne pas incrémenter retryCount ici car il est déjà incrémenté
 * par incrementRetryCount() appelé en amont dans le flux de publication.
 */
export async function markPostAsFailed(id: string, errorMessage: string): Promise<SocialPost> {
  const post = await prisma.socialPost.update({
    where: { id },
    data: {
      status: 'FAILED',
      errorMessage,
    },
  });

  return mapPost(post);
}

/**
 * Supprime un post
 */
export async function deleteSocialPost(id: string): Promise<void> {
  await prisma.socialPost.delete({
    where: { id },
  });
}

/**
 * Incrémente le compteur de retry d'un post
 */
export async function incrementRetryCount(id: string): Promise<SocialPost> {
  const post = await prisma.socialPost.update({
    where: { id },
    data: { retryCount: { increment: 1 } },
  });

  return mapPost(post);
}

/**
 * Récupère les posts à publier :
 * - Posts en SCHEDULED dont l'heure est passée
 * - Posts bloqués en PUBLISHING depuis plus de 10 minutes (timeout/crash recovery)
 *
 * @param before - Date limite pour les posts schedulés (par défaut: maintenant)
 * @param stuckTimeout - Délai en minutes pour considérer un post PUBLISHING comme bloqué (par défaut: 10)
 */
export async function getScheduledPosts(
  before?: Date,
  stuckTimeout: number = 10
): Promise<SocialPost[]> {
  const now = before || new Date();
  const stuckThreshold = new Date(now.getTime() - stuckTimeout * 60 * 1000);

  const posts = await prisma.socialPost.findMany({
    where: {
      OR: [
        // Posts schedulés dont l'heure est passée (avec scheduledAt non-null)
        {
          status: 'SCHEDULED',
          scheduledAt: {
            not: null,
            lte: now,
          },
        },
        // Posts bloqués en PUBLISHING depuis plus de stuckTimeout minutes
        // (crash recovery - le post n'a pas été mis à jour depuis trop longtemps)
        {
          status: 'PUBLISHING',
          updatedAt: {
            lte: stuckThreshold,
          },
        },
      ],
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return posts.map(mapPost);
}

/**
 * Tente de réserver un post pour publication de manière atomique.
 *
 * Utilise updateMany avec un filtre sur le status courant pour garantir
 * qu'un seul handler CRON concurrent peut s'emparer du post.
 * Retourne true si le post a été réservé, false s'il a déjà été pris.
 *
 * @param postId - ID du post à réserver
 * @param expectedStatus - Statuts acceptés pour la réservation
 */
export async function claimPostForPublishing(
  postId: string,
  expectedStatus: string[] = ['SCHEDULED', 'PUBLISHING']
): Promise<boolean> {
  const result = await prisma.socialPost.updateMany({
    where: {
      id: postId,
      status: { in: expectedStatus },
    },
    data: {
      status: 'PUBLISHING',
    },
  });

  return result.count > 0;
}

/**
 * Récupère les posts planifiés dans le futur (SCHEDULED avec scheduledAt > maintenant).
 *
 * Utilisé par le cron de réconciliation QStash pour renvoyer les triggers
 * des posts dont le message QStash one-shot a pu être perdu.
 */
export async function getFutureScheduledPosts(): Promise<SocialPost[]> {
  const now = new Date();

  const posts = await prisma.socialPost.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: {
        not: null,
        gt: now,
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return posts.map(mapPost);
}

/**
 * Compte les posts par statut
 */
export async function countPostsByStatus(): Promise<Record<PostStatus, number>> {
  const counts = await prisma.socialPost.groupBy({
    by: ['status'],
    _count: true,
  });

  const result: Record<string, number> = {
    DRAFT: 0,
    SCHEDULED: 0,
    PUBLISHING: 0,
    PUBLISHED: 0,
    FAILED: 0,
    CANCELLED: 0,
  };

  for (const count of counts) {
    result[count.status] = count._count;
  }

  return result as Record<PostStatus, number>;
}

// ===========================================
// Analytics des Posts
// ===========================================

/**
 * Récupère ou crée les analytics d'un post
 */
export async function getOrCreatePostAnalytics(postId: string): Promise<SocialPostAnalytics> {
  let analytics = await prisma.socialPostAnalytics.findUnique({
    where: { postId },
  });

  if (!analytics) {
    analytics = await prisma.socialPostAnalytics.create({
      data: { postId },
    });
  }

  return mapAnalytics(analytics);
}

/**
 * Met à jour les analytics d'un post
 */
export async function updatePostAnalytics(
  postId: string,
  input: UpdateSocialPostAnalyticsInput
): Promise<SocialPostAnalytics> {
  // Préparer les données avec le bon type pour rawData
  const { rawData, ...rest } = input;
  const createData = {
    postId,
    ...rest,
    rawData: rawData ? (rawData as PrismaJsonValue) : null,
  };
  const updateData = {
    ...rest,
    rawData: rawData ? (rawData as PrismaJsonValue) : undefined,
    lastSyncAt: new Date(),
  };

  const analytics = await prisma.socialPostAnalytics.upsert({
    where: { postId },
    create: createData,
    update: updateData,
  });

  return mapAnalytics(analytics);
}

// ===========================================
// Templates
// ===========================================

/**
 * Récupère tous les templates
 */
export async function getAllTemplates(): Promise<SocialTemplate[]> {
  const templates = await prisma.socialTemplate.findMany({
    orderBy: [{ isDefault: 'desc' }, { usageCount: 'desc' }],
  });

  return templates.map(mapTemplate);
}

/**
 * Récupère les templates pour une plateforme
 */
export async function getTemplatesByPlatform(platform: SocialPlatform): Promise<SocialTemplate[]> {
  const templates = await prisma.socialTemplate.findMany({
    where: { platform },
    orderBy: [{ isDefault: 'desc' }, { usageCount: 'desc' }],
  });

  return templates.map(mapTemplate);
}

/**
 * Récupère le template par défaut pour une plateforme
 */
export async function getDefaultTemplate(platform: SocialPlatform): Promise<SocialTemplate | null> {
  const template = await prisma.socialTemplate.findFirst({
    where: { platform, isDefault: true },
  });

  return template ? mapTemplate(template) : null;
}

/**
 * Récupère un template par son ID
 */
export async function getTemplateById(id: string): Promise<SocialTemplate | null> {
  const template = await prisma.socialTemplate.findUnique({
    where: { id },
  });

  return template ? mapTemplate(template) : null;
}

/**
 * Crée un nouveau template
 */
export async function createTemplate(input: CreateSocialTemplateInput): Promise<SocialTemplate> {
  // Si c'est le nouveau défaut, retirer le statut défaut des autres
  if (input.isDefault) {
    await prisma.socialTemplate.updateMany({
      where: { platform: input.platform, isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await prisma.socialTemplate.create({
    data: {
      name: input.name,
      platform: input.platform,
      description: input.description,
      promptTemplate: input.promptTemplate,
      defaultTone: input.defaultTone,
      defaultHashtags: input.defaultHashtags || [],
      isDefault: input.isDefault || false,
    },
  });

  return mapTemplate(template);
}

/**
 * Met à jour un template
 */
export async function updateTemplate(
  id: string,
  input: UpdateSocialTemplateInput
): Promise<SocialTemplate> {
  // Si on définit comme défaut, retirer le statut défaut des autres
  if (input.isDefault) {
    const template = await prisma.socialTemplate.findUnique({ where: { id } });
    if (template) {
      await prisma.socialTemplate.updateMany({
        where: { platform: template.platform, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }
  }

  const data: Record<string, unknown> = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.promptTemplate !== undefined) data.promptTemplate = input.promptTemplate;
  if (input.defaultTone !== undefined) data.defaultTone = input.defaultTone;
  if (input.defaultHashtags !== undefined) data.defaultHashtags = input.defaultHashtags;
  if (input.isDefault !== undefined) data.isDefault = input.isDefault;

  const template = await prisma.socialTemplate.update({
    where: { id },
    data,
  });

  return mapTemplate(template);
}

/**
 * Incrémente le compteur d'utilisation d'un template
 */
export async function incrementTemplateUsage(id: string): Promise<void> {
  await prisma.socialTemplate.update({
    where: { id },
    data: { usageCount: { increment: 1 } },
  });
}

/**
 * Supprime un template
 */
export async function deleteTemplate(id: string): Promise<void> {
  await prisma.socialTemplate.delete({
    where: { id },
  });
}

// ===========================================
// Logs de Génération
// ===========================================

/**
 * Crée un log de génération
 */
export async function createGenerationLog(
  input: CreateSocialGenerationLogInput
): Promise<SocialGenerationLog> {
  const log = await prisma.socialGenerationLog.create({
    data: {
      blogSlug: input.blogSlug,
      platform: input.platform,
      inputContent: input.inputContent,
      promptUsed: input.promptUsed,
      generatedContent: input.generatedContent,
      tokensUsed: input.tokensUsed,
    },
  });

  return mapGenerationLog(log);
}

/**
 * Marque un log comme accepté/modifié
 */
export async function updateGenerationLogStatus(
  id: string,
  wasAccepted: boolean,
  wasModified: boolean
): Promise<void> {
  await prisma.socialGenerationLog.update({
    where: { id },
    data: { wasAccepted, wasModified },
  });
}

/**
 * Récupère les logs de génération pour un article
 */
export async function getGenerationLogsByBlogSlug(
  blogSlug: string
): Promise<SocialGenerationLog[]> {
  const logs = await prisma.socialGenerationLog.findMany({
    where: { blogSlug },
    orderBy: { createdAt: 'desc' },
  });

  return logs.map(mapGenerationLog);
}

/**
 * Récupère les derniers logs de génération
 */
export async function getRecentGenerationLogs(limit = 50): Promise<SocialGenerationLog[]> {
  const logs = await prisma.socialGenerationLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return logs.map(mapGenerationLog);
}

// ===========================================
// Helpers de mapping
// ===========================================

function mapAccountToPublic(account: Record<string, unknown>): SocialAccountPublic {
  return {
    id: account.id as string,
    platform: account.platform as SocialPlatform,
    accountId: account.accountId as string,
    accountName: account.accountName as string,
    tokenExpiry: account.tokenExpiry as Date | null,
    scope: account.scope as string[],
    isActive: account.isActive as boolean,
    lastUsed: account.lastUsed as Date | null,
    createdAt: account.createdAt as Date,
    updatedAt: account.updatedAt as Date,
  };
}

function mapPost(post: Record<string, unknown>): SocialPost {
  return {
    id: post.id as string,
    blogSlug: post.blogSlug as string | null,
    blogTitle: post.blogTitle as string | null,
    platform: post.platform as SocialPlatform,
    content: post.content as string,
    mediaUrls: post.mediaUrls as string[],
    hashtags: post.hashtags as string[],
    linkUrl: post.linkUrl as string | null,
    scheduledAt: post.scheduledAt as Date | null,
    publishedAt: post.publishedAt as Date | null,
    status: post.status as PostStatus,
    externalPostId: post.externalPostId as string | null,
    platformUrl: post.platformUrl as string | null,
    errorMessage: post.errorMessage as string | null,
    retryCount: post.retryCount as number,
    generatedBy: post.generatedBy as SocialPost['generatedBy'],
    aiPrompt: post.aiPrompt as string | null,
    aiModel: post.aiModel as string | null,
    metadata: post.metadata as SocialPost['metadata'],
    accountId: post.accountId as string,
    createdAt: post.createdAt as Date,
    updatedAt: post.updatedAt as Date,
  };
}

function mapAnalytics(analytics: Record<string, unknown>): SocialPostAnalytics {
  return {
    id: analytics.id as string,
    postId: analytics.postId as string,
    impressions: analytics.impressions as number,
    reach: analytics.reach as number,
    engagements: analytics.engagements as number,
    likes: analytics.likes as number,
    comments: analytics.comments as number,
    shares: analytics.shares as number,
    saves: analytics.saves as number,
    clicks: analytics.clicks as number,
    rawData: analytics.rawData as Record<string, unknown> | null,
    lastSyncAt: analytics.lastSyncAt as Date,
    updatedAt: analytics.updatedAt as Date,
  };
}

function mapTemplate(template: Record<string, unknown>): SocialTemplate {
  return {
    id: template.id as string,
    name: template.name as string,
    platform: template.platform as SocialPlatform,
    description: template.description as string | null,
    promptTemplate: template.promptTemplate as string,
    defaultTone: template.defaultTone as SocialTemplate['defaultTone'],
    defaultHashtags: template.defaultHashtags as string[],
    isDefault: template.isDefault as boolean,
    usageCount: template.usageCount as number,
    createdAt: template.createdAt as Date,
    updatedAt: template.updatedAt as Date,
  };
}

function mapGenerationLog(log: Record<string, unknown>): SocialGenerationLog {
  return {
    id: log.id as string,
    blogSlug: log.blogSlug as string,
    platform: log.platform as SocialPlatform,
    inputContent: log.inputContent as string,
    promptUsed: log.promptUsed as string,
    generatedContent: log.generatedContent as string,
    tokensUsed: log.tokensUsed as number | null,
    wasAccepted: log.wasAccepted as boolean,
    wasModified: log.wasModified as boolean,
    createdAt: log.createdAt as Date,
  };
}
