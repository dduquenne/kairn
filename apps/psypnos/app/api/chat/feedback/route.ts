/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Type incompatibilities to fix
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';

const feedbackSchema = z.object({
  conversationId: z.string(),
  satisfied: z.boolean(),
});

/**
 * POST /api/chat/feedback
 * Record user feedback for a conversation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { conversationId, satisfied } = parsed.data;

    // Update conversation with feedback
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        satisfied,
        status: 'ended',
        endedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Merci pour votre retour !',
    });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du feedback" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/feedback
 * Get chat statistics (admin only)
 */
export async function GET() {
  try {
    const [
      totalConversations,
      satisfiedConversations,
      unsatisfiedConversations,
      totalMessages,
      averageMessagesPerConversation,
    ] = await Promise.all([
      prisma.chatConversation.count(),
      prisma.chatConversation.count({ where: { satisfied: true } }),
      prisma.chatConversation.count({ where: { satisfied: false } }),
      prisma.chatMessage.count(),
      prisma.chatConversation.aggregate({
        _avg: { messageCount: true },
      }),
    ]);

    // Recent conversations with feedback
    const recentFeedback = await prisma.chatConversation.findMany({
      where: { satisfied: { not: null } },
      take: 10,
      orderBy: { endedAt: 'desc' },
      select: {
        id: true,
        satisfied: true,
        messageCount: true,
        endedAt: true,
      },
    });

    const satisfactionRate =
      totalConversations > 0
        ? (satisfiedConversations / (satisfiedConversations + unsatisfiedConversations)) * 100
        : 0;

    return NextResponse.json({
      stats: {
        totalConversations,
        satisfiedConversations,
        unsatisfiedConversations,
        totalMessages,
        averageMessagesPerConversation: averageMessagesPerConversation._avg.messageCount || 0,
        satisfactionRate: Math.round(satisfactionRate * 10) / 10,
      },
      recentFeedback,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
