/* eslint-disable no-console */
/**
 * GET /api/debug/blog-status — Diagnostic endpoint for blog system
 *
 * Returns the actual state of the blog data pipeline:
 * - Database connectivity
 * - Site record existence
 * - Blog post counts by status
 * - Sample post data
 * - Any errors encountered
 *
 * This endpoint is intentionally public (no auth) for debugging deployment issues.
 * It does NOT expose sensitive data (no content, no auth tokens).
 */

import { NextResponse } from 'next/server';

import prisma from '@/lib/db/prisma';

interface DiagnosticResult {
  timestamp: string;
  checks: {
    databaseUrl: boolean;
    databaseConnected: boolean;
    siteRecord: { found: boolean; id?: string; slug?: string; isActive?: boolean } | null;
    blogPosts: {
      total: number;
      published: number;
      draft: number;
      withPublishedAt: number;
      withoutPublishedAt: number;
      futurePublishedAt: number;
    } | null;
    samplePosts: Array<{
      slug: string;
      title: string;
      status: string;
      publishedAt: string | null;
      category: string | null;
      featured: boolean | null;
    }>;
  };
  errors: string[];
}

export async function GET() {
  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    checks: {
      databaseUrl: false,
      databaseConnected: false,
      siteRecord: null,
      blogPosts: null,
      samplePosts: [],
    },
    errors: [],
  };

  // 1. Check DATABASE_URL
  result.checks.databaseUrl = !!process.env.DATABASE_URL;
  if (!result.checks.databaseUrl) {
    result.errors.push('DATABASE_URL is not set');
    return NextResponse.json(result, { status: 503 });
  }

  // 2. Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    result.checks.databaseConnected = true;
  } catch (error) {
    result.checks.databaseConnected = false;
    result.errors.push(
      `Database connection failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return NextResponse.json(result, { status: 503 });
  }

  // 3. Check Site record
  try {
    const site = await prisma.site.findUnique({
      where: { slug: 'psypnos' },
      select: { id: true, slug: true, isActive: true },
    });

    if (site) {
      result.checks.siteRecord = {
        found: true,
        id: site.id,
        slug: site.slug,
        isActive: site.isActive,
      };
    } else {
      result.checks.siteRecord = { found: false };
      result.errors.push('Site record with slug "psypnos" not found in database');

      // List all sites for debugging
      const allSites = await prisma.site.findMany({ select: { slug: true, isActive: true } });
      result.errors.push(`Available sites: ${JSON.stringify(allSites)}`);
    }
  } catch (error) {
    result.errors.push(
      `Site query failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // 4. Check BlogPost records
  if (result.checks.siteRecord?.found && result.checks.siteRecord.id) {
    const siteId = result.checks.siteRecord.id;
    const now = new Date();

    try {
      const [total, published, draft, withPublishedAt, futurePublishedAt] = await Promise.all([
        prisma.blogPost.count({ where: { siteId } }),
        prisma.blogPost.count({ where: { siteId, status: 'PUBLISHED' } }),
        prisma.blogPost.count({ where: { siteId, status: 'DRAFT' } }),
        prisma.blogPost.count({ where: { siteId, publishedAt: { not: null } } }),
        prisma.blogPost.count({ where: { siteId, publishedAt: { gt: now } } }),
      ]);

      result.checks.blogPosts = {
        total,
        published,
        draft,
        withPublishedAt,
        withoutPublishedAt: total - withPublishedAt,
        futurePublishedAt,
      };

      if (total === 0) {
        result.errors.push(
          'No blog posts found in database for this site. Run seed or create posts via admin.'
        );
      } else if (published === 0) {
        result.errors.push(
          `Found ${total} blog post(s) but none have status PUBLISHED. All posts are in DRAFT.`
        );
      }

      // 5. Sample posts (first 5, no content)
      const samplePosts = await prisma.blogPost.findMany({
        where: { siteId },
        select: {
          slug: true,
          title: true,
          status: true,
          publishedAt: true,
          category: true,
          featured: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      result.checks.samplePosts = samplePosts.map(p => ({
        slug: p.slug,
        title: p.title,
        status: p.status,
        publishedAt: p.publishedAt?.toISOString() ?? null,
        category: p.category,
        featured: p.featured,
      }));
    } catch (error) {
      result.errors.push(
        `BlogPost query failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const status = result.errors.length > 0 ? 500 : 200;
  return NextResponse.json(result, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
