/**
 * Text Improvement Service
 * @package @kairn/ai
 */

import { TONE_DESCRIPTIONS } from '../prompts/blog-article.js';
import type { AIProvider, RetryOptions } from '../providers/types.js';
import { withRetry } from '../utils/retry.js';

import type {
  TextImprovementOptions,
  ImprovedText,
  ImprovementType,
  ArticleTone,
} from './types.js';

// ============================================
// Improvement Type Descriptions
// ============================================

const IMPROVEMENT_DESCRIPTIONS: Record<ImprovementType, string> = {
  clarity:
    'Améliore la clarté du texte en simplifiant les phrases complexes et en rendant les idées plus accessibles',
  conciseness:
    'Réduit la longueur tout en préservant le sens, élimine les redondances et les mots superflus',
  engagement:
    'Rend le texte plus engageant et captivant, ajoute des accroches et des transitions dynamiques',
  seo: 'Optimise pour le référencement naturel en intégrant naturellement les mots-clés et en améliorant la structure',
  tone: 'Ajuste le ton selon les instructions tout en préservant le message',
  grammar: 'Corrige les erreurs grammaticales, orthographiques et de ponctuation',
  structure:
    "Améliore l'organisation et la structure du texte avec des paragraphes et transitions logiques",
  readability: 'Améliore la lisibilité avec des paragraphes courts, des listes et du texte aéré',
};

// ============================================
// Text Improver Service
// ============================================

export class TextImprover {
  private provider: AIProvider;
  private retryOptions: RetryOptions;
  private defaultSystemPrompt: string;

  constructor(
    provider: AIProvider,
    options: {
      systemPrompt?: string;
      retryOptions?: RetryOptions;
    } = {}
  ) {
    this.provider = provider;
    this.retryOptions = options.retryOptions || {
      maxRetries: 2,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
    };
    this.defaultSystemPrompt =
      options.systemPrompt ||
      `Tu es un rédacteur expert spécialisé dans l'amélioration de texte.

Règles d'amélioration :
1. Préserve le sens et les informations clés du texte original
2. Améliore la clarté et la fluidité
3. Corrige les erreurs grammaticales et de style
4. Utilise le Markdown approprié (gras pour les concepts clés, italique pour les nuances)
5. Structure les paragraphes de manière aérée (3-4 lignes max)
6. Pas de retours à la ligne à l'intérieur des paragraphes
7. Réponds uniquement avec le texte amélioré, sans commentaires ni explications`;
  }

  /**
   * Improve text based on options
   */
  async improve(options: TextImprovementOptions): Promise<ImprovedText> {
    const {
      text,
      type = 'clarity',
      instructions,
      targetTone,
      preserveMarkdown = true,
      language = 'fr',
    } = options;

    const prompt = this.buildImprovementPrompt(
      text,
      type,
      instructions,
      targetTone,
      preserveMarkdown,
      language
    );

    const result = await withRetry(
      () =>
        this.provider.generateText(prompt, {
          systemPrompt: this.defaultSystemPrompt,
          maxTokens: Math.max(text.length * 2, 2000),
          temperature: 0.3,
        }),
      this.retryOptions
    );

    // Clean up the response
    let improvedContent = result.content.trim();

    // Remove any wrapper quotes or markdown code blocks
    improvedContent = improvedContent
      .replace(/^```[\w]*\n?/, '')
      .replace(/\n?```$/, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    return {
      content: improvedContent,
      metadata: {
        tokensUsed: result.totalTokens,
        durationMs: result.durationMs,
        model: result.model,
      },
    };
  }

  /**
   * Quick improvement methods for common use cases
   */
  async improveClarity(text: string, language?: 'fr' | 'en'): Promise<ImprovedText> {
    return this.improve({ text, type: 'clarity', language });
  }

  async improveConciseness(text: string, language?: 'fr' | 'en'): Promise<ImprovedText> {
    return this.improve({ text, type: 'conciseness', language });
  }

  async improveEngagement(text: string, language?: 'fr' | 'en'): Promise<ImprovedText> {
    return this.improve({ text, type: 'engagement', language });
  }

  async improveSeo(
    text: string,
    keywords?: string[],
    language?: 'fr' | 'en'
  ): Promise<ImprovedText> {
    const instructions = keywords?.length
      ? `Intègre naturellement ces mots-clés : ${keywords.join(', ')}`
      : undefined;
    return this.improve({ text, type: 'seo', instructions, language });
  }

  async improveGrammar(text: string, language?: 'fr' | 'en'): Promise<ImprovedText> {
    return this.improve({ text, type: 'grammar', language });
  }

  async improveReadability(text: string, language?: 'fr' | 'en'): Promise<ImprovedText> {
    return this.improve({ text, type: 'readability', language });
  }

  async changeTone(
    text: string,
    targetTone: ArticleTone,
    language?: 'fr' | 'en'
  ): Promise<ImprovedText> {
    return this.improve({ text, type: 'tone', targetTone, language });
  }

  /**
   * Custom improvement with specific instructions
   */
  async improveWithInstructions(
    text: string,
    instructions: string,
    language?: 'fr' | 'en'
  ): Promise<ImprovedText> {
    return this.improve({ text, instructions, language });
  }

  /**
   * Build the improvement prompt
   */
  private buildImprovementPrompt(
    text: string,
    type: ImprovementType,
    instructions?: string,
    targetTone?: ArticleTone,
    preserveMarkdown?: boolean,
    language?: 'fr' | 'en'
  ): string {
    const parts: string[] = [];

    // Main instruction
    parts.push('Améliore le texte suivant :');
    parts.push('');
    parts.push('---');
    parts.push(text);
    parts.push('---');
    parts.push('');

    // Improvement type
    parts.push(`Type d'amélioration demandé : ${type}`);
    parts.push(IMPROVEMENT_DESCRIPTIONS[type]);
    parts.push('');

    // Additional instructions
    if (instructions) {
      parts.push(`Instructions spécifiques : ${instructions}`);
      parts.push('');
    }

    // Target tone
    if (targetTone) {
      parts.push(`Ton cible : ${TONE_DESCRIPTIONS[targetTone]}`);
      parts.push('');
    }

    // Markdown handling
    if (preserveMarkdown) {
      parts.push('Préserve le formatage Markdown existant (titres, listes, gras, italique).');
    } else {
      parts.push('Tu peux ajouter ou modifier le formatage Markdown si nécessaire.');
    }

    // Language
    parts.push(`\nLangue : ${language === 'fr' ? 'Français' : 'Anglais'}`);

    // Final instruction
    parts.push('\nRéponds uniquement avec le texte amélioré, sans commentaires ni explications.');

    return parts.join('\n');
  }
}

/**
 * Create a text improver with the given provider
 */
export function createTextImprover(
  provider: AIProvider,
  options?: {
    systemPrompt?: string;
    retryOptions?: RetryOptions;
  }
): TextImprover {
  return new TextImprover(provider, options);
}
