import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';

import { withAdminAuth } from '../../../../auth/middleware';

/**
 * GET /api/admin/chatbot/conversations/[id]
 * Get full conversation detail with all messages
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  try {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            tokensUsed: true,
            processingTime: true,
            suggestedActions: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
    }

    // Compute total tokens used
    type Msg = { tokensUsed?: number | null; processingTime?: number | null };
    const msgs = conversation.messages as Msg[];
    const totalTokens = msgs.reduce((sum: number, msg: Msg) => sum + (msg.tokensUsed || 0), 0);
    const avgProcessingTime =
      msgs.filter((m: Msg) => m.processingTime).length > 0
        ? Math.round(
            msgs.reduce((sum: number, m: Msg) => sum + (m.processingTime || 0), 0) /
              msgs.filter((m: Msg) => m.processingTime).length
          )
        : null;

    return NextResponse.json({
      ...conversation,
      totalTokens,
      avgProcessingTime,
    });
  } catch (error) {
    console.error('[Admin Chatbot] Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la conversation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/chatbot/conversations/[id]
 * Delete a conversation and all its messages
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  try {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
    }

    // Delete conversation (cascades to messages)
    await prisma.chatConversation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Conversation supprimée' });
  } catch (error) {
    console.error('[Admin Chatbot] Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la conversation' },
      { status: 500 }
    );
  }
}
