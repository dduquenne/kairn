import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

import { withAdminAuth } from '../../../auth/middleware';

/**
 * GET /api/admin/chatbot/conversations
 * List all chatbot conversations with pagination, search, and stats
 */
export async function GET(request: Request) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const search = searchParams.get('search')?.trim() || '';
  const status = searchParams.get('status') || '';
  const satisfaction = searchParams.get('satisfaction') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  try {
    const siteId = await getSiteId();

    // Build where clause — always scoped to current site
    const where: Record<string, unknown> = { siteId };

    if (status && ['active', 'ended', 'transferred'].includes(status)) {
      where.status = status;
    }

    if (satisfaction === 'satisfied') {
      where.satisfied = true;
    } else if (satisfaction === 'unsatisfied') {
      where.satisfied = false;
    } else if (satisfaction === 'no_feedback') {
      where.satisfied = null;
    }

    if (search) {
      where.messages = {
        some: {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      };
    }

    // Get conversations with message preview
    const [conversations, total] = await Promise.all([
      prisma.chatConversation.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 2,
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          [sortBy === 'messageCount' ? 'messageCount' : 'createdAt']: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.chatConversation.count({ where }),
    ]);

    // Get overall stats — scoped to current site
    const siteFilter = { siteId };
    const [
      totalConversations,
      activeConversations,
      satisfiedCount,
      unsatisfiedCount,
      totalMessages,
      avgMessages,
      todayConversations,
      weekConversations,
    ] = await Promise.all([
      prisma.chatConversation.count({ where: siteFilter }),
      prisma.chatConversation.count({ where: { ...siteFilter, status: 'active' } }),
      prisma.chatConversation.count({ where: { ...siteFilter, satisfied: true } }),
      prisma.chatConversation.count({ where: { ...siteFilter, satisfied: false } }),
      prisma.chatMessage.count({
        where: { conversation: { siteId } },
      }),
      prisma.chatConversation.aggregate({
        where: siteFilter,
        _avg: { messageCount: true },
      }),
      prisma.chatConversation.count({
        where: {
          ...siteFilter,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.chatConversation.count({
        where: {
          ...siteFilter,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const feedbackTotal = satisfiedCount + unsatisfiedCount;
    const satisfactionRate =
      feedbackTotal > 0 ? Math.round((satisfiedCount / feedbackTotal) * 1000) / 10 : null;

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conversations: conversations.map((conv: any) => ({
        id: conv.id,
        sessionId: conv.sessionId,
        status: conv.status,
        messageCount: conv.messageCount,
        satisfied: conv.satisfied,
        deviceType: conv.deviceType,
        referrer: conv.referrer,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        endedAt: conv.endedAt,
        preview: conv.messages[0]?.content?.slice(0, 120) || '',
        firstUserMessage:
          conv.messages
            .find((m: { role: string; content?: string }) => m.role === 'user')
            ?.content?.slice(0, 150) || '',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalConversations,
        activeConversations,
        satisfiedCount,
        unsatisfiedCount,
        satisfactionRate,
        totalMessages,
        avgMessagesPerConversation: Math.round((avgMessages._avg.messageCount || 0) * 10) / 10,
        todayConversations,
        weekConversations,
      },
    });
  } catch (error) {
    console.error('[Admin Chatbot] Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des conversations' },
      { status: 500 }
    );
  }
}
