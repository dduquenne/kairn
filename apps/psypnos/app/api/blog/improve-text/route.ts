import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_DEFAULT_MODEL } from '@kairn/ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { validateCSRFMiddleware } from '../../common/csrf-middleware';
import { PSYPNOS_STYLE_SYSTEM_PROMPT } from '../../common/psypnos-system-prompt';
import { recordAttemptAsync, getClientIP } from '../../common/rate-limiter';

// Vercel serverless function timeout — single Claude API call
export const maxDuration = 60;

const improveTextSchema = z.object({
  selectedText: z.string().trim().min(1).max(10000),
  improvementInstructions: z.string().trim().min(1).max(1000),
  usePsypnosStyle: z.boolean().optional().default(true),
  meta: z
    .object({
      honeypot: z
        .string()
        .optional()
        .transform(value => value?.trim() ?? ''),
    })
    .default({ honeypot: '' }),
});

type ImproveTextPayload = z.infer<typeof improveTextSchema>;

export async function POST(request: Request) {
  // PROTECTION : Rate limiting - 20 requêtes par heure par IP (API coûteuse)
  const clientIP = getClientIP(request);
  const rateLimitResult = await recordAttemptAsync('improveText', clientIP);

  if (rateLimitResult.limited) {
    return NextResponse.json(
      {
        message: 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  // Valider le token CSRF
  const csrfError = await validateCSRFMiddleware(request);
  if (csrfError) {
    return csrfError;
  }

  let payload: ImproveTextPayload;

  try {
    const body = await request.json();
    const parsed = improveTextSchema.safeParse(body);

    if (!parsed.success) {
      // SÉCURITÉ : Messages d'erreur génériques
      return NextResponse.json({ message: 'Données invalides.' }, { status: 400 });
    }

    payload = parsed.data;
  } catch (error) {
    return NextResponse.json({ message: 'Données invalides.' }, { status: 400 });
  }

  // Protection anti-spam (honeypot)
  if (payload.meta.honeypot) {
    return NextResponse.json({ success: true, message: 'Texte amélioré' });
  }

  // Récupérer la clé API Anthropic
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY n'est pas configurée");
    return NextResponse.json({ message: "Le service n'est pas configuré." }, { status: 500 });
  }

  try {
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const prompt = payload.usePsypnosStyle
      ? `## TEXTE SÉLECTIONNÉ

${payload.selectedText}

---

## INSTRUCTIONS D'AMÉLIORATION

${payload.improvementInstructions}

---

Améliore ce texte en suivant ces instructions, en respectant scrupuleusement :
1. Le style d'écriture PSYPNOS (défini dans ton système)
2. Le format Markdown si le texte en contient
3. La bienveillance et l'approche pédagogique

**DIRECTIVES CRITIQUES POUR LA LISIBILITÉ:**
- ✓ Ajoute des **listes à puces** si le texte contient des énumérés, conseils ou étapes
- ✓ Met en valeur les concepts-clés avec du **gras** (**texte**)
- ✓ Utilise l'*italique* pour l'introspection et les tournures poétiques (*texte*)
- ✓ Améliore la structure globale sans perdre le contenu original
- ✓ Rend le texte PLUS lisible et moins dense

Conserve le même format et assure-toi que le contenu reste précis, bienveillant et fondé sur des bases scientifiques.

**Retourne uniquement le texte amélioré**, sans balises XML additionnelles, sans préambule, sans explication.`
      : `TEXTE À AMÉLIORER :
${payload.selectedText}

INSTRUCTIONS D'AMÉLIORATION :
${payload.improvementInstructions}

Améliore ce texte en suivant ces instructions. Conserve le même format et assure-toi que le contenu reste précis et bienveillant.

Retourne uniquement le texte amélioré, sans balises additionnelles, sans préambule, sans explication.`;

    const message = await anthropic.messages.create({
      model: CLAUDE_DEFAULT_MODEL,
      max_tokens: 8000,
      temperature: 0.7,
      ...(payload.usePsypnosStyle && { system: PSYPNOS_STYLE_SYSTEM_PROMPT }),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const firstBlock = message.content[0];
    const improvedText = firstBlock?.type === 'text' ? firstBlock.text : '';

    if (!improvedText) {
      throw new Error('Aucun contenu dans la réponse de Claude');
    }

    return NextResponse.json({
      success: true,
      improvedText: improvedText.trim(),
    });
  } catch (error) {
    console.error("Erreur lors de l'amélioration du texte:", error);
    return NextResponse.json(
      {
        message: "Une erreur est survenue lors de l'amélioration. Veuillez réessayer.",
      },
      { status: 500 }
    );
  }
}
