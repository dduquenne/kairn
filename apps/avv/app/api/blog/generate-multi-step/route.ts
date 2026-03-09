/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * @module /api/blog/generate-multi-step
 * @description API endpoint pour la génération d'articles en plusieurs étapes
 *
 * Cette API utilise Server-Sent Events (SSE) pour fournir un suivi de progression
 * en temps réel pendant la génération de l'article.
 *
 * Les étapes sont:
 * 1. Génération du plan/outline
 * 2. Rédaction du contenu
 * 3. Optimisation SEO (titre, description)
 * 4. Génération des tags
 * 5. Création de la FAQ
 * 6. Génération du prompt image
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withAdminAuth } from '../../auth/middleware';
import {
  generateArticleMultiStep,
  type GenerationStep,
  type MultiStepGenerationOptions,
} from '../../common/claude-article-generator-multi-step';

// Vercel serverless function timeout — 6 sequential Claude API calls
export const maxDuration = 300;

/**
 * Schéma de validation pour les requêtes de génération
 */
const generateArticleSchema = z.object({
  topic: z.string().trim().min(1, 'Le sujet est requis'),
  category: z.enum(['Comprendre', 'Traverser', 'Découvrir', 'Cheminer']),
  targetLength: z.enum(['short', 'medium', 'long']).optional().default('medium'),
  editorialCategory: z.enum(['Comprendre', 'Traverser', 'Découvrir', 'Cheminer']).optional(),
  preferredTones: z.array(z.string()).optional(),
  tones: z.array(z.string()).optional(), // Alias
  seoQuery: z.string().trim().optional(),
  searchIntent: z.string().trim().optional(),
  readerPersona: z.string().optional(),
  useAvvStyle: z.boolean().optional().default(true),
  // Pour rétrocompatibilité
  subject: z.string().trim().optional(),
  seoKeyword: z.string().trim().optional(),
  searchIntention: z.string().trim().optional(),
  persona: z.string().optional(),
  // Mode de génération
  useStreaming: z.boolean().optional().default(false),
});

type GenerateArticlePayload = z.infer<typeof generateArticleSchema>;

/**
 * Encoder pour les messages SSE
 */
function encodeSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * POST /api/blog/generate-multi-step
 *
 * Génère un article de blog en plusieurs étapes avec Claude AI
 *
 * Modes de fonctionnement:
 * 1. Mode standard (useStreaming: false): Retourne l'article complet une fois terminé
 * 2. Mode streaming (useStreaming: true): Utilise SSE pour les mises à jour en temps réel
 */
export async function POST(request: NextRequest) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  let payload: GenerateArticlePayload;

  try {
    const body = await request.json();
    const parsed = generateArticleSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      const message = firstError?.message ?? 'Données invalides.';
      return NextResponse.json({ message }, { status: 400 });
    }

    payload = parsed.data;
  } catch (error) {
    return NextResponse.json({ message: 'Données invalides.' }, { status: 400 });
  }

  // Récupérer la clé API Anthropic
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY n'est pas configurée");
    return NextResponse.json({ message: "Le service n'est pas configuré." }, { status: 500 });
  }

  // Fusionner les champs pour rétrocompatibilité
  const allTones = payload.preferredTones || payload.tones || [];

  const options: MultiStepGenerationOptions = {
    topic: payload.topic || payload.subject || '',
    category: payload.category,
    editorialCategory: payload.editorialCategory || payload.category,
    targetLength: payload.targetLength,
    seoQuery: payload.seoQuery || payload.seoKeyword || '',
    searchIntent: payload.searchIntent || payload.searchIntention || '',
    readerPersona: payload.readerPersona || payload.persona || '',
    preferredTones: allTones,
    useAvvStyle: payload.useAvvStyle,
  };

  // Mode streaming avec SSE
  if (payload.useStreaming) {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Lancer la génération en arrière-plan
    (async () => {
      try {
        // Callback de progression
        const onProgress = async (step: GenerationStep) => {
          await writer.write(encoder.encode(encodeSSE('progress', step)));
        };

        const result = await generateArticleMultiStep({ ...options, onProgress }, apiKey);

        // Envoyer le résultat final
        await writer.write(
          encoder.encode(
            encodeSSE('complete', {
              success: result.success,
              article: {
                title: result.title,
                description: result.description,
                content: result.content,
                category: result.category,
                tags: result.tags,
                faq: result.faq,
                imagePrompt: result.imagePrompt,
              },
              generationMetadata: result.generationMetadata,
              error: result.error,
            })
          )
        );
      } catch (error) {
        console.error('Erreur lors de la génération streaming:', error);
        await writer.write(
          encoder.encode(
            encodeSSE('error', {
              message: error instanceof Error ? error.message : 'Erreur inconnue',
            })
          )
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  // Mode standard (non-streaming)
  try {
    const result = await generateArticleMultiStep(options, apiKey);

    if (!result.success && !result.content) {
      // Échec complet - aucun contenu généré
      return NextResponse.json(
        {
          success: false,
          message: result.error || 'Erreur lors de la génération',
          generationMetadata: result.generationMetadata,
        },
        { status: 500 }
      );
    }

    // Succès (complet ou partiel)
    return NextResponse.json({
      success: result.success,
      article: {
        title: result.title,
        description: result.description,
        content: result.content,
        category: result.category || payload.category,
        tags: result.tags,
        faq: result.faq,
        imagePrompt: result.imagePrompt,
      },
      // Champs pour rétrocompatibilité avec l'ancienne API
      content: result.content,
      title: result.title,
      description: result.description,
      tags: result.tags,
      faq: result.faq,
      imagePrompt: result.imagePrompt,
      category: result.category || payload.category,
      // Métadonnées de génération
      generationMetadata: result.generationMetadata,
      // Avertissement si génération partielle
      ...(result.success === false &&
        result.content && {
          warning: 'Génération partielle - certaines étapes ont échoué',
          error: result.error,
        }),
    });
  } catch (error) {
    console.error("Erreur lors de la génération de l'article:", error);
    return NextResponse.json(
      {
        success: false,
        message: 'Une erreur est survenue lors de la génération. Veuillez réessayer.',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
