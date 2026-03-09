/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Type incompatibilities to fix
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';

const consentSchema = z.object({
  sessionId: z.string(),
  consentGiven: z.boolean(),
});

/**
 * POST /api/prefill/consent
 * Record user consent for prefill tracking
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = consentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { sessionId, consentGiven } = parsed.data;

    if (consentGiven) {
      // Create or update navigation history with consent
      await prisma.navigationHistory.upsert({
        where: { sessionId },
        update: {
          consentGiven: true,
          consentAt: new Date(),
        },
        create: {
          sessionId,
          pagesVisited: [],
          consentGiven: true,
          consentAt: new Date(),
        },
      });
    } else {
      // Remove data if consent is withdrawn
      await prisma.navigationHistory.deleteMany({
        where: { sessionId },
      });
    }

    return NextResponse.json({
      success: true,
      consentGiven,
    });
  } catch (error) {
    console.error('Consent error:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du consentement" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/prefill/consent
 * Check if user has given consent
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ consentGiven: false });
  }

  try {
    const history = await prisma.navigationHistory.findUnique({
      where: { sessionId },
      select: { consentGiven: true },
    });

    return NextResponse.json({
      consentGiven: history?.consentGiven || false,
    });
  } catch (error) {
    console.error('Consent check error:', error);
    return NextResponse.json({ consentGiven: false });
  }
}
