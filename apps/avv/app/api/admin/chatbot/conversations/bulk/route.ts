import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

import { withAdminAuth } from '../../../../auth/middleware';

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

/**
 * DELETE /api/admin/chatbot/conversations/bulk
 * Bulk delete conversations
 */
export async function DELETE(request: Request) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = bulkDeleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { ids } = parsed.data;
    const siteId = await getSiteId();

    const result = await prisma.chatConversation.deleteMany({
      where: { id: { in: ids }, siteId },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `${result.count} conversation(s) supprimée(s)`,
    });
  } catch (error) {
    console.error('[Admin Chatbot] Error bulk deleting conversations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des conversations' },
      { status: 500 }
    );
  }
}
