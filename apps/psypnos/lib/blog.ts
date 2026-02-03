/* eslint-disable no-console, import/no-named-as-default, import/no-unresolved */
// TODO: Migration - Prisma/type incompatibilities to fix
// @ts-expect-error - reading-time types
import readingTime from 'reading-time';

import prisma from '@/lib/db/prisma';

/**
 * Blog Library - PostgreSQL via Prisma
 * Provides functions to read blog posts from the database
 */

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
  // For sync compatibility, we can't use Prisma directly
  // This is a limitation - recommend using async version
  console.warn('getBlogPostImage is deprecated - use getBlogPostImageAsync');
  return null;
}

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

/**
 * Get all post slugs (async version - recommended)
 */
export async function getAllPostSlugsAsync(): Promise<string[]> {
  try {
    const posts = await prisma.blogPostExtended.findMany({
      where: { published: true },
      select: { slug: true },
    });
    return posts.map((post: (typeof posts)[number]) => post.slug);
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
  // Return from cache if available
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
    const post = await prisma.blogPostExtended.findUnique({
      where: { slug },
    });

    if (!post) return null;

    return formatPrismaPostToBlogPost(post);
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
  // Return from cache if available
  if (postsCache && Date.now() - postsCacheTimestamp < CACHE_TTL) {
    const post = postsCache.find(p => p.slug === slug);
    if (post) return post;
  }
  console.warn('getPostBySlug is deprecated - use getPostBySlugAsync');
  return null;
}

/**
 * Format Prisma post to BlogPost interface
 */
function formatPrismaPostToBlogPost(post: {
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
}): BlogPost {
  // Calculate reading time
  const stats = readingTime(post.content);

  // Extract excerpt
  const excerpt =
    post.description ||
    post.content
      .slice(0, 200)
      .replace(/[#*[\]]/g, '')
      .trim() + '...';

  return {
    slug: post.slug,
    title: post.title,
    description: post.description || excerpt,
    date: post.date.toISOString().split('T')[0],
    author: post.author,
    category: post.category,
    tags: post.tags,
    image: post.image || undefined,
    published: post.published,
    featured: post.featured,
    faq: (post.faq as FAQItem[] | null) || undefined,
    jsonLd: (post.jsonLd as Record<string, unknown> | null) || undefined,
    imagePrompt: post.imagePrompt || undefined,
    seoIntent: post.seoIntent || undefined,
    persona: post.persona || undefined,
    tones: post.tones.length > 0 ? post.tones : undefined,
    content: post.content,
    readingTime: stats.text,
    excerpt,
  };
}

/**
 * Get all blog posts (async version - recommended)
 *
 * ROBUSTESSE : Cette fonction log tous les appels et erreurs pour faciliter
 * le diagnostic des problèmes d'affichage des articles.
 */
export async function getAllPostsAsync(includeUnpublished = false): Promise<BlogPostSummary[]> {
  const startTime = Date.now();
  console.log(`[blog] getAllPostsAsync appelé (includeUnpublished: ${includeUnpublished})`);

  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of day

    const posts = await prisma.blogPostExtended.findMany({
      where: {
        ...(includeUnpublished ? {} : { published: true }),
        ...(includeUnpublished ? {} : { date: { lte: today } }),
      },
      orderBy: { date: 'desc' },
    });

    console.log(
      `[blog] ${posts.length} articles récupérés de la base de données en ${Date.now() - startTime}ms`
    );

    const formattedPosts = posts.map(formatPrismaPostToBlogPost);

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

    // Log un échantillon des articles pour le diagnostic
    if (summaries.length > 0) {
      console.log(
        `[blog] Premier article: "${summaries[0].title}" - Tags: [${summaries[0].tags?.join(', ') || 'aucun'}]`
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
  // Return from cache if available
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
    const posts = await prisma.blogPostExtended.findMany({
      where: { published: true },
      distinct: ['category'],
      select: { category: true },
    });
    return posts.map((post: (typeof posts)[number]) => post.category).sort();
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
    const posts = await prisma.blogPostExtended.findMany({
      where: { published: true },
      select: { tags: true },
    });
    const allTags: string[] = posts.flatMap((post: { tags: string[] }) => post.tags);
    return Array.from(new Set(allTags)).sort();
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

  // Similarity score for each post
  const postsWithScore = allPosts
    .filter(post => post.slug !== slug)
    .map(post => {
      let score = 0;

      // Same category = +10 points
      if (post.category === currentPost.category) {
        score += 10;
      }

      // Common tags = +5 points per tag
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
    const posts = await prisma.blogPostExtended.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { date: 'desc' },
    });

    return posts.map(formatPrismaPostToBlogPost).map(
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
