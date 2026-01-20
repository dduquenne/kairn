/**
 * Blog Utilities
 * Helper functions for blog operations
 */

import readingTime from 'reading-time';
import type { BlogPost, BlogPostSummary, BlogPostMetadata } from './types';

/**
 * Formats a Prisma blog post to BlogPost interface
 */
export function formatPrismaPostToBlogPost(post: {
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
    post.content.slice(0, 200).replace(/[#*\[\]]/g, '').trim() + '...';

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
    faq: (post.faq as BlogPostMetadata['faq']) || undefined,
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
 * Converts a BlogPost to BlogPostSummary (for list views)
 */
export function postToSummary(post: BlogPost): BlogPostSummary {
  return {
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
  };
}

/**
 * Generates a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validates a slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Calculates similarity score between two posts
 * Used for finding related posts
 */
export function calculatePostSimilarity(
  post1: BlogPostSummary | BlogPost,
  post2: BlogPostSummary | BlogPost
): number {
  let score = 0;

  // Same category = +10 points
  if (post1.category === post2.category) {
    score += 10;
  }

  // Common tags = +5 points per tag
  const commonTags = post1.tags.filter((tag) =>
    post2.tags.includes(tag)
  );
  score += commonTags.length * 5;

  return score;
}

/**
 * Finds related posts based on category and tags
 */
export function findRelatedPosts(
  currentPost: BlogPost | BlogPostSummary,
  allPosts: BlogPostSummary[],
  limit: number = 3
): BlogPostSummary[] {
  return allPosts
    .filter((post) => post.slug !== currentPost.slug)
    .map((post) => ({
      post,
      score: calculatePostSimilarity(currentPost, post),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}

/**
 * Filters posts by category (case-insensitive)
 */
export function filterByCategory(
  posts: BlogPostSummary[],
  category: string
): BlogPostSummary[] {
  return posts.filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Filters posts by tag (case-insensitive)
 */
export function filterByTag(
  posts: BlogPostSummary[],
  tag: string
): BlogPostSummary[] {
  return posts.filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Searches posts by query
 * Searches in title, description, excerpt, tags, and category
 */
export function searchPosts(
  posts: BlogPostSummary[],
  query: string
): BlogPostSummary[] {
  const searchTerm = query.toLowerCase();

  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm) ||
      post.description.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
      post.category.toLowerCase().includes(searchTerm)
  );
}

/**
 * Extracts unique categories from posts
 */
export function extractCategories(posts: BlogPostSummary[]): string[] {
  const categories = posts.map((post) => post.category);
  return Array.from(new Set(categories)).sort();
}

/**
 * Extracts unique tags from posts
 */
export function extractTags(posts: BlogPostSummary[]): string[] {
  const tags = posts.flatMap((post) => post.tags);
  return Array.from(new Set(tags)).sort();
}

/**
 * Groups posts by category
 */
export function groupByCategory(
  posts: BlogPostSummary[]
): Record<string, BlogPostSummary[]> {
  return posts.reduce((acc, post) => {
    const category = post.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(post);
    return acc;
  }, {} as Record<string, BlogPostSummary[]>);
}

/**
 * Sorts posts by date (newest first by default)
 */
export function sortByDate(
  posts: BlogPostSummary[],
  ascending: boolean = false
): BlogPostSummary[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Paginates posts
 */
export function paginatePosts(
  posts: BlogPostSummary[],
  page: number,
  perPage: number
): {
  posts: BlogPostSummary[];
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
} {
  const totalPages = Math.ceil(posts.length / perPage);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const start = (currentPage - 1) * perPage;
  const paginatedPosts = posts.slice(start, start + perPage);

  return {
    posts: paginatedPosts,
    totalPages,
    currentPage,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
  };
}

/**
 * Gets featured posts
 */
export function getFeaturedPosts(
  posts: BlogPostSummary[],
  limit?: number
): BlogPostSummary[] {
  const featured = posts.filter((post) => post.featured);
  return limit ? featured.slice(0, limit) : featured;
}
