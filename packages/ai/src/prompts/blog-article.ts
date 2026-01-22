/**
 * Blog article generation prompt templates
 * @package @kairn/ai
 */

import type { ArticleTone, ArticleLength, ArticleCategory } from '../services/types.js';

// ============================================
// Prompt Configuration Types
// ============================================

export interface ArticlePromptConfig {
  topic: string;
  category?: ArticleCategory;
  length?: ArticleLength;
  tone?: ArticleTone;
  tones?: ArticleTone[];
  keywords?: string[];
  targetAudience?: string;
  seoQuery?: string;
  searchIntent?: string;
  language?: 'fr' | 'en';
  customSystemPrompt?: string;
}

// ============================================
// Length Configuration
// ============================================

export const LENGTH_CONFIG = {
  short: {
    wordRange: '800-1000',
    maxTokens: 6000,
    sectionCount: '3-4',
  },
  medium: {
    wordRange: '1000-1500',
    maxTokens: 10000,
    sectionCount: '4-6',
  },
  long: {
    wordRange: '1500-2000',
    maxTokens: 16000,
    sectionCount: '6-8',
  },
} as const;

// ============================================
// Tone Descriptions
// ============================================

export const TONE_DESCRIPTIONS: Record<ArticleTone, string> = {
  professional: 'Formel, expert, basé sur des faits',
  casual: 'Décontracté, conversationnel, accessible',
  educational: 'Pédagogique, explicatif, didactique',
  inspirational: 'Motivant, encourageant, positif',
  analytical: 'Analytique, logique, structuré',
  poetic: 'Poétique, évocateur, imagé',
  introspective: 'Introspectif, réflexif, contemplatif',
  narrative: 'Narratif, storytelling, engageant',
  conversational: 'Dialogue, questions-réponses, interactif',
  provocative: 'Provocateur, questionnant, challengeant',
  humorous: 'Humoristique, léger, divertissant',
  scientific: 'Scientifique, rigoureux, sourcé',
  practical: 'Pratique, actionnable, concret',
};

// ============================================
// Default System Prompt
// ============================================

export const DEFAULT_SYSTEM_PROMPT = `Tu es un rédacteur web senior spécialisé en SEO et en création de contenu de qualité.

Règles de rédaction :
1. Structure claire avec introduction, corps et conclusion
2. Utilise des sous-titres H2 et H3 pour organiser le contenu
3. Une idée par paragraphe de 3-4 lignes
4. Pas de retour à la ligne à l'intérieur des paragraphes
5. Utilise le gras (**texte**) pour les concepts clés
6. Utilise l'italique (*texte*) pour les nuances ou réflexions
7. Listes à puces pour les énumérations (3-5 éléments max)
8. Citations en blockquote: > « Citation » — Auteur
9. Pas de tableaux, pas de MAJUSCULES excessives
10. Capitalisation naturelle dans les titres (pas de Title Case)

Format de sortie attendu avec des balises XML:
<TITLE>Titre de l'article</TITLE>
<DESCRIPTION>Meta description SEO de 150-160 caractères</DESCRIPTION>
<CONTENT>
Contenu Markdown de l'article
</CONTENT>
<TAGS>tag1, tag2, tag3</TAGS>
<FAQ>
[{"question": "Question 1?", "answer": "Réponse 1"}, {"question": "Question 2?", "answer": "Réponse 2"}]
</FAQ>
<IMAGE_PROMPT>Description détaillée pour générer une image d'illustration</IMAGE_PROMPT>`;

// ============================================
// Prompt Builders
// ============================================

/**
 * Build the main article generation prompt
 */
export function buildArticlePrompt(config: ArticlePromptConfig): string {
  const {
    topic,
    category,
    length = 'medium',
    tone,
    tones,
    keywords,
    targetAudience,
    seoQuery,
    searchIntent,
    language = 'fr',
  } = config;

  const lengthConfig = LENGTH_CONFIG[length];
  const activeTones: ArticleTone[] = tones?.length ? tones : tone ? [tone] : ['professional'];

  const toneDescriptions = activeTones.map((t: ArticleTone) => TONE_DESCRIPTIONS[t]).join(', ');

  const parts: string[] = [
    `Rédige un article de blog complet sur le sujet suivant : "${topic}"`,
    '',
  ];

  // Specifications
  parts.push('Spécifications :');
  parts.push(`- Longueur : ${lengthConfig.wordRange} mots`);
  parts.push(`- Structure : ${lengthConfig.sectionCount} sections`);
  parts.push(`- Ton : ${toneDescriptions}`);
  parts.push(`- Langue : ${language === 'fr' ? 'Français' : 'Anglais'}`);

  if (category) {
    parts.push(`- Catégorie : ${category}`);
  }

  if (keywords?.length) {
    parts.push(`- Mots-clés SEO à intégrer naturellement : ${keywords.join(', ')}`);
  }

  if (seoQuery) {
    parts.push(`- Requête SEO cible : "${seoQuery}"`);
  }

  if (searchIntent) {
    parts.push(`- Intention de recherche : ${searchIntent}`);
  }

  if (targetAudience) {
    parts.push(`- Public cible : ${targetAudience}`);
  }

  parts.push('');
  parts.push(
    "Génère l'article complet avec tous les éléments demandés dans le format XML spécifié."
  );

  return parts.join('\n');
}

/**
 * Build prompt for outline generation
 */
export function buildOutlinePrompt(config: ArticlePromptConfig): string {
  const { topic, category, length = 'medium', keywords } = config;
  const lengthConfig = LENGTH_CONFIG[length];

  return `Crée un plan détaillé pour un article sur : "${topic}"

${category ? `Catégorie : ${category}` : ''}
${keywords?.length ? `Mots-clés à couvrir : ${keywords.join(', ')}` : ''}

Le plan doit contenir ${lengthConfig.sectionCount} sections.

Format de sortie JSON :
{
  "title": "Titre proposé pour l'article",
  "sections": [
    {
      "heading": "Titre de la section",
      "level": 2,
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "subsections": [
        {
          "heading": "Sous-titre",
          "level": 3,
          "keyPoints": ["Point 1", "Point 2"]
        }
      ]
    }
  ],
  "introduction": "Bref résumé de l'introduction",
  "conclusion": "Bref résumé de la conclusion"
}`;
}

/**
 * Build prompt for section generation
 */
export function buildSectionPrompt(
  sectionTitle: string,
  keyPoints: string[],
  context: {
    articleTopic: string;
    previousSections?: string[];
    tone?: ArticleTone;
  }
): string {
  const { articleTopic, previousSections, tone = 'professional' } = context;

  return `Rédige la section suivante d'un article sur "${articleTopic}":

## ${sectionTitle}

Points clés à développer :
${keyPoints.map(p => `- ${p}`).join('\n')}

Ton : ${TONE_DESCRIPTIONS[tone]}

${
  previousSections?.length
    ? `Sections précédentes pour contexte :\n${previousSections.join('\n\n')}`
    : ''
}

Règles :
- Une idée par paragraphe
- 150-300 mots pour cette section
- Transitions fluides avec le contenu précédent
- Utilise le Markdown (gras, italique, listes si pertinent)

Génère uniquement le contenu de cette section, sans le titre H2.`;
}

/**
 * Build prompt for FAQ generation
 */
export function buildFaqPrompt(articleContent: string, topic: string, count: number = 5): string {
  return `À partir de l'article suivant sur "${topic}", génère ${count} questions fréquemment posées avec leurs réponses.

Article :
${articleContent}

Règles :
- Questions que les lecteurs pourraient se poser
- Réponses concises (2-3 phrases)
- Questions variées couvrant différents aspects
- Format naturel et conversationnel

Format JSON attendu :
[
  {"question": "Question 1?", "answer": "Réponse 1"},
  {"question": "Question 2?", "answer": "Réponse 2"}
]`;
}

/**
 * Build prompt for meta description generation
 */
export function buildMetaDescriptionPrompt(
  articleTitle: string,
  articleContent: string,
  seoQuery?: string
): string {
  return `Génère une meta description SEO pour cet article :

Titre : ${articleTitle}
${seoQuery ? `Requête SEO cible : ${seoQuery}` : ''}

Contenu (extrait) :
${articleContent.slice(0, 1000)}...

Règles :
- 150-160 caractères maximum
- Inclure le mot-clé principal naturellement
- Donner envie de cliquer
- Résumer la valeur apportée au lecteur

Réponds uniquement avec la meta description, sans guillemets ni explications.`;
}

/**
 * Build prompt for tags extraction
 */
export function buildTagsPrompt(articleContent: string, existingTags?: string[]): string {
  return `Extrais 5-10 tags SEO pertinents pour cet article :

${articleContent.slice(0, 2000)}...

${existingTags?.length ? `Tags existants dans le système : ${existingTags.join(', ')}` : ''}

Règles :
- Tags courts (1-3 mots)
- Mélange de tags génériques et spécifiques
- Pertinents pour le SEO
- En minuscules, séparés par des virgules

Réponds uniquement avec les tags séparés par des virgules, sans explications.`;
}
