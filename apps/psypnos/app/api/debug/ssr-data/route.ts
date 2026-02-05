/**
 * Debug endpoint to test SSR data fetchers
 * This endpoint uses the same functions that page.tsx uses during SSR
 */

import { NextResponse } from 'next/server';

import prisma from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';
import {
  getUpcomingSeminars,
  getFeaturedBlogPosts,
  getTestimonials,
} from '@/lib/server/data-fetchers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      vercelEnv: process.env.VERCEL_ENV,
    },
  };

  // Test 1: Check if we can get the site ID
  try {
    const siteId = await getSiteId();
    results.siteId = { success: true, value: siteId };
  } catch (error) {
    results.siteId = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test 2: Check direct Prisma query
  try {
    const site = await prisma.site.findUnique({
      where: { slug: 'psypnos' },
      select: { id: true, name: true, domain: true },
    });
    results.directSiteQuery = { success: true, value: site };
  } catch (error) {
    results.directSiteQuery = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test 3: Get seminars using SSR data fetcher
  try {
    const seminars = await getUpcomingSeminars(3);
    results.seminars = {
      success: true,
      count: seminars.length,
      data: seminars.map(s => ({ id: s.id, title: s.title })),
    };
  } catch (error) {
    results.seminars = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test 4: Get blog posts using SSR data fetcher
  try {
    const posts = await getFeaturedBlogPosts(3);
    results.blogPosts = {
      success: true,
      count: posts.length,
      data: posts.map(p => ({ slug: p.slug, title: p.title })),
    };
  } catch (error) {
    results.blogPosts = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test 5: Get testimonials using SSR data fetcher
  try {
    const testimonials = await getTestimonials(10);
    results.testimonials = {
      success: true,
      count: testimonials.length,
      data: testimonials.map(t => ({ id: t.id, author: t.author })),
    };
  } catch (error) {
    results.testimonials = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
