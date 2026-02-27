/**
 * API de génération de contenu pour les réseaux sociaux pour les séminaires
 *
 * POST /api/social/generate-seminar
 *
 * Génère du contenu adapté pour les réseaux sociaux à partir d'un séminaire.
 * Utilise Claude API pour créer des posts optimisés par plateforme.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { getSeminarById, type SeminarOutput } from '@/app/api/seminars/prisma-store';
import { parseGenerationResponse, parseMultiPlatformResponse } from '@/lib/social/prompts/builder';
import {
  buildSeminarSystemPrompt,
  buildSeminarUserPrompt,
  buildSeminarMultiPlatformPrompt,
  type SeminarInput,
  type SeminarGenerationOptions,
} from '@/lib/social/prompts/seminar-builder';
import type {
  SocialPlatform,
  ContentTone,
  ContentAngle,
  GeneratedContent,
  SeminarInstagramFormat,
  SeminarLinkedInFormat,
  SeminarFacebookFormat,
  SeminarThreadsFormat,
  SeminarUrgencyLevel,
} from '@/lib/social/types';

// ===========================================
// Configuration
// ===========================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 2048;

// ===========================================
// Types
// ===========================================

interface GenerateSeminarRequestBody {
  seminarId: string;
  platforms: SocialPlatform[];
  tone: ContentTone;
  angle: ContentAngle;
  customInstructions?: string;
  // Options avancées par plateforme
  instagramFormat?: SeminarInstagramFormat;
  linkedinFormat?: SeminarLinkedInFormat;
  facebookFormat?: SeminarFacebookFormat;
  threadsFormat?: SeminarThreadsFormat;
  // Urgence
  urgencyLevel?: SeminarUrgencyLevel;
  placesRemaining?: number;
}

interface GenerationResult {
  success: boolean;
  generations: GeneratedContent[];
  totalTokensUsed: number;
  errors?: string[];
}

// ===========================================
// Anthropic Client
// ===========================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('[SeminarSocialGeneration] ANTHROPIC_API_KEY non configurée.');
    }
    anthropicClient = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// ===========================================
// Helpers
// ===========================================

/**
 * Vérifie la configuration
 */
function checkConfig(): { valid: boolean; error?: string } {
  if (!ANTHROPIC_API_KEY) {
    return { valid: false, error: 'ANTHROPIC_API_KEY non configurée' };
  }
  return { valid: true };
}

/**
 * Valide le corps de la requête
 */
function validateRequestBody(body: unknown): {
  valid: boolean;
  data?: GenerateSeminarRequestBody;
  error?: string;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Corps de la requête invalide' };
  }

  const b = body as Record<string, unknown>;

  if (!b.seminarId || typeof b.seminarId !== 'string') {
    return { valid: false, error: 'seminarId est requis' };
  }

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

  const validAngles: ContentAngle[] = ['benefices', 'probleme', 'histoire', 'expert', 'pratique'];
  if (!b.angle || !validAngles.includes(b.angle as ContentAngle)) {
    return { valid: false, error: 'angle invalide ou manquant' };
  }

  // Valider les formats optionnels
  const validInstagramFormats: SeminarInstagramFormat[] = [
    'compte_rebours',
    'apercu_experience',
    'temoignage_passe',
    'question_reflexive',
    'liste_benefices',
    'coulisses',
  ];
  const validLinkedinFormats: SeminarLinkedInFormat[] = [
    'annonce_expert',
    'probleme_solution',
    'observation_terrain',
    'invitation_reflexion',
    'programme_detaille',
    'derniere_chance',
  ];
  const validFacebookFormats: SeminarFacebookFormat[] = [
    'invitation_chaleureuse',
    'histoire_transformation',
    'question_engagement',
    'details_pratiques',
    'derniers_jours',
    'partage_vision',
  ];
  const validThreadsFormats: SeminarThreadsFormat[] = [
    'pensee_spontanee',
    'micro_confession',
    'question_ouverte',
    'fragment_anticipation',
    'rappel_humain',
  ];
  const validUrgencyLevels: SeminarUrgencyLevel[] = [1, 2, 3, 4, 5];

  // Validation optionnelle des formats
  if (
    b.instagramFormat &&
    !validInstagramFormats.includes(b.instagramFormat as SeminarInstagramFormat)
  ) {
    return { valid: false, error: `Format Instagram invalide: ${b.instagramFormat}` };
  }
  if (
    b.linkedinFormat &&
    !validLinkedinFormats.includes(b.linkedinFormat as SeminarLinkedInFormat)
  ) {
    return { valid: false, error: `Format LinkedIn invalide: ${b.linkedinFormat}` };
  }
  if (
    b.facebookFormat &&
    !validFacebookFormats.includes(b.facebookFormat as SeminarFacebookFormat)
  ) {
    return { valid: false, error: `Format Facebook invalide: ${b.facebookFormat}` };
  }
  if (b.threadsFormat && !validThreadsFormats.includes(b.threadsFormat as SeminarThreadsFormat)) {
    return { valid: false, error: `Format Threads invalide: ${b.threadsFormat}` };
  }
  if (
    b.urgencyLevel !== undefined &&
    !validUrgencyLevels.includes(b.urgencyLevel as SeminarUrgencyLevel)
  ) {
    return { valid: false, error: `Niveau d'urgence invalide: ${b.urgencyLevel}` };
  }
  if (
    b.placesRemaining !== undefined &&
    (typeof b.placesRemaining !== 'number' || b.placesRemaining < 0)
  ) {
    return { valid: false, error: 'placesRemaining doit être un nombre positif' };
  }

  return {
    valid: true,
    data: {
      seminarId: b.seminarId as string,
      platforms: b.platforms as SocialPlatform[],
      tone: b.tone as ContentTone,
      angle: b.angle as ContentAngle,
      customInstructions: b.customInstructions as string | undefined,
      instagramFormat: b.instagramFormat as SeminarInstagramFormat | undefined,
      linkedinFormat: b.linkedinFormat as SeminarLinkedInFormat | undefined,
      facebookFormat: b.facebookFormat as SeminarFacebookFormat | undefined,
      threadsFormat: b.threadsFormat as SeminarThreadsFormat | undefined,
      urgencyLevel: b.urgencyLevel as SeminarUrgencyLevel | undefined,
      placesRemaining: b.placesRemaining as number | undefined,
    },
  };
}

/**
 * Convertit un SeminarOutput (Prisma) en SeminarInput (prompt builder)
 */
function toSeminarInput(seminar: SeminarOutput): SeminarInput {
  return {
    id: seminar.id,
    title: seminar.title,
    description: seminar.description,
    speakers: seminar.speakers,
    startAt: seminar.startAt,
    endAt: seminar.endAt,
    capacity: seminar.capacity,
    price: seminar.price,
    deposit: seminar.deposit,
    tags: seminar.tags,
  };
}

// ===========================================
// Generation
// ===========================================

/**
 * Génère pour une seule plateforme
 */
async function generateForPlatform(
  seminar: SeminarInput,
  platform: SocialPlatform,
  options: SeminarGenerationOptions
): Promise<{ success: boolean; content?: GeneratedContent; error?: string; tokensUsed?: number }> {
  try {
    const client = getAnthropicClient();
    const systemPrompt = buildSeminarSystemPrompt();
    const userPrompt = buildSeminarUserPrompt(seminar, platform, options);

    console.log(`[SeminarSocialGen] Generating ${platform} content for "${seminar.title}"`);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    const parsed = parseGenerationResponse(responseText);

    if (!parsed) {
      console.error(`[SeminarSocialGen] Failed to parse response for ${platform}:`, responseText);
      return { success: false, error: "Échec de l'analyse de la réponse" };
    }

    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    return {
      success: true,
      content: {
        platform,
        content: parsed.content,
        hashtags: parsed.hashtags,
        tokensUsed,
      },
      tokensUsed,
    };
  } catch (error) {
    console.error(`[SeminarSocialGen] Error generating ${platform} content:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Génère pour plusieurs plateformes
 */
async function generateForMultiplePlatforms(
  seminar: SeminarInput,
  platforms: SocialPlatform[],
  options: SeminarGenerationOptions
): Promise<GenerationResult> {
  if (platforms.length === 0) {
    return {
      success: false,
      generations: [],
      totalTokensUsed: 0,
      errors: ['Aucune plateforme spécifiée'],
    };
  }

  // Pour une seule plateforme, utiliser la génération simple
  if (platforms.length === 1) {
    const result = await generateForPlatform(seminar, platforms[0]!, options);
    return {
      success: result.success,
      generations: result.content ? [result.content] : [],
      totalTokensUsed: result.tokensUsed || 0,
      errors: result.error ? [result.error] : undefined,
    };
  }

  try {
    const client = getAnthropicClient();
    const systemPrompt = buildSeminarSystemPrompt();
    const userPrompt = buildSeminarMultiPlatformPrompt(seminar, platforms, options);

    console.log(`[SeminarSocialGen] Generating for ${platforms.join(', ')} for "${seminar.title}"`);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS * platforms.length,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    const parsed = parseMultiPlatformResponse(responseText);

    if (!parsed) {
      console.error('[SeminarSocialGen] Failed to parse multi-platform response, falling back');
      return generateIndividually(seminar, platforms, options);
    }

    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
    const tokensPerPlatform = Math.floor(tokensUsed / platforms.length);

    const generations: GeneratedContent[] = parsed.map(gen => ({
      platform: gen.platform,
      content: gen.content,
      hashtags: gen.hashtags,
      tokensUsed: tokensPerPlatform,
    }));

    return {
      success: true,
      generations,
      totalTokensUsed: tokensUsed,
    };
  } catch (error) {
    console.error('[SeminarSocialGen] Error in multi-platform generation:', error);
    return generateIndividually(seminar, platforms, options);
  }
}

/**
 * Génère individuellement (fallback)
 */
async function generateIndividually(
  seminar: SeminarInput,
  platforms: SocialPlatform[],
  options: SeminarGenerationOptions
): Promise<GenerationResult> {
  const generations: GeneratedContent[] = [];
  const errors: string[] = [];
  let totalTokensUsed = 0;

  for (const platform of platforms) {
    const result = await generateForPlatform(seminar, platform, options);

    if (result.success && result.content) {
      generations.push(result.content);
      totalTokensUsed += result.tokensUsed || 0;
    } else if (result.error) {
      errors.push(`${platform}: ${result.error}`);
    }
  }

  return {
    success: generations.length > 0,
    generations,
    totalTokensUsed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ===========================================
// POST Handler
// ===========================================

export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  // Vérifier la configuration
  const configCheck = checkConfig();
  if (!configCheck.valid) {
    return NextResponse.json({ error: configCheck.error }, { status: 500 });
  }

  try {
    // Parser et valider le corps
    const body = await request.json();
    const validation = validateRequestBody(body);

    if (!validation.valid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      seminarId,
      platforms,
      tone,
      angle,
      customInstructions,
      instagramFormat,
      linkedinFormat,
      facebookFormat,
      threadsFormat,
      urgencyLevel,
      placesRemaining,
    } = validation.data;

    // Récupérer le séminaire depuis la base de données
    const seminar = await getSeminarById(seminarId);

    if (!seminar) {
      return NextResponse.json({ error: `Séminaire non trouvé: ${seminarId}` }, { status: 404 });
    }

    const seminarInput = toSeminarInput(seminar);
    const options: SeminarGenerationOptions = {
      tone,
      angle,
      customInstructions,
      // Options avancées par plateforme
      instagramFormat,
      linkedinFormat,
      facebookFormat,
      threadsFormat,
      // Urgence
      urgencyLevel,
      placesRemaining,
    };

    console.log(`[SeminarSocialGen API] Generating for ${platforms.join(', ')}`);

    // Générer le contenu
    const result = await generateForMultiplePlatforms(seminarInput, platforms, options);

    if (!result.success) {
      return NextResponse.json(
        {
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
      seminar: {
        id: seminar.id,
        title: seminar.title,
        startAt: seminar.startAt,
        endAt: seminar.endAt,
      },
    });
  } catch (error) {
    console.error('[SeminarSocialGen API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
