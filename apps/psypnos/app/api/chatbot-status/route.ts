import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';

const SITE_SLUG = 'psypnos';

/**
 * GET /api/chatbot-status
 * Public endpoint to check if chatbot is enabled (no auth required)
 * Cached for 60 seconds to reduce DB hits
 */
export async function GET() {
  try {
    const site = await prisma.site.findUnique({
      where: { slug: SITE_SLUG },
      select: { config: true },
    });

    const config = (site?.config as Record<string, unknown>) || {};
    const enabled = config.chatbotEnabled !== false;

    return NextResponse.json(
      { enabled },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch {
    // On error, default to enabled
    return NextResponse.json({ enabled: true });
  }
}
