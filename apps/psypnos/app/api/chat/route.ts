import crypto from 'crypto';

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_DEFAULT_MODEL } from '@kairn/ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import { getSiteId } from '@/lib/db/site';

import { recordAttemptAsync, getClientIP } from '../common/rate-limiter';

// Vercel serverless function timeout (Pro plan: max 300s)
export const maxDuration = 60;

/**
 * Returns the Anthropic API key from environment.
 * Read at call time (not module load) to support testing and env changes.
 */
function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY;
}

/**
 * Create an Anthropic client instance.
 * @throws if ANTHROPIC_API_KEY is not set
 */
function getAnthropicClient(): Anthropic {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({ apiKey });
}

const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().nullish(),
  sessionId: z.string().optional(),
  context: z
    .object({
      siteName: z.string().optional(),
      currentPage: z.string().optional(),
    })
    .optional(),
});

// Chatbot-specific system prompt — focused on conversational tone, not article writing
const SYSTEM_PROMPT = `Tu es l'assistant virtuel de Psypnos, un cabinet d'hypnothérapie et de sophrologie dirigé par David Duquenne, praticien certifié. Tu incarnes la voix de Psypnos dans un format conversationnel.

## TON ET STYLE

Adopte un ton calme, posé, rassurant — comme une voix intérieure qui guide sans brusquer. Sois empathique, bienveillant, encourageant et non-jugeant. Utilise le vouvoiement comme un accompagnement thérapeutique respectueux. Intègre naturellement le vocabulaire transpersonnel quand c'est pertinent (présence, conscience, transformation intérieure, écoute de soi…). Privilégie les tournures qui invitent à l'introspection : « Avez-vous remarqué… ? », « Peut-être cela vous est-il déjà arrivé… »

## INFORMATIONS SUR LE CABINET

- **Nom** : Psypnos - Cabinet d'Hypnose et de Sophrologie
- **Praticien** : David Duquenne
- **Spécialités** : Hypnothérapie, Sophrologie, Gestion du stress, Arrêt du tabac, Perte de poids, Confiance en soi, Troubles du sommeil
- **Localisation** : Saint-Julien-du-Sault, Yonne (89) — séances en présentiel et en visioconférence

## SERVICES PROPOSÉS

1. **Hypnothérapie Ericksonienne** : Arrêt du tabac (1-2 séances), perte de poids et relation à l'alimentation, gestion du stress et de l'anxiété, amélioration de la confiance en soi, troubles du sommeil et insomnies, phobies et peurs, préparation mentale
2. **Sophrologie** : Relaxation et détente, gestion des émotions, préparation aux examens, accompagnement de la grossesse, amélioration des performances
3. **Séminaires et Ateliers** : Ateliers de groupe sur la respiration, séminaires de développement personnel, formations en entreprise

## DÉROULEMENT D'UNE SÉANCE

- Durée : environ 1h à 1h30
- Première séance : anamnèse (discussion sur les objectifs) + première séance d'hypnose/sophrologie
- Tarifs : Les tarifs sont consultables sur le site ou sur demande
- Prise de RDV : Via le formulaire de contact ou par téléphone

## RÈGLES DE RÉPONSE

1. Réponds UNIQUEMENT aux questions concernant les services du cabinet, l'hypnothérapie, la sophrologie, le bien-être intérieur, ou la prise de rendez-vous.
2. Pour toute question médicale spécifique, recommande de consulter un médecin.
3. Si la question est hors sujet (politique, actualités, etc.), redirige poliment vers les services du cabinet.
4. Propose de prendre rendez-vous quand c'est pertinent.
5. Réponds en français.
6. Garde tes réponses concises : 2-3 paragraphes maximum, adaptés au format conversationnel.

## FORMAT DE RÉPONSE

- Réponds directement à la question avec empathie et profondeur.
- Si pertinent, propose une action (rendez-vous, contact, lecture d'un article).
- Termine par une invitation douce à poser d'autres questions ou à explorer davantage.

## ACTIONS SUGGÉRÉES

IMPORTANT : À la fin de ta réponse, si une action est pertinente, ajoute sur une nouvelle ligne :
[ACTION:appointment] si tu suggères de prendre rendez-vous
[ACTION:contact] si tu suggères de contacter le cabinet
[ACTION:blog] si tu recommandes de lire un article du blog
`;

const FALLBACK_ERROR_MESSAGE =
  'Désolé, je rencontre des difficultés techniques. Vous pouvez nous contacter directement via le formulaire de contact.';

/**
 * Parse the User-Agent header to determine device type (mobile, tablet, desktop).
 */
function parseDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*phone|windows phone|blackberry/.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Sanitize message history for Anthropic API:
 * - Only keep 'user' and 'assistant' roles
 * - Ensure messages alternate correctly
 * - If alternation is broken (e.g. after a failed API call), fix it
 */
function sanitizeMessageHistory(
  messages: { role: string; content: string }[]
): Anthropic.Messages.MessageParam[] {
  // Filter to only user/assistant roles
  const filtered = messages.filter(m => m.role === 'user' || m.role === 'assistant');

  if (filtered.length === 0) return [];

  const sanitized: Anthropic.Messages.MessageParam[] = [];

  for (const msg of filtered) {
    const lastRole = sanitized.length > 0 ? sanitized[sanitized.length - 1]!.role : null;

    if (lastRole === msg.role) {
      // Two consecutive messages with same role — replace the last one to maintain alternation
      sanitized[sanitized.length - 1] = {
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      };
    } else {
      sanitized.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }
  }

  // Anthropic requires the first message to be 'user'
  if (sanitized.length > 0 && sanitized[0]!.role === 'assistant') {
    sanitized.shift();
  }

  return sanitized;
}

/**
 * POST /api/chat
 * Handle chat messages with Claude.
 * Logging structuré pour diagnostic Vercel.
 */
export async function POST(request: Request) {
  const requestStartTime = Date.now();

  // Check API key availability early
  if (!getApiKey()) {
    console.error('[Chat] ERREUR CRITIQUE : ANTHROPIC_API_KEY manquante — HTTP 503');
    return NextResponse.json(
      {
        error: 'service_unavailable',
        message: FALLBACK_ERROR_MESSAGE,
        suggestedActions: [{ type: 'contact', label: 'Nous contacter', url: '/contact' }],
      },
      { status: 503 }
    );
  }

  // Rate limiting (async for Redis support in serverless)
  const clientIP = getClientIP(request);
  const rateLimitResult = await recordAttemptAsync('chat', clientIP);

  if (rateLimitResult.limited) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: 'rate_limited',
        message: 'Vous avez envoyé trop de messages. Veuillez patienter quelques instants.',
        retryAfter,
      },
      { status: 429 }
    );
  }

  // Parse and validate request
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Requête invalide' },
      { status: 400 }
    );
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    console.warn(
      '[Chat] Validation échouée:',
      parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    );
    return NextResponse.json(
      { error: 'validation_error', message: 'Message invalide' },
      { status: 400 }
    );
  }

  const { message, conversationId: existingConversationId, sessionId, context } = parsed.data;

  // Resolve site ID for multi-tenancy
  let siteId: string;
  try {
    siteId = await getSiteId();
  } catch (siteError) {
    console.error('[Chat] Failed to resolve siteId:', siteError);
    return NextResponse.json(
      {
        error: 'database_error',
        message: FALLBACK_ERROR_MESSAGE,
        suggestedActions: [{ type: 'contact', label: 'Nous contacter', url: '/contact' }],
      },
      { status: 500 }
    );
  }

  // Get or create conversation
  let conversation;
  let conversationId = existingConversationId;

  try {
    if (conversationId) {
      conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 10,
          },
        },
      });
    }

    if (!conversation) {
      const ipHash = crypto.createHash('sha256').update(clientIP).digest('hex').slice(0, 16);
      const deviceType = parseDeviceType(request.headers.get('user-agent'));
      conversation = await prisma.chatConversation.create({
        data: {
          sessionId: sessionId || `chat-${Date.now()}`,
          ipHash,
          referrer: context?.currentPage,
          deviceType,
          siteId,
        },
        include: { messages: true },
      });
      conversationId = conversation.id;
    }
  } catch (dbError) {
    console.error('[Chat] Database error (conversation):', dbError);
    return NextResponse.json(
      {
        error: 'database_error',
        message: FALLBACK_ERROR_MESSAGE,
        suggestedActions: [{ type: 'contact', label: 'Nous contacter', url: '/contact' }],
      },
      { status: 500 }
    );
  }

  // Store user message
  try {
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });
  } catch (dbError) {
    console.error('[Chat] Database error (store user message):', dbError);
    return NextResponse.json(
      {
        error: 'database_error',
        message: FALLBACK_ERROR_MESSAGE,
        conversationId,
        suggestedActions: [{ type: 'contact', label: 'Nous contacter', url: '/contact' }],
      },
      { status: 500 }
    );
  }

  // Build and sanitize message history for Claude
  const rawHistory = [
    ...conversation.messages.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];
  const messageHistory = sanitizeMessageHistory(rawHistory);

  // Call Claude API
  let responseText: string;
  let tokensUsed: number | undefined;
  let processingTime: number;

  try {
    const anthropic = getAnthropicClient();
    const startTime = Date.now();
    const response = await anthropic.messages.create({
      model: CLAUDE_DEFAULT_MODEL,
      max_tokens: 1000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: messageHistory,
    });
    processingTime = Date.now() - startTime;

    const assistantContent = response.content[0];
    responseText = assistantContent?.type === 'text' ? assistantContent.text : '';
    tokensUsed = response.usage
      ? response.usage.input_tokens + response.usage.output_tokens
      : undefined;
  } catch (apiError) {
    const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
    console.error(
      `[Chat] Anthropic API error: ${errorMessage}`,
      apiError instanceof Error && 'status' in apiError
        ? `(HTTP ${(apiError as Error & { status: number }).status})`
        : ''
    );
    processingTime = 0;

    // CRITICAL FIX: Store a fallback assistant message in DB to maintain message alternation.
    // Without this, the next request would have two consecutive 'user' messages,
    // which permanently breaks the conversation.
    responseText = FALLBACK_ERROR_MESSAGE;
    try {
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: responseText,
          processingTime: 0,
        },
      });
      await prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { messageCount: { increment: 2 } },
      });
    } catch (dbError) {
      console.error('[Chat] Failed to store fallback assistant message:', dbError);
    }

    return NextResponse.json(
      {
        error: 'ai_error',
        message: responseText,
        conversationId,
        suggestedActions: [{ type: 'contact', label: 'Nous contacter', url: '/contact' }],
      },
      { status: 502 }
    );
  }

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

  // Store assistant message and update conversation
  try {
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: responseText,
        tokensUsed,
        processingTime,
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      },
    });

    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 2 },
      },
    });
  } catch (dbError) {
    // Non-fatal: response was generated successfully, just DB storage failed
    console.error('[Chat] Database error (store assistant message):', dbError);
  }

  const totalDuration = Date.now() - requestStartTime;
  console.info(
    `[Chat] OK — ${totalDuration}ms total, ${processingTime}ms API, ` +
      `${tokensUsed ?? '?'} tokens, conversation=${conversationId}`
  );

  return NextResponse.json({
    message: responseText,
    conversationId,
    suggestedActions,
  });
}
