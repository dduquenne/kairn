/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Service de génération de contenu pour les réseaux sociaux
 *
 * MIGRATION PHASE 6 NOTE: Ce module utilise directement l'API Anthropic
 * car il a des prompts et un parsing de réponse spécifiques à Appréciez Votre Vie.
 * Une migration vers @kairn/ai pourrait être envisagée si les prompts
 * sont standardisés dans une phase future.
 *
 * Utilise Claude API pour générer du contenu adapté à chaque plateforme
 * à partir d'articles de blog.
 */

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_DEFAULT_MODEL } from '@kairn/ai';

import {
  buildSystemPrompt,
  buildUserPrompt,
  buildMultiPlatformPrompt,
  parseGenerationResponse,
  parseMultiPlatformResponse,
  estimateTokens,
  type BlogArticleInput,
} from './prompts';
import { createGenerationLog } from './store';
import type {
  SocialPlatform,
  ContentTone,
  ContentAngle,
  GeneratedContent,
  GenerationOptions,
} from './types';

// ===========================================
// Configuration
// ===========================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = CLAUDE_DEFAULT_MODEL;
const MAX_TOKENS = 2048;

// ===========================================
// Types
// ===========================================

export interface GenerationRequest {
  article: BlogArticleInput;
  platforms: SocialPlatform[];
  options: GenerationOptions;
}

export interface GenerationResult {
  success: boolean;
  generations: GeneratedContent[];
  totalTokensUsed: number;
  errors?: string[];
}

export interface SingleGenerationResult {
  success: boolean;
  content?: GeneratedContent;
  tokensUsed?: number;
  error?: string;
}

// ===========================================
// Client Anthropic
// ===========================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error(
        '[SocialGeneration] ANTHROPIC_API_KEY non configurée. ' +
          "Ajoutez votre clé API Anthropic dans les variables d'environnement."
      );
    }
    anthropicClient = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// ===========================================
// Génération individuelle
// ===========================================

/**
 * Génère du contenu pour une seule plateforme
 */
export async function generateForPlatform(
  article: BlogArticleInput,
  platform: SocialPlatform,
  options: GenerationOptions
): Promise<SingleGenerationResult> {
  try {
    const client = getAnthropicClient();
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(article, platform, options);

    console.log(`[SocialGeneration] Generating ${platform} content for "${article.title}"`);

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

    // Extraire le texte de la réponse
    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Parser la réponse
    const parsed = parseGenerationResponse(responseText);

    if (!parsed) {
      console.error(`[SocialGeneration] Failed to parse response for ${platform}:`, responseText);
      return {
        success: false,
        error: "Échec de l'analyse de la réponse de Claude",
      };
    }

    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    // Logger la génération
    try {
      await createGenerationLog({
        blogSlug: article.slug,
        platform,
        inputContent: article.content.substring(0, 1000),
        promptUsed: userPrompt.substring(0, 2000),
        generatedContent: parsed.content,
        tokensUsed,
      });
    } catch (logError) {
      console.warn('[SocialGeneration] Failed to log generation:', logError);
    }

    return {
      success: true,
      content: {
        platform,
        content: parsed.content,
        hashtags: parsed.hashtags,
        suggestedMediaUrl: article.imageUrl,
        tokensUsed,
      },
      tokensUsed,
    };
  } catch (error) {
    console.error(`[SocialGeneration] Error generating ${platform} content:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// ===========================================
// Génération multi-plateforme
// ===========================================

/**
 * Génère du contenu pour plusieurs plateformes en une seule requête
 * Plus efficace en tokens que des appels séparés
 */
export async function generateForMultiplePlatforms(
  article: BlogArticleInput,
  platforms: SocialPlatform[],
  options: GenerationOptions
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
    const result = await generateForPlatform(article, platforms[0], options);
    return {
      success: result.success,
      generations: result.content ? [result.content] : [],
      totalTokensUsed: result.tokensUsed || 0,
      errors: result.error ? [result.error] : undefined,
    };
  }

  try {
    const client = getAnthropicClient();
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildMultiPlatformPrompt(article, platforms, options);

    console.log(
      `[SocialGeneration] Generating content for ${platforms.join(', ')} for "${article.title}"`
    );

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
      console.error('[SocialGeneration] Failed to parse multi-platform response:', responseText);

      // Fallback: générer individuellement
      console.log('[SocialGeneration] Falling back to individual generation');
      return generateIndividually(article, platforms, options);
    }

    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
    const tokensPerPlatform = Math.floor(tokensUsed / platforms.length);

    const generations: GeneratedContent[] = parsed.map(gen => ({
      platform: gen.platform,
      content: gen.content,
      hashtags: gen.hashtags,
      suggestedMediaUrl: article.imageUrl,
      tokensUsed: tokensPerPlatform,
    }));

    // Logger chaque génération
    for (const gen of generations) {
      try {
        await createGenerationLog({
          blogSlug: article.slug,
          platform: gen.platform,
          inputContent: article.content.substring(0, 1000),
          promptUsed: `[Multi-platform] ${userPrompt.substring(0, 1000)}`,
          generatedContent: gen.content,
          tokensUsed: gen.tokensUsed,
        });
      } catch (logError) {
        console.warn('[SocialGeneration] Failed to log generation:', logError);
      }
    }

    return {
      success: true,
      generations,
      totalTokensUsed: tokensUsed,
    };
  } catch (error) {
    console.error('[SocialGeneration] Error in multi-platform generation:', error);

    // Fallback: générer individuellement
    console.log('[SocialGeneration] Falling back to individual generation due to error');
    return generateIndividually(article, platforms, options);
  }
}

/**
 * Génère pour chaque plateforme individuellement (fallback)
 */
async function generateIndividually(
  article: BlogArticleInput,
  platforms: SocialPlatform[],
  options: GenerationOptions
): Promise<GenerationResult> {
  const generations: GeneratedContent[] = [];
  const errors: string[] = [];
  let totalTokensUsed = 0;

  for (const platform of platforms) {
    const result = await generateForPlatform(article, platform, options);

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
// Utilitaires
// ===========================================

/**
 * Vérifie que la configuration est correcte
 */
export function checkGenerationConfig(): { valid: boolean; error?: string } {
  if (!ANTHROPIC_API_KEY) {
    return {
      valid: false,
      error: 'ANTHROPIC_API_KEY non configurée',
    };
  }
  return { valid: true };
}

/**
 * Estime le coût approximatif d'une génération
 * Basé sur les tarifs Claude (approximatifs)
 */
export function estimateGenerationCost(
  article: BlogArticleInput,
  platforms: SocialPlatform[]
): {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUSD: number;
} {
  // Estimation des tokens d'entrée
  const baseSystemTokens = 800; // Prompt système
  const articleTokens = estimateTokens(article.content.substring(0, 3000));
  const platformTokens = platforms.length * 300; // Specs par plateforme

  const estimatedInputTokens = baseSystemTokens + articleTokens + platformTokens;

  // Estimation des tokens de sortie (environ 200 par plateforme)
  const estimatedOutputTokens = platforms.length * 200;

  // Coût approximatif Claude Sonnet (USD par 1M tokens)
  // Input: $3, Output: $15
  const inputCost = (estimatedInputTokens / 1_000_000) * 3;
  const outputCost = (estimatedOutputTokens / 1_000_000) * 15;

  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedCostUSD: inputCost + outputCost,
  };
}

/**
 * Régénère le contenu pour une plateforme spécifique avec des ajustements
 */
export async function regenerateWithFeedback(
  article: BlogArticleInput,
  platform: SocialPlatform,
  previousContent: string,
  feedback: string,
  options: GenerationOptions
): Promise<SingleGenerationResult> {
  // Ajouter le feedback aux instructions personnalisées
  const enhancedOptions: GenerationOptions = {
    ...options,
    customInstructions:
      `${options.customInstructions || ''}\n\nContenu précédent (à améliorer):\n${previousContent}\n\nFeedback utilisateur:\n${feedback}`.trim(),
  };

  return generateForPlatform(article, platform, enhancedOptions);
}
