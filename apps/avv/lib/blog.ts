/* eslint-disable no-console */
/**
 * Blog Library - Multi-tenant Prisma Models
 *
 * This module provides blog post access using the Kairn multi-tenant database schema.
 * All queries filter by siteId to ensure tenant isolation.
 */
import readingTime from 'reading-time';

import prisma from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

// ============================================
// Types
// ============================================

export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

export interface BlogPostMetadata {
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  published: boolean;
  featured?: boolean;
  faq?: FAQItem[];
  jsonLd?: Record<string, unknown>;
  imagePrompt?: string;
  seoIntent?: string;
  persona?: string;
  tones?: string[];
}

export interface BlogPost extends BlogPostMetadata {
  slug: string;
  content: string;
  readingTime: string;
  excerpt: string;
}

export interface BlogPostSummary extends BlogPostMetadata {
  slug: string;
  readingTime: string;
  excerpt: string;
}

// Cache for sync functions (populated by async calls)
let postsCache: BlogPost[] | null = null;
let postsCacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

// ============================================
// Helper Functions
// ============================================

/**
 * Format Prisma BlogPost to our BlogPost interface
 */
function formatPrismaPost(post: {
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
  tags: Array<{ tag: { name: string } }>;
}): BlogPost {
  const stats = readingTime(post.content);
  const excerpt =
    post.excerpt ||
    post.content
      .slice(0, 200)
      .replace(/[#*[\]]/g, '')
      .trim() + '...';

  const dateStr = post.publishedAt
    ? post.publishedAt.toISOString().split('T')[0]!
    : post.createdAt.toISOString().split('T')[0]!;

  return {
    slug: post.slug,
    title: post.title,
    description: post.excerpt || excerpt,
    date: dateStr,
    author: post.authorName || 'AVV',
    category: post.category || '',
    tags: post.tags.map(t => t.tag.name),
    image: post.coverImage || undefined,
    published: post.status === 'PUBLISHED',
    featured: post.featured || false,
    faq: post.faq as FAQItem[] | undefined,
    jsonLd: post.jsonLd as Record<string, unknown> | undefined,
    imagePrompt: post.imagePrompt || undefined,
    seoIntent: post.seoIntent || undefined,
    persona: post.persona || undefined,
    tones: post.tones || [],
    content: post.content,
    readingTime: stats.text,
    excerpt,
  };
}

// ============================================
// Async API Functions (Recommended)
// ============================================

/**
 * Get image URL for a blog post
 */
export async function getBlogPostImageAsync(slug: string): Promise<string | null> {
  try {
    const post = await getPostBySlugAsync(slug);
    return post?.image || null;
  } catch {
    return null;
  }
}

/**
 * Get image URL for a blog post (sync version for backward compatibility)
 * @deprecated Use getBlogPostImageAsync instead
 */
export function getBlogPostImage(_slug: string): string | null {
  console.warn('getBlogPostImage is deprecated - use getBlogPostImageAsync');
  return null;
}

/**
 * Get all post slugs (async version - recommended)
 */
export async function getAllPostSlugsAsync(): Promise<string[]> {
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
 * Get all post slugs (sync version for backward compatibility)
 * @deprecated Use getAllPostSlugsAsync instead
 */
export function getAllPostSlugs(): string[] {
  if (postsCache && Date.now() - postsCacheTimestamp < CACHE_TTL) {
    return postsCache.map(post => post.slug);
  }
  console.warn('getAllPostSlugs is deprecated - use getAllPostSlugsAsync');
  return [];
}

/**
 * Get a blog post by slug (async version - recommended)
 */
export async function getPostBySlugAsync(slug: string): Promise<BlogPost | null> {
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

    return formatPrismaPost(post);
  } catch (error) {
    console.error(`Error fetching post ${slug}:`, error);
    return null;
  }
}

/**
 * Get a blog post by slug (sync version for backward compatibility)
 * @deprecated Use getPostBySlugAsync instead
 */
export function getPostBySlug(slug: string): BlogPost | null {
  if (postsCache && Date.now() - postsCacheTimestamp < CACHE_TTL) {
    const post = postsCache.find(p => p.slug === slug);
    if (post) return post;
  }
  console.warn('getPostBySlug is deprecated - use getPostBySlugAsync');
  return null;
}

/**
 * Get all blog posts (async version - recommended)
 */
export async function getAllPostsAsync(includeUnpublished = false): Promise<BlogPostSummary[]> {
  const startTime = Date.now();
  console.log(`[blog] getAllPostsAsync appelé (includeUnpublished: ${includeUnpublished})`);

  try {
    const siteId = await getSiteId();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const posts = await prisma.blogPost.findMany({
      where: {
        siteId,
        ...(includeUnpublished
          ? {}
          : {
              status: 'PUBLISHED',
              publishedAt: { lte: today },
            }),
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    console.log(
      `[blog] ${posts.length} articles récupérés de la base de données en ${Date.now() - startTime}ms`
    );

    const formattedPosts = posts.map(formatPrismaPost);

    // Update cache for sync functions
    postsCache = formattedPosts;
    postsCacheTimestamp = Date.now();

    const summaries = formattedPosts.map(
      (post: BlogPost): BlogPostSummary => ({
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.date,
        author: post.author,
        category: post.category,
        tags: post.tags,
        image: post.image,
        published: post.published,
        featured: post.featured,
        readingTime: post.readingTime,
        excerpt: post.excerpt,
      })
    );

    if (summaries.length > 0) {
      const first = summaries[0]!;
      console.log(
        `[blog] Premier article: "${first.title}" - Tags: [${first.tags?.join(', ') || 'aucun'}]`
      );
    }

    return summaries;
  } catch (error) {
    console.error('[blog] ERREUR lors de la récupération des articles:', error);
    console.error('[blog] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return [];
  }
}

/**
 * Get all blog posts (sync version for backward compatibility)
 * @deprecated Use getAllPostsAsync instead
 */
export function getAllPosts(includeUnpublished = false): BlogPostSummary[] {
  if (postsCache && Date.now() - postsCacheTimestamp < CACHE_TTL) {
    const filteredPosts = includeUnpublished
      ? postsCache
      : postsCache.filter(post => {
          if (!post.published) return false;
          const postDate = new Date(post.date);
          postDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return postDate <= today;
        });

    return filteredPosts.map(
      ({
        slug,
        title,
        description,
        date,
        author,
        category,
        tags,
        image,
        published,
        featured,
        readingTime: rt,
        excerpt,
      }) => ({
        slug,
        title,
        description,
        date,
        author,
        category,
        tags,
        image,
        published,
        featured,
        readingTime: rt,
        excerpt,
      })
    );
  }

  console.warn('getAllPosts is deprecated - use getAllPostsAsync');
  return [];
}

/**
 * Get posts by category (async version)
 */
export async function getPostsByCategoryAsync(
  category: string,
  includeUnpublished = false
): Promise<BlogPostSummary[]> {
  const allPosts = await getAllPostsAsync(includeUnpublished);
  return allPosts.filter(post => post.category.toLowerCase() === category.toLowerCase());
}

/**
 * Get posts by category (sync version for backward compatibility)
 * @deprecated Use getPostsByCategoryAsync instead
 */
export function getPostsByCategory(
  category: string,
  includeUnpublished = false
): BlogPostSummary[] {
  const allPosts = getAllPosts(includeUnpublished);
  return allPosts.filter(post => post.category.toLowerCase() === category.toLowerCase());
}

/**
 * Get posts by tag (async version)
 */
export async function getPostsByTagAsync(
  tag: string,
  includeUnpublished = false
): Promise<BlogPostSummary[]> {
  const allPosts = await getAllPostsAsync(includeUnpublished);
  return allPosts.filter(post => post.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
}

/**
 * Get posts by tag (sync version for backward compatibility)
 * @deprecated Use getPostsByTagAsync instead
 */
export function getPostsByTag(tag: string, includeUnpublished = false): BlogPostSummary[] {
  const allPosts = getAllPosts(includeUnpublished);
  return allPosts.filter(post => post.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
}

/**
 * Get all unique categories (async version)
 */
export async function getAllCategoriesAsync(): Promise<string[]> {
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
    return posts
      .map(p => p.category)
      .filter((c): c is string => c !== null)
      .sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Get all unique categories (sync version for backward compatibility)
 * @deprecated Use getAllCategoriesAsync instead
 */
export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categories = posts.map(post => post.category);
  return Array.from(new Set(categories)).sort();
}

/**
 * Get all unique tags (async version)
 */
export async function getAllTagsAsync(): Promise<string[]> {
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
    const tags = new Set<string>();
    for (const post of posts) {
      for (const t of post.tags) {
        tags.add(t.tag.name);
      }
    }
    return Array.from(tags).sort();
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Get all unique tags (sync version for backward compatibility)
 * @deprecated Use getAllTagsAsync instead
 */
export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = posts.flatMap(post => post.tags);
  return Array.from(new Set(tags)).sort();
}

/**
 * Get related posts (async version)
 */
export async function getRelatedPostsAsync(slug: string, limit = 3): Promise<BlogPostSummary[]> {
  const currentPost = await getPostBySlugAsync(slug);
  if (!currentPost) return [];

  const allPosts = await getAllPostsAsync();

  const postsWithScore = allPosts
    .filter(post => post.slug !== slug)
    .map(post => {
      let score = 0;

      if (post.category === currentPost.category) {
        score += 10;
      }

      const commonTags = post.tags.filter(tag => currentPost.tags.includes(tag));
      score += commonTags.length * 5;

      return { post, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return postsWithScore.map(({ post }) => post);
}

/**
 * Get related posts (sync version for backward compatibility)
 * @deprecated Use getRelatedPostsAsync instead
 */
export function getRelatedPosts(slug: string, limit = 3): BlogPostSummary[] {
  const currentPost = getPostBySlug(slug);
  if (!currentPost) return [];

  const allPosts = getAllPosts();

  const postsWithScore = allPosts
    .filter(post => post.slug !== slug)
    .map(post => {
      let score = 0;
      if (post.category === currentPost.category) score += 10;
      const commonTags = post.tags.filter(tag => currentPost.tags.includes(tag));
      score += commonTags.length * 5;
      return { post, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return postsWithScore.map(({ post }) => post);
}

/**
 * Search posts (async version)
 */
export async function searchPostsAsync(query: string): Promise<BlogPostSummary[]> {
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
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    return posts.map(formatPrismaPost).map(
      (post: BlogPost): BlogPostSummary => ({
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.date,
        author: post.author,
        category: post.category,
        tags: post.tags,
        image: post.image,
        published: post.published,
        featured: post.featured,
        readingTime: post.readingTime,
        excerpt: post.excerpt,
      })
    );
  } catch (error) {
    console.error('Error searching posts:', error);
    return [];
  }
}

/**
 * Search posts (sync version for backward compatibility)
 * @deprecated Use searchPostsAsync instead
 */
export function searchPosts(query: string): BlogPostSummary[] {
  const allPosts = getAllPosts();
  const searchTerm = query.toLowerCase();

  return allPosts.filter(
    post =>
      post.title.toLowerCase().includes(searchTerm) ||
      post.description.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      post.category.toLowerCase().includes(searchTerm)
  );
}
