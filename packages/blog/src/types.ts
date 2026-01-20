/**
 * Blog Types
 * Core type definitions for the blog system
 */

/**
 * FAQ Item structure
 */
export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

/**
 * Blog post metadata
 */
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

/**
 * Full blog post with content
 */
export interface BlogPost extends BlogPostMetadata {
  slug: string;
  content: string;
  readingTime: string;
  excerpt: string;
}

/**
 * Blog post summary for list views
 */
export interface BlogPostSummary extends BlogPostMetadata {
  slug: string;
  readingTime: string;
  excerpt: string;
}

/**
 * Table of contents heading
 */
export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

/**
 * Blog configuration
 */
export interface BlogConfig {
  /** Number of posts per page */
  postsPerPage: number;
  /** Default author name */
  defaultAuthor: string;
  /** Available categories */
  categories: string[];
  /** Enable featured posts */
  enableFeatured: boolean;
  /** Enable FAQs */
  enableFaq: boolean;
  /** Cache TTL in milliseconds */
  cacheTtl: number;
}

/**
 * Default blog configuration
 */
export const DEFAULT_BLOG_CONFIG: BlogConfig = {
  postsPerPage: 10,
  defaultAuthor: 'Admin',
  categories: [],
  enableFeatured: true,
  enableFaq: true,
  cacheTtl: 60000, // 1 minute
};
