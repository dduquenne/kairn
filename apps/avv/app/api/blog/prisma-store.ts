/* eslint-disable no-console */
/**
 * Blog Posts Store - Multi-tenant Prisma Models
 *
 * This module provides blog post access using the Kairn multi-tenant database schema.
 * All queries filter by siteId to ensure tenant isolation.
 */

import { Prisma } from '@prisma/client';
import { z } from 'zod';

import prisma from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

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
// Database Operations (using multi-tenant Prisma models)
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

  try {
    const siteId = await getSiteId();

    const posts = await prisma.blogPost.findMany({
      where: {
        siteId,
        ...(includeUnpublished ? {} : { status: 'PUBLISHED' }),
        ...(category ? { category } : {}),
        ...(featured !== undefined ? { featured } : {}),
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: featuredFirst
        ? [{ featured: 'desc' }, { publishedAt: 'desc' }]
        : { publishedAt: 'desc' },
      ...(limit ? { take: limit } : {}),
    });

    return posts.map(formatBlogPostSummary);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

/**
 * Get all post slugs (for static generation)
 */
export async function getAllPostSlugs(): Promise<string[]> {
  try {
    const siteId = await getSiteId();
    const posts = await prisma.blogPost.findMany({
      where: {
        siteId,
        status: 'PUBLISHED',
      },
      select: { slug: true },
    });
    return posts.map(post => post.slug);
  } catch (error) {
    console.error('Error fetching post slugs:', error);
    return [];
  }
}

/**
 * Get blog post by slug
 */
export async function getBlogPostBySlug(
  slug: string,
  includeUnpublished = false
): Promise<BlogPostOutput | null> {
  try {
    const siteId = await getSiteId();
    const post = await prisma.blogPost.findUnique({
      where: {
        slug_siteId: { slug, siteId },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!post) return null;
    if (!includeUnpublished && post.status !== 'PUBLISHED') return null;

    return formatBlogPostOutput(post);
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return null;
  }
}

/**
 * Check if slug exists
 */
export async function slugExists(slug: string): Promise<boolean> {
  try {
    const siteId = await getSiteId();
    const post = await prisma.blogPost.findUnique({
      where: {
        slug_siteId: { slug, siteId },
      },
      select: { id: true },
    });
    return post !== null;
  } catch (error) {
    console.error('Error checking slug existence:', error);
    return false;
  }
}

/**
 * Create a new blog post
 */
export async function createBlogPost(data: BlogPostPayload): Promise<BlogPostOutput> {
  const siteId = await getSiteId();

  // Check if slug already exists
  const existing = await slugExists(data.slug);
  if (existing) {
    throw new Error('Un article avec ce slug existe déjà');
  }

  const tags = data.tags || [];
  const published = data.published !== false;
  const featured = data.featured === true;
  const postDate = data.date ? new Date(data.date) : new Date();

  try {
    // Create or get tags
    const tagRecords = await Promise.all(
      tags.map(async tagName => {
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');
        let tag = await prisma.tag.findUnique({
          where: { slug_siteId: { slug: tagSlug, siteId } },
        });
        if (!tag) {
          tag = await prisma.tag.create({
            data: { name: tagName, slug: tagSlug, siteId },
          });
        }
        return tag;
      })
    );

    const post = await prisma.blogPost.create({
      data: {
        siteId,
        slug: data.slug,
        title: data.title,
        excerpt: data.description || null,
        content: data.content,
        coverImage: data.image || null,
        status: published ? 'PUBLISHED' : 'DRAFT',
        category: data.category,
        imagePrompt: data.imagePrompt || null,
        seoIntent: data.seoIntent || null,
        persona: data.persona || null,
        tones: data.tones || [],
        faq: data.faq as Prisma.InputJsonValue | undefined,
        jsonLd: data.jsonLd as Prisma.InputJsonValue | undefined,
        featured,
        authorName: data.author,
        publishedAt: postDate,
        tags: {
          create: tagRecords.map(tag => ({
            tagId: tag.id,
          })),
        },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    return formatBlogPostOutput(post);
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
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
    const existingPost = await prisma.blogPost.findUnique({
      where: {
        slug_siteId: { slug, siteId },
      },
      include: {
        tags: true,
      },
    });

    if (!existingPost) {
      return null;
    }

    // Handle tags if provided
    let tagOperations = {};
    if (data.tags !== undefined) {
      const tags = data.tags || [];
      const tagRecords = await Promise.all(
        tags.map(async tagName => {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');
          let tag = await prisma.tag.findUnique({
            where: { slug_siteId: { slug: tagSlug, siteId } },
          });
          if (!tag) {
            tag = await prisma.tag.create({
              data: { name: tagName, slug: tagSlug, siteId },
            });
          }
          return tag;
        })
      );

      tagOperations = {
        tags: {
          deleteMany: {},
          create: tagRecords.map(tag => ({
            tagId: tag.id,
          })),
        },
      };
    }

    const published =
      data.published !== undefined ? data.published : existingPost.status === 'PUBLISHED';
    const postDate = data.date ? new Date(data.date) : existingPost.publishedAt;

    const post = await prisma.blogPost.update({
      where: { id: existingPost.id },
      data: {
        ...(data.slug && { slug: data.slug }),
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { excerpt: data.description || null }),
        ...(data.content && { content: data.content }),
        ...(data.image !== undefined && { coverImage: data.image || null }),
        status: published ? 'PUBLISHED' : 'DRAFT',
        ...(data.category && { category: data.category }),
        ...(data.imagePrompt !== undefined && { imagePrompt: data.imagePrompt || null }),
        ...(data.seoIntent !== undefined && { seoIntent: data.seoIntent || null }),
        ...(data.persona !== undefined && { persona: data.persona || null }),
        ...(data.tones !== undefined && { tones: data.tones || [] }),
        ...(data.faq !== undefined && { faq: data.faq as Prisma.InputJsonValue | undefined }),
        ...(data.jsonLd !== undefined && {
          jsonLd: data.jsonLd as Prisma.InputJsonValue | undefined,
        }),
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.author && { authorName: data.author }),
        publishedAt: postDate,
        ...tagOperations,
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    return formatBlogPostOutput(post);
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(slug: string): Promise<boolean> {
  try {
    const siteId = await getSiteId();
    const post = await prisma.blogPost.findUnique({
      where: {
        slug_siteId: { slug, siteId },
      },
    });

    if (!post) {
      return false;
    }

    await prisma.blogPost.delete({
      where: { id: post.id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return false;
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
  try {
    const siteId = await getSiteId();
    const posts = await prisma.blogPost.findMany({
      where: {
        siteId,
        status: 'PUBLISHED',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return posts.map(formatBlogPostSummary);
  } catch (error) {
    console.error('Error searching blog posts:', error);
    return [];
  }
}

/**
 * Get distinct categories
 */
export async function getCategories(): Promise<string[]> {
  try {
    const siteId = await getSiteId();
    const posts = await prisma.blogPost.findMany({
      where: {
        siteId,
        status: 'PUBLISHED',
        category: { not: null },
      },
      select: { category: true },
      distinct: ['category'],
    });
    return posts.map(p => p.category).filter((c): c is string => c !== null);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Get distinct tags with counts
 */
export async function getTagsWithCounts(): Promise<Array<{ tag: string; count: number }>> {
  try {
    const siteId = await getSiteId();
    const posts = await prisma.blogPost.findMany({
      where: {
        siteId,
        status: 'PUBLISHED',
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    const tagCounts = new Map<string, number>();
    for (const post of posts) {
      for (const t of post.tags) {
        const name = t.tag.name;
        tagCounts.set(name, (tagCounts.get(name) || 0) + 1);
      }
    }

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching tags with counts:', error);
    return [];
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format database record to API summary output
 */
function formatBlogPostSummary(post: {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  status: string;
  category: string | null;
  featured: boolean | null;
  authorName: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  tags: Array<{ tag: { name: string } }>;
}): BlogPostSummary {
  return {
    slug: post.slug,
    title: post.title,
    description: post.excerpt || undefined,
    author: post.authorName || 'AVV',
    category: post.category || '',
    tags: post.tags.map(t => t.tag.name),
    image: post.coverImage || undefined,
    published: post.status === 'PUBLISHED',
    featured: post.featured || false,
    date: post.publishedAt
      ? post.publishedAt.toISOString().split('T')[0]!
      : post.createdAt.toISOString().split('T')[0]!,
  };
}

/**
 * Format database record to full API output
 */
function formatBlogPostOutput(post: {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  status: string;
  category: string | null;
  imagePrompt: string | null;
  seoIntent: string | null;
  persona: string | null;
  tones: string[];
  faq: unknown;
  jsonLd: unknown;
  featured: boolean | null;
  authorName: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{ tag: { name: string } }>;
}): BlogPostOutput {
  return {
    slug: post.slug,
    title: post.title,
    ...(post.excerpt && { description: post.excerpt }),
    content: post.content,
    author: post.authorName || 'AVV',
    category: post.category || '',
    tags: post.tags.map(t => t.tag.name),
    ...(post.coverImage && { image: post.coverImage }),
    ...(post.imagePrompt && { imagePrompt: post.imagePrompt }),
    ...(post.seoIntent && { seoIntent: post.seoIntent }),
    ...(post.persona && { persona: post.persona }),
    tones: post.tones || [],
    ...(post.faq
      ? { faq: post.faq as Array<{ question: string; answer: string; id?: string }> }
      : {}),
    ...(post.jsonLd ? { jsonLd: post.jsonLd as Record<string, unknown> } : {}),
    published: post.status === 'PUBLISHED',
    featured: post.featured || false,
    date: post.publishedAt
      ? post.publishedAt.toISOString().split('T')[0]!
      : post.createdAt.toISOString().split('T')[0]!,
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
