/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Générateur d'articles avec génération section par section
 *
 * Cette implémentation résout les problèmes de limitation de tokens en générant
 * chaque section de l'article séparément tout en maintenant la cohérence globale.
 *
 * Étapes:
 * 1. Générer le plan détaillé (outline)
 * 2. Générer l'introduction
 * 3. Générer chaque section H2 séparément (avec contexte des sections précédentes)
 * 4. Générer la conclusion
 * 5. Réviser et assembler le contenu complet
 * 6. Générer le titre et la description SEO
 * 7. Générer les tags
 * 8. Générer la FAQ
 * 9. Générer le prompt image
 */

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_DEFAULT_MODEL } from '@kairn/ai';

import { parseJsonFromText, withRetryAndTimeout, type RetryOptions } from './ai-utils';
import {
  AVV_IMAGE_GENERATION_PROMPT,
  enrichImagePromptWithThematics,
  validatePromptForMandatoryElements,
} from './avv-image-prompt-generator';
import { AVV_STYLE_SYSTEM_PROMPT } from './avv-system-prompt';

// Configuration des timeouts et retries
const API_TIMEOUT_MS = 90000; // 90 secondes par étape (plus court car plusieurs étapes)
const RETRY_OPTIONS: RetryOptions = {
  maxRetries: 2,
  initialDelayMs: 2000,
  backoffMultiplier: 2,
  maxDelayMs: 15000,
  onRetry: (attempt, error, delayMs) => {
    console.warn(
      `🔄 Retry ${attempt} après erreur, attente ${delayMs}ms:`,
      error instanceof Error ? error.message : error
    );
  },
};

// Types
export interface SectionalGenerationOptions {
  topic: string;
  category: string;
  targetLength?: 'short' | 'medium' | 'long';
  seoQuery?: string;
  searchIntent?: string;
  editorialCategory?: 'Comprendre' | 'Traverser' | 'Découvrir' | 'Cheminer';
  readerPersona?: string;
  preferredTones?: string[];
  useAvvStyle?: boolean;
  onProgress?: (step: GenerationProgress) => void | Promise<void>;
}

export interface GenerationProgress {
  step: number;
  totalSteps: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
  substep?: {
    current: number;
    total: number;
    name: string;
  };
}

export interface DetailedOutline {
  mainThesis: string;
  targetAudience: string;
  keyMessages: string[];
  introduction: {
    hook: string;
    contextSetup: string;
    promiseToReader: string;
  };
  sections: {
    title: string;
    purpose: string;
    keyPoints: string[];
    transitionToNext?: string;
    estimatedWords: number;
  }[];
  conclusion: {
    keyTakeaways: string[];
    callToAction: string;
    closingThought: string;
  };
}

export interface GeneratedSectionalArticle {
  success: boolean;
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  faq?: Array<{ question: string; answer: string }>;
  imagePrompt?: string;
  error?: string;
  generationMetadata?: {
    outline?: DetailedOutline;
    sectionsGenerated: number;
    totalSections: number;
    stepsCompleted: number;
    totalSteps: number;
    coherenceScore?: number;
  };
}

// Constantes
const LENGTH_CONFIG = {
  short: {
    words: '800-1000',
    sections: 2,
    introWords: 150,
    sectionWords: 300,
    conclusionWords: 150,
    maxTokensPerSection: 1500,
  },
  medium: {
    words: '1000-1500',
    sections: 3,
    introWords: 200,
    sectionWords: 350,
    conclusionWords: 150,
    maxTokensPerSection: 2000,
  },
  long: {
    words: '1500-2000',
    sections: 4,
    introWords: 250,
    sectionWords: 400,
    conclusionWords: 200,
    maxTokensPerSection: 2500,
  },
} as const;

const SPECIFIC_TONE_GUIDE: Record<string, string> = {
  informatif: 'Présente les faits et informations avec clarté et objectivité.',
  pédagogique: 'Approche pédagogique progressive, guidant pas à pas vers la compréhension.',
  inspirant: 'Motivant et porteur, incitant à croire en ses capacités de transformation.',
  narratif: 'Raconte des histoires engageantes, utilisant des anecdotes.',
  conversationnel: 'Ton amical et accessible, comme une conversation entre amis.',
  professionnel: 'Formel et expert, avec vocabulaire spécialisé.',
  provocateur: 'Défi les conventions, provoque la réflexion critique.',
  humoristique: "Léger et amusant, utilise l'humour.",
  poétique: 'Approche poétique et métaphorique, beauté du langage.',
  introspectif: 'Approche introspective et contemplative, exploration intérieure.',
  engagé: "Prend position, appelle à l'action avec passion.",
  scientifique: 'Base sur les données et recherches, ton neutre et basé sur preuves.',
  pragmatique: "Focalisé sur l'utilité pratique et les résultats concrets.",
  analytique: 'Approche analytique et structurée, décortiquant avec précision.',
  apaisant: 'Calme, rassurant, comme une voix intérieure qui guide.',
} as const;

// Instructions Markdown communes
const MARKDOWN_INSTRUCTIONS = `
## RÈGLES MARKDOWN STRICTES
- Une idée par paragraphe (3-4 lignes max)
- AUCUN retour à la ligne dans un paragraphe
- **Gras** pour concepts-clés, *italique* pour introspection
- Listes : 3-5 points maximum
- Citations : > « Citation » — Auteur
- Callouts : [!NOTE], [!TIP], [!WARNING] si pertinent
- Pas de tableaux, pas de MAJUSCULES
- H2/H3 : pas de majuscule inutile (sauf noms propres)
`;

/**
 * Crée une instance Anthropic
 */
function createAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

/**
 * Génère le contexte éditorial
 */
function buildEditorialContext(options: SectionalGenerationOptions): string {
  const parts: string[] = [];

  if (options.seoQuery) {
    parts.push(`**Requête SEO** : ${options.seoQuery}`);
  }
  if (options.searchIntent) {
    parts.push(`**Intention de recherche** : ${options.searchIntent}`);
  }
  if (options.editorialCategory) {
    parts.push(`**Catégorie** : ${options.editorialCategory}`);
  }
  if (options.readerPersona) {
    parts.push(`**Persona lecteur** : ${options.readerPersona}`);
  }
  if (options.preferredTones && options.preferredTones.length > 0) {
    const tonesDesc = options.preferredTones
      .map(t => `- **${t}** : ${SPECIFIC_TONE_GUIDE[t] || t}`)
      .join('\n');
    parts.push(`**Tons** :\n${tonesDesc}`);
  }

  return parts.join('\n');
}

/**
 * ÉTAPE 1: Génère le plan détaillé de l'article
 */
async function generateDetailedOutline(
  anthropic: Anthropic,
  options: SectionalGenerationOptions,
  useAvvStyle: boolean
): Promise<DetailedOutline> {
  const lengthConfig = LENGTH_CONFIG[options.targetLength || 'medium'];
  const editorialContext = buildEditorialContext(options);

  const prompt = `Tu dois créer un plan TRÈS DÉTAILLÉ pour un article de blog.

## SUJET
${options.topic}

## CATÉGORIE
${options.category}

## CONTEXTE ÉDITORIAL
${editorialContext}

## CONTRAINTES
- Longueur cible : ${lengthConfig.words} mots
- Nombre de sections H2 : ${lengthConfig.sections} sections
- Introduction : ~${lengthConfig.introWords} mots
- Chaque section : ~${lengthConfig.sectionWords} mots
- Conclusion : ~${lengthConfig.conclusionWords} mots

## TÂCHE
Génère un plan détaillé au format JSON suivant. Ce plan servira à générer chaque partie séparément tout en maintenant la cohérence.

{
  "mainThesis": "La thèse principale de l'article",
  "targetAudience": "Description précise du public cible",
  "keyMessages": ["Message clé 1", "Message clé 2", "Message clé 3"],
  "introduction": {
    "hook": "Phrase d'accroche captivante (question, statistique, ou situation)",
    "contextSetup": "Contexte qui pose le problème ou la thématique",
    "promiseToReader": "Ce que le lecteur va apprendre/gagner en lisant"
  },
  "sections": [
    {
      "title": "Titre H2 (sans majuscules inutiles)",
      "purpose": "Objectif de cette section dans l'article",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "transitionToNext": "Idée de transition vers la section suivante",
      "estimatedWords": ${lengthConfig.sectionWords}
    }
  ],
  "conclusion": {
    "keyTakeaways": ["Point à retenir 1", "Point à retenir 2"],
    "callToAction": "CTA subtil et bienveillant",
    "closingThought": "Pensée finale inspirante ou réflexive"
  }
}

IMPORTANT:
- Les titres suivent la convention française (pas de majuscule inutile)
- Chaque section doit avoir un but clair et contribuer à la thèse principale
- Les transitions doivent créer un fil conducteur logique
- Le JSON doit être valide et complet
- Réponds UNIQUEMENT avec le JSON`;

  // Appel API avec retry et timeout
  const message = await withRetryAndTimeout(
    () =>
      anthropic.messages.create({
        model: CLAUDE_DEFAULT_MODEL,
        max_tokens: 5000, // Augmenté de 2000 à 5000 pour éviter la troncature du JSON
        temperature: 0.7,
        ...(useAvvStyle && { system: AVV_STYLE_SYSTEM_PROMPT }),
        messages: [{ role: 'user', content: prompt }],
      }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    // Utiliser le parsing JSON robuste
    return parseJsonFromText<DetailedOutline>(responseText);
  } catch (error) {
    console.error('Erreur parsing outline JSON:', responseText.slice(0, 1000));
    throw new Error(
      `Impossible de parser le plan détaillé: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    );
  }
}

/**
 * ÉTAPE 2: Génère l'introduction
 */
async function generateIntroduction(
  anthropic: Anthropic,
  options: SectionalGenerationOptions,
  outline: DetailedOutline,
  useAvvStyle: boolean
): Promise<string> {
  const lengthConfig = LENGTH_CONFIG[options.targetLength || 'medium'];
  const editorialContext = buildEditorialContext(options);

  const prompt = `Tu dois rédiger l'INTRODUCTION d'un article de blog.

## SUJET
${options.topic}

## CONTEXTE ÉDITORIAL
${editorialContext}

## PLAN DE L'INTRODUCTION
- **Accroche** : ${outline.introduction.hook}
- **Contexte** : ${outline.introduction.contextSetup}
- **Promesse au lecteur** : ${outline.introduction.promiseToReader}

## THÈSE PRINCIPALE
${outline.mainThesis}

## PUBLIC CIBLE
${outline.targetAudience}

## SECTIONS À VENIR
${outline.sections.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}

${MARKDOWN_INSTRUCTIONS}

## INSTRUCTIONS
1. Rédige 2 paragraphes maximum (~${lengthConfig.introWords} mots)
2. Commence par l'accroche (question, statistique, ou mise en situation)
3. Pose le contexte de façon engageante
4. Termine avec la promesse/valeur pour le lecteur
5. N'inclus PAS de titre H1 ou H2
6. Intègre des mots-clés SEO naturellement dans les premiers 100 mots

IMPORTANT: Rédige UNIQUEMENT l'introduction en Markdown, sans balises ni commentaires.`;

  // Appel API avec retry et timeout
  const message = await withRetryAndTimeout(
    () =>
      anthropic.messages.create({
        model: CLAUDE_DEFAULT_MODEL,
        max_tokens: 1000,
        temperature: 0.7,
        ...(useAvvStyle && { system: AVV_STYLE_SYSTEM_PROMPT }),
        messages: [{ role: 'user', content: prompt }],
      }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const content = message.content[0].type === 'text' ? message.content[0].text : '';
  return content.trim();
}

/**
 * ÉTAPE 3: Génère une section spécifique
 */
async function generateSection(
  anthropic: Anthropic,
  options: SectionalGenerationOptions,
  outline: DetailedOutline,
  sectionIndex: number,
  previousSectionsContent: string,
  useAvvStyle: boolean
): Promise<string> {
  const lengthConfig = LENGTH_CONFIG[options.targetLength || 'medium'];
  const section = outline.sections[sectionIndex];
  const isLastSection = sectionIndex === outline.sections.length - 1;
  const editorialContext = buildEditorialContext(options);

  // Résumé des sections précédentes pour maintenir la cohérence
  const previousContext =
    previousSectionsContent.length > 0
      ? `## RÉSUMÉ DES SECTIONS PRÉCÉDENTES (pour cohérence)
${previousSectionsContent.slice(-2000)}...

`
      : '';

  const prompt = `Tu dois rédiger UNE SECTION d'un article de blog.

## SUJET GLOBAL
${options.topic}

## CONTEXTE ÉDITORIAL
${editorialContext}

## THÈSE PRINCIPALE
${outline.mainThesis}

${previousContext}
## SECTION À RÉDIGER (Section ${sectionIndex + 1}/${outline.sections.length})

**Titre H2** : ${section.title}
**Objectif** : ${section.purpose}
**Points clés à couvrir** :
${section.keyPoints.map(p => `- ${p}`).join('\n')}
**Longueur cible** : ~${section.estimatedWords} mots
${section.transitionToNext && !isLastSection ? `**Transition vers section suivante** : ${section.transitionToNext}` : ''}

${
  !isLastSection
    ? `## PROCHAINE SECTION (pour préparer la transition)
Titre : ${outline.sections[sectionIndex + 1]?.title || 'Conclusion'}
Objectif : ${outline.sections[sectionIndex + 1]?.purpose || "Conclure l'article"}`
    : ''
}

${MARKDOWN_INSTRUCTIONS}

## INSTRUCTIONS
1. Commence par le titre H2 : ## ${section.title}
2. Développe TOUS les points clés listés
3. Utilise des exemples concrets ou métaphores si pertinent
4. Intègre des listes à puces pour la lisibilité
5. ${isLastSection ? 'Prépare une transition naturelle vers la conclusion' : 'Termine avec une transition douce vers la section suivante'}
6. Longueur : ~${section.estimatedWords} mots

IMPORTANT: Rédige UNIQUEMENT cette section en Markdown (titre H2 inclus), sans balises ni commentaires.`;

  // Appel API avec retry et timeout
  const message = await withRetryAndTimeout(
    () =>
      anthropic.messages.create({
        model: CLAUDE_DEFAULT_MODEL,
        max_tokens: lengthConfig.maxTokensPerSection,
        temperature: 0.7,
        ...(useAvvStyle && { system: AVV_STYLE_SYSTEM_PROMPT }),
        messages: [{ role: 'user', content: prompt }],
      }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const content = message.content[0].type === 'text' ? message.content[0].text : '';
  return content.trim();
}

/**
 * ÉTAPE 4: Génère la conclusion
 */
async function generateConclusion(
  anthropic: Anthropic,
  options: SectionalGenerationOptions,
  outline: DetailedOutline,
  fullContentSoFar: string,
  useAvvStyle: boolean
): Promise<string> {
  const lengthConfig = LENGTH_CONFIG[options.targetLength || 'medium'];
  const editorialContext = buildEditorialContext(options);

  const prompt = `Tu dois rédiger la CONCLUSION d'un article de blog.

## SUJET
${options.topic}

## CONTEXTE ÉDITORIAL
${editorialContext}

## THÈSE PRINCIPALE
${outline.mainThesis}

## PLAN DE LA CONCLUSION
- **Points à retenir** : ${outline.conclusion.keyTakeaways.join(', ')}
- **CTA** : ${outline.conclusion.callToAction}
- **Pensée finale** : ${outline.conclusion.closingThought}

## EXTRAIT DE L'ARTICLE (pour cohérence)
${fullContentSoFar.slice(-1500)}...

${MARKDOWN_INSTRUCTIONS}

## INSTRUCTIONS
1. Rédige 2-3 paragraphes (~${lengthConfig.conclusionWords} mots)
2. Commence par un titre H2 approprié (ex: "En conclusion" ou "Pour aller plus loin")
3. Rappelle les points essentiels sans répéter mot pour mot
4. Intègre un CTA subtil et bienveillant
5. Termine avec une pensée inspirante ou une question ouverte
6. Le ton doit être chaleureux et encourageant

IMPORTANT: Rédige UNIQUEMENT la conclusion en Markdown (titre H2 inclus), sans balises ni commentaires.`;

  // Appel API avec retry et timeout
  const message = await withRetryAndTimeout(
    () =>
      anthropic.messages.create({
        model: CLAUDE_DEFAULT_MODEL,
        max_tokens: 1000,
        temperature: 0.7,
        ...(useAvvStyle && { system: AVV_STYLE_SYSTEM_PROMPT }),
        messages: [{ role: 'user', content: prompt }],
      }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const content = message.content[0].type === 'text' ? message.content[0].text : '';
  return content.trim();
}

/**
 * ÉTAPE 5: Révise le contenu pour cohérence et fluidité
 */
async function reviseForCoherence(
  anthropic: Anthropic,
  options: SectionalGenerationOptions,
  fullContent: string,
  outline: DetailedOutline,
  useAvvStyle: boolean
): Promise<{ revisedContent: string; coherenceScore: number }> {
  const editorialContext = buildEditorialContext(options);

  const prompt = `Tu dois RÉVISER un article pour améliorer sa cohérence et sa fluidité.

## SUJET
${options.topic}

## CONTEXTE ÉDITORIAL
${editorialContext}

## THÈSE PRINCIPALE
${outline.mainThesis}

## ARTICLE À RÉVISER
${fullContent}

## TÂCHE
1. **Analyse** la cohérence globale de l'article
2. **Améliore** les transitions entre sections si nécessaire
3. **Uniformise** le ton et le style
4. **Corrige** les répétitions ou incohérences
5. **Vérifie** que la thèse principale est bien développée

## RÈGLES DE RÉVISION
- NE PAS changer la structure (H2/H3)
- NE PAS ajouter ou supprimer de sections
- Garder les mêmes idées principales
- Améliorer uniquement la fluidité et les transitions
- Corriger les erreurs de formulation

## FORMAT DE RÉPONSE
Réponds au format JSON :
{
  "revisedContent": "L'article révisé complet en Markdown",
  "coherenceScore": 85,
  "changesApplied": ["Description brève des changements 1", "Changement 2"]
}

Le coherenceScore est une note de 0 à 100 évaluant la cohérence de l'article.`;

  // Appel API avec timeout réduit et retry limité pour la révision
  // 50s pour rester sous la limite Vercel 60s, 1 seul retry
  const COHERENCE_TIMEOUT_MS = 50000;
  const COHERENCE_RETRY_OPTIONS: RetryOptions = { ...RETRY_OPTIONS, maxRetries: 1 };
  const message = await withRetryAndTimeout(
    () =>
      anthropic.messages.create({
        model: CLAUDE_DEFAULT_MODEL,
        max_tokens: 8000,
        temperature: 0.3, // Température basse pour la révision
        ...(useAvvStyle && { system: AVV_STYLE_SYSTEM_PROMPT }),
        messages: [{ role: 'user', content: prompt }],
      }),
    COHERENCE_TIMEOUT_MS,
    COHERENCE_RETRY_OPTIONS
  );

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    // Utiliser le parsing JSON robuste avec fallback
    const parsed = parseJsonFromText<{ revisedContent?: string; coherenceScore?: number }>(
      responseText,
      { revisedContent: fullContent, coherenceScore: 70 } // Fallback
    );
    return {
      revisedContent: parsed.revisedContent || fullContent,
      coherenceScore: parsed.coherenceScore || 75,
    };
  } catch (error) {
    console.warn('Impossible de parser la révision JSON, utilisation du contenu original:', error);
    return {
      revisedContent: fullContent,
      coherenceScore: 70,
    };
  }
}

/**
 * ÉTAPE 6: Génère le titre et la description SEO
 */
async function generateTitleAndDescription(
  anthropic: Anthropic,
  options: SectionalGenerationOptions,
  content: string,
  outline: DetailedOutline,
  useAvvStyle: boolean
): Promise<{ title: string; description: string }> {
  const contentPreview = content.slice(0, 2000);

  const prompt = `Génère un titre et une description SEO optimisés.

## SUJET
${options.topic}

## THÈSE PRINCIPALE
${outline.mainThesis}

## REQUÊTE SEO
${options.seoQuery || 'Non spécifiée'}

## DÉBUT DU CONTENU
${contentPreview}...

## TÂCHE
{
  "title": "Titre accrocheur (50-60 caractères)",
  "description": "Meta description engageante (20 mots max)"
}

RÈGLES TITRE :
- Pas de majuscule inutile (sauf noms propres)
- Doit contenir le mot-clé principal
- Accrocheur et informatif

RÈGLES DESCRIPTION :
- Maximum 20 mots
- Incite au clic
- Résume la valeur de l'article

Réponds UNIQUEMENT avec le JSON.`;

  // Appel API avec retry et timeout
  const message = await withRetryAndTimeout(
    () =>
      anthropic.messages.create({
        model: CLAUDE_DEFAULT_MODEL,
        max_tokens: 500,
        temperature: 0.7,
        ...(useAvvStyle && { system: AVV_STYLE_SYSTEM_PROMPT }),
        messages: [{ role: 'user', content: prompt }],
      }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    // Utiliser le parsing JSON robuste avec fallback
    return parseJsonFromText<{ title: string; description: string }>(responseText, {
      title: options.topic,
      description: `Découvrez notre article sur ${options.topic}`,
    });
  } catch (error) {
    console.warn('Erreur parsing titre/description, utilisation des valeurs par défaut');
    return {
      title: options.topic,
      description: `Découvrez notre article sur ${options.topic}`,
    };
  }
}

/**
 * ÉTAPE 7: Génère les tags SEO
 */
async function generateTags(
  anthropic: Anthropic,
  options: SectionalGenerationOptions,
  content: string,
  title: string
): Promise<string[]> {
  const contentPreview = content.slice(0, 1500);

  const prompt = `Génère des tags SEO.

## TITRE
${title}

## SUJET
${options.topic}

## CATÉGORIE
${options.category}

## EXTRAIT
${contentPreview}...

## TÂCHE
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"]
}

RÈGLES :
- 5 à 8 tags
- En français
- Pertinents SEO
- Pas de majuscules inutiles

Réponds UNIQUEMENT avec le JSON.`;

  // Appel API avec retry et timeout
  const message = await withRetryAndTimeout(
    () =>
      anthropic.messages.create({
        model: CLAUDE_DEFAULT_MODEL,
        max_tokens: 300,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    // Utiliser le parsing JSON robuste avec fallback
    const parsed = parseJsonFromText<{ tags?: string[] }>(responseText, { tags: [] });
    return parsed.tags || [];
  } catch (error) {
    console.warn('Erreur parsing tags, retour tableau vide');
    return [];
  }
}

/**
 * ÉTAPE 8: Génère la FAQ
 */
async function generateFAQ(
  anthropic: Anthropic,
  options: SectionalGenerationOptions,
  content: string,
  title: string,
  useAvvStyle: boolean
): Promise<Array<{ question: string; answer: string }>> {
  const contentPreview = content.slice(0, 2000);

  const prompt = `Génère une FAQ pour cet article.

## TITRE
${title}

## SUJET
${options.topic}

## REQUÊTE SEO
${options.seoQuery || 'Non spécifiée'}

## EXTRAIT
${contentPreview}...

## TÂCHE
{
  "faq": [
    {"question": "Question 1 ?", "answer": "Réponse concise (2-3 phrases)"},
    {"question": "Question 2 ?", "answer": "Réponse concise (2-3 phrases)"}
  ]
}

RÈGLES :
- 3 à 5 questions
- Questions que les gens recherchent sur Google
- Réponses optimisées featured snippets (50-80 mots)
- Format recherche vocale

Réponds UNIQUEMENT avec le JSON.`;

  // Appel API avec retry et timeout
  const message = await withRetryAndTimeout(
    () =>
      anthropic.messages.create({
        model: CLAUDE_DEFAULT_MODEL,
        max_tokens: 1500,
        temperature: 0.7,
        ...(useAvvStyle && { system: AVV_STYLE_SYSTEM_PROMPT }),
        messages: [{ role: 'user', content: prompt }],
      }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    // Utiliser le parsing JSON robuste avec fallback
    const parsed = parseJsonFromText<{ faq?: Array<{ question: string; answer: string }> }>(
      responseText,
      { faq: [] }
    );
    return parsed.faq || [];
  } catch (error) {
    console.warn('Erreur parsing FAQ, retour tableau vide');
    return [];
  }
}

/**
 * ÉTAPE 9: Génère le prompt image
 */
async function generateImagePrompt(
  anthropic: Anthropic,
  options: SectionalGenerationOptions,
  content: string,
  title: string
): Promise<string> {
  const contentPreview = content.slice(0, 1500);

  const prompt = `Génère un prompt pour une image d'illustration respectant l'identité visuelle Appréciez Votre Vie v2.0.

## TITRE
${title}

## SUJET
${options.topic}

## CATÉGORIE
${options.category}

## EXTRAIT
${contentPreview}...

## 🔴 4 ÉLÉMENTS OBLIGATOIRES (NON NÉGOCIABLE)

**CHAQUE prompt image DOIT inclure ces 4 éléments - aucune exception :**

1. ✅ **SILHOUETTE(S) MINIMALISTE(S)** (1-3 silhouettes)
   - Formes épurées et stylisées, NON réalistes
   - Illuminées d'une aura/halo doré
   - Postures contemplatives (assises, profil, méditation)

2. ✅ **LUMIÈRE DORÉE RAYONNANTE** (ÉLÉMENT CRUCIAL)
   - Halos de lumière dorée autour des silhouettes
   - Rayonnement centripète ou enveloppant
   - DOIT être EXPLICITEMENT NOMMÉE dans le prompt

3. ✅ **PALETTE AVV OFFICIELLE** (codes hex OBLIGATOIRES)
   - **Or Appréciez Votre Vie** (#c7a962) : Couleur primaire dominante
   - **Bleu nuit** (#0e1f2f) : Base/fond principal
   - **Ivoire** (#f5f1e6) : Lumières douces
   - Accents : pourpre (#9b7eaa), sauge (#7b9d8f), or clair (#f0d9a3)

4. ✅ **ATMOSPHÈRE CHALEUREUSE + PROFONDEUR EN COUCHES**
   - Voile translucide doux, qualité ACCUEILLANTE
   - Profondeur : plan net → midground → arrière-plan estompé
   - Message d'espoir implicite

## STRUCTURE DU PROMPT
Image 1920×640px (ratio 3:1), style [aquarelle numérique/illustration abstraite].
Composition : [Description avec silhouette(s) + formes + mouvement]
Silhouette : [Description minimaliste illuminée - aura dorée (#c7a962)]
Lumière : [EXPLICITEMENT nommer la lumière dorée rayonnante]
Palette : [Or Appréciez Votre Vie (#c7a962), bleu nuit (#0e1f2f), ivoire (#f5f1e6)]
Atmosphère : [Chaleureuse/accueillante + profondeur en couches]
Message : L'image transmet : "[Message d'espoir]"
Directive : Silhouettes minimalistes OK. Pas d'humains réalistes, texte ou logo. Qualité haute.

EXEMPLES BON STYLE (v2.0) :
✅ "Silhouette minimaliste dont les lignes s'apaisent en spirales. Halo doré (#c7a962). Fond bleu nuit (#0e1f2f). L'image transmet : L'apaisement est possible."
✅ "Silhouette translucide révélant un cœur lumineux or (#c7a962). Palette pourpre (#9b7eaa), ivoire (#f5f1e6)."

EXEMPLES À ÉVITER :
❌ "Femme en consultation avec thérapeute"
❌ Prompts sans silhouettes minimalistes illuminées
❌ Prompts sans codes hex de la palette Appréciez Votre Vie

Réponds UNIQUEMENT avec le prompt image.`;

  // Appel API avec le system prompt spécialisé et retry/timeout
  const message = await withRetryAndTimeout(
    () =>
      anthropic.messages.create({
        model: CLAUDE_DEFAULT_MODEL,
        max_tokens: 1000,
        temperature: 0.7,
        system: AVV_IMAGE_GENERATION_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    API_TIMEOUT_MS,
    RETRY_OPTIONS
  );

  const rawImagePrompt = message.content[0].type === 'text' ? message.content[0].text : '';

  // Enrichir avec les données thématiques et la catégorie
  const enrichedPrompt = enrichImagePromptWithThematics(
    rawImagePrompt.trim(),
    options.topic,
    options.category
  );

  // Valider que le prompt contient les 4 éléments obligatoires
  const validation = validatePromptForMandatoryElements(enrichedPrompt);

  if (!validation.isValid) {
    console.warn(
      `⚠️ IMAGE_PROMPT (sectional) manque des éléments obligatoires: ${validation.missingElements.join(', ')}`
    );
  }

  return enrichedPrompt;
}

/**
 * Génère un article complet avec l'approche sectionnelle
 */
export async function generateArticleSectional(
  options: SectionalGenerationOptions,
  apiKey: string
): Promise<GeneratedSectionalArticle> {
  const anthropic = createAnthropicClient(apiKey);
  const useAvvStyle = options.useAvvStyle !== false;
  const lengthConfig = LENGTH_CONFIG[options.targetLength || 'medium'];

  // Calcul du nombre total d'étapes
  // 1 (outline) + 1 (intro) + N (sections) + 1 (conclusion) + 1 (révision) + 1 (titre) + 1 (tags) + 1 (FAQ) + 1 (image)
  const totalSteps = 9;
  let currentStep = 0;

  const notifyProgress = async (
    name: string,
    status: GenerationProgress['status'],
    message?: string,
    substep?: GenerationProgress['substep']
  ): Promise<void> => {
    if (options.onProgress) {
      // Appeler le callback et attendre qu'il se termine
      // Le callback peut être async (pour écrire dans un stream SSE)
      await Promise.resolve(
        options.onProgress({
          step: currentStep,
          totalSteps,
          name,
          status,
          message,
          substep,
        })
      );
    }
  };

  let outline: DetailedOutline | undefined;
  let content = '';
  let title = '';
  let description = '';
  let tags: string[] = [];
  let faq: Array<{ question: string; answer: string }> = [];
  let imagePrompt = '';
  let sectionsGenerated = 0;
  let coherenceScore = 0;

  // Helper async pour notifier la progression de manière sûre
  const safeNotifyProgress = async (
    name: string,
    status: GenerationProgress['status'],
    message?: string,
    substep?: GenerationProgress['substep']
  ) => {
    try {
      await notifyProgress(name, status, message, substep);
    } catch (err) {
      console.error('Erreur lors de la notification de progression:', err);
    }
  };

  try {
    // ÉTAPE 1: Générer le plan détaillé
    currentStep = 1;
    await safeNotifyProgress(
      'Génération du plan détaillé',
      'in_progress',
      "Création de la structure de l'article..."
    );
    try {
      outline = await generateDetailedOutline(anthropic, options, useAvvStyle);
      await safeNotifyProgress('Génération du plan détaillé', 'completed');
    } catch (error) {
      console.error('Erreur étape 1 (outline):', error);
      await safeNotifyProgress('Génération du plan détaillé', 'error');
      throw new Error(`Échec du plan: ${error instanceof Error ? error.message : 'Erreur'}`);
    }

    // ÉTAPE 2: Générer l'introduction
    currentStep = 2;
    await safeNotifyProgress(
      "Rédaction de l'introduction",
      'in_progress',
      'Création du chapo introductif...'
    );
    try {
      const intro = await generateIntroduction(anthropic, options, outline, useAvvStyle);
      content = intro;
      await safeNotifyProgress("Rédaction de l'introduction", 'completed');
    } catch (error) {
      console.error('Erreur étape 2 (intro):', error);
      await safeNotifyProgress("Rédaction de l'introduction", 'error');
      throw new Error(`Échec introduction: ${error instanceof Error ? error.message : 'Erreur'}`);
    }

    // ÉTAPE 3: Générer chaque section
    currentStep = 3;
    const totalSections = outline.sections.length;
    for (let i = 0; i < totalSections; i++) {
      const sectionName = outline.sections[i].title;
      await safeNotifyProgress(
        'Rédaction des sections',
        'in_progress',
        `Rédaction : ${sectionName}`,
        { current: i + 1, total: totalSections, name: sectionName }
      );

      try {
        const sectionContent = await generateSection(
          anthropic,
          options,
          outline,
          i,
          content,
          useAvvStyle
        );
        content += '\n\n' + sectionContent;
        sectionsGenerated++;
      } catch (error) {
        console.error(`Erreur section ${i + 1}:`, error);
        // Continuer avec les autres sections
      }
    }
    await safeNotifyProgress(
      'Rédaction des sections',
      'completed',
      `${sectionsGenerated}/${totalSections} sections`
    );

    // ÉTAPE 4: Générer la conclusion
    currentStep = 4;
    await safeNotifyProgress(
      'Rédaction de la conclusion',
      'in_progress',
      'Création de la conclusion...'
    );
    try {
      const conclusion = await generateConclusion(
        anthropic,
        options,
        outline,
        content,
        useAvvStyle
      );
      content += '\n\n' + conclusion;
      await safeNotifyProgress('Rédaction de la conclusion', 'completed');
    } catch (error) {
      console.error('Erreur conclusion:', error);
      await safeNotifyProgress('Rédaction de la conclusion', 'error');
      // Continuer sans conclusion
    }

    // ÉTAPE 5: Réviser pour cohérence
    currentStep = 5;
    await safeNotifyProgress(
      'Révision de cohérence',
      'in_progress',
      'Amélioration des transitions...'
    );
    try {
      const revision = await reviseForCoherence(anthropic, options, content, outline, useAvvStyle);
      // Seulement utiliser le contenu révisé s'il est non vide et de longueur raisonnable
      if (revision.revisedContent && revision.revisedContent.length > content.length * 0.5) {
        content = revision.revisedContent;
      } else {
        console.warn('Révision ignorée: contenu révisé trop court ou vide');
      }
      coherenceScore = revision.coherenceScore;
      await safeNotifyProgress(
        'Révision de cohérence',
        'completed',
        `Score: ${coherenceScore}/100`
      );
    } catch (error) {
      console.error('Erreur révision:', error);
      await safeNotifyProgress('Révision de cohérence', 'error');
      coherenceScore = 70;
    }

    // ÉTAPE 6: Générer titre et description
    currentStep = 6;
    await safeNotifyProgress(
      'Optimisation SEO',
      'in_progress',
      'Génération du titre et description...'
    );
    try {
      const titleDesc = await generateTitleAndDescription(
        anthropic,
        options,
        content,
        outline,
        useAvvStyle
      );
      title = titleDesc.title;
      description = titleDesc.description;
      await safeNotifyProgress('Optimisation SEO', 'completed');
    } catch (error) {
      console.error('Erreur titre/description:', error);
      title = options.topic;
      description = `Découvrez notre article sur ${options.topic}`;
      await safeNotifyProgress('Optimisation SEO', 'error');
    }

    // ÉTAPE 7: Générer les tags
    currentStep = 7;
    await safeNotifyProgress('Génération des tags', 'in_progress', 'Création des tags SEO...');
    try {
      tags = await generateTags(anthropic, options, content, title);
      await safeNotifyProgress('Génération des tags', 'completed', `${tags.length} tags`);
    } catch (error) {
      console.error('Erreur tags:', error);
      await safeNotifyProgress('Génération des tags', 'error');
    }

    // ÉTAPE 8: Générer la FAQ
    currentStep = 8;
    await safeNotifyProgress(
      'Création de la FAQ',
      'in_progress',
      'Génération des questions fréquentes...'
    );
    try {
      faq = await generateFAQ(anthropic, options, content, title, useAvvStyle);
      await safeNotifyProgress('Création de la FAQ', 'completed', `${faq.length} questions`);
    } catch (error) {
      console.error('Erreur FAQ:', error);
      await safeNotifyProgress('Création de la FAQ', 'error');
    }

    // ÉTAPE 9: Générer le prompt image
    currentStep = 9;
    await safeNotifyProgress(
      'Création du prompt image',
      'in_progress',
      "Génération du prompt d'illustration..."
    );
    try {
      imagePrompt = await generateImagePrompt(anthropic, options, content, title);
      await safeNotifyProgress('Création du prompt image', 'completed');
    } catch (error) {
      console.error('Erreur prompt image:', error);
      await safeNotifyProgress('Création du prompt image', 'error');
    }

    // Ajouter le titre H1 au début du contenu
    const contentWithTitle = title ? `# ${title}\n\n${content}` : content;

    return {
      success: true,
      title,
      description,
      content: contentWithTitle,
      category: options.category,
      tags,
      faq,
      imagePrompt,
      generationMetadata: {
        outline,
        sectionsGenerated,
        totalSections: lengthConfig.sections,
        stepsCompleted: currentStep,
        totalSteps,
        coherenceScore,
      },
    };
  } catch (error) {
    console.error('Erreur génération sectionnelle:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      title,
      description,
      content,
      category: options.category,
      tags,
      faq,
      imagePrompt,
      generationMetadata: {
        outline,
        sectionsGenerated,
        totalSections: lengthConfig.sections,
        stepsCompleted: currentStep,
        totalSteps,
        coherenceScore,
      },
    };
  }
}
