/**
 * @module /api/blog/generate
 * @description Article generation API endpoint using Claude AI
 *
 * This endpoint generates blog articles based on provided parameters using
 * Claude's language model. It supports both modern and legacy API payloads
 * for backwards compatibility.
 *
 * @see ArticleGeneratorModal for request structure
 * @see generateArticleWithClaude for implementation details
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withAdminAuth } from '../../auth/middleware';
import { formatAIErrorResponse } from '../../common/ai-error-handler';
import {
  generateArticleWithClaude,
  type ArticleGenerationOptions,
} from '../../common/claude-article-generator';

// Vercel serverless function timeout — single-step article generation with retries
export const maxDuration = 300;

/**
 * Zod schema for validating article generation requests
 *
 * Supports both:
 * - Modern API (ArticleGenerator component): topic, targetLength, preferredTones
 * - Legacy API (ArticleGeneratorModal): subject, tone, searchIntention
 *
 * @property {string} topic - Main topic for the article (modern API)
 * @property {string} category - Blog category (Comprendre, Traverser, Découvrir, Cheminer)
 * @property {array} tones - Array of preferred writing tones
 * @property {string} seoQuery - SEO keyword/query for optimization
 * @property {string} readerPersona - Target reader persona
 */
const generateArticleSchema = z.object({
  // Champs du composant ArticleGenerator (new API)
  action: z.string().optional(),
  topic: z.string().trim().optional(),
  category: z.enum(['Comprendre', 'Traverser', 'Découvrir', 'Cheminer']),
  targetLength: z.enum(['short', 'medium', 'long']).optional(),
  editorialCategory: z.enum(['Comprendre', 'Traverser', 'Découvrir', 'Cheminer']).optional(),
  preferredTones: z.array(z.string()).optional(),
  tones: z.array(z.string()).optional(), // Alias depuis ArticleGeneratorModal
  seoQuery: z.string().trim().optional(),
  searchIntent: z.string().trim().optional(),
  readerPersona: z.string().optional(),
  usePsypnosStyle: z.boolean().optional(),
  meta: z.object({ honeypot: z.string() }).optional(),

  // Ancien schema pour rétrocompatibilité
  subject: z.string().trim().optional(),
  seoKeyword: z.string().trim().optional(),
  searchIntention: z.string().trim().optional(),
  persona: z.string().optional(),
  tone: z.enum(['analytique', 'poétique', 'pédagogique', 'introspectif']).optional(),
});

type GenerateArticlePayload = z.infer<typeof generateArticleSchema>;

/**
 * POST /api/blog/generate
 *
 * Generate a blog article using Claude AI
 *
 * @async
 * @param {Request} request - HTTP request with JSON body containing article generation parameters
 * @returns {Promise<NextResponse>} JSON response with generated article data
 *
 * @example
 * POST /api/blog/generate
 * {
 *   "topic": "Understanding anxiety",
 *   "category": "Comprendre",
 *   "tones": ["accessible", "compassionate"],
 *   "seoQuery": "how to manage anxiety",
 *   "readerPersona": "busy professional"
 * }
 *
 * @throws {400} Invalid request payload (missing required fields or invalid values)
 * @throws {500} API key not configured or Claude API error
 *
 * Process:
 * 1. Parse and validate incoming request using Zod schema
 * 2. Map legacy field names to modern API (backwards compatibility)
 * 3. Call Claude to generate article with specified parameters
 * 4. Return generated article with title, content, FAQ items, etc.
 */
export async function POST(request: Request) {
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

  try {
    // Déterminer si c'est la nouvelle API (ArticleGenerator) ou l'ancienne
    const isNewAPI = !!payload.topic;

    // Fusionner les tons depuis preferredTones (ArticleGenerator) ou tones (ArticleGeneratorModal)
    const allTones = payload.preferredTones || payload.tones || [];

    // Récupérer la première tone pour compatibilité (pour l'instant)
    const singleTone = allTones?.[0] || payload.tone;

    const options: ArticleGenerationOptions = {
      topic: payload.topic || payload.subject || '',
      category: payload.editorialCategory || payload.category,
      editorialCategory: payload.editorialCategory || payload.category,
      seoQuery: payload.seoQuery || payload.seoKeyword || '',
      searchIntent: payload.searchIntent || payload.searchIntention || '',
      readerPersona: payload.readerPersona || payload.persona || '',
      specificTone: singleTone as ArticleGenerationOptions['specificTone'],
      usePsypnosStyle: payload.usePsypnosStyle !== false,
      targetLength: (payload.targetLength || 'long') as 'short' | 'medium' | 'long',
      preferredTones: allTones, // Utiliser les tons fusionnés
    };

    const result = await generateArticleWithClaude(options, apiKey);

    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la génération');
    }

    return NextResponse.json({
      success: true,
      article: {
        title: result.title,
        description: result.description,
        content: result.content,
        category: payload.category || payload.editorialCategory,
        tags: result.tags,
        faq: result.faq,
        imagePrompt: result.imagePrompt,
      },
      // Champs rétrocompatibilité
      content: result.content,
      title: result.title,
      description: result.description,
      tags: result.tags,
      faq: result.faq,
      imagePrompt: result.imagePrompt,
      subject: payload.topic || payload.subject,
      seoKeyword: payload.seoQuery || payload.seoKeyword,
      searchIntention: payload.searchIntent || payload.searchIntention,
      category: payload.category || payload.editorialCategory,
      persona: payload.readerPersona || payload.persona || '',
      tone: singleTone,
    });
  } catch (error) {
    console.error("Erreur lors de la génération de l'article:", error);
    const { body, status } = formatAIErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
