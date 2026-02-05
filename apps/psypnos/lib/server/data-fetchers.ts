/**
 * Server-side data fetchers for SSR prefetching
 *
 * These functions fetch data directly from the PSYPNOS database for use in Server Components.
 * This avoids client-side fetch issues and provides instant initial data.
 *
 * IMPORTANT: The psypnos database uses a single-tenant schema with simple table names:
 * - blog_posts (not BlogPost with siteId)
 * - seminars (not Seminar with siteId)
 * - testimonials (not Testimonial with siteId)
 *
 * We use raw SQL queries to match the actual database structure.
 */

import { cache } from 'react';

import prisma from '@/lib/db/prisma';

// ============================================
// Seminar Types
// ============================================

export interface SeminarData {
  id: string;
  title: string;
  description: string;
  speakers: Array<{ firstName: string; lastName: string }>;
  startAt: string;
  endAt: string;
  capacity: number;
  price?: number;
  deposit?: number;
  tags: string[];
  thumbnail?: string;
  seminarType?: string;
}

// ============================================
// Blog Post Types
// ============================================

export interface BlogPostData {
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
// Testimonial Types
// ============================================

export interface TestimonialData {
  id: string;
  quote: string;
  author: string;
  role?: string;
}

// ============================================
// Raw Database Types (matching actual psypnos schema)
// ============================================

interface RawSeminar {
  id: string;
  title: string;
  description: string;
  speakers: unknown; // JSONB
  start_at: Date;
  end_at: Date;
  capacity: number;
  price: { toNumber?: () => number } | number | null;
  deposit: { toNumber?: () => number } | number | null;
  tags: string[] | null;
  thumbnail: string | null;
  seminar_type: string | null;
}

interface RawBlogPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  author: string;
  category: string;
  tags: string[] | null;
  image: string | null;
  published: boolean;
  featured: boolean;
  date: Date;
}

interface RawTestimonial {
  id: string;
  quote: string;
  author: string;
  role: string | null;
}

// ============================================
// Server-side Data Fetchers (cached per request)
// ============================================

/**
 * Fetch upcoming seminars for SSR
 * Uses raw SQL to query the actual psypnos database schema
 */
export const getUpcomingSeminars = cache(async (limit = 3): Promise<SeminarData[]> => {
  try {
    const now = new Date();

    // Query upcoming seminars from the single-tenant seminars table
    const seminars = await prisma.$queryRaw<RawSeminar[]>`
      SELECT id, title, description, speakers, start_at, end_at, capacity, price, deposit, tags, thumbnail, seminar_type
      FROM seminars
      WHERE start_at >= ${now}
      ORDER BY start_at ASC
      LIMIT ${limit}
    `;

    // If no upcoming seminars, get most recent ones
    if (seminars.length === 0) {
      const recentSeminars = await prisma.$queryRaw<RawSeminar[]>`
        SELECT id, title, description, speakers, start_at, end_at, capacity, price, deposit, tags, thumbnail, seminar_type
        FROM seminars
        ORDER BY start_at DESC
        LIMIT ${limit}
      `;
      return recentSeminars.map(formatSeminar);
    }

    return seminars.map(formatSeminar);
  } catch (error) {
    console.error('Error fetching seminars:', error);
    return [];
  }
});

/**
 * Fetch featured blog posts for SSR
 * Uses raw SQL to query the actual psypnos database schema
 */
export const getFeaturedBlogPosts = cache(async (limit = 3): Promise<BlogPostData[]> => {
  try {
    // Query published posts from the single-tenant blog_posts table
    // Order by featured first, then by date
    const posts = await prisma.$queryRaw<RawBlogPost[]>`
      SELECT id, slug, title, description, author, category, tags, image, published, featured, date
      FROM blog_posts
      WHERE published = true
      ORDER BY featured DESC, date DESC
      LIMIT ${limit}
    `;

    return posts.map(formatBlogPost);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
});

/**
 * Fetch testimonials for SSR
 * Uses raw SQL to query the actual psypnos database schema
 */
export const getTestimonials = cache(async (limit = 10): Promise<TestimonialData[]> => {
  try {
    // Query from the single-tenant testimonials table
    // Note: psypnos testimonials don't have isApproved or order columns
    const testimonials = await prisma.$queryRaw<RawTestimonial[]>`
      SELECT id, quote, author, role
      FROM testimonials
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return testimonials.map(formatTestimonial);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
});

// ============================================
// Format Helpers
// ============================================

function formatSeminar(seminar: RawSeminar): SeminarData {
  // Handle price/deposit which could be Decimal or number
  const getNumericValue = (
    val: { toNumber?: () => number } | number | null
  ): number | undefined => {
    if (val === null) return undefined;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && val.toNumber) return val.toNumber();
    return undefined;
  };

  return {
    id: seminar.id,
    title: seminar.title,
    description: seminar.description,
    speakers: (seminar.speakers as Array<{ firstName: string; lastName: string }>) || [],
    startAt: seminar.start_at.toISOString(),
    endAt: seminar.end_at.toISOString(),
    capacity: seminar.capacity,
    ...(seminar.price !== null && { price: getNumericValue(seminar.price) }),
    ...(seminar.deposit !== null && { deposit: getNumericValue(seminar.deposit) }),
    tags: seminar.tags || [],
    ...(seminar.thumbnail && { thumbnail: seminar.thumbnail }),
    ...(seminar.seminar_type && { seminarType: seminar.seminar_type }),
  };
}

function formatBlogPost(post: RawBlogPost): BlogPostData {
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

function formatTestimonial(testimonial: RawTestimonial): TestimonialData {
  return {
    id: testimonial.id,
    quote: testimonial.quote,
    author: testimonial.author,
    role: testimonial.role || undefined,
  };
}
