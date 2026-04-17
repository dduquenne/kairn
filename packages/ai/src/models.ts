/**
 * Modèles IA par défaut pour la plateforme Kairn
 *
 * Source unique de vérité pour les identifiants de modèles.
 * Surchargeables via variables d'environnement.
 * @package @kairn/ai
 */

/** Modèle Claude par défaut pour la génération de texte */
export const CLAUDE_DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

/** Modèle OpenAI par défaut pour la génération de texte */
export const OPENAI_DEFAULT_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4o';

/** Modèle OpenAI par défaut pour la génération d'images */
export const OPENAI_DEFAULT_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
