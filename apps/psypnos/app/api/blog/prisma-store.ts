/* eslint-disable no-console */
/**
 * Blog Posts Store - PostgreSQL via Raw SQL
 *
 * IMPORTANT: The psypnos database uses a single-tenant schema with simple table names:
 * - blog_posts (not BlogPost with siteId)
 *
 * We use raw SQL queries to match the actual database structure.
 */

import { z } from 'zod';

import prisma from '@/lib/db/prisma';

// ============================================
// Raw Database Types (matching actual psypnos schema)
// ============================================

interface RawBlogPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  author: string;
  category: string;
  tags: string[] | null;
  image: string | null;
  published: boolean;
  featured: boolean;
  date: Date;
  created_at: Date;
  updated_at: Date;
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
// Database Operations (using raw SQL for single-tenant psypnos schema)
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
    // Build dynamic query based on options
    let query = `
      SELECT id, slug, title, description, author, category, tags, image, published, featured, date, created_at, updated_at
      FROM blog_posts
      WHERE 1=1
    `;

    const conditions: string[] = [];
    if (!includeUnpublished) {
      conditions.push('published = true');
    }
    if (category) {
      conditions.push(`category = '${category.replace(/'/g, "''")}'`);
    }
    if (featured !== undefined) {
      conditions.push(`featured = ${featured}`);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    // Order by
    if (featuredFirst) {
      query += ' ORDER BY featured DESC, date DESC';
    } else {
      query += ' ORDER BY date DESC';
    }

    // Limit
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const posts = await prisma.$queryRawUnsafe<RawBlogPost[]>(query);

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
    const posts = await prisma.$queryRaw<Array<{ slug: string }>>`
      SELECT slug FROM blog_posts WHERE published = true
    `;
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
    const posts = await prisma.$queryRaw<RawBlogPost[]>`
      SELECT id, slug, title, description, content, author, category, tags, image, published, featured, date, created_at, updated_at
      FROM blog_posts
      WHERE slug = ${slug}
    `;

    if (posts.length === 0) return null;

    const post = posts[0]!;
    if (!includeUnpublished && !post.published) return null;

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
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM blog_posts WHERE slug = ${slug}
    `;
    return Number(result[0]?.count ?? 0) > 0;
  } catch (error) {
    console.error('Error checking slug existence:', error);
    return false;
  }
}

/**
 * Create a new blog post
 */
export async function createBlogPost(data: BlogPostPayload): Promise<BlogPostOutput> {
  // Check if slug already exists
  const existing = await slugExists(data.slug);
  if (existing) {
    throw new Error('Un article avec ce slug existe déjà');
  }

  const now = new Date();
  const postDate = data.date ? new Date(data.date) : now;
  const tags = data.tags || [];
  const published = data.published !== false;
  const featured = data.featured === true;

  try {
    const result = await prisma.$queryRaw<RawBlogPost[]>`
      INSERT INTO blog_posts (slug, title, description, content, author, category, tags, image, published, featured, date, created_at, updated_at)
      VALUES (
        ${data.slug},
        ${data.title},
        ${data.description || null},
        ${data.content},
        ${data.author},
        ${data.category},
        ${tags}::text[],
        ${data.image || null},
        ${published},
        ${featured},
        ${postDate},
        ${now},
        ${now}
      )
      RETURNING id, slug, title, description, content, author, category, tags, image, published, featured, date, created_at, updated_at
    `;

    return formatBlogPostOutput(result[0]!);
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
  // If slug is being changed, check if new slug already exists
  if (data.slug && data.slug !== slug) {
    const existing = await slugExists(data.slug);
    if (existing) {
      throw new Error('Un article avec ce slug existe déjà');
    }
  }

  try {
    // First check if the post exists
    const existingPosts = await prisma.$queryRaw<RawBlogPost[]>`
      SELECT id, slug, title, description, content, author, category, tags, image, published, featured, date, created_at, updated_at
      FROM blog_posts
      WHERE slug = ${slug}
    `;

    if (existingPosts.length === 0) {
      return null;
    }

    const existing = existingPosts[0]!;
    const now = new Date();

    // Build the update with merged values
    const newSlug = data.slug ?? existing.slug;
    const newTitle = data.title ?? existing.title;
    const newDescription =
      data.description !== undefined ? data.description || null : existing.description;
    const newContent = data.content ?? existing.content;
    const newAuthor = data.author ?? existing.author;
    const newCategory = data.category ?? existing.category;
    const newTags = data.tags ?? existing.tags ?? [];
    const newImage = data.image !== undefined ? data.image || null : existing.image;
    const newPublished = data.published !== undefined ? data.published : existing.published;
    const newFeatured = data.featured !== undefined ? data.featured : existing.featured;
    const newDate = data.date ? new Date(data.date) : existing.date;

    const result = await prisma.$queryRaw<RawBlogPost[]>`
      UPDATE blog_posts
      SET
        slug = ${newSlug},
        title = ${newTitle},
        description = ${newDescription},
        content = ${newContent},
        author = ${newAuthor},
        category = ${newCategory},
        tags = ${newTags}::text[],
        image = ${newImage},
        published = ${newPublished},
        featured = ${newFeatured},
        date = ${newDate},
        updated_at = ${now}
      WHERE slug = ${slug}
      RETURNING id, slug, title, description, content, author, category, tags, image, published, featured, date, created_at, updated_at
    `;

    return formatBlogPostOutput(result[0]!);
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
    const result = await prisma.$queryRaw<Array<{ id: string }>>`
      DELETE FROM blog_posts WHERE slug = ${slug} RETURNING id
    `;
    return result.length > 0;
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
    const searchPattern = `%${query}%`;
    const posts = await prisma.$queryRaw<RawBlogPost[]>`
      SELECT id, slug, title, description, author, category, tags, image, published, featured, date, created_at, updated_at
      FROM blog_posts
      WHERE published = true
        AND (
          title ILIKE ${searchPattern}
          OR description ILIKE ${searchPattern}
          OR content ILIKE ${searchPattern}
        )
      ORDER BY date DESC
      LIMIT ${limit}
    `;

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
    const result = await prisma.$queryRaw<Array<{ category: string }>>`
      SELECT DISTINCT category FROM blog_posts WHERE published = true AND category IS NOT NULL
    `;
    return result.map(r => r.category);
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
    const result = await prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
      SELECT unnest(tags) as tag, COUNT(*) as count
      FROM blog_posts
      WHERE published = true AND tags IS NOT NULL
      GROUP BY unnest(tags)
      ORDER BY count DESC
    `;
    return result.map(r => ({ tag: r.tag, count: Number(r.count) }));
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
function formatBlogPostSummary(post: RawBlogPost): BlogPostSummary {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description || undefined,
    author: post.author || 'PSYPNOS',
    category: post.category || '',
    tags: post.tags || [],
    image: post.image || undefined,
    published: post.published,
    featured: post.featured,
    date:
      post.date instanceof Date
        ? (post.date.toISOString().split('T')[0] as string)
        : String(post.date),
  };
}

/**
 * Format database record to full API output
 */
function formatBlogPostOutput(post: RawBlogPost): BlogPostOutput {
  return {
    slug: post.slug,
    title: post.title,
    ...(post.description && { description: post.description }),
    content: post.content,
    author: post.author || 'PSYPNOS',
    category: post.category || '',
    tags: post.tags || [],
    ...(post.image && { image: post.image }),
    // Note: Extended fields (imagePrompt, seoIntent, persona, tones, faq, jsonLd) are not in the psypnos schema
    tones: [],
    published: post.published,
    featured: post.featured,
    date:
      post.date instanceof Date
        ? (post.date.toISOString().split('T')[0] as string)
        : String(post.date),
    createdAt: post.created_at.toISOString(),
    updatedAt: post.updated_at.toISOString(),
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
