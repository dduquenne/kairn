import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withAdminAuth } from '../../../auth/middleware';
import { prisma } from '@/lib/db/prisma';

const SITE_SLUG = 'avv';

const settingsSchema = z.object({
  chatbotEnabled: z.boolean(),
});

/**
 * GET /api/admin/chatbot/settings
 * Get chatbot settings (enabled/disabled status)
 */
export async function GET() {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const site = await prisma.site.findUnique({
      where: { slug: SITE_SLUG },
      select: { config: true },
    });

    const config = (site?.config as Record<string, unknown>) || {};
    const chatbotEnabled = config.chatbotEnabled !== false; // Enabled by default

    return NextResponse.json({ chatbotEnabled });
  } catch (error) {
    console.error('[Admin Chatbot] Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/chatbot/settings
 * Update chatbot settings (enable/disable)
 */
export async function PUT(request: Request) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { chatbotEnabled } = parsed.data;

    // Get current config
    const site = await prisma.site.findUnique({
      where: { slug: SITE_SLUG },
      select: { config: true },
    });

    const currentConfig = (site?.config as Record<string, unknown>) || {};

    // Update config with chatbot setting
    await prisma.site.update({
      where: { slug: SITE_SLUG },
      data: {
        config: {
          ...currentConfig,
          chatbotEnabled,
        },
      },
    });

    return NextResponse.json({
      success: true,
      chatbotEnabled,
      message: chatbotEnabled ? 'ChatBot IA activé' : 'ChatBot IA désactivé',
    });
  } catch (error) {
    console.error('[Admin Chatbot] Error updating settings:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    );
  }
}
