/**
 * API CRUD pour les posts sociaux
 *
 * GET /api/social/posts - Liste des posts avec filtres
 * POST /api/social/posts - Créer un nouveau post
 */

import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import {
  getSocialPostsWithRelations,
  createSocialPost,
  countPostsByStatus,
} from '@/lib/social/store';
import type { SocialPlatform, PostStatus, CreateSocialPostInput } from '@/lib/social/types';

function parseFilters(searchParams: URLSearchParams) {
  const filters: {
    platform?: SocialPlatform;
    status?: PostStatus;
    accountId?: string;
    blogSlug?: string;
    scheduledFrom?: Date;
    scheduledTo?: Date;
    limit?: number;
    offset?: number;
  } = {};

  const platform = searchParams.get('platform');
  if (platform) filters.platform = platform as SocialPlatform;

  const status = searchParams.get('status');
  if (status) filters.status = status as PostStatus;

  const accountId = searchParams.get('accountId');
  if (accountId) filters.accountId = accountId;

  const blogSlug = searchParams.get('blogSlug');
  if (blogSlug) filters.blogSlug = blogSlug;

  // Support both 'from'/'to' and 'scheduledFrom'/'scheduledTo' parameter names
  const from = searchParams.get('from') || searchParams.get('scheduledFrom');
  if (from) filters.scheduledFrom = new Date(from);

  const to = searchParams.get('to') || searchParams.get('scheduledTo');
  if (to) filters.scheduledTo = new Date(to);

  const limit = searchParams.get('limit');
  if (limit) filters.limit = parseInt(limit, 10);

  const offset = searchParams.get('offset');
  if (offset) filters.offset = parseInt(offset, 10);

  return filters;
}

// ===========================================
// GET - Liste des posts
// ===========================================

export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = parseFilters(searchParams);

    // Always include relations to get account name and analytics
    const [postsWithRelations, statusCounts] = await Promise.all([
      getSocialPostsWithRelations(filters),
      countPostsByStatus(),
    ]);

    // Transform posts to include accountName at top level for easier frontend consumption
    const posts = postsWithRelations.map(post => ({
      id: post.id,
      platform: post.platform,
      content: post.content,
      status: post.status,
      blogTitle: post.blogTitle,
      blogSlug: post.blogSlug,
      scheduledAt: post.scheduledAt,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      accountName: post.account?.accountName || 'Compte inconnu',
      accountId: post.accountId,
      hashtags: post.hashtags || [],
      platformUrl: post.platformUrl,
      errorMessage: post.errorMessage,
      linkUrl: post.linkUrl,
      mediaUrls: post.mediaUrls || [],
      externalPostId: post.externalPostId,
      generatedBy: post.generatedBy,
      metadata: post.metadata,
      // Include analytics summary if available
      analytics: post.analytics
        ? {
            impressions: post.analytics.impressions,
            reach: post.analytics.reach,
            engagements: post.analytics.engagements,
            likes: post.analytics.likes,
            comments: post.analytics.comments,
            shares: post.analytics.shares,
          }
        : null,
    }));

    return NextResponse.json({
      posts,
      counts: statusCounts,
      filters,
    });
  } catch (error) {
    console.error('[Social Posts API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}

// ===========================================
// POST - Créer un post
// ===========================================

export async function POST(request: NextRequest) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();

    // Validation
    const validation = validateCreateInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const input: CreateSocialPostInput = {
      accountId: body.accountId,
      platform: body.platform,
      content: body.content,
      blogSlug: body.blogSlug,
      blogTitle: body.blogTitle,
      mediaUrls: body.mediaUrls || [],
      hashtags: body.hashtags || [],
      linkUrl: body.linkUrl,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      generatedBy: body.generatedBy || 'manual',
      aiPrompt: body.aiPrompt,
      aiModel: body.aiModel,
      metadata: body.metadata,
    };

    const post = await createSocialPost(input);

    console.log(`[Social Posts API] Created post ${post.id} for ${post.platform}`);

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('[Social Posts API] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}

// ===========================================
// Validation
// ===========================================

function validateCreateInput(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Corps de la requête invalide' };
  }

  const b = body as Record<string, unknown>;

  if (!b.accountId || typeof b.accountId !== 'string') {
    return { valid: false, error: 'accountId est requis' };
  }

  if (!b.platform || typeof b.platform !== 'string') {
    return { valid: false, error: 'platform est requis' };
  }

  const validPlatforms = ['FACEBOOK', 'LINKEDIN', 'INSTAGRAM', 'TWITTER', 'THREADS'];
  if (!validPlatforms.includes(b.platform)) {
    return { valid: false, error: `Plateforme invalide: ${b.platform}` };
  }

  if (!b.content || typeof b.content !== 'string' || b.content.trim() === '') {
    return { valid: false, error: 'content est requis' };
  }

  return { valid: true };
}
