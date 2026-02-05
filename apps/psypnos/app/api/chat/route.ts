/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Type incompatibilities to fix
import crypto from 'crypto';

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';

import { recordAttempt, getClientIP } from '../common/rate-limiter';

const anthropic = new Anthropic();

const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().optional(),
  sessionId: z.string().optional(),
  context: z
    .object({
      siteName: z.string().optional(),
      currentPage: z.string().optional(),
    })
    .optional(),
});

// Site context for Claude - information about Psypnos services
const SITE_CONTEXT = `
Tu es l'assistant virtuel de Psypnos, un cabinet d'hypnothérapie et de sophrologie dirigé par David Duquenne, praticien certifié.

INFORMATIONS SUR LE CABINET:
- Nom: Psypnos - Cabinet d'Hypnose et de Sophrologie
- Praticien: David Duquenne
- Spécialités: Hypnothérapie, Sophrologie, Gestion du stress, Arrêt du tabac, Perte de poids, Confiance en soi, Troubles du sommeil
- Localisation: France (séances en présentiel et en visioconférence)

SERVICES PROPOSÉS:
1. Hypnothérapie Ericksonienne
   - Arrêt du tabac (1-2 séances)
   - Perte de poids et relation à l'alimentation
   - Gestion du stress et de l'anxiété
   - Amélioration de la confiance en soi
   - Troubles du sommeil et insomnies
   - Phobies et peurs
   - Préparation mentale

2. Sophrologie
   - Relaxation et détente
   - Gestion des émotions
   - Préparation aux examens
   - Accompagnement de la grossesse
   - Amélioration des performances

3. Séminaires et Ateliers
   - Ateliers de groupe sur la respiration
   - Séminaires de développement personnel
   - Formations en entreprise

DÉROULEMENT D'UNE SÉANCE:
- Durée: environ 1h à 1h30
- Première séance: anamnèse (discussion sur les objectifs) + première séance d'hypnose/sophrologie
- Tarifs: Les tarifs sont consultables sur le site ou sur demande
- Prise de RDV: Via le formulaire de contact ou par téléphone

RÈGLES DE RÉPONSE:
1. Réponds UNIQUEMENT aux questions concernant les services du cabinet, l'hypnothérapie, la sophrologie, ou la prise de rendez-vous
2. Pour toute question médicale spécifique, recommande de consulter un médecin
3. Si la question est hors sujet (politique, actualités, etc.), redirige poliment vers les services du cabinet
4. Sois chaleureux, professionnel et bienveillant
5. Propose toujours de prendre rendez-vous quand c'est pertinent
6. Réponds en français
7. Garde tes réponses concises (2-3 paragraphes maximum)
`;

const SYSTEM_PROMPT = `${SITE_CONTEXT}

Tu dois toujours:
- Répondre de manière concise et professionnelle
- Être empathique et bienveillant
- Suggérer la prise de rendez-vous quand approprié
- Refuser poliment les questions hors sujet en redirigeant vers les services

Format de réponse:
- Réponds directement à la question
- Si pertinent, propose une action (rendez-vous, contact)
- Termine par une invitation à poser d'autres questions si besoin

IMPORTANT: À la fin de ta réponse, si une action est pertinente, ajoute sur une nouvelle ligne:
[ACTION:appointment] si tu suggères de prendre rendez-vous
[ACTION:contact] si tu suggères de contacter le cabinet
[ACTION:blog] si tu recommandes de lire un article du blog
`;

/**
 * POST /api/chat
 * Handle chat messages with Claude
 */
export async function POST(request: Request) {
  // Rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = recordAttempt('chat', clientIP);

  if (rateLimitResult.limited) {
    return NextResponse.json(
      {
        message: 'Vous avez envoyé trop de messages. Veuillez patienter quelques instants.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Message invalide' }, { status: 400 });
    }

    const { message, conversationId: existingConversationId, sessionId, context } = parsed.data;

    // Get or create conversation
    let conversation;
    let conversationId = existingConversationId;

    if (conversationId) {
      conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 10, // Last 10 messages for context
          },
        },
      });
    }

    if (!conversation) {
      // Create new conversation
      const ipHash = crypto.createHash('sha256').update(clientIP).digest('hex').slice(0, 16);
      conversation = await prisma.chatConversation.create({
        data: {
          sessionId: sessionId || `chat-${Date.now()}`,
          ipHash,
          referrer: context?.currentPage,
        },
        include: { messages: true },
      });
      conversationId = conversation.id;
    }

    // Store user message
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // Build message history for Claude
    const messageHistory: Anthropic.Messages.MessageParam[] = conversation.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Add current message
    messageHistory.push({
      role: 'user',
      content: message,
    });

    // Call Claude
    const startTime = Date.now();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: messageHistory,
    });

    const processingTime = Date.now() - startTime;

    // Extract response text
    const assistantContent = response.content[0];
    let responseText = assistantContent.type === 'text' ? assistantContent.text : '';

    // Parse suggested actions from response
    const suggestedActions: { type: string; label: string; url?: string }[] = [];
    const actionMatches = responseText.matchAll(/\[ACTION:(\w+)\]/g);

    for (const match of actionMatches) {
      const actionType = match[1];
      switch (actionType) {
        case 'appointment':
          suggestedActions.push({
            type: 'appointment',
            label: 'Prendre rendez-vous',
            url: '/contact',
          });
          break;
        case 'contact':
          suggestedActions.push({
            type: 'contact',
            label: 'Nous contacter',
            url: '/contact',
          });
          break;
        case 'blog':
          suggestedActions.push({
            type: 'link',
            label: 'Voir nos articles',
            url: '/blog',
          });
          break;
      }
    }

    // Remove action tags from response
    responseText = responseText.replace(/\[ACTION:\w+\]/g, '').trim();

    // Store assistant message
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: responseText,
        tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
        processingTime,
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      },
    });

    // Update conversation
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 2 },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: responseText,
      conversationId,
      suggestedActions,
    });
  } catch (error) {
    console.error('Chat error:', error);

    // Return a friendly error message
    return NextResponse.json({
      message:
        'Désolé, je rencontre des difficultés techniques. Vous pouvez nous contacter directement via le formulaire de contact.',
      suggestedActions: [{ type: 'contact', label: 'Nous contacter', url: '/contact' }],
    });
  }
}
