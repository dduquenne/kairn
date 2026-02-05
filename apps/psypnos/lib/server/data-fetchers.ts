/**
 * Server-side data fetchers for SSR prefetching
 *
 * These functions fetch data directly from the database for use in Server Components.
 * This avoids client-side fetch issues and provides instant initial data.
 */

import { PostStatus } from '@prisma/client';
import { cache } from 'react';

import prisma from '@/lib/db/prisma';

// Site slug for multi-tenancy
const SITE_SLUG = 'psypnos';

// ============================================
// Cached Site ID Getter
// ============================================

const getSiteId = cache(async (): Promise<string | null> => {
  try {
    const site = await prisma.site.findUnique({
      where: { slug: SITE_SLUG },
      select: { id: true },
    });
    return site?.id ?? null;
  } catch (error) {
    console.error('Error fetching site:', error);
    return null;
  }
});

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
// Server-side Data Fetchers (cached per request)
// ============================================

/**
 * Fetch upcoming seminars for SSR
 */
export const getUpcomingSeminars = cache(async (limit = 3): Promise<SeminarData[]> => {
  try {
    const siteId = await getSiteId();
    if (!siteId) return [];

    const now = new Date();
    const seminars = await prisma.seminar.findMany({
      where: {
        siteId,
        startAt: { gte: now },
      },
      orderBy: { startAt: 'asc' },
      take: limit,
    });

    // If no upcoming seminars, get most recent ones
    if (seminars.length === 0) {
      const recentSeminars = await prisma.seminar.findMany({
        where: { siteId },
        orderBy: { startAt: 'desc' },
        take: limit,
      });
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
 */
export const getFeaturedBlogPosts = cache(async (limit = 3): Promise<BlogPostData[]> => {
  try {
    const siteId = await getSiteId();
    if (!siteId) return [];

    const posts = await prisma.blogPost.findMany({
      where: {
        siteId,
        status: PostStatus.PUBLISHED,
      },
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    return posts.map(formatBlogPost);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
});

/**
 * Fetch testimonials for SSR
 */
export const getTestimonials = cache(async (limit = 10): Promise<TestimonialData[]> => {
  try {
    const siteId = await getSiteId();
    if (!siteId) return [];

    const testimonials = await prisma.testimonial.findMany({
      where: {
        siteId,
        isApproved: true,
      },
      orderBy: { order: 'asc' },
      take: limit,
    });

    return testimonials.map(formatTestimonial);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
});

// ============================================
// Format Helpers
// ============================================

function formatSeminar(seminar: {
  id: string;
  title: string;
  description: string;
  speakers: unknown;
  startAt: Date;
  endAt: Date;
  capacity: number;
  price: { toNumber: () => number } | null;
  deposit: { toNumber: () => number } | null;
  tags: string[];
  thumbnail: string | null;
  seminarType: string | null;
}): SeminarData {
  return {
    id: seminar.id,
    title: seminar.title,
    description: seminar.description,
    speakers: seminar.speakers as Array<{ firstName: string; lastName: string }>,
    startAt: seminar.startAt.toISOString(),
    endAt: seminar.endAt.toISOString(),
    capacity: seminar.capacity,
    ...(seminar.price && { price: seminar.price.toNumber() }),
    ...(seminar.deposit && { deposit: seminar.deposit.toNumber() }),
    tags: seminar.tags,
    ...(seminar.thumbnail && { thumbnail: seminar.thumbnail }),
    ...(seminar.seminarType && { seminarType: seminar.seminarType }),
  };
}

function formatBlogPost(post: {
  slug: string;
  title: string;
  excerpt: string | null;
  authorName: string | null;
  category: string | null;
  coverImage: string | null;
  status: PostStatus;
  featured: boolean;
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
    published: post.status === PostStatus.PUBLISHED,
    featured: post.featured,
    date: (post.publishedAt ?? post.createdAt).toISOString().split('T')[0] as string,
  };
}

function formatTestimonial(testimonial: {
  id: string;
  content: string;
  clientName: string;
  clientInitials: string | null;
}): TestimonialData {
  return {
    id: testimonial.id,
    quote: testimonial.content,
    author: testimonial.clientInitials || testimonial.clientName,
    role: undefined,
  };
}
