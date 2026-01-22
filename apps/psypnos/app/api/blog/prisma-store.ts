// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * Blog Posts Store - PostgreSQL via Prisma
 * Replaces the Markdown file-based store for robust data management
 */

import { Prisma } from "@prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { z } from "zod";
import prisma from "@/lib/db/prisma";

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
    .min(1, "Le slug est obligatoire")
    .max(MAX_SLUG_LENGTH, `Le slug doit faire moins de ${MAX_SLUG_LENGTH} caractères`)
    .regex(SLUG_REGEX, "Format de slug invalide. Utilisez uniquement des lettres minuscules, chiffres et tirets."),
  title: z.string().trim().min(1, "Le titre est obligatoire"),
  description: z.string().trim().optional(),
  content: z.string().min(1, "Le contenu est obligatoire"),
  author: z.string().trim().min(1, "L'auteur est obligatoire"),
  category: z.string().trim().min(1, "La catégorie est obligatoire"),
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

  const posts = await prisma.blogPost.findMany({
    where: {
      ...(includeUnpublished ? {} : { published: true }),
      ...(category ? { category } : {}),
      ...(featured !== undefined ? { featured } : {}),
    },
    orderBy: featuredFirst
      ? [{ featured: "desc" }, { date: "desc" }]
      : { date: "desc" },
    take: limit,
    select: {
      slug: true,
      title: true,
      description: true,
      author: true,
      category: true,
      tags: true,
      image: true,
      published: true,
      featured: true,
      date: true,
    },
  });

  return posts.map((post: (typeof posts)[number]) => ({
    slug: post.slug,
    title: post.title,
    description: post.description || undefined,
    author: post.author,
    category: post.category,
    tags: post.tags,
    image: post.image || undefined,
    published: post.published,
    featured: post.featured,
    date: post.date.toISOString().split("T")[0],
  }));
}

/**
 * Get all post slugs (for static generation)
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true },
  });

  return posts.map((post: (typeof posts)[number]) => post.slug);
}

/**
 * Get blog post by slug
 */
export async function getBlogPostBySlug(
  slug: string,
  includeUnpublished = false
): Promise<BlogPostOutput | null> {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post) return null;
  if (!includeUnpublished && !post.published) return null;

  return formatBlogPostOutput(post);
}

/**
 * Check if slug exists
 */
export async function slugExists(slug: string): Promise<boolean> {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { slug: true },
  });

  return post !== null;
}

/**
 * Create a new blog post
 * If jobId is provided, marks the job as used to prevent duplicate article creation
 */
export async function createBlogPost(
  data: BlogPostPayload
): Promise<BlogPostOutput> {
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
    throw new Error("Un article avec ce slug existe déjà");
  }

  // Use transaction to ensure atomicity: create post and mark job as used
  const post = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Create the blog post
    const newPost = await tx.blogPost.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description || null,
        content: data.content,
        author: data.author,
        category: data.category,
        tags: data.tags || [],
        image: data.image || null,
        imagePrompt: data.imagePrompt || null,
        seoIntent: data.seoIntent || null,
        persona: data.persona || null,
        tones: data.tones || [],
        faq: data.faq ? (data.faq as InputJsonValue) : Prisma.DbNull,
        jsonLd: data.jsonLd ? (data.jsonLd as InputJsonValue) : Prisma.DbNull,
        published: data.published !== false,
        featured: data.featured === true,
        date: data.date ? new Date(data.date) : new Date(),
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
  // If slug is being changed, check if new slug already exists
  if (data.slug && data.slug !== slug) {
    const existing = await slugExists(data.slug);
    if (existing) {
      throw new Error("Un article avec ce slug existe déjà");
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description || null;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.image !== undefined) updateData.image = data.image || null;
    if (data.imagePrompt !== undefined)
      updateData.imagePrompt = data.imagePrompt || null;
    if (data.seoIntent !== undefined)
      updateData.seoIntent = data.seoIntent || null;
    if (data.persona !== undefined) updateData.persona = data.persona || null;
    if (data.tones !== undefined) updateData.tones = data.tones;
    if (data.faq !== undefined)
      updateData.faq = data.faq ? (data.faq as InputJsonValue) : Prisma.DbNull;
    if (data.jsonLd !== undefined)
      updateData.jsonLd = data.jsonLd ? (data.jsonLd as InputJsonValue) : Prisma.DbNull;
    if (data.published !== undefined) updateData.published = data.published;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.date !== undefined) updateData.date = new Date(data.date);

    const post = await prisma.blogPost.update({
      where: { slug },
      data: updateData,
    });

    return formatBlogPostOutput(post);
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return null; // Record not found
    }
    throw error;
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(slug: string): Promise<boolean> {
  try {
    await prisma.blogPost.delete({
      where: { slug },
    });
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
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
export async function searchBlogPosts(
  query: string,
  limit = 10
): Promise<BlogPostSummary[]> {
  const posts = await prisma.blogPost.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { tags: { has: query } },
      ],
    },
    orderBy: { date: "desc" },
    take: limit,
    select: {
      slug: true,
      title: true,
      description: true,
      author: true,
      category: true,
      tags: true,
      image: true,
      published: true,
      featured: true,
      date: true,
    },
  });

  return posts.map((post: (typeof posts)[number]) => ({
    slug: post.slug,
    title: post.title,
    description: post.description || undefined,
    author: post.author,
    category: post.category,
    tags: post.tags,
    image: post.image || undefined,
    published: post.published,
    featured: post.featured,
    date: post.date.toISOString().split("T")[0],
  }));
}

/**
 * Get distinct categories
 */
export async function getCategories(): Promise<string[]> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    distinct: ["category"],
    select: { category: true },
  });

  return posts.map((post: (typeof posts)[number]) => post.category);
}

/**
 * Get distinct tags with counts
 */
export async function getTagsWithCounts(): Promise<
  Array<{ tag: string; count: number }>
> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { tags: true },
  });

  const tagCounts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format database record to API output
 */
function formatBlogPostOutput(post: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  author: string;
  category: string;
  tags: string[];
  image: string | null;
  imagePrompt: string | null;
  seoIntent: string | null;
  persona: string | null;
  tones: string[];
  faq: unknown;
  jsonLd: unknown;
  published: boolean;
  featured: boolean;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}): BlogPostOutput {
  return {
    slug: post.slug,
    title: post.title,
    ...(post.description && { description: post.description }),
    content: post.content,
    author: post.author,
    category: post.category,
    tags: post.tags,
    ...(post.image && { image: post.image }),
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
    published: post.published,
    featured: post.featured,
    date: post.date.toISOString().split("T")[0],
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

/**
 * Validate slug format
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || typeof slug !== "string") {
    return { valid: false, error: "Le slug est obligatoire" };
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
        "Format de slug invalide. Utilisez uniquement des lettres minuscules, chiffres et tirets.",
    };
  }

  // Prevent path traversal
  if (slug.includes("..") || slug.includes("/") || slug.includes("\\")) {
    return {
      valid: false,
      error: "Slug invalide : tentative de path traversal détectée",
    };
  }

  return { valid: true };
}
