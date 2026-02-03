/* eslint-disable no-console */
/**
 * Blog Posts Store - PostgreSQL via Prisma
 * Uses multi-tenant BlogPost model with siteId filtering
 */

import { PostStatus, Prisma } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { z } from 'zod';

import prisma from '@/lib/db/prisma';

// ============================================
// Site Configuration
// ============================================

const SITE_SLUG = 'psypnos';

/**
 * Get the site ID for the current site
 */
async function getSiteId(): Promise<string> {
  const site = await prisma.site.findUnique({
    where: { slug: SITE_SLUG },
    select: { id: true },
  });

  if (!site) {
    throw new Error(`Site "${SITE_SLUG}" not found in database`);
  }

  return site.id;
}

// ============================================
// Validation Schemas
// ============================================

const MAX_SLUG_LENGTH = 200;
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  id: z.string().optional(),
});

export const blogPostPayloadSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Le slug est obligatoire')
    .max(MAX_SLUG_LENGTH, `Le slug doit faire moins de ${MAX_SLUG_LENGTH} caractères`)
    .regex(
      SLUG_REGEX,
      'Format de slug invalide. Utilisez uniquement des lettres minuscules, chiffres et tirets.'
    ),
  title: z.string().trim().min(1, 'Le titre est obligatoire'),
  description: z.string().trim().optional(),
  content: z.string().min(1, 'Le contenu est obligatoire'),
  author: z.string().trim().min(1, "L'auteur est obligatoire"),
  category: z.string().trim().min(1, 'La catégorie est obligatoire'),
  tags: z.array(z.string().trim()).optional(),
  image: z.string().trim().optional(),
  imagePrompt: z.string().trim().optional(),
  seoIntent: z.string().trim().optional(),
  persona: z.string().trim().optional(),
  tones: z.array(z.string().trim()).optional(),
  faq: z.array(faqItemSchema).optional(),
  jsonLd: z.record(z.unknown()).optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  date: z.string().optional(),
  jobId: z.string().uuid().optional(),
});

export type BlogPostPayload = z.infer<typeof blogPostPayloadSchema>;

// ============================================
// Output Type (API response format)
// ============================================

export interface BlogPostOutput {
  slug: string;
  title: string;
  description?: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  imagePrompt?: string;
  seoIntent?: string;
  persona?: string;
  tones: string[];
  faq?: Array<{ question: string; answer: string; id?: string }>;
  jsonLd?: Record<string, unknown>;
  published: boolean;
  featured: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// Lighter version for list responses
export interface BlogPostSummary {
  slug: string;
  title: string;
  description?: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  published: boolean;
  featured: boolean;
  date: string;
}

// ============================================
// Tag Helpers
// ============================================

/**
 * Create a URL-friendly slug from a tag name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens from ends
}

/**
 * Get or create tags by names, returning tag IDs
 */
async function getOrCreateTags(
  tagNames: string[],
  tx?: Prisma.TransactionClient
): Promise<string[]> {
  const client = tx || prisma;
  const tagIds: string[] = [];

  for (const name of tagNames) {
    const slug = slugify(name);

    // Try to find existing tag
    let tag = await client.tag.findUnique({
      where: { slug },
    });

    if (!tag) {
      // Create new tag
      tag = await client.tag.create({
        data: { name, slug },
      });
    }

    tagIds.push(tag.id);
  }

  return tagIds;
}

/**
 * Extract tag names from a BlogPost with included tags
 */
function extractTagNames(tags: Array<{ tag: { name: string } }> | undefined): string[] {
  return tags?.map(t => t.tag.name) || [];
}

// ============================================
// Database Operations
// ============================================

/**
 * Get all blog posts from database
 */
export async function getAllBlogPosts(
  options: {
    includeUnpublished?: boolean;
    limit?: number;
    category?: string;
    featured?: boolean;
    featuredFirst?: boolean;
  } = {}
): Promise<BlogPostSummary[]> {
  const { includeUnpublished = false, limit, category, featured, featuredFirst = false } = options;
  const siteId = await getSiteId();

  const posts = await prisma.blogPost.findMany({
    where: {
      siteId,
      ...(includeUnpublished ? {} : { status: PostStatus.PUBLISHED }),
      ...(category ? { category } : {}),
      ...(featured !== undefined ? { featured } : {}),
    },
    orderBy: featuredFirst
      ? [{ featured: 'desc' }, { publishedAt: 'desc' }]
      : { publishedAt: 'desc' },
    take: limit,
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  return posts.map(post => ({
    slug: post.slug,
    title: post.title,
    description: post.excerpt || undefined,
    author: post.authorName || 'PSYPNOS',
    category: post.category || '',
    tags: extractTagNames(post.tags),
    image: post.coverImage || undefined,
    published: post.status === PostStatus.PUBLISHED,
    featured: post.featured,
    date:
      post.publishedAt?.toISOString().split('T')[0] || post.createdAt.toISOString().split('T')[0],
  }));
}

/**
 * Get all post slugs (for static generation)
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const siteId = await getSiteId();

  const posts = await prisma.blogPost.findMany({
    where: { siteId, status: PostStatus.PUBLISHED },
    select: { slug: true },
  });

  return posts.map(post => post.slug);
}

/**
 * Get blog post by slug
 */
export async function getBlogPostBySlug(
  slug: string,
  includeUnpublished = false
): Promise<BlogPostOutput | null> {
  const siteId = await getSiteId();

  const post = await prisma.blogPost.findFirst({
    where: { siteId, slug },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  if (!post) return null;
  if (!includeUnpublished && post.status !== PostStatus.PUBLISHED) return null;

  return formatBlogPostOutput(post);
}

/**
 * Check if slug exists
 */
export async function slugExists(slug: string): Promise<boolean> {
  const siteId = await getSiteId();

  const post = await prisma.blogPost.findFirst({
    where: { siteId, slug },
    select: { slug: true },
  });

  return post !== null;
}

/**
 * Create a new blog post
 * If jobId is provided, marks the job as used to prevent duplicate article creation
 */
export async function createBlogPost(data: BlogPostPayload): Promise<BlogPostOutput> {
  const siteId = await getSiteId();

  // If jobId provided, check if job has already been used
  if (data.jobId) {
    const job = await prisma.blogGenerationJob.findUnique({
      where: { id: data.jobId },
      select: { usedAt: true, articleSlug: true },
    });

    if (job?.usedAt) {
      throw new Error(
        `Ce job a déjà été utilisé pour créer l'article "${job.articleSlug}". ` +
          `Utilisez le bouton "Modifier" pour éditer l'article existant.`
      );
    }
  }

  // Check if slug already exists
  const existing = await slugExists(data.slug);
  if (existing) {
    throw new Error('Un article avec ce slug existe déjà');
  }

  // Use transaction to ensure atomicity: create post, tags, and mark job as used
  const post = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Get or create tags
    const tagIds = data.tags && data.tags.length > 0 ? await getOrCreateTags(data.tags, tx) : [];

    // Create the blog post
    const newPost = await tx.blogPost.create({
      data: {
        slug: data.slug,
        title: data.title,
        excerpt: data.description || null,
        content: data.content,
        coverImage: data.image || null,
        status: data.published !== false ? PostStatus.PUBLISHED : PostStatus.DRAFT,
        publishedAt: data.date ? new Date(data.date) : new Date(),
        // Extended fields
        category: data.category,
        imagePrompt: data.imagePrompt || null,
        seoIntent: data.seoIntent || null,
        persona: data.persona || null,
        tones: data.tones || [],
        faq: data.faq ? (data.faq as InputJsonValue) : Prisma.DbNull,
        jsonLd: data.jsonLd ? (data.jsonLd as InputJsonValue) : Prisma.DbNull,
        featured: data.featured === true,
        authorName: data.author,
        // Multi-tenancy
        siteId,
        authorId: null,
        // Tag relations
        tags:
          tagIds.length > 0
            ? {
                create: tagIds.map(tagId => ({ tagId })),
              }
            : undefined,
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    // If jobId provided, mark the job as used
    if (data.jobId) {
      await tx.blogGenerationJob.update({
        where: { id: data.jobId },
        data: {
          usedAt: new Date(),
          articleSlug: data.slug,
        },
      });
    }

    return newPost;
  });

  return formatBlogPostOutput(post);
}

/**
 * Update an existing blog post
 */
export async function updateBlogPost(
  slug: string,
  data: Partial<BlogPostPayload>
): Promise<BlogPostOutput | null> {
  const siteId = await getSiteId();

  // If slug is being changed, check if new slug already exists
  if (data.slug && data.slug !== slug) {
    const existing = await slugExists(data.slug);
    if (existing) {
      throw new Error('Un article avec ce slug existe déjà');
    }
  }

  try {
    // Find the post first
    const existingPost = await prisma.blogPost.findFirst({
      where: { siteId, slug },
    });

    if (!existingPost) {
      return null;
    }

    // Use transaction for atomic update with tags
    const post = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Build update data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {};

      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.excerpt = data.description || null;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.author !== undefined) updateData.authorName = data.author;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.image !== undefined) updateData.coverImage = data.image || null;
      if (data.imagePrompt !== undefined) updateData.imagePrompt = data.imagePrompt || null;
      if (data.seoIntent !== undefined) updateData.seoIntent = data.seoIntent || null;
      if (data.persona !== undefined) updateData.persona = data.persona || null;
      if (data.tones !== undefined) updateData.tones = data.tones;
      if (data.faq !== undefined)
        updateData.faq = data.faq ? (data.faq as InputJsonValue) : Prisma.DbNull;
      if (data.jsonLd !== undefined)
        updateData.jsonLd = data.jsonLd ? (data.jsonLd as InputJsonValue) : Prisma.DbNull;
      if (data.published !== undefined)
        updateData.status = data.published ? PostStatus.PUBLISHED : PostStatus.DRAFT;
      if (data.featured !== undefined) updateData.featured = data.featured;
      if (data.date !== undefined) updateData.publishedAt = new Date(data.date);

      // Handle tags if provided
      if (data.tags !== undefined) {
        // Delete existing tag relations
        await tx.blogPostTag.deleteMany({
          where: { postId: existingPost.id },
        });

        // Create new tag relations
        if (data.tags.length > 0) {
          const tagIds = await getOrCreateTags(data.tags, tx);
          await tx.blogPostTag.createMany({
            data: tagIds.map(tagId => ({
              postId: existingPost.id,
              tagId,
            })),
          });
        }
      }

      // Update the post
      const updatedPost = await tx.blogPost.update({
        where: { id: existingPost.id },
        data: updateData,
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });

      return updatedPost;
    });

    return formatBlogPostOutput(post);
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return null; // Record not found
    }
    throw error;
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(slug: string): Promise<boolean> {
  const siteId = await getSiteId();

  try {
    const post = await prisma.blogPost.findFirst({
      where: { siteId, slug },
    });

    if (!post) {
      return false;
    }

    await prisma.blogPost.delete({
      where: { id: post.id },
    });

    return true;
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return false; // Record not found
    }
    throw error;
  }
}

/**
 * Get posts by category
 */
export async function getBlogPostsByCategory(
  category: string,
  limit?: number
): Promise<BlogPostSummary[]> {
  return getAllBlogPosts({ category, limit });
}

/**
 * Search blog posts by query
 */
export async function searchBlogPosts(query: string, limit = 10): Promise<BlogPostSummary[]> {
  const siteId = await getSiteId();

  const posts = await prisma.blogPost.findMany({
    where: {
      siteId,
      status: PostStatus.PUBLISHED,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  return posts.map(post => ({
    slug: post.slug,
    title: post.title,
    description: post.excerpt || undefined,
    author: post.authorName || 'PSYPNOS',
    category: post.category || '',
    tags: extractTagNames(post.tags),
    image: post.coverImage || undefined,
    published: post.status === PostStatus.PUBLISHED,
    featured: post.featured,
    date:
      post.publishedAt?.toISOString().split('T')[0] || post.createdAt.toISOString().split('T')[0],
  }));
}

/**
 * Get distinct categories
 */
export async function getCategories(): Promise<string[]> {
  const siteId = await getSiteId();

  const posts = await prisma.blogPost.findMany({
    where: { siteId, status: PostStatus.PUBLISHED },
    distinct: ['category'],
    select: { category: true },
  });

  return posts.map(post => post.category).filter((c): c is string => c !== null);
}

/**
 * Get distinct tags with counts
 */
export async function getTagsWithCounts(): Promise<Array<{ tag: string; count: number }>> {
  const siteId = await getSiteId();

  const posts = await prisma.blogPost.findMany({
    where: { siteId, status: PostStatus.PUBLISHED },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  const tagCounts = new Map<string, number>();
  for (const post of posts) {
    for (const { tag } of post.tags) {
      tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// ============================================
// Helper Functions
// ============================================

// Type for BlogPost with included tags
type BlogPostWithTags = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  status: PostStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category: string | null;
  imagePrompt: string | null;
  seoIntent: string | null;
  persona: string | null;
  tones: string[];
  faq: unknown;
  jsonLd: unknown;
  featured: boolean;
  authorName: string | null;
  tags: Array<{ tag: { name: string } }>;
};

/**
 * Format database record to API output
 */
function formatBlogPostOutput(post: BlogPostWithTags): BlogPostOutput {
  return {
    slug: post.slug,
    title: post.title,
    ...(post.excerpt && { description: post.excerpt }),
    content: post.content,
    author: post.authorName || 'PSYPNOS',
    category: post.category || '',
    tags: extractTagNames(post.tags),
    ...(post.coverImage && { image: post.coverImage }),
    ...(post.imagePrompt && { imagePrompt: post.imagePrompt }),
    ...(post.seoIntent && { seoIntent: post.seoIntent }),
    ...(post.persona && { persona: post.persona }),
    tones: post.tones,
    ...(post.faq != null
      ? {
          faq: post.faq as Array<{ question: string; answer: string; id?: string }>,
        }
      : {}),
    ...(post.jsonLd != null
      ? {
          jsonLd: post.jsonLd as Record<string, unknown>,
        }
      : {}),
    published: post.status === PostStatus.PUBLISHED,
    featured: post.featured,
    date:
      post.publishedAt?.toISOString().split('T')[0] || post.createdAt.toISOString().split('T')[0],
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

/**
 * Validate slug format
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Le slug est obligatoire' };
  }

  if (slug.length > MAX_SLUG_LENGTH) {
    return {
      valid: false,
      error: `Le slug doit faire moins de ${MAX_SLUG_LENGTH} caractères`,
    };
  }

  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error:
        'Format de slug invalide. Utilisez uniquement des lettres minuscules, chiffres et tirets.',
    };
  }

  // Prevent path traversal
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
    return {
      valid: false,
      error: 'Slug invalide : tentative de path traversal détectée',
    };
  }

  return { valid: true };
}
