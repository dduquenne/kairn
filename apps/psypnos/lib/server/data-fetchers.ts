/**
 * Server-side data fetchers for SSR prefetching
 *
 * These functions fetch data from internal API routes for use in Server Components.
 * Using API routes ensures consistent behavior between SSR and client-side.
 *
 * All queries filter by siteId to ensure tenant isolation.
 */

import { headers } from 'next/headers';
import { cache } from 'react';

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
 * Get the base URL for internal API calls
 */
async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

/**
 * Fetch upcoming seminars for SSR
 * Uses internal API route for consistent behavior
 */
export const getUpcomingSeminars = cache(async (limit = 3): Promise<SeminarData[]> => {
  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}/api/seminars?upcoming=true&limit=${limit}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[SSR] Seminars API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data.map((s: SeminarData) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      speakers: s.speakers || [],
      startAt: s.startAt,
      endAt: s.endAt,
      capacity: s.capacity,
      price: s.price,
      deposit: s.deposit,
      tags: s.tags || [],
      thumbnail: s.thumbnail,
      seminarType: s.seminarType,
    }));
  } catch (error) {
    console.error('[SSR] Error fetching seminars:', error);
    return [];
  }
});

/**
 * Fetch featured blog posts for SSR
 * Uses internal API route for consistent behavior
 */
export const getFeaturedBlogPosts = cache(async (limit = 3): Promise<BlogPostData[]> => {
  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}/api/blog/posts?limit=${limit}&featuredFirst=true`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[SSR] Blog API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data.map((p: BlogPostData) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      author: p.author,
      category: p.category,
      tags: p.tags || [],
      image: p.image,
      published: p.published,
      featured: p.featured,
      date: p.date,
    }));
  } catch (error) {
    console.error('[SSR] Error fetching blog posts:', error);
    return [];
  }
});

/**
 * Fetch testimonials for SSR
 * Uses internal API route for consistent behavior
 */
export const getTestimonials = cache(async (limit = 10): Promise<TestimonialData[]> => {
  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}/api/testimonials?limit=${limit}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[SSR] Testimonials API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data.map((t: TestimonialData) => ({
      id: t.id,
      quote: t.quote,
      author: t.author,
      role: t.role,
    }));
  } catch (error) {
    console.error('[SSR] Error fetching testimonials:', error);
    return [];
  }
});
