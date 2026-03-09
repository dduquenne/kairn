/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Constructeur de prompts pour la génération de contenu social
 *
 * Construit des prompts optimisés pour Claude API en fonction de:
 * - L'article source
 * - La plateforme cible
 * - Le ton et l'angle choisis
 * - Les instructions personnalisées
 */

import type {
  SocialPlatform,
  ContentTone,
  ContentAngle,
  InstagramPostFormat,
  AuthenticityLevel,
  ThreadsPostFormat,
  ThreadsAuthenticityLevel,
  FacebookPostFormat,
  FacebookToneLevel,
  LinkedInPostFormat,
  LinkedInExpertiseLevel,
} from '../types';

import {
  FACEBOOK_FORMATS,
  FACEBOOK_CTA_TEMPLATES,
  FACEBOOK_EMOJI_STRATEGY,
  FACEBOOK_EMOJIS_TO_AVOID,
  FACEBOOK_TONE_LEVELS,
  suggestFacebookFormat,
  getFacebookHookPatternsForTone,
  generateFacebookHashtags,
  suggestFacebookToneLevel,
} from './facebook-specs';
import {
  INSTAGRAM_FORMATS,
  INSTAGRAM_CTA_TEMPLATES,
  INSTAGRAM_EMOJI_STRATEGY,
  INSTAGRAM_EMOJIS_TO_AVOID,
  AUTHENTICITY_LEVELS,
  suggestInstagramFormat,
  getHookPatternsForTone,
  generateBalancedHashtags,
} from './instagram-specs';
import {
  LINKEDIN_FORMATS,
  LINKEDIN_CTA_TEMPLATES,
  LINKEDIN_EMOJI_STRATEGY,
  LINKEDIN_EMOJIS_TO_AVOID,
  LINKEDIN_EXPERTISE_LEVELS,
  LINKEDIN_RULES,
  suggestLinkedInFormat,
  getLinkedInHookPatternsForTone,
  generateLinkedInHashtags,
  suggestLinkedInExpertiseLevel,
} from './linkedin-specs';
import { PLATFORM_GENERATION_SPECS, CONTENT_TONES, CONTENT_ANGLES } from './platform-specs';
import {
  THREADS_FORMATS,
  THREADS_AUTHENTICITY_LEVELS,
  THREADS_RULES,
  suggestThreadsFormat,
  getThreadsHookPatternsForTone,
  suggestThreadsAuthenticityLevel,
} from './threads-specs';

// ===========================================
// Types
// ===========================================

export interface BlogArticleInput {
  slug: string;
  title: string;
  description: string;
  category: string;
  content: string;
  tags?: string[];
  author?: string;
  imageUrl?: string;
}

export interface GenerationPromptOptions {
  tone: ContentTone;
  angle: ContentAngle;
  customInstructions?: string;
  templateOverride?: string;
  // Options spécifiques Instagram
  instagramFormat?: InstagramPostFormat;
  authenticityLevel?: AuthenticityLevel;
  // Options spécifiques Threads
  threadsFormat?: ThreadsPostFormat;
  threadsAuthenticityLevel?: ThreadsAuthenticityLevel;
  // Options spécifiques Facebook
  facebookFormat?: FacebookPostFormat;
  facebookToneLevel?: FacebookToneLevel;
  // Options spécifiques LinkedIn
  linkedinFormat?: LinkedInPostFormat;
  linkedinExpertiseLevel?: LinkedInExpertiseLevel;
}

export interface GeneratedPrompt {
  systemPrompt: string;
  userPrompt: string;
}

// ===========================================
// Helpers
// ===========================================

/** URL du site (production) */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://appreciezvotrevie.fr';

/**
 * Mapping plateforme → utm_source
 */
const PLATFORM_UTM_SOURCE: Record<SocialPlatform, string> = {
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
  THREADS: 'threads',
};

/**
 * Construit l'URL d'un article avec les paramètres UTM pour une plateforme donnée
 */
function buildArticleLinkWithUtm(slug: string, platform: SocialPlatform): string {
  const source = PLATFORM_UTM_SOURCE[platform];
  return `${SITE_URL}/blog/${slug}?utm_source=${source}&utm_medium=social&utm_content=blog`;
}

/**
 * Construit la section de contexte image + lien pour les prompts
 */
function buildMediaAndLinkContext(article: BlogArticleInput, platform: SocialPlatform): string {
  const articleLink = buildArticleLinkWithUtm(article.slug, platform);
  const hasImage = Boolean(article.imageUrl);

  const lines: string[] = [
    '═══════════════════════════════════════════',
    "IMAGE ET LIEN DE L'ARTICLE",
    '═══════════════════════════════════════════',
    '',
  ];

  if (hasImage) {
    lines.push(
      `Une image est associée à cet article et sera AUTOMATIQUEMENT attachée au post.`,
      `URL de l'image : ${article.imageUrl}`,
      `Rédige ton contenu en tenant compte qu'une image accompagnera le post (ne décris pas l'image).`,
      ''
    );
  }

  lines.push(`Lien vers l'article : ${articleLink}`);

  return lines.join('\n');
}

// ===========================================
// Contexte Appréciez Votre Vie
// ===========================================

const AVV_CONTEXT = `Tu es un expert en communication digitale pour un cabinet de sophrologie.

CONTEXTE DU CABINET:
- Nom: Appréciez Votre Vie - Sophrologie, Somatothérapie & Breathwork & Rebirth
- Praticien: Nathalie Duquenne, sophrologue certifié
- Localisation: Saint-Julien-du-Sault, Yonne (89), France
- Spécialités: Somatothérapie, Breathwork & rebirth, Sophrologie et Relaxation, Soins énergétiques
- Public: Adultes en quête de bien-être, développement personnel et accompagnement thérapeutique
- Site web: https://appreciezvotrevie.fr

IDENTITÉ DE MARQUE:
- Ton général: Mystérieux mais rassurant, professionnel mais accessible
- Valeurs: Authenticité, bienveillance, expertise, accompagnement personnalisé
- Positionnement: Praticien expérimenté, approche holistique, ancrage local

CONTRAINTES DÉONTOLOGIQUES:
- Ne jamais faire de promesses thérapeutiques absolues ou garanties de résultats
- Éviter le vocabulaire médical réservé (diagnostic, guérison, traitement)
- Rester dans le cadre de la sophrologie et des pratiques complémentaires
- Respecter la confidentialité et la dignité des personnes
- Ne pas dénigrer les autres approches thérapeutiques`;

// ===========================================
// Fonctions de construction
// ===========================================

/**
 * Construit le prompt système (contexte global)
 */
export function buildSystemPrompt(): string {
  return `${AVV_CONTEXT}

MISSION:
Tu vas générer du contenu pour les réseaux sociaux de Appréciez Votre Vie à partir d'articles de blog.
Ton objectif est de créer des posts engageants qui:
1. Attirent l'attention dès la première ligne
2. Suscitent l'envie de lire l'article complet
3. Génèrent de l'engagement (likes, commentaires, partages, sauvegardes)
4. Renforcent l'image de marque Appréciez Votre Vie
5. Respectent les codes et bonnes pratiques de chaque plateforme

Tu dois toujours fournir une réponse structurée avec:
- Le contenu du post adapté à la plateforme
- Les hashtags recommandés (séparés)

Réponds UNIQUEMENT avec le format JSON demandé, sans texte avant ou après.`;
}

/**
 * Construit le prompt Instagram avancé avec les spécifications natives
 */
function buildInstagramPrompt(article: BlogArticleInput, options: GenerationPromptOptions): string {
  const toneSpec = CONTENT_TONES[options.tone];
  const angleSpec = CONTENT_ANGLES[options.angle];

  // Déterminer le format Instagram à utiliser
  const format = options.instagramFormat || suggestInstagramFormat(options.tone, options.angle);
  const formatSpec = INSTAGRAM_FORMATS[format];

  // Déterminer le niveau d'authenticité
  const authenticityLevel = options.authenticityLevel || 3;
  const authenticitySpec = AUTHENTICITY_LEVELS[authenticityLevel];

  // Obtenir les patterns d'accroche pour le ton choisi
  const hookPatterns = getHookPatternsForTone(options.tone);

  // Générer des hashtags suggérés basés sur la catégorie de l'article
  const suggestedHashtags = generateBalancedHashtags(article.category, 10);

  // Résumé de l'article
  const contentSummary =
    article.content.length > 3000 ? article.content.substring(0, 3000) + '...' : article.content;

  // Construire les sections du prompt
  const hookPatternsSection = hookPatterns
    .slice(0, 3)
    .map(h => `• ${h.name}: "${h.pattern}"\n  Exemples: ${h.examples.slice(0, 2).join(' | ')}`)
    .join('\n');

  const ctaSection = INSTAGRAM_CTA_TEMPLATES.map(
    cta => `• ${cta.category}: ${cta.templates.slice(0, 2).join(' | ')}`
  ).join('\n');

  const emojiSection = INSTAGRAM_EMOJI_STRATEGY.slice(0, 4)
    .map(e => `• ${e.category}: ${e.emojis.join(' ')} - ${e.usage}`)
    .join('\n');

  const mediaAndLinkContext = buildMediaAndLinkContext(article, 'INSTAGRAM');
  const articleLink = buildArticleLinkWithUtm(article.slug, 'INSTAGRAM');

  return `Génère un post Instagram NATIF et ENGAGEANT pour l'article suivant.

═══════════════════════════════════════════
ARTICLE SOURCE
═══════════════════════════════════════════

Titre: ${article.title}
Description: ${article.description}
Catégorie: ${article.category}
${article.tags?.length ? `Tags: ${article.tags.join(', ')}` : ''}

Contenu:
${contentSummary}

${mediaAndLinkContext}
Sur Instagram, les liens ne sont pas cliquables dans les légendes.
Mentionne "lien en bio" pour rediriger vers : ${articleLink}

═══════════════════════════════════════════
FORMAT DE POST INSTAGRAM
═══════════════════════════════════════════

Tu dois utiliser le format "${formatSpec.name}" :
${formatSpec.description}

Structure à suivre :
${formatSpec.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Exemple de ce format :
---
${formatSpec.example}
---

Ce format est idéal pour : ${formatSpec.bestFor.join(', ')}

Conseils pour ce format :
${formatSpec.tips.map(t => `• ${t}`).join('\n')}

═══════════════════════════════════════════
PATTERNS D'ACCROCHE (Première ligne)
═══════════════════════════════════════════

La première ligne est CRUCIALE (visible avant "...plus").
Utilise un de ces patterns éprouvés :

${hookPatternsSection}

IMPORTANT: La première ligne doit faire max 125 caractères et créer un "arrêt" mental.

═══════════════════════════════════════════
APPELS À L'ACTION (CTA)
═══════════════════════════════════════════

Varie les CTA, ne répète pas toujours "sauvegardez" :

${ctaSection}

Choisis un CTA qui correspond au type d'engagement souhaité.

═══════════════════════════════════════════
STRATÉGIE ÉMOJIS
═══════════════════════════════════════════

Utilise les émojis de manière STRATÉGIQUE, pas décorative :

${emojiSection}

À ÉVITER : ${INSTAGRAM_EMOJIS_TO_AVOID.join(' ')} (trop familiers ou corporate)

═══════════════════════════════════════════
NIVEAU D'AUTHENTICITÉ : ${authenticitySpec.level}/5 - ${authenticitySpec.name}
═══════════════════════════════════════════

${authenticitySpec.description}

Caractéristiques :
${authenticitySpec.characteristics.map(c => `• ${c}`).join('\n')}

Exemple d'ouverture pour ce niveau :
"${authenticitySpec.exampleOpening}"

═══════════════════════════════════════════
PARAMÈTRES DE GÉNÉRATION
═══════════════════════════════════════════

Ton : ${toneSpec.name} - ${toneSpec.promptInstructions}
Angle : ${angleSpec.name} - ${angleSpec.promptInstructions}

${options.customInstructions ? `Instructions personnalisées : ${options.customInstructions}` : ''}

═══════════════════════════════════════════
STRATÉGIE HASHTAGS (3 tiers)
═══════════════════════════════════════════

Utilise une stratégie de hashtags en 3 tiers :
• 3-4 hashtags NICHE (100K-500K posts) : ciblage précis
• 3-4 hashtags MEDIUM (1M-5M posts) : visibilité équilibrée
• 2-3 hashtags LARGE (5M+ posts) : découvrabilité

Hashtags suggérés pour cet article :
${suggestedHashtags.map(h => `#${h}`).join(' ')}

Tu peux les utiliser ou en proposer de plus pertinents.

═══════════════════════════════════════════
RÈGLES INSTAGRAM ESSENTIELLES
═══════════════════════════════════════════

✅ À FAIRE :
• Sauts de ligne fréquents pour aérer
• Première ligne < 125 caractères
• Séparateur visuel avant hashtags (3 points sur lignes séparées)
• Mentionner "lien en bio" si pertinent
• Créer de l'émotion et de la connexion

❌ À ÉVITER :
• Texte en bloc sans aération
• Liens dans le texte (non cliquables)
• Ton trop corporate ou distant
• Plus de 15 hashtags
• Émojis en excès ou mal placés

═══════════════════════════════════════════
FORMAT DE RÉPONSE
═══════════════════════════════════════════

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :

{
  "content": "Le contenu du post (avec \\n pour les sauts de ligne)",
  "hashtags": ["hashtag1", "hashtag2", "..."],
  "suggestedMediaAlt": "Description alternative pour l'image",
  "formatUsed": "${format}",
  "hookPatternUsed": "nom du pattern utilisé"
}`;
}

/**
 * Construit le prompt Threads optimisé pour des posts courts et authentiques
 * Utilise les formats natifs Threads pour une meilleure adaptation à la culture de la plateforme
 */
function buildThreadsPrompt(article: BlogArticleInput, options: GenerationPromptOptions): string {
  const toneSpec = CONTENT_TONES[options.tone];
  const angleSpec = CONTENT_ANGLES[options.angle];

  // Déterminer le format Threads à utiliser
  const format = options.threadsFormat || suggestThreadsFormat(options.tone, options.angle);
  const formatSpec = THREADS_FORMATS[format];

  // Déterminer le niveau d'authenticité
  const authenticityLevel =
    options.threadsAuthenticityLevel || suggestThreadsAuthenticityLevel(options.tone);
  const authenticitySpec = THREADS_AUTHENTICITY_LEVELS[authenticityLevel];

  // Obtenir les patterns d'accroche pour le ton choisi
  const hookPatterns = getThreadsHookPatternsForTone(options.tone);

  // Résumé court de l'article (Threads n'a pas besoin de tout le contenu)
  const contentSummary =
    article.content.length > 1500 ? article.content.substring(0, 1500) + '...' : article.content;

  // Construire les sections du prompt
  const hookPatternsSection = hookPatterns
    .slice(0, 3)
    .map(h => `• ${h.name}: "${h.pattern}"\n  Exemples: ${h.examples.slice(0, 2).join(' | ')}`)
    .join('\n');

  const mediaAndLinkContext = buildMediaAndLinkContext(article, 'THREADS');
  const articleLink = buildArticleLinkWithUtm(article.slug, 'THREADS');

  return `Génère un post Threads AUTHENTIQUE et COURT pour partager cet article.

═══════════════════════════════════════════
RÈGLE CRITIQUE : LIMITE DE CARACTÈRES
═══════════════════════════════════════════

⚠️ THREADS A UNE LIMITE DE 500 CARACTÈRES MAXIMUM ⚠️

Tu dois générer un post de ${THREADS_RULES.optimalLength} CARACTÈRES maximum (hors lien).
Le lien suivant sera ajouté automatiquement APRÈS ton contenu, ne l'inclus PAS dans le texte :
${articleLink}

Compte les caractères ! Un post Threads réussi = UNE pensée courte et percutante.

${mediaAndLinkContext}

═══════════════════════════════════════════
ARTICLE SOURCE
═══════════════════════════════════════════

Titre: ${article.title}
Description: ${article.description}
Catégorie: ${article.category}
${article.tags?.length ? `Tags: ${article.tags.join(', ')}` : ''}

Résumé du contenu:
${contentSummary}

═══════════════════════════════════════════
FORMAT DE POST THREADS
═══════════════════════════════════════════

Tu dois utiliser le format "${formatSpec.name}" :
${formatSpec.description}

Structure à suivre :
${formatSpec.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Exemples de ce format :
${formatSpec.examples.map(ex => `---\n${ex}\n---`).join('\n')}

Ce format est idéal pour : ${formatSpec.bestFor.join(', ')}

Conseils pour ce format :
${formatSpec.tips.map(t => `• ${t}`).join('\n')}

LONGUEUR MAX POUR CE FORMAT : ${formatSpec.maxLength} caractères

═══════════════════════════════════════════
PATTERNS D'ACCROCHE
═══════════════════════════════════════════

Utilise un de ces patterns éprouvés pour Threads :

${hookPatternsSection}

═══════════════════════════════════════════
NIVEAU D'AUTHENTICITÉ : ${authenticitySpec.level}/5 - ${authenticitySpec.name}
═══════════════════════════════════════════

${authenticitySpec.description}

Caractéristiques :
${authenticitySpec.characteristics.map(c => `• ${c}`).join('\n')}

Exemple d'ouverture pour ce niveau :
"${authenticitySpec.exampleOpening}"

Formats recommandés pour ce niveau : ${authenticitySpec.recommendedFormats.join(', ')}

═══════════════════════════════════════════
PARAMÈTRES DE GÉNÉRATION
═══════════════════════════════════════════

Ton : ${toneSpec.name} - ${toneSpec.promptInstructions}
Angle : ${angleSpec.name} - ${angleSpec.promptInstructions}

${options.customInstructions ? `Instructions personnalisées : ${options.customInstructions}` : ''}

═══════════════════════════════════════════
RÈGLES THREADS (CRITIQUES)
═══════════════════════════════════════════

✅ À FAIRE :
${THREADS_RULES.tone.do.map(d => `• ${d}`).join('\n')}

❌ À ÉVITER ABSOLUMENT :
${THREADS_RULES.tone.avoid.map(a => `• ${a}`).join('\n')}

HASHTAGS : ${THREADS_RULES.hashtagStyle}
ÉMOJIS : ${THREADS_RULES.formatting.emojis}
LIENS : ${THREADS_RULES.formatting.links}

═══════════════════════════════════════════
COMPARAISON AVEC AUTRES PLATEFORMES
═══════════════════════════════════════════

THREADS ≠ INSTAGRAM :
- Instagram = structuré, hashtags, CTA explicites
- Threads = spontané, sans hashtags, conversation naturelle

THREADS ≠ LINKEDIN :
- LinkedIn = professionnel, développé, expertise
- Threads = personnel, bref, humanité

THREADS ≠ FACEBOOK :
- Facebook = informatif, liens directs, engagement classique
- Threads = pensée à voix haute, brut, connexion émotionnelle

═══════════════════════════════════════════
FORMAT DE RÉPONSE
═══════════════════════════════════════════

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :

{
  "content": "Le contenu COURT du post (max ${formatSpec.maxLength} caractères, sans lien)",
  "hashtags": [],
  "suggestedMediaAlt": "Description si une image est suggérée",
  "formatUsed": "${format}",
  "hookPatternUsed": "nom du pattern utilisé"
}

RAPPEL FINAL :
- Le post DOIT faire moins de ${formatSpec.maxLength} caractères
- PAS de lien dans content (ajouté automatiquement après)
- PAS de hashtags (ou 1 max vraiment pertinent)
- PAS d'appel à l'action explicite
- Écris comme tu PENSES, pas comme tu VENDRAIS`;
}

/**
 * Construit le prompt Facebook avancé avec les spécifications natives
 */
function buildFacebookPrompt(article: BlogArticleInput, options: GenerationPromptOptions): string {
  const toneSpec = CONTENT_TONES[options.tone];
  const angleSpec = CONTENT_ANGLES[options.angle];

  // Déterminer le format Facebook à utiliser
  const format = options.facebookFormat || suggestFacebookFormat(options.tone, options.angle);
  const formatSpec = FACEBOOK_FORMATS[format];

  // Déterminer le niveau de ton Facebook
  const toneLevel = options.facebookToneLevel || suggestFacebookToneLevel(article.category);
  const toneLevelSpec = FACEBOOK_TONE_LEVELS[toneLevel];

  // Obtenir les patterns d'accroche pour le ton choisi
  const hookPatterns = getFacebookHookPatternsForTone(options.tone);

  // Générer des hashtags suggérés
  const suggestedHashtags = generateFacebookHashtags(article.category, 2);

  // Résumé de l'article
  const contentSummary =
    article.content.length > 3000 ? article.content.substring(0, 3000) + '...' : article.content;

  // Construire les sections du prompt
  const hookPatternsSection = hookPatterns
    .slice(0, 4)
    .map(h => `• ${h.name}: "${h.pattern}"\n  Exemples: ${h.examples.slice(0, 2).join(' | ')}`)
    .join('\n');

  const ctaCommentSection = FACEBOOK_CTA_TEMPLATES.filter(c => c.category === 'commentaire')
    .map(c => c.templates.slice(0, 3).join(' | '))
    .join('\n');

  const emojiSection = FACEBOOK_EMOJI_STRATEGY.slice(0, 3)
    .map(e => `• ${e.category}: ${e.emojis.join(' ')} - ${e.usage}`)
    .join('\n');

  const mediaAndLinkContext = buildMediaAndLinkContext(article, 'FACEBOOK');
  const articleLink = buildArticleLinkWithUtm(article.slug, 'FACEBOOK');

  return `Génère un post Facebook NATIF et ENGAGEANT pour l'article suivant.

═══════════════════════════════════════════
ARTICLE SOURCE
═══════════════════════════════════════════

Titre: ${article.title}
Description: ${article.description}
Catégorie: ${article.category}
${article.tags?.length ? `Tags: ${article.tags.join(', ')}` : ''}

Contenu:
${contentSummary}

${mediaAndLinkContext}
Le lien suivant sera attaché automatiquement au post Facebook (aperçu avec image) :
${articleLink}
NE PAS inclure ce lien dans le texte du post — il sera ajouté comme lien de partage.

═══════════════════════════════════════════
FORMAT DE POST FACEBOOK : "${formatSpec.name}"
═══════════════════════════════════════════

${formatSpec.description}

Structure à suivre :
${formatSpec.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Longueur optimale : ${formatSpec.optimalLength.min}-${formatSpec.optimalLength.max} mots

Exemple de ce format :
---
${formatSpec.example}
---

Ce format est idéal pour : ${formatSpec.bestFor.join(', ')}

Conseils pour ce format :
${formatSpec.tips.map(t => `• ${t}`).join('\n')}

═══════════════════════════════════════════
NIVEAU DE TON : ${toneLevelSpec.level} - ${toneLevelSpec.name}
═══════════════════════════════════════════

${toneLevelSpec.description}

Caractéristiques :
${toneLevelSpec.characteristics.map(c => `• ${c}`).join('\n')}

Exemple d'ouverture pour ce niveau :
"${toneLevelSpec.exampleOpening}"

═══════════════════════════════════════════
PATTERNS D'ACCROCHE (Première ligne)
═══════════════════════════════════════════

La première ligne est CRUCIALE sur Facebook. Elle doit créer un "arrêt du scroll".
Utilise un de ces patterns éprouvés :

${hookPatternsSection}

IMPORTANT: L'accroche doit être percutante ET authentique. Pas de clickbait.

═══════════════════════════════════════════
APPELS À L'ACTION (CTA)
═══════════════════════════════════════════

Facebook privilégie les posts qui génèrent des commentaires.
Termine par une question d'engagement :

${ctaCommentSection}

Note: Le lien vers l'article sera ajouté automatiquement après ton contenu. Ne l'inclus pas.

═══════════════════════════════════════════
STRATÉGIE ÉMOJIS FACEBOOK
═══════════════════════════════════════════

Sur Facebook, moins d'émojis qu'Instagram. Usage STRATÉGIQUE uniquement :

${emojiSection}

À ÉVITER : ${FACEBOOK_EMOJIS_TO_AVOID.join(' ')} (trop marketing ou inappropriés)

═══════════════════════════════════════════
PARAMÈTRES DE GÉNÉRATION
═══════════════════════════════════════════

Ton demandé : ${toneSpec.name} - ${toneSpec.promptInstructions}
Angle demandé : ${angleSpec.name} - ${angleSpec.promptInstructions}

${options.customInstructions ? `Instructions personnalisées : ${options.customInstructions}` : ''}

═══════════════════════════════════════════
RÈGLES FACEBOOK ESSENTIELLES
═══════════════════════════════════════════

✅ À FAIRE :
• Commencer par une accroche émotionnelle ou une question
• Utiliser des sauts de ligne pour aérer (pas de blocs de texte)
• Terminer par une question qui invite aux commentaires
• Être authentique et personnel (pas de ton corporate)
• Maximum 2-3 hashtags, discrets en fin de post

❌ À ÉVITER :
• Texte trop long (max 150 mots idéalement)
• Ton trop professionnel ou distant
• Promesses thérapeutiques ou résultats garantis
• Trop d'émojis (Facebook n'est pas Instagram)
• Posts qui ressemblent à des publicités
• Clickbait ou titres sensationnalistes
• NE PAS inclure de lien/URL dans le contenu (le lien sera ajouté automatiquement)

═══════════════════════════════════════════
CONTRAINTES DÉONTOLOGIQUES
═══════════════════════════════════════════

• Ne jamais promettre de résultats thérapeutiques
• Éviter le vocabulaire médical réservé (diagnostic, guérison, traitement)
• Rester humble : "ouvre un espace", "permet d'explorer", pas "guérit"
• Anonymiser totalement toute référence à des patients

═══════════════════════════════════════════
FORMAT DE RÉPONSE
═══════════════════════════════════════════

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :

{
  "content": "Le contenu du post Facebook (avec \\n pour les sauts de ligne). NE PAS inclure de lien - il sera ajouté automatiquement.",
  "hashtags": ["${suggestedHashtags[0] || 'somatothérapie'}", "${suggestedHashtags[1] || 'bienetre'}"],
  "suggestedMediaAlt": "Description alternative pour l'image si une est utilisée",
  "formatUsed": "${format}",
  "hookPatternUsed": "nom du pattern utilisé"
}

RAPPEL: Le post doit faire ${formatSpec.optimalLength.min}-${formatSpec.optimalLength.max} mots, être authentique et engageant.
IMPORTANT: NE PAS inclure de lien/URL dans le contenu - le lien vers l'article sera ajouté automatiquement avec les paramètres de tracking.`;
}

/**
 * Construit le prompt LinkedIn avancé avec les spécifications natives
 * Optimisé pour l'engagement professionnel et le positionnement d'expertise
 */
function buildLinkedInPrompt(article: BlogArticleInput, options: GenerationPromptOptions): string {
  const toneSpec = CONTENT_TONES[options.tone];
  const angleSpec = CONTENT_ANGLES[options.angle];

  // Déterminer le format LinkedIn à utiliser
  const format = options.linkedinFormat || suggestLinkedInFormat(options.tone, options.angle);
  const formatSpec = LINKEDIN_FORMATS[format];

  // Déterminer le niveau d'expertise
  const expertiseLevel =
    options.linkedinExpertiseLevel || suggestLinkedInExpertiseLevel(article.category);
  const expertiseSpec = LINKEDIN_EXPERTISE_LEVELS[expertiseLevel];

  // Obtenir les patterns d'accroche pour le ton choisi
  const hookPatterns = getLinkedInHookPatternsForTone(options.tone);

  // Générer des hashtags suggérés selon la stratégie 3 tiers
  const suggestedHashtags = generateLinkedInHashtags(article.category, 4);

  // Résumé de l'article
  const contentSummary =
    article.content.length > 3000 ? article.content.substring(0, 3000) + '...' : article.content;

  // Construire les sections du prompt
  const hookPatternsSection = hookPatterns
    .slice(0, 4)
    .map(h => `• ${h.name}: "${h.pattern}"\n  Exemples: ${h.examples.slice(0, 2).join(' | ')}`)
    .join('\n');

  const ctaCommentSection = LINKEDIN_CTA_TEMPLATES.filter(c => c.category === 'commentaire')
    .map(c => c.templates.slice(0, 3).join(' | '))
    .join('\n');

  const ctaLienSection = LINKEDIN_CTA_TEMPLATES.filter(c => c.category === 'lien')
    .map(c => c.templates.slice(0, 3).join(' | '))
    .join('\n');

  const emojiSection = LINKEDIN_EMOJI_STRATEGY.slice(0, 3)
    .map(e => `• ${e.category}: ${e.emojis.join(' ')} - ${e.usage}`)
    .join('\n');

  const mediaAndLinkContext = buildMediaAndLinkContext(article, 'LINKEDIN');
  const articleLink = buildArticleLinkWithUtm(article.slug, 'LINKEDIN');

  return `Génère un post LinkedIn PROFESSIONNEL et ENGAGEANT pour l'article suivant.

═══════════════════════════════════════════
ARTICLE SOURCE
═══════════════════════════════════════════

Titre: ${article.title}
Description: ${article.description}
Catégorie: ${article.category}
${article.tags?.length ? `Tags: ${article.tags.join(', ')}` : ''}

Contenu:
${contentSummary}

${mediaAndLinkContext}
Le lien vers l'article sera placé en commentaire (bonne pratique LinkedIn).
Mentionne dans le post que le lien complet est en commentaire.
Lien : ${articleLink}

═══════════════════════════════════════════
FORMAT DE POST LINKEDIN : "${formatSpec.name}"
═══════════════════════════════════════════

${formatSpec.description}

Structure à suivre :
${formatSpec.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Longueur optimale : ${formatSpec.optimalLength.min}-${formatSpec.optimalLength.max} mots

Exemple de ce format :
---
${formatSpec.example}
---

Ce format est idéal pour : ${formatSpec.bestFor.join(', ')}

Conseils pour ce format :
${formatSpec.tips.map(t => `• ${t}`).join('\n')}

═══════════════════════════════════════════
NIVEAU D'EXPERTISE : ${expertiseSpec.level}/5 - ${expertiseSpec.name}
═══════════════════════════════════════════

${expertiseSpec.description}

Caractéristiques :
${expertiseSpec.characteristics.map(c => `• ${c}`).join('\n')}

Exemple d'ouverture pour ce niveau :
"${expertiseSpec.exampleOpening}"

Formats recommandés : ${expertiseSpec.recommendedFormats.join(', ')}

═══════════════════════════════════════════
PATTERNS D'ACCROCHE (Première ligne CRUCIALE)
═══════════════════════════════════════════

La première ligne détermine si le lecteur clique sur "voir plus".
Elle doit créer un ARRÊT dans le scroll.

Utilise un de ces patterns éprouvés sur LinkedIn :

${hookPatternsSection}

IMPORTANT: L'accroche doit être courte, percutante et créer de la curiosité.

═══════════════════════════════════════════
APPELS À L'ACTION (CTA)
═══════════════════════════════════════════

LinkedIn favorise les posts qui génèrent des COMMENTAIRES dans les 90 premières minutes.
Termine TOUJOURS par une question ouverte qui invite au partage d'expérience :

${ctaCommentSection}

Pour mentionner le lien (qui sera en commentaire) :
${ctaLienSection}

═══════════════════════════════════════════
FORMATAGE LINKEDIN NATIF
═══════════════════════════════════════════

✅ RÈGLES DE FORMATAGE ESSENTIELLES :
• Paragraphes ULTRA-COURTS : 1-3 lignes maximum
• Sauts de ligne généreux entre chaque idée
• Utiliser → pour les listes (pas de tirets classiques)
• Séparateur --- avant le CTA/mention du lien
• Émojis numérotés 1️⃣ 2️⃣ 3️⃣ pour les listes

Exemple de formatage correct :
---
Première idée courte.

Deuxième idée.
Développement bref.

→ Point 1
→ Point 2
→ Point 3

Conclusion percutante.

---
Lien en commentaire 👇
---

═══════════════════════════════════════════
STRATÉGIE ÉMOJIS LINKEDIN
═══════════════════════════════════════════

Sur LinkedIn, les émojis doivent être STRATÉGIQUES et PROFESSIONNELS :

${emojiSection}

À ÉVITER ABSOLUMENT : ${LINKEDIN_EMOJIS_TO_AVOID.join(' ')} (trop familiers ou "bro culture")

═══════════════════════════════════════════
STRATÉGIE HASHTAGS (3 TIERS)
═══════════════════════════════════════════

Utilise ${LINKEDIN_RULES.hashtagStrategy.optimal} hashtags en mélangeant :
• 1 hashtag NICHE : ciblage précis (ex: #somatothérapieericksonienne)
• 2 hashtags MEDIUM : visibilité équilibrée (ex: #gestiondustress)
• 1-2 hashtags LARGE : découvrabilité (ex: #bienetre, #santementale)

Hashtags suggérés pour cet article :
${suggestedHashtags.map(h => `#${h}`).join(' ')}

Placement : À la fin du post, après le séparateur

═══════════════════════════════════════════
PARAMÈTRES DE GÉNÉRATION
═══════════════════════════════════════════

Ton demandé : ${toneSpec.name} - ${toneSpec.promptInstructions}
Angle demandé : ${angleSpec.name} - ${angleSpec.promptInstructions}

${options.customInstructions ? `Instructions personnalisées : ${options.customInstructions}` : ''}

═══════════════════════════════════════════
RÈGLES LINKEDIN ESSENTIELLES
═══════════════════════════════════════════

✅ À FAIRE :
${LINKEDIN_RULES.tone.do.map(d => `• ${d}`).join('\n')}

❌ À ÉVITER :
${LINKEDIN_RULES.tone.avoid.map(a => `• ${a}`).join('\n')}

═══════════════════════════════════════════
CONTRAINTES DÉONTOLOGIQUES
═══════════════════════════════════════════

• Ne jamais promettre de résultats thérapeutiques
• Éviter le vocabulaire médical réservé (diagnostic, guérison, traitement)
• Rester humble : "ouvre un espace", "permet d'explorer", pas "guérit"
• Anonymiser totalement toute référence à des patients
• Positionnement expert MAIS accessible et bienveillant

═══════════════════════════════════════════
DIFFÉRENCIATION AVEC AUTRES PLATEFORMES
═══════════════════════════════════════════

LINKEDIN ≠ FACEBOOK :
- LinkedIn = expertise, observations de terrain, crédibilité professionnelle
- Facebook = plus personnel, émotionnel, conversationnel

LINKEDIN ≠ INSTAGRAM :
- LinkedIn = texte développé, pas de "lien en bio", hashtags discrets
- Instagram = visuel prioritaire, hashtags nombreux, structure légère

LINKEDIN ≠ THREADS :
- LinkedIn = structuré, développé, formatage soigné
- Threads = pensée brute, spontané, très court

═══════════════════════════════════════════
FORMAT DE RÉPONSE
═══════════════════════════════════════════

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :

{
  "content": "Le contenu du post LinkedIn (avec \\\\n pour les sauts de ligne). Mentionner que le lien est en commentaire.",
  "hashtags": ["${suggestedHashtags[0] || 'bienetre'}", "${suggestedHashtags[1] || 'santementale'}", "${suggestedHashtags[2] || 'psychotherapie'}", "${suggestedHashtags[3] || 'somatothérapie'}"],
  "suggestedMediaAlt": "Description alternative pour l'image si une est utilisée",
  "formatUsed": "${format}",
  "hookPatternUsed": "nom du pattern utilisé"
}

RAPPEL FINAL:
- Le post doit faire ${formatSpec.optimalLength.min}-${formatSpec.optimalLength.max} mots
- Paragraphes ULTRA-COURTS (1-3 lignes)
- Question d'engagement en fin de post
- Lien mentionné "en commentaire" (pas dans le contenu)
- ${LINKEDIN_RULES.hashtagStrategy.optimal} hashtags professionnels`;
}

/**
 * Construit le prompt utilisateur pour une plateforme spécifique
 */
export function buildUserPrompt(
  article: BlogArticleInput,
  platform: SocialPlatform,
  options: GenerationPromptOptions
): string {
  // Utiliser le prompt Instagram avancé si la plateforme est Instagram
  if (platform === 'INSTAGRAM') {
    return buildInstagramPrompt(article, options);
  }

  // Utiliser le prompt Threads optimisé pour des posts courts
  if (platform === 'THREADS') {
    return buildThreadsPrompt(article, options);
  }

  // Utiliser le prompt Facebook avancé pour des posts natifs et engageants
  if (platform === 'FACEBOOK') {
    return buildFacebookPrompt(article, options);
  }

  // Utiliser le prompt LinkedIn avancé pour des posts professionnels et engageants
  if (platform === 'LINKEDIN') {
    return buildLinkedInPrompt(article, options);
  }

  const spec = PLATFORM_GENERATION_SPECS[platform];
  const toneSpec = CONTENT_TONES[options.tone];
  const angleSpec = CONTENT_ANGLES[options.angle];

  // Résumé de l'article (limité pour ne pas surcharger le contexte)
  const contentSummary =
    article.content.length > 3000 ? article.content.substring(0, 3000) + '...' : article.content;

  const mediaAndLinkContext = buildMediaAndLinkContext(article, platform);
  const articleLink = buildArticleLinkWithUtm(article.slug, platform);

  const prompt = `Génère un post ${spec.name} pour l'article suivant.

═══════════════════════════════════════════
ARTICLE SOURCE
═══════════════════════════════════════════

Titre: ${article.title}
Description: ${article.description}
Catégorie: ${article.category}
${article.tags?.length ? `Tags: ${article.tags.join(', ')}` : ''}
${article.author ? `Auteur: ${article.author}` : ''}

Contenu:
${contentSummary}

${mediaAndLinkContext}
Lien vers l'article (à inclure dans le post si la plateforme le permet) : ${articleLink}

═══════════════════════════════════════════
SPÉCIFICATIONS ${spec.name.toUpperCase()}
═══════════════════════════════════════════

Longueur optimale: ${spec.optimalLength} mots (min: ${spec.minLength}, max: ${spec.maxLength})
Ton attendu: ${spec.tone}
Style: ${spec.style}

Structure recommandée:
${spec.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Hashtags: ${spec.optimalHashtags} hashtags (min: ${spec.minHashtags}, max: ${spec.maxHashtags})
Style hashtags: ${spec.hashtagStyle}

Lien: ${spec.linkPlacement === 'inline' ? 'Dans le post' : spec.linkPlacement === 'comment' ? "Mentionner qu'il sera en commentaire" : 'Mentionner "lien en bio"'}
Émojis: ${spec.emojiUsage === 'minimal' ? 'Peu ou pas' : spec.emojiUsage === 'moderate' ? 'Avec modération' : 'Librement'}

Conseils spécifiques:
${spec.tips.map(t => `• ${t}`).join('\n')}

À éviter:
${spec.avoid.map(a => `• ${a}`).join('\n')}

═══════════════════════════════════════════
PARAMÈTRES DE GÉNÉRATION
═══════════════════════════════════════════

Ton demandé: ${toneSpec.name} - ${toneSpec.description}
Instructions ton: ${toneSpec.promptInstructions}

Angle demandé: ${angleSpec.name} - ${angleSpec.description}
Instructions angle: ${angleSpec.promptInstructions}

${options.customInstructions ? `Instructions personnalisées: ${options.customInstructions}` : ''}

═══════════════════════════════════════════
FORMAT DE RÉPONSE ATTENDU
═══════════════════════════════════════════

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks):

{
  "content": "Le contenu du post ici (respecte les sauts de ligne avec \\n)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "suggestedMediaAlt": "Description alternative suggérée pour l'image si une est utilisée"
}`;

  return prompt;
}

/**
 * Construit un prompt pour générer plusieurs plateformes en une seule requête
 */
export function buildMultiPlatformPrompt(
  article: BlogArticleInput,
  platforms: SocialPlatform[],
  options: GenerationPromptOptions
): string {
  const toneSpec = CONTENT_TONES[options.tone];
  const angleSpec = CONTENT_ANGLES[options.angle];

  const contentSummary =
    article.content.length > 3000 ? article.content.substring(0, 3000) + '...' : article.content;

  const hasImage = Boolean(article.imageUrl);

  const platformSpecs = platforms
    .map(platform => {
      const spec = PLATFORM_GENERATION_SPECS[platform];
      const articleLink = buildArticleLinkWithUtm(article.slug, platform);

      // Threads utilise des caractères, pas des mots
      if (platform === 'THREADS') {
        return `
### THREADS
- ⚠️ LIMITE: 150-250 CARACTÈRES maximum (pas mots, CARACTÈRES !)
- Ton: ${spec.tone}
- Style: pensée courte et spontanée, comme un tweet
- Hashtags: 0-1 maximum (Threads n'aime pas les hashtags)
- Lien article (ajouté automatiquement après le texte) : ${articleLink}
- IMPORTANT: Une seule idée percutante, pas de développement`;
      }

      return `
### ${spec.name.toUpperCase()}
- Longueur: ${spec.optimalLength} mots
- Ton: ${spec.tone}
- Structure: ${spec.structure.join(' → ')}
- Hashtags: ${spec.optimalHashtags} (style: ${spec.hashtagStyle})
- Lien article : ${articleLink}
- Placement du lien: ${spec.linkPlacement === 'inline' ? 'dans le post' : spec.linkPlacement === 'comment' ? 'en commentaire (mentionner dans le texte)' : 'lien en bio (mentionner dans le texte)'}
- Émojis: ${spec.emojiUsage}`;
    })
    .join('\n');

  return `Génère des posts pour TOUTES les plateformes suivantes à partir de cet article.

═══════════════════════════════════════════
ARTICLE SOURCE
═══════════════════════════════════════════

Titre: ${article.title}
Description: ${article.description}
Catégorie: ${article.category}
${article.tags?.length ? `Tags: ${article.tags.join(', ')}` : ''}

Contenu:
${contentSummary}

═══════════════════════════════════════════
IMAGE ET LIEN
═══════════════════════════════════════════

${hasImage ? `Une image est associée à cet article (${article.imageUrl}) et sera attachée à chaque post.\nRédige les contenus en sachant qu'une image accompagnera chaque publication.` : "Aucune image n'est associée à cet article."}

═══════════════════════════════════════════
PLATEFORMES CIBLES
═══════════════════════════════════════════
${platformSpecs}

═══════════════════════════════════════════
PARAMÈTRES COMMUNS
═══════════════════════════════════════════

Ton: ${toneSpec.name} - ${toneSpec.promptInstructions}
Angle: ${angleSpec.name} - ${angleSpec.promptInstructions}
${options.customInstructions ? `Instructions: ${options.customInstructions}` : ''}

═══════════════════════════════════════════
FORMAT DE RÉPONSE
═══════════════════════════════════════════

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks):

{
  "generations": [
    {
      "platform": "FACEBOOK",
      "content": "Contenu du post Facebook...",
      "hashtags": ["hashtag1", "hashtag2"]
    },
    {
      "platform": "LINKEDIN",
      "content": "Contenu du post LinkedIn...",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
    }
  ]
}

IMPORTANT: Chaque post doit être unique et optimisé pour sa plateforme.
Ne copie pas le même contenu entre les plateformes.`;
}

/**
 * Extrait le JSON d'une chaîne qui peut contenir du texte autour
 */
function extractJsonFromText(text: string): string | null {
  let str = text.trim();

  // Enlever les éventuels backticks markdown
  if (str.startsWith('```json')) {
    str = str.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (str.startsWith('```')) {
    str = str.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Essayer de trouver un objet JSON { ... }
  const jsonObjectMatch = str.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    return jsonObjectMatch[0];
  }

  return str;
}

/**
 * Valide et nettoie la réponse JSON de Claude
 */
export function parseGenerationResponse(response: string): {
  content: string;
  hashtags: string[];
  suggestedMediaAlt?: string;
} | null {
  try {
    const jsonStr = extractJsonFromText(response);
    if (!jsonStr) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonStr);

    // Valider la structure
    if (!parsed.content || typeof parsed.content !== 'string') {
      throw new Error('Missing or invalid content field');
    }

    return {
      content: parsed.content,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      suggestedMediaAlt: parsed.suggestedMediaAlt,
    };
  } catch (error) {
    console.error('[PromptBuilder] Failed to parse generation response:', error);
    console.error('[PromptBuilder] Raw response:', response.substring(0, 500));
    return null;
  }
}

/**
 * Valide et nettoie la réponse multi-plateforme
 */
export function parseMultiPlatformResponse(response: string): Array<{
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
}> | null {
  try {
    const jsonStr = extractJsonFromText(response);
    if (!jsonStr) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonStr);

    if (!parsed.generations || !Array.isArray(parsed.generations)) {
      throw new Error('Missing or invalid generations array');
    }

    return parsed.generations.map((gen: Record<string, unknown>) => ({
      platform: gen.platform as SocialPlatform,
      content: String(gen.content || ''),
      hashtags: Array.isArray(gen.hashtags) ? gen.hashtags : [],
    }));
  } catch (error) {
    console.error('[PromptBuilder] Failed to parse multi-platform response:', error);
    console.error('[PromptBuilder] Raw response:', response.substring(0, 500));
    return null;
  }
}

/**
 * Estime le nombre de tokens pour un texte
 * Approximation: ~4 caractères = 1 token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
