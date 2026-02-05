/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
// TODO: Type incompatibilities to fix
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';

// Schema for POST validation (GET uses query params directly)
const _prefillRequestSchema = z.object({
  sessionId: z.string(),
});

/**
 * GET /api/prefill
 * Get prefill suggestions based on navigation history
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    const history = await prisma.navigationHistory.findUnique({
      where: { sessionId },
    });

    if (!history || !history.consentGiven) {
      return NextResponse.json({
        suggestedService: null,
        suggestedMessage: null,
        interests: [],
      });
    }

    return NextResponse.json({
      suggestedService: history.suggestedService,
      interests: history.interests,
      // Generate suggested message based on service
      suggestedMessage: history.suggestedService
        ? generateSuggestedMessage(history.suggestedService)
        : null,
    });
  } catch (error) {
    console.error('Prefill error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des suggestions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prefill
 * Update prefill data from client analysis
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const schema = z.object({
      sessionId: z.string(),
      suggestedService: z.string().optional(),
      interests: z.array(z.string()).optional(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { sessionId, suggestedService, interests } = parsed.data;

    // Check if consent was given
    const existing = await prisma.navigationHistory.findUnique({
      where: { sessionId },
    });

    if (!existing?.consentGiven) {
      return NextResponse.json({ error: 'Consentement requis' }, { status: 403 });
    }

    // Update suggestions
    await prisma.navigationHistory.update({
      where: { sessionId },
      data: {
        suggestedService,
        interests: interests || [],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Prefill update error:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

function generateSuggestedMessage(service: string): string {
  const messages: Record<string, string> = {
    "Gestion du stress et de l'anxiété":
      'Bonjour, je souhaiterais en savoir plus sur vos séances pour la gestion du stress.',
    'Arrêt du tabac': "Bonjour, je suis intéressé(e) par l'arrêt du tabac par hypnose.",
    'Perte de poids':
      "Bonjour, je voudrais des informations sur l'accompagnement pour la perte de poids.",
    'Troubles du sommeil':
      "Bonjour, je rencontre des difficultés de sommeil et j'aimerais prendre rendez-vous.",
    'Confiance en soi': 'Bonjour, je souhaite travailler sur ma confiance en moi.',
    'Phobies et peurs': "Bonjour, j'aimerais me faire accompagner pour surmonter mes peurs.",
    Hypnothérapie: "Bonjour, je suis intéressé(e) par l'hypnothérapie.",
    Sophrologie: 'Bonjour, je voudrais découvrir la sophrologie.',
    'Séminaires et ateliers': 'Bonjour, je suis intéressé(e) par vos prochains séminaires.',
  };

  return messages[service] || 'Bonjour, je souhaiterais prendre rendez-vous.';
}
