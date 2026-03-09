/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - SocialPost model not available in Kairn schema
/**
 * API pour récupérer les posts sociaux liés à des articles de blog
 *
 * GET /api/social/posts/by-blog?slugs=slug1,slug2,... - Récupère les posts par slugs
 */

import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import type { SocialPlatform } from '@/lib/social/types';

// ===========================================
// Types
// ===========================================

interface BlogSocialStatus {
  blogSlug: string;
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  failedPosts: number;
  draftPosts: number;
  platforms: SocialPlatform[];
  lastPublishedAt: string | null;
  nextScheduledAt: string | null;
}

// ===========================================
// GET - Récupérer le statut social des articles
// ===========================================

export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const slugsParam = searchParams.get('slugs');

    if (!slugsParam) {
      return NextResponse.json({ error: 'Paramètre slugs requis' }, { status: 400 });
    }

    const slugs = slugsParam.split(',').map((s) => s.trim()).filter(Boolean);

    if (slugs.length === 0) {
      return NextResponse.json({ statuses: {} });
    }

    // Récupérer tous les posts pour ces slugs
    const posts: Array<{
      blogSlug: string | null;
      platform: string;
      status: string;
      scheduledAt: Date | null;
      publishedAt: Date | null;
    }> = await prisma.socialPost.findMany({
      where: {
        blogSlug: {
          in: slugs,
        },
      },
      select: {
        blogSlug: true,
        platform: true,
        status: true,
        scheduledAt: true,
        publishedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Grouper par slug
    const statusMap: Record<string, BlogSocialStatus> = {};

    for (const slug of slugs) {
      const slugPosts = posts.filter((p) => p.blogSlug === slug);
      const platforms = new Set<SocialPlatform>();
      let publishedCount = 0;
      let scheduledCount = 0;
      let failedCount = 0;
      let draftCount = 0;
      let lastPublishedAt: Date | null = null;
      let nextScheduledAt: Date | null = null;

      for (const post of slugPosts) {
        platforms.add(post.platform as SocialPlatform);

        switch (post.status) {
          case 'PUBLISHED':
            publishedCount++;
            if (post.publishedAt && (!lastPublishedAt || post.publishedAt > lastPublishedAt)) {
              lastPublishedAt = post.publishedAt;
            }
            break;
          case 'SCHEDULED':
            scheduledCount++;
            if (post.scheduledAt && (!nextScheduledAt || post.scheduledAt < nextScheduledAt)) {
              nextScheduledAt = post.scheduledAt;
            }
            break;
          case 'FAILED':
            failedCount++;
            break;
          case 'DRAFT':
            draftCount++;
            break;
        }
      }

      statusMap[slug] = {
        blogSlug: slug,
        totalPosts: slugPosts.length,
        publishedPosts: publishedCount,
        scheduledPosts: scheduledCount,
        failedPosts: failedCount,
        draftPosts: draftCount,
        platforms: Array.from(platforms),
        lastPublishedAt: lastPublishedAt?.toISOString() || null,
        nextScheduledAt: nextScheduledAt?.toISOString() || null,
      };
    }

    return NextResponse.json({ statuses: statusMap });
  } catch (error) {
    console.error('[Social Posts By Blog API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
