/**
 * Server-side data fetchers for SSR prefetching
 *
 * These functions fetch data directly from the Kairn multi-tenant database for use in Server Components.
 * This avoids client-side fetch issues and provides instant initial data.
 *
 * All queries filter by siteId to ensure tenant isolation.
 */

import { Decimal } from '@prisma/client/runtime/library';
import { unstable_noStore as noStore } from 'next/cache';

import prisma from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

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
// Server-side Data Fetchers
// ============================================

/**
 * Fetch upcoming seminars for SSR
 * Uses Prisma models with multi-tenant siteId filtering
 */
export async function getUpcomingSeminars(limit = 3): Promise<SeminarData[]> {
  noStore(); // Opt out of caching for fresh data

  // eslint-disable-next-line no-console
  console.log('[SSR] getUpcomingSeminars: Starting fetch, limit:', limit);

  try {
    const siteId = await getSiteId();
    // eslint-disable-next-line no-console
    console.log('[SSR] getUpcomingSeminars: Got siteId:', siteId);

    const now = new Date();

    // Query upcoming seminars
    let seminars = await prisma.seminar.findMany({
      where: {
        siteId,
        startAt: { gte: now },
      },
      orderBy: { startAt: 'asc' },
      take: limit,
    });

    // eslint-disable-next-line no-console
    console.log('[SSR] getUpcomingSeminars: Found upcoming:', seminars.length);

    // If no upcoming seminars, get most recent ones
    if (seminars.length === 0) {
      seminars = await prisma.seminar.findMany({
        where: { siteId },
        orderBy: { startAt: 'desc' },
        take: limit,
      });
      // eslint-disable-next-line no-console
      console.log('[SSR] getUpcomingSeminars: Found recent:', seminars.length);
    }

    const result = seminars.map(formatSeminar);
    // eslint-disable-next-line no-console
    console.log('[SSR] getUpcomingSeminars: Returning', result.length, 'seminars');
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[SSR] getUpcomingSeminars ERROR:', error);
    // Return empty array to prevent page crash, but error is logged
    return [];
  }
}

/**
 * Fetch featured blog posts for SSR
 * Uses Prisma models with multi-tenant siteId filtering
 */
export async function getFeaturedBlogPosts(limit = 3): Promise<BlogPostData[]> {
  noStore(); // Opt out of caching for fresh data

  // eslint-disable-next-line no-console
  console.log('[SSR] getFeaturedBlogPosts: Starting fetch, limit:', limit);

  try {
    const siteId = await getSiteId();
    // eslint-disable-next-line no-console
    console.log('[SSR] getFeaturedBlogPosts: Got siteId:', siteId);

    // Query published posts, ordered by featured first then by date
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
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
    });

    // eslint-disable-next-line no-console
    console.log('[SSR] getFeaturedBlogPosts: Found', posts.length, 'posts');

    const result = posts.map(formatBlogPost);
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[SSR] getFeaturedBlogPosts ERROR:', error);
    return [];
  }
}

/**
 * Fetch testimonials for SSR
 * Uses Prisma models with multi-tenant siteId filtering
 */
export async function getTestimonials(limit = 10): Promise<TestimonialData[]> {
  noStore(); // Opt out of caching for fresh data

  // eslint-disable-next-line no-console
  console.log('[SSR] getTestimonials: Starting fetch, limit:', limit);

  try {
    const siteId = await getSiteId();
    // eslint-disable-next-line no-console
    console.log('[SSR] getTestimonials: Got siteId:', siteId);

    // Query approved testimonials
    const testimonials = await prisma.testimonial.findMany({
      where: {
        siteId,
        isApproved: true,
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });

    // eslint-disable-next-line no-console
    console.log('[SSR] getTestimonials: Found', testimonials.length, 'testimonials');

    return testimonials.map(formatTestimonial);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[SSR] getTestimonials ERROR:', error);
    return [];
  }
}

// ============================================
// Format Helpers
// ============================================

/**
 * Get numeric value from Decimal or number
 */
function getNumericValue(val: Decimal | number | null): number | undefined {
  if (val === null) return undefined;
  if (typeof val === 'number') return val;
  if (val instanceof Decimal) return val.toNumber();
  return undefined;
}

function formatSeminar(seminar: {
  id: string;
  title: string;
  description: string;
  speakers: unknown;
  startAt: Date;
  endAt: Date;
  capacity: number;
  price: Decimal | null;
  deposit: Decimal | null;
  tags: string[];
  thumbnail: string | null;
  seminarType: string | null;
}): SeminarData {
  return {
    id: seminar.id,
    title: seminar.title,
    description: seminar.description,
    speakers: (seminar.speakers as Array<{ firstName: string; lastName: string }>) || [],
    startAt: seminar.startAt.toISOString(),
    endAt: seminar.endAt.toISOString(),
    capacity: seminar.capacity,
    ...(seminar.price !== null && { price: getNumericValue(seminar.price) }),
    ...(seminar.deposit !== null && { deposit: getNumericValue(seminar.deposit) }),
    tags: seminar.tags || [],
    ...(seminar.thumbnail && { thumbnail: seminar.thumbnail }),
    ...(seminar.seminarType && { seminarType: seminar.seminarType }),
  };
}

function formatBlogPost(post: {
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
}): BlogPostData {
  return {
    slug: post.slug,
    title: post.title,
    description: post.excerpt || undefined,
    author: post.authorName || 'PSYPNOS',
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

function formatTestimonial(testimonial: {
  id: string;
  clientName: string;
  clientInitials: string | null;
  content: string;
  rating: number | null;
  isApproved: boolean;
  order: number;
}): TestimonialData {
  return {
    id: testimonial.id,
    quote: testimonial.content,
    author: testimonial.clientName,
    // Note: The multi-tenant schema doesn't have a 'role' field
  };
}
