/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Factory pour le store social
 *
 * Fournit toutes les opérations CRUD pour les comptes sociaux, posts,
 * analytics, templates et logs de génération.
 * Accepte un PrismaClient en injection de dépendance.
 */

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
} from '../types';
import { encryptToken, decryptToken } from '../utils/crypto';

import type { SocialPrismaClient } from './types';

// Type for JSON values in Prisma
type PrismaJsonValue = any;

// ===========================================
// Mapping helpers
// ===========================================

/** @internal */
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

/** @internal */
function mapPost(post: Record<string, unknown>): SocialPost {
  return {
    id: post.id as string,
    blogSlug: post.blogSlug as string | null,
    blogTitle: post.blogTitle as string | null,
    platform: post.platform as SocialPlatform,
    content: post.content as string,
    mediaUrls: (post.mediaUrls as string[] | null) ?? [],
    hashtags: (post.hashtags as string[] | null) ?? [],
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

/** @internal */
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

/** @internal */
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

/** @internal */
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

/**
 * Type de retour de createSocialStore — expose toutes les opérations CRUD
 */
export interface SocialStore {
  // Comptes
  getAllSocialAccounts: () => Promise<SocialAccountPublic[]>;
  getActiveAccountsByPlatform: (platform: SocialPlatform) => Promise<SocialAccountPublic[]>;
  getSocialAccountById: (id: string) => Promise<SocialAccountFull | null>;
  getSocialAccountByPlatformId: (
    platform: SocialPlatform,
    accountId: string
  ) => Promise<SocialAccountPublic | null>;
  createSocialAccount: (input: CreateSocialAccountInput) => Promise<SocialAccountPublic>;
  updateSocialAccount: (
    id: string,
    input: UpdateSocialAccountInput
  ) => Promise<SocialAccountPublic>;
  markAccountAsUsed: (id: string) => Promise<void>;
  deleteSocialAccount: (id: string) => Promise<void>;
  // Posts
  getSocialPosts: (filters?: SocialPostFilters) => Promise<SocialPost[]>;
  getSocialPostsWithRelations: (filters?: SocialPostFilters) => Promise<SocialPostWithRelations[]>;
  getPostsToPublish: () => Promise<SocialPostWithRelations[]>;
  getSocialPostById: (id: string) => Promise<SocialPostWithRelations | null>;
  createSocialPost: (input: CreateSocialPostInput) => Promise<SocialPost>;
  updateSocialPost: (id: string, input: UpdateSocialPostInput) => Promise<SocialPost>;
  markPostAsPublished: (
    id: string,
    externalPostId: string,
    platformUrl?: string
  ) => Promise<SocialPost>;
  markPostAsFailed: (id: string, errorMessage: string) => Promise<SocialPost>;
  deleteSocialPost: (id: string) => Promise<void>;
  incrementRetryCount: (id: string) => Promise<SocialPost>;
  getScheduledPosts: (before?: Date, stuckTimeout?: number) => Promise<SocialPost[]>;
  claimPostForPublishing: (postId: string, expectedStatus?: string[]) => Promise<boolean>;
  getFutureScheduledPosts: () => Promise<SocialPost[]>;
  countPostsByStatus: () => Promise<Record<PostStatus, number>>;
  // Analytics
  getOrCreatePostAnalytics: (postId: string) => Promise<SocialPostAnalytics>;
  updatePostAnalytics: (
    postId: string,
    input: UpdateSocialPostAnalyticsInput
  ) => Promise<SocialPostAnalytics>;
  // Templates
  getAllTemplates: () => Promise<SocialTemplate[]>;
  getTemplatesByPlatform: (platform: SocialPlatform) => Promise<SocialTemplate[]>;
  getDefaultTemplate: (platform: SocialPlatform) => Promise<SocialTemplate | null>;
  getTemplateById: (id: string) => Promise<SocialTemplate | null>;
  createTemplate: (input: CreateSocialTemplateInput) => Promise<SocialTemplate>;
  updateTemplate: (id: string, input: UpdateSocialTemplateInput) => Promise<SocialTemplate>;
  incrementTemplateUsage: (id: string) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  // Logs de génération
  createGenerationLog: (input: CreateSocialGenerationLogInput) => Promise<SocialGenerationLog>;
  updateGenerationLogStatus: (
    id: string,
    wasAccepted: boolean,
    wasModified: boolean
  ) => Promise<void>;
  getGenerationLogsByBlogSlug: (blogSlug: string) => Promise<SocialGenerationLog[]>;
  getRecentGenerationLogs: (limit?: number) => Promise<SocialGenerationLog[]>;
}

/**
 * Crée une instance du store social avec l'injection du client Prisma.
 *
 * @param prisma - Instance PrismaClient compatible
 * @returns Objet contenant toutes les opérations CRUD du store social
 */
export function createSocialStore(prisma: SocialPrismaClient): SocialStore {
  return {
    // ===========================================
    // Comptes Sociaux
    // ===========================================

    async getAllSocialAccounts(): Promise<SocialAccountPublic[]> {
      const accounts = await prisma.socialAccount.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return accounts.map(mapAccountToPublic);
    },

    async getActiveAccountsByPlatform(platform: SocialPlatform): Promise<SocialAccountPublic[]> {
      const accounts = await prisma.socialAccount.findMany({
        where: { platform, isActive: true },
        orderBy: { lastUsed: 'desc' },
      });
      return accounts.map(mapAccountToPublic);
    },

    async getSocialAccountById(id: string): Promise<SocialAccountFull | null> {
      const account = await prisma.socialAccount.findUnique({ where: { id } });
      if (!account) return null;
      return {
        ...mapAccountToPublic(account),
        accessToken: decryptToken(account.accessToken),
        refreshToken: account.refreshToken ? decryptToken(account.refreshToken) : null,
        metadata: account.metadata as SocialAccountFull['metadata'],
      };
    },

    async getSocialAccountByPlatformId(
      platform: SocialPlatform,
      accountId: string
    ): Promise<SocialAccountPublic | null> {
      const account = await prisma.socialAccount.findUnique({
        where: { platform_accountId: { platform, accountId } },
      });
      return account ? mapAccountToPublic(account) : null;
    },

    async createSocialAccount(input: CreateSocialAccountInput): Promise<SocialAccountPublic> {
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
    },

    async updateSocialAccount(
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

      const account = await prisma.socialAccount.update({ where: { id }, data });
      return mapAccountToPublic(account);
    },

    async markAccountAsUsed(id: string): Promise<void> {
      await prisma.socialAccount.update({
        where: { id },
        data: { lastUsed: new Date() },
      });
    },

    async deleteSocialAccount(id: string): Promise<void> {
      await prisma.socialAccount.delete({ where: { id } });
    },

    // ===========================================
    // Posts Sociaux
    // ===========================================

    async getSocialPosts(filters: SocialPostFilters = {}): Promise<SocialPost[]> {
      const where: Record<string, unknown> = {};
      if (filters.platform) where.platform = filters.platform;
      if (filters.status) where.status = filters.status;
      if (filters.accountId) where.accountId = filters.accountId;
      if (filters.blogSlug) where.blogSlug = filters.blogSlug;
      if (filters.scheduledFrom || filters.scheduledTo) {
        where.scheduledAt = {};
        if (filters.scheduledFrom)
          (where.scheduledAt as Record<string, Date>).gte = filters.scheduledFrom;
        if (filters.scheduledTo)
          (where.scheduledAt as Record<string, Date>).lte = filters.scheduledTo;
      }
      const posts = await prisma.socialPost.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        ...(filters.limit ? { take: filters.limit } : {}),
        ...(filters.offset ? { skip: filters.offset } : {}),
      });
      return posts.map(mapPost);
    },

    async getSocialPostsWithRelations(
      filters: SocialPostFilters = {}
    ): Promise<SocialPostWithRelations[]> {
      const where: Record<string, unknown> = {};
      if (filters.platform) where.platform = filters.platform;
      if (filters.status) where.status = filters.status;
      if (filters.accountId) where.accountId = filters.accountId;
      if (filters.blogSlug) where.blogSlug = filters.blogSlug;
      if (filters.scheduledFrom || filters.scheduledTo) {
        where.scheduledAt = {};
        if (filters.scheduledFrom)
          (where.scheduledAt as Record<string, Date>).gte = filters.scheduledFrom;
        if (filters.scheduledTo)
          (where.scheduledAt as Record<string, Date>).lte = filters.scheduledTo;
      }
      const posts = await prisma.socialPost.findMany({
        where,
        include: { account: true, analytics: true },
        orderBy: { scheduledAt: 'asc' },
        ...(filters.limit ? { take: filters.limit } : {}),
        ...(filters.offset ? { skip: filters.offset } : {}),
      } as any);
      return posts.map((post: any) => ({
        ...mapPost(post),
        account: mapAccountToPublic(post.account),
        analytics: post.analytics ? mapAnalytics(post.analytics) : null,
      }));
    },

    async getPostsToPublish(): Promise<SocialPostWithRelations[]> {
      const posts = await prisma.socialPost.findMany({
        where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
        include: { account: true, analytics: true },
        orderBy: { scheduledAt: 'asc' },
      } as any);
      return posts.map((post: any) => ({
        ...mapPost(post),
        account: mapAccountToPublic(post.account),
        analytics: post.analytics ? mapAnalytics(post.analytics) : null,
      }));
    },

    async getSocialPostById(id: string): Promise<SocialPostWithRelations | null> {
      const post = await prisma.socialPost.findUnique({
        where: { id },
        include: { account: true, analytics: true },
      } as any);
      if (!post) return null;
      return {
        ...mapPost(post),
        account: mapAccountToPublic((post as any).account),
        analytics: (post as any).analytics ? mapAnalytics((post as any).analytics) : null,
      };
    },

    async createSocialPost(input: CreateSocialPostInput): Promise<SocialPost> {
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
    },

    async updateSocialPost(id: string, input: UpdateSocialPostInput): Promise<SocialPost> {
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

      const post = await prisma.socialPost.update({ where: { id }, data });
      return mapPost(post);
    },

    async markPostAsPublished(
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
    },

    async markPostAsFailed(id: string, errorMessage: string): Promise<SocialPost> {
      const post = await prisma.socialPost.update({
        where: { id },
        data: { status: 'FAILED', errorMessage },
      });
      return mapPost(post);
    },

    async deleteSocialPost(id: string): Promise<void> {
      await prisma.socialPost.delete({ where: { id } });
    },

    async incrementRetryCount(id: string): Promise<SocialPost> {
      const post = await prisma.socialPost.update({
        where: { id },
        data: { retryCount: { increment: 1 } },
      });
      return mapPost(post);
    },

    async getScheduledPosts(before?: Date, stuckTimeout: number = 10): Promise<SocialPost[]> {
      const now = before || new Date();
      const stuckThreshold = new Date(now.getTime() - stuckTimeout * 60 * 1000);
      const posts = await prisma.socialPost.findMany({
        where: {
          OR: [
            { status: 'SCHEDULED', scheduledAt: { not: null, lte: now } },
            { status: 'PUBLISHING', updatedAt: { lte: stuckThreshold } },
          ],
        },
        orderBy: { scheduledAt: 'asc' },
      } as any);
      return posts.map(mapPost);
    },

    async claimPostForPublishing(
      postId: string,
      expectedStatus: string[] = ['SCHEDULED', 'PUBLISHING']
    ): Promise<boolean> {
      const result = await prisma.socialPost.updateMany({
        where: { id: postId, status: { in: expectedStatus } },
        data: { status: 'PUBLISHING' },
      });
      return result.count > 0;
    },

    async getFutureScheduledPosts(): Promise<SocialPost[]> {
      const now = new Date();
      const posts = await prisma.socialPost.findMany({
        where: { status: 'SCHEDULED', scheduledAt: { not: null, gt: now } },
        orderBy: { scheduledAt: 'asc' },
      } as any);
      return posts.map(mapPost);
    },

    async countPostsByStatus(): Promise<Record<PostStatus, number>> {
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
    },

    // ===========================================
    // Analytics des Posts
    // ===========================================

    async getOrCreatePostAnalytics(postId: string): Promise<SocialPostAnalytics> {
      let analytics = await prisma.socialPostAnalytics.findUnique({ where: { postId } });
      if (!analytics) {
        analytics = await prisma.socialPostAnalytics.create({ data: { postId } });
      }
      return mapAnalytics(analytics);
    },

    async updatePostAnalytics(
      postId: string,
      input: UpdateSocialPostAnalyticsInput
    ): Promise<SocialPostAnalytics> {
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
    },

    // ===========================================
    // Templates
    // ===========================================

    async getAllTemplates(): Promise<SocialTemplate[]> {
      const templates = await prisma.socialTemplate.findMany({
        orderBy: [{ isDefault: 'desc' }, { usageCount: 'desc' }],
      });
      return templates.map(mapTemplate);
    },

    async getTemplatesByPlatform(platform: SocialPlatform): Promise<SocialTemplate[]> {
      const templates = await prisma.socialTemplate.findMany({
        where: { platform },
        orderBy: [{ isDefault: 'desc' }, { usageCount: 'desc' }],
      });
      return templates.map(mapTemplate);
    },

    async getDefaultTemplate(platform: SocialPlatform): Promise<SocialTemplate | null> {
      const template = await prisma.socialTemplate.findFirst({
        where: { platform, isDefault: true },
      });
      return template ? mapTemplate(template) : null;
    },

    async getTemplateById(id: string): Promise<SocialTemplate | null> {
      const template = await prisma.socialTemplate.findUnique({ where: { id } });
      return template ? mapTemplate(template) : null;
    },

    async createTemplate(input: CreateSocialTemplateInput): Promise<SocialTemplate> {
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
    },

    async updateTemplate(id: string, input: UpdateSocialTemplateInput): Promise<SocialTemplate> {
      if (input.isDefault) {
        const template = await prisma.socialTemplate.findUnique({ where: { id } });
        if (template) {
          await prisma.socialTemplate.updateMany({
            where: { platform: template.platform, isDefault: true, NOT: { id } },
            data: { isDefault: false },
          } as any);
        }
      }
      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.description !== undefined) data.description = input.description;
      if (input.promptTemplate !== undefined) data.promptTemplate = input.promptTemplate;
      if (input.defaultTone !== undefined) data.defaultTone = input.defaultTone;
      if (input.defaultHashtags !== undefined) data.defaultHashtags = input.defaultHashtags;
      if (input.isDefault !== undefined) data.isDefault = input.isDefault;

      const template = await prisma.socialTemplate.update({ where: { id }, data });
      return mapTemplate(template);
    },

    async incrementTemplateUsage(id: string): Promise<void> {
      await prisma.socialTemplate.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      });
    },

    async deleteTemplate(id: string): Promise<void> {
      await prisma.socialTemplate.delete({ where: { id } });
    },

    // ===========================================
    // Logs de Génération
    // ===========================================

    async createGenerationLog(input: CreateSocialGenerationLogInput): Promise<SocialGenerationLog> {
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
    },

    async updateGenerationLogStatus(
      id: string,
      wasAccepted: boolean,
      wasModified: boolean
    ): Promise<void> {
      await prisma.socialGenerationLog.update({
        where: { id },
        data: { wasAccepted, wasModified },
      });
    },

    async getGenerationLogsByBlogSlug(blogSlug: string): Promise<SocialGenerationLog[]> {
      const logs = await prisma.socialGenerationLog.findMany({
        where: { blogSlug },
        orderBy: { createdAt: 'desc' },
      });
      return logs.map(mapGenerationLog);
    },

    async getRecentGenerationLogs(limit = 50): Promise<SocialGenerationLog[]> {
      const logs = await prisma.socialGenerationLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return logs.map(mapGenerationLog);
    },
  };
}
