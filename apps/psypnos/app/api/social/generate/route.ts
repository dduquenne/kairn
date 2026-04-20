/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * API de génération de contenu pour les réseaux sociaux
 *
 * POST /api/social/generate
 *
 * Génère du contenu adapté pour les réseaux sociaux à partir d'un article de blog.
 * Utilise Claude API pour créer des posts optimisés par plateforme.
 */

import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { formatAIErrorResponse } from '@/app/api/common/ai-error-handler';
import { getPostBySlugAsync } from '@/lib/blog';
import {
  generateForMultiplePlatforms,
  checkGenerationConfig,
  estimateGenerationCost,
  type BlogArticleInput,
} from '@/lib/social';
import type {
  SocialPlatform,
  ContentTone,
  ContentAngle,
  GenerationOptions,
  InstagramPostFormat,
  AuthenticityLevel,
  ThreadsPostFormat,
  ThreadsAuthenticityLevel,
  LinkedInPostFormat,
  LinkedInExpertiseLevel,
} from '@/lib/social/types';

// ===========================================
// Types
// ===========================================

interface GenerateRequestBody {
  blogSlug: string;
  platforms: SocialPlatform[];
  tone: ContentTone;
  angle: ContentAngle;
  customInstructions?: string;
  // Options spécifiques Instagram
  instagramFormat?: InstagramPostFormat;
  authenticityLevel?: AuthenticityLevel;
  // Options spécifiques Threads
  threadsFormat?: ThreadsPostFormat;
  threadsAuthenticityLevel?: ThreadsAuthenticityLevel;
  // Options spécifiques LinkedIn
  linkedinFormat?: LinkedInPostFormat;
  linkedinExpertiseLevel?: LinkedInExpertiseLevel;
}

// ===========================================
// Helpers
// ===========================================

/**
 * Valide le corps de la requête
 */
function validateRequestBody(body: unknown): {
  valid: boolean;
  data?: GenerateRequestBody;
  error?: string;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Corps de la requête invalide' };
  }

  const b = body as Record<string, unknown>;

  // blogSlug requis
  if (!b.blogSlug || typeof b.blogSlug !== 'string') {
    return { valid: false, error: 'blogSlug est requis' };
  }

  // platforms requis et doit être un tableau non vide
  if (!Array.isArray(b.platforms) || b.platforms.length === 0) {
    return { valid: false, error: 'platforms doit être un tableau non vide' };
  }

  const validPlatforms: SocialPlatform[] = [
    'FACEBOOK',
    'LINKEDIN',
    'INSTAGRAM',
    'TWITTER',
    'THREADS',
  ];
  for (const p of b.platforms) {
    if (!validPlatforms.includes(p as SocialPlatform)) {
      return { valid: false, error: `Plateforme invalide: ${p}` };
    }
  }

  // tone requis
  const validTones: ContentTone[] = [
    'informatif',
    'inspirant',
    'promotionnel',
    'educatif',
    'personnel',
  ];
  if (!b.tone || !validTones.includes(b.tone as ContentTone)) {
    return { valid: false, error: 'tone invalide ou manquant' };
  }

  // angle requis
  const validAngles: ContentAngle[] = ['benefices', 'probleme', 'histoire', 'expert', 'pratique'];
  if (!b.angle || !validAngles.includes(b.angle as ContentAngle)) {
    return { valid: false, error: 'angle invalide ou manquant' };
  }

  // instagramFormat optionnel mais doit être valide si fourni
  const validInstagramFormats: InstagramPostFormat[] = [
    'hook_reveal',
    'liste_visuelle',
    'micro_storytelling',
    'question_rhethorique',
    'citation_reflexion',
    'mythe_realite',
  ];
  if (
    b.instagramFormat &&
    !validInstagramFormats.includes(b.instagramFormat as InstagramPostFormat)
  ) {
    return { valid: false, error: 'instagramFormat invalide' };
  }

  // authenticityLevel optionnel mais doit être entre 1 et 5 si fourni
  if (b.authenticityLevel !== undefined) {
    const level = Number(b.authenticityLevel);
    if (isNaN(level) || level < 1 || level > 5) {
      return { valid: false, error: 'authenticityLevel doit être entre 1 et 5' };
    }
  }

  // threadsFormat optionnel mais doit être valide si fourni
  const validThreadsFormats: ThreadsPostFormat[] = [
    'pensee_brute',
    'observation_cabinet',
    'question_ouverte',
    'micro_confession',
    'fragment_poetique',
    'contre_intuitif',
  ];
  if (b.threadsFormat && !validThreadsFormats.includes(b.threadsFormat as ThreadsPostFormat)) {
    return { valid: false, error: 'threadsFormat invalide' };
  }

  // threadsAuthenticityLevel optionnel mais doit être entre 1 et 5 si fourni
  if (b.threadsAuthenticityLevel !== undefined) {
    const level = Number(b.threadsAuthenticityLevel);
    if (isNaN(level) || level < 1 || level > 5) {
      return { valid: false, error: 'threadsAuthenticityLevel doit être entre 1 et 5' };
    }
  }

  // linkedinFormat optionnel mais doit être valide si fourni
  const validLinkedInFormats: LinkedInPostFormat[] = [
    'observation_pro',
    'contre_intuition',
    'liste_puces',
    'storytelling_court',
    'question_provocante',
    'temoignage_terrain',
  ];
  if (b.linkedinFormat && !validLinkedInFormats.includes(b.linkedinFormat as LinkedInPostFormat)) {
    return { valid: false, error: 'linkedinFormat invalide' };
  }

  // linkedinExpertiseLevel optionnel mais doit être entre 1 et 5 si fourni
  if (b.linkedinExpertiseLevel !== undefined) {
    const level = Number(b.linkedinExpertiseLevel);
    if (isNaN(level) || level < 1 || level > 5) {
      return { valid: false, error: 'linkedinExpertiseLevel doit être entre 1 et 5' };
    }
  }

  return {
    valid: true,
    data: {
      blogSlug: b.blogSlug as string,
      platforms: b.platforms as SocialPlatform[],
      tone: b.tone as ContentTone,
      angle: b.angle as ContentAngle,
      customInstructions: b.customInstructions as string | undefined,
      instagramFormat: b.instagramFormat as InstagramPostFormat | undefined,
      authenticityLevel: b.authenticityLevel as AuthenticityLevel | undefined,
      threadsFormat: b.threadsFormat as ThreadsPostFormat | undefined,
      threadsAuthenticityLevel: b.threadsAuthenticityLevel as ThreadsAuthenticityLevel | undefined,
      linkedinFormat: b.linkedinFormat as LinkedInPostFormat | undefined,
      linkedinExpertiseLevel: b.linkedinExpertiseLevel as LinkedInExpertiseLevel | undefined,
    },
  };
}

// ===========================================
// POST Handler
// ===========================================

/**
 * POST /api/social/generate
 *
 * Génère du contenu pour les réseaux sociaux à partir d'un article
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  // Vérifier la configuration
  const configCheck = checkGenerationConfig();
  if (!configCheck.valid) {
    return NextResponse.json(
      {
        message:
          "Le service IA n'est pas configuré. Contactez l'administrateur pour vérifier la clé API Anthropic.",
        error: configCheck.error,
      },
      { status: 500 }
    );
  }

  try {
    // Parser et valider le corps
    const body = await request.json();
    const validation = validateRequestBody(body);

    if (!validation.valid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      blogSlug,
      platforms,
      tone,
      angle,
      customInstructions,
      instagramFormat,
      authenticityLevel,
      threadsFormat,
      threadsAuthenticityLevel,
      linkedinFormat,
      linkedinExpertiseLevel,
    } = validation.data;

    // Récupérer l'article
    const article = await getPostBySlugAsync(blogSlug);
    if (!article) {
      return NextResponse.json({ error: `Article non trouvé: ${blogSlug}` }, { status: 404 });
    }

    // Préparer l'input pour la génération
    const articleInput: BlogArticleInput = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      category: article.category,
      content: article.content,
      tags: article.tags,
      author: article.author,
      imageUrl: article.image,
    };

    // Options de génération
    const options: GenerationOptions = {
      tone,
      angle,
      customInstructions,
      instagramFormat,
      authenticityLevel,
      threadsFormat,
      threadsAuthenticityLevel,
      linkedinFormat,
      linkedinExpertiseLevel,
    };

    // Estimer le coût
    const costEstimate = estimateGenerationCost(articleInput, platforms);

    console.log(
      `[Social Generate API] Generating for ${platforms.join(', ')} ` +
        `(estimated ${costEstimate.estimatedInputTokens + costEstimate.estimatedOutputTokens} tokens)`
    );

    // Générer le contenu
    const result = await generateForMultiplePlatforms(articleInput, platforms, options);

    if (!result.success) {
      const detailMessage = result.errors?.length
        ? result.errors.join(' | ')
        : 'Aucun détail disponible';
      return NextResponse.json(
        {
          message: `Échec de la génération de contenu social : ${detailMessage}`,
          error: 'Échec de la génération',
          details: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      generations: result.generations,
      totalTokensUsed: result.totalTokensUsed,
      article: {
        slug: article.slug,
        title: article.title,
        image: article.image,
      },
    });
  } catch (error) {
    console.error('[Social Generate API] Error:', error);
    const { body, status } = formatAIErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

// ===========================================
// GET Handler - Estimation
// ===========================================

/**
 * GET /api/social/generate?blogSlug=xxx&platforms=FACEBOOK,LINKEDIN
 *
 * Estime le coût de la génération sans l'exécuter
 */
export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const blogSlug = searchParams.get('blogSlug');
    const platformsParam = searchParams.get('platforms');

    if (!blogSlug) {
      return NextResponse.json({ error: 'blogSlug requis' }, { status: 400 });
    }

    const platforms = platformsParam
      ? (platformsParam.split(',') as SocialPlatform[])
      : (['FACEBOOK', 'LINKEDIN', 'INSTAGRAM'] as SocialPlatform[]);

    // Récupérer l'article
    const article = await getPostBySlugAsync(blogSlug);
    if (!article) {
      return NextResponse.json({ error: `Article non trouvé: ${blogSlug}` }, { status: 404 });
    }

    const articleInput: BlogArticleInput = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      category: article.category,
      content: article.content,
      tags: article.tags,
      author: article.author,
      imageUrl: article.image,
    };

    const estimate = estimateGenerationCost(articleInput, platforms);

    return NextResponse.json({
      article: {
        slug: article.slug,
        title: article.title,
        contentLength: article.content.length,
      },
      platforms,
      estimate: {
        inputTokens: estimate.estimatedInputTokens,
        outputTokens: estimate.estimatedOutputTokens,
        totalTokens: estimate.estimatedInputTokens + estimate.estimatedOutputTokens,
        estimatedCostUSD: Math.round(estimate.estimatedCostUSD * 10000) / 10000,
      },
    });
  } catch (error) {
    console.error('[Social Generate API] Estimation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
