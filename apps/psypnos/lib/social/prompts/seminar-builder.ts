// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Constructeur de prompts avancé pour la génération de contenu social pour les séminaires
 *
 * Construit des prompts optimisés pour Claude API afin de promouvoir
 * les séminaires et susciter des inscriptions.
 *
 * Ce module applique les meilleures pratiques de promotion d'événements :
 * - Création d'urgence positive (places limitées)
 * - Mise en valeur de l'expérience transformationnelle
 * - Formats natifs optimisés par plateforme
 * - Respect des contraintes déontologiques
 */

import type {
  SocialPlatform,
  ContentTone,
  ContentAngle,
  SeminarInstagramFormat,
  SeminarLinkedInFormat,
  SeminarFacebookFormat,
  SeminarThreadsFormat,
  SeminarUrgencyLevel,
} from '../types';
import {
  PLATFORM_GENERATION_SPECS,
  CONTENT_TONES,
  CONTENT_ANGLES,
} from './platform-specs';
import {
  SEMINAR_INSTAGRAM_FORMATS,
  SEMINAR_LINKEDIN_FORMATS,
  SEMINAR_FACEBOOK_FORMATS,
  SEMINAR_THREADS_FORMATS,
  SEMINAR_URGENCY_LEVELS,
  SEMINAR_HOOK_PATTERNS,
  SEMINAR_CTA_TEMPLATES,
  suggestSeminarInstagramFormat,
  suggestSeminarLinkedInFormat,
  suggestSeminarFacebookFormat,
  suggestSeminarThreadsFormat,
  calculateUrgencyLevel,
  getSeminarHookPatternsForPlatform,
  generateSeminarHashtags,
} from './seminar-platform-specs';

// ===========================================
// Types
// ===========================================

export interface SeminarInput {
  id: string;
  title: string;
  description: string;
  speakers: Array<{ firstName: string; lastName: string }>;
  startAt: string;
  endAt: string;
  capacity: number;
  price?: number;
  deposit?: number;
  tags: string[];
}

export interface SeminarGenerationOptions {
  tone: ContentTone;
  angle: ContentAngle;
  customInstructions?: string;
  // Options spécifiques Instagram
  instagramFormat?: SeminarInstagramFormat;
  // Options spécifiques LinkedIn
  linkedinFormat?: SeminarLinkedInFormat;
  // Options spécifiques Facebook
  facebookFormat?: SeminarFacebookFormat;
  // Options spécifiques Threads
  threadsFormat?: SeminarThreadsFormat;
  // Niveau d'urgence (calculé automatiquement si non fourni)
  urgencyLevel?: SeminarUrgencyLevel;
  // Nombre de places restantes (pour l'urgence)
  placesRemaining?: number;
}

// ===========================================
// Contexte Psypnos pour les séminaires
// ===========================================

const PSYPNOS_SEMINAR_CONTEXT = `Tu es un expert en communication digitale pour un cabinet de psychothérapie.

CONTEXTE DU CABINET:
- Nom: Psypnos - Psychothérapie, Hypnose & Respiration Holotropique
- Praticien: David Duquenne, psychopraticien certifié
- Localisation: Saint-Julien-du-Sault, Yonne (89), France
- Spécialités: Hypnose ericksonienne, Respiration holotropique, Psychothérapie transpersonnelle, Soins énergétiques
- Public: Adultes en quête de bien-être, développement personnel et accompagnement thérapeutique
- Site web: https://psypnos.fr

IDENTITÉ DE MARQUE:
- Ton général: Mystérieux mais rassurant, professionnel mais accessible
- Valeurs: Authenticité, bienveillance, expertise, accompagnement personnalisé
- Positionnement: Praticien expérimenté, approche holistique, ancrage local

CONTEXTE DES SÉMINAIRES:
- Les séminaires sont des expériences immersives de groupe
- Ils offrent un cadre sécurisé pour l'exploration intérieure
- Chaque séminaire est limité en places pour garantir la qualité de l'accompagnement
- L'objectif est de susciter des inscriptions en créant un sentiment d'urgence positive

CONTRAINTES DÉONTOLOGIQUES:
- Ne jamais faire de promesses thérapeutiques absolues ou garanties de résultats
- Éviter le vocabulaire médical réservé (diagnostic, guérison, traitement)
- Rester dans le cadre de la psychothérapie et des pratiques complémentaires
- Respecter la confidentialité et la dignité des personnes
- Ne pas dénigrer les autres approches thérapeutiques
- L'urgence doit rester bienveillante, jamais anxiogène`;

// ===========================================
// Fonctions utilitaires
// ===========================================

/**
 * Formate les dates du séminaire pour l'affichage
 */
function formatSeminarDates(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${dateFormatter.format(start)} de ${timeFormatter.format(start)} à ${timeFormatter.format(end)}`;
  }

  return `Du ${dateFormatter.format(start)} au ${dateFormatter.format(end)}`;
}

/**
 * Calcule le nombre de jours avant le séminaire
 */
function getDaysUntilEvent(startAt: string): number {
  const start = new Date(startAt);
  const now = new Date();
  const diffTime = start.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formate les intervenants
 */
function formatSpeakers(speakers: Array<{ firstName: string; lastName: string }>): string {
  return speakers
    .map((s) => `${s.firstName} ${s.lastName}`)
    .join(' et ');
}

/**
 * Formate le prix
 */
function formatPrice(price?: number, deposit?: number): string {
  if (!price) return 'Prix sur demande';

  let priceStr = `${price}€`;
  if (deposit) {
    priceStr += ` (acompte de ${deposit}€ à l'inscription)`;
  }
  return priceStr;
}

/**
 * Extrait le lieu depuis les tags
 */
function extractLocation(tags: string[]): string {
  const locationTag = tags.find(tag => tag.toLowerCase().startsWith('lieu:'));
  if (locationTag) {
    return locationTag.replace(/^lieu:/i, '').trim();
  }
  return 'Bourgogne';
}

// ===========================================
// Constructeur de prompts
// ===========================================

/**
 * Construit le prompt système pour les séminaires
 */
export function buildSeminarSystemPrompt(): string {
  return `${PSYPNOS_SEMINAR_CONTEXT}

MISSION:
Tu vas générer du contenu pour les réseaux sociaux de Psypnos afin de promouvoir un séminaire.
Ton objectif est de créer des posts engageants qui:
1. Attirent l'attention dès la première ligne
2. Suscitent l'envie de participer au séminaire
3. Créent un sentiment d'urgence positive (places limitées)
4. Mettent en valeur l'expérience unique proposée
5. Génèrent des inscriptions

Tu dois toujours fournir une réponse structurée avec:
- Le contenu du post adapté à la plateforme
- Les hashtags recommandés (séparés)

Réponds UNIQUEMENT avec le format JSON demandé, sans texte avant ou après.`;
}

/**
 * Construit le prompt Instagram avancé pour les séminaires
 */
function buildSeminarInstagramPrompt(
  seminar: SeminarInput,
  options: SeminarGenerationOptions
): string {
  const toneSpec = CONTENT_TONES[options.tone];
  const angleSpec = CONTENT_ANGLES[options.angle];
  const daysUntil = getDaysUntilEvent(seminar.startAt);

  // Déterminer le format
  const format = options.instagramFormat || suggestSeminarInstagramFormat(options.tone, daysUntil);
  const formatSpec = SEMINAR_INSTAGRAM_FORMATS[format];

  // Déterminer le niveau d'urgence
  const urgencyLevel = options.urgencyLevel || calculateUrgencyLevel(
    daysUntil,
    options.placesRemaining || Math.floor(seminar.capacity * 0.6),
    seminar.capacity
  );
  const urgencySpec = SEMINAR_URGENCY_LEVELS[urgencyLevel];

  // Obtenir les patterns d'accroche
  const hookPatterns = getSeminarHookPatternsForPlatform('INSTAGRAM', options.tone);

  // Générer les hashtags suggérés
  const suggestedHashtags = generateSeminarHashtags('INSTAGRAM', seminar.tags, 10);

  // Informations formatées
  const formattedDates = formatSeminarDates(seminar.startAt, seminar.endAt);
  const formattedSpeakers = formatSpeakers(seminar.speakers);
  const formattedPrice = formatPrice(seminar.price, seminar.deposit);
  const location = extractLocation(seminar.tags);

  const hookPatternsSection = hookPatterns.slice(0, 3).map(h =>
    `• ${h.name}: "${h.pattern}"\n  Exemples: ${h.examples.slice(0, 2).join(' | ')}`
  ).join('\n');

  return `Génère un post Instagram NATIF et ENGAGEANT pour promouvoir ce séminaire.

═══════════════════════════════════════════
SÉMINAIRE À PROMOUVOIR
═══════════════════════════════════════════

Titre: ${seminar.title}
Description: ${seminar.description}
Intervenants: ${formattedSpeakers}
Dates: ${formattedDates}
Lieu: ${location}
Capacité: ${seminar.capacity} places
Places restantes: ${options.placesRemaining || 'non précisé'}
Prix: ${formattedPrice}
Thématiques: ${seminar.tags.join(', ')}
Jours avant l'événement: ${daysUntil}

═══════════════════════════════════════════
FORMAT DE POST : "${formatSpec.name}"
═══════════════════════════════════════════

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
NIVEAU D'URGENCE : ${urgencySpec.level}/5 - ${urgencySpec.name}
═══════════════════════════════════════════

${urgencySpec.description}
Timing approprié : ${urgencySpec.timing}

Caractéristiques :
${urgencySpec.characteristics.map(c => `• ${c}`).join('\n')}

Phrase type pour ce niveau : "${urgencySpec.examplePhrase}"

═══════════════════════════════════════════
PATTERNS D'ACCROCHE RECOMMANDÉS
═══════════════════════════════════════════

${hookPatternsSection}

IMPORTANT: La première ligne doit faire max 125 caractères et créer un "arrêt" mental.

═══════════════════════════════════════════
PARAMÈTRES DE GÉNÉRATION
═══════════════════════════════════════════

Ton : ${toneSpec.name} - ${toneSpec.promptInstructions}
Angle : ${angleSpec.name} - ${angleSpec.promptInstructions}

${options.customInstructions ? `Instructions personnalisées : ${options.customInstructions}` : ''}

═══════════════════════════════════════════
OBJECTIFS SPÉCIFIQUES AU SÉMINAIRE
═══════════════════════════════════════════

1. Créer un sentiment d'URGENCE POSITIVE :
   - Mentionner le nombre limité de places (${seminar.capacity} places)
   - Adapter l'urgence au niveau ${urgencyLevel}/5
   - L'urgence doit rester BIENVEILLANTE, pas anxiogène

2. Mettre en valeur l'EXPÉRIENCE UNIQUE :
   - Le cadre exceptionnel (${location})
   - L'accompagnement de qualité
   - La transformation possible (sans promesse thérapeutique)

3. Appel à l'action CLAIR :
   - Inciter à s'inscrire
   - "Lien en bio" pour Instagram

═══════════════════════════════════════════
RÈGLES INSTAGRAM ESSENTIELLES
═══════════════════════════════════════════

✅ À FAIRE :
• Sauts de ligne fréquents pour aérer
• Première ligne < 125 caractères
• Séparateur visuel avant hashtags (3 points sur lignes séparées)
• Mentionner "lien en bio"
• Créer de l'émotion et de la connexion

❌ À ÉVITER :
• Texte en bloc sans aération
• Liens dans le texte (non cliquables)
• Ton trop corporate ou distant
• Plus de 15 hashtags
• Promesses thérapeutiques ou de résultats garantis

═══════════════════════════════════════════
STRATÉGIE HASHTAGS
═══════════════════════════════════════════

Hashtags suggérés :
${suggestedHashtags.map(h => `#${h}`).join(' ')}

═══════════════════════════════════════════
FORMAT DE RÉPONSE
═══════════════════════════════════════════

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :

{
  "content": "Le contenu du post (avec \\n pour les sauts de ligne)",
  "hashtags": ["hashtag1", "hashtag2", "..."],
  "suggestedMediaAlt": "Description alternative pour l'image",
  "formatUsed": "${format}",
  "urgencyLevelUsed": ${urgencyLevel}
}`;
}

/**
 * Construit le prompt LinkedIn avancé pour les séminaires
 */
function buildSeminarLinkedInPrompt(
  seminar: SeminarInput,
  options: SeminarGenerationOptions
): string {
  const toneSpec = CONTENT_TONES[options.tone];
  const angleSpec = CONTENT_ANGLES[options.angle];
  const daysUntil = getDaysUntilEvent(seminar.startAt);

  // Déterminer le format
  const format = options.linkedinFormat || suggestSeminarLinkedInFormat(options.tone, daysUntil);
  const formatSpec = SEMINAR_LINKEDIN_FORMATS[format];

  // Déterminer le niveau d'urgence
  const urgencyLevel = options.urgencyLevel || calculateUrgencyLevel(
    daysUntil,
    options.placesRemaining || Math.floor(seminar.capacity * 0.6),
    seminar.capacity
  );
  const urgencySpec = SEMINAR_URGENCY_LEVELS[urgencyLevel];

  // Obtenir les patterns d'accroche
  const hookPatterns = getSeminarHookPatternsForPlatform('LINKEDIN', options.tone);

  // Générer les hashtags suggérés
  const suggestedHashtags = generateSeminarHashtags('LINKEDIN', seminar.tags, 5);

  // Informations formatées
  const formattedDates = formatSeminarDates(seminar.startAt, seminar.endAt);
  const formattedSpeakers = formatSpeakers(seminar.speakers);
  const formattedPrice = formatPrice(seminar.price, seminar.deposit);
  const location = extractLocation(seminar.tags);

  const hookPatternsSection = hookPatterns.slice(0, 4).map(h =>
    `• ${h.name}: "${h.pattern}"\n  Exemples: ${h.examples.slice(0, 2).join(' | ')}`
  ).join('\n');

  return `Génère un post LinkedIn PROFESSIONNEL et ENGAGEANT pour promouvoir ce séminaire.

═══════════════════════════════════════════
SÉMINAIRE À PROMOUVOIR
═══════════════════════════════════════════

Titre: ${seminar.title}
Description: ${seminar.description}
Intervenants: ${formattedSpeakers}
Dates: ${formattedDates}
Lieu: ${location}
Capacité: ${seminar.capacity} places
Places restantes: ${options.placesRemaining || 'non précisé'}
Prix: ${formattedPrice}
Thématiques: ${seminar.tags.join(', ')}
Jours avant l'événement: ${daysUntil}

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
NIVEAU D'URGENCE : ${urgencySpec.level}/5 - ${urgencySpec.name}
═══════════════════════════════════════════

${urgencySpec.description}
Timing approprié : ${urgencySpec.timing}

Caractéristiques :
${urgencySpec.characteristics.map(c => `• ${c}`).join('\n')}

═══════════════════════════════════════════
PATTERNS D'ACCROCHE LINKEDIN
═══════════════════════════════════════════

${hookPatternsSection}

IMPORTANT: L'accroche doit être courte, percutante et créer de la curiosité.

═══════════════════════════════════════════
PARAMÈTRES DE GÉNÉRATION
═══════════════════════════════════════════

Ton demandé : ${toneSpec.name} - ${toneSpec.promptInstructions}
Angle demandé : ${angleSpec.name} - ${angleSpec.promptInstructions}

${options.customInstructions ? `Instructions personnalisées : ${options.customInstructions}` : ''}

═══════════════════════════════════════════
FORMATAGE LINKEDIN NATIF
═══════════════════════════════════════════

✅ RÈGLES DE FORMATAGE ESSENTIELLES :
• Paragraphes ULTRA-COURTS : 1-3 lignes maximum
• Sauts de ligne généreux entre chaque idée
• Utiliser → pour les listes (pas de tirets classiques)
• Séparateur --- avant le CTA/mention du lien
• Émojis numérotés 1️⃣ 2️⃣ 3️⃣ pour les listes

═══════════════════════════════════════════
RÈGLES LINKEDIN ESSENTIELLES
═══════════════════════════════════════════

✅ À FAIRE :
• Paragraphes ultra-courts (1-3 lignes)
• Sauts de ligne généreux
• Flèches → pour les listes
• Question d'engagement en fin de post
• Lien mentionné "en commentaire"
• Ton expert mais accessible

❌ À ÉVITER :
• Blocs de texte compacts
• Plus de 5 hashtags
• Émojis excessifs
• Ton trop promotionnel
• Promesses thérapeutiques

═══════════════════════════════════════════
FORMAT DE RÉPONSE
═══════════════════════════════════════════

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :

{
  "content": "Le contenu du post LinkedIn (avec \\n pour les sauts de ligne). Mentionner que le lien est en commentaire.",
  "hashtags": ["${suggestedHashtags[0] || 'seminaire'}", "${suggestedHashtags[1] || 'bienetre'}", "${suggestedHashtags[2] || 'ressourcement'}", "${suggestedHashtags[3] || 'developpementpersonnel'}"],
  "suggestedMediaAlt": "Description alternative pour l'image",
  "formatUsed": "${format}",
  "urgencyLevelUsed": ${urgencyLevel}
}

RAPPEL FINAL:
- Le post doit faire ${formatSpec.optimalLength.min}-${formatSpec.optimalLength.max} mots
- Paragraphes ULTRA-COURTS (1-3 lignes)
- Question d'engagement en fin de post
- Lien mentionné "en commentaire"`;
}

/**
 * Construit le prompt Facebook avancé pour les séminaires
 */
function buildSeminarFacebookPrompt(
  seminar: SeminarInput,
  options: SeminarGenerationOptions
): string {
  const toneSpec = CONTENT_TONES[options.tone];
  const angleSpec = CONTENT_ANGLES[options.angle];
  const daysUntil = getDaysUntilEvent(seminar.startAt);

  // Déterminer le format
  const format = options.facebookFormat || suggestSeminarFacebookFormat(options.tone, daysUntil);
  const formatSpec = SEMINAR_FACEBOOK_FORMATS[format];

  // Déterminer le niveau d'urgence
  const urgencyLevel = options.urgencyLevel || calculateUrgencyLevel(
    daysUntil,
    options.placesRemaining || Math.floor(seminar.capacity * 0.6),
    seminar.capacity
  );
  const urgencySpec = SEMINAR_URGENCY_LEVELS[urgencyLevel];

  // Obtenir les patterns d'accroche
  const hookPatterns = getSeminarHookPatternsForPlatform('FACEBOOK', options.tone);

  // Générer les hashtags suggérés
  const suggestedHashtags = generateSeminarHashtags('FACEBOOK', seminar.tags, 3);

  // Informations formatées
  const formattedDates = formatSeminarDates(seminar.startAt, seminar.endAt);
  const formattedSpeakers = formatSpeakers(seminar.speakers);
  const formattedPrice = formatPrice(seminar.price, seminar.deposit);
  const location = extractLocation(seminar.tags);

  const hookPatternsSection = hookPatterns.slice(0, 4).map(h =>
    `• ${h.name}: "${h.pattern}"\n  Exemples: ${h.examples.slice(0, 2).join(' | ')}`
  ).join('\n');

  return `Génère un post Facebook NATIF et ENGAGEANT pour promouvoir ce séminaire.

═══════════════════════════════════════════
SÉMINAIRE À PROMOUVOIR
═══════════════════════════════════════════

Titre: ${seminar.title}
Description: ${seminar.description}
Intervenants: ${formattedSpeakers}
Dates: ${formattedDates}
Lieu: ${location}
Capacité: ${seminar.capacity} places
Places restantes: ${options.placesRemaining || 'non précisé'}
Prix: ${formattedPrice}
Thématiques: ${seminar.tags.join(', ')}
Jours avant l'événement: ${daysUntil}

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
NIVEAU D'URGENCE : ${urgencySpec.level}/5 - ${urgencySpec.name}
═══════════════════════════════════════════

${urgencySpec.description}

Caractéristiques :
${urgencySpec.characteristics.map(c => `• ${c}`).join('\n')}

═══════════════════════════════════════════
PATTERNS D'ACCROCHE FACEBOOK
═══════════════════════════════════════════

${hookPatternsSection}

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
• Ton chaleureux et conversationnel
• Utiliser des sauts de ligne pour aérer
• Inclure le lien vers l'inscription avec 👉
• Terminer par une question qui invite aux commentaires
• Maximum 2-3 hashtags, discrets en fin de post

❌ À ÉVITER :
• Texte trop long (max 120 mots idéalement)
• Ton trop professionnel ou distant
• Promesses thérapeutiques
• Trop d'émojis
• Urgence anxiogène

═══════════════════════════════════════════
FORMAT DE RÉPONSE
═══════════════════════════════════════════

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :

{
  "content": "Le contenu du post Facebook (avec \\n pour les sauts de ligne). Inclure [LIEN] à l'emplacement souhaité.",
  "hashtags": ["${suggestedHashtags[0] || 'seminaire'}", "${suggestedHashtags[1] || 'bienetre'}"],
  "suggestedMediaAlt": "Description alternative pour l'image",
  "formatUsed": "${format}",
  "urgencyLevelUsed": ${urgencyLevel}
}`;
}

/**
 * Construit le prompt Threads pour les séminaires
 */
function buildSeminarThreadsPrompt(
  seminar: SeminarInput,
  options: SeminarGenerationOptions
): string {
  const toneSpec = CONTENT_TONES[options.tone];
  const angleSpec = CONTENT_ANGLES[options.angle];

  // Déterminer le format
  const format = options.threadsFormat || suggestSeminarThreadsFormat(options.tone);
  const formatSpec = SEMINAR_THREADS_FORMATS[format];

  // Informations formatées
  const formattedDates = formatSeminarDates(seminar.startAt, seminar.endAt);
  const location = extractLocation(seminar.tags);
  const daysUntil = getDaysUntilEvent(seminar.startAt);

  return `Génère un post Threads AUTHENTIQUE et COURT pour promouvoir ce séminaire.

═══════════════════════════════════════════
RÈGLE CRITIQUE : LIMITE DE CARACTÈRES
═══════════════════════════════════════════

⚠️ THREADS A UNE LIMITE DE 500 CARACTÈRES MAXIMUM ⚠️

Tu dois générer un post de ${formatSpec.maxLength} CARACTÈRES maximum.
Le lien sera ajouté automatiquement, ne l'inclus PAS dans le contenu.

═══════════════════════════════════════════
SÉMINAIRE À PROMOUVOIR
═══════════════════════════════════════════

Titre: ${seminar.title}
Description: ${seminar.description}
Dates: ${formattedDates}
Lieu: ${location}
Capacité: ${seminar.capacity} places
Jours avant: ${daysUntil}

═══════════════════════════════════════════
FORMAT DE POST THREADS : "${formatSpec.name}"
═══════════════════════════════════════════

${formatSpec.description}

Structure à suivre :
${formatSpec.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Exemples de ce format :
${formatSpec.examples.map(ex => `---\n${ex}\n---`).join('\n')}

Ce format est idéal pour : ${formatSpec.bestFor.join(', ')}

Conseils pour ce format :
${formatSpec.tips.map(t => `• ${t}`).join('\n')}

LONGUEUR MAX : ${formatSpec.maxLength} caractères

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
• Écrire comme on pense, spontanément
• Authenticité maximale
• Ton conversationnel
• Une seule idée, percutante

❌ À ÉVITER ABSOLUMENT :
• Ton marketing ou promotionnel
• Hashtags (0-1 maximum)
• Appels à l'action explicites
• Liens dans le texte
• Majuscules partout
• Émojis excessifs

═══════════════════════════════════════════
FORMAT DE RÉPONSE
═══════════════════════════════════════════

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :

{
  "content": "Le contenu COURT du post (max ${formatSpec.maxLength} caractères, sans lien)",
  "hashtags": [],
  "formatUsed": "${format}"
}

RAPPEL FINAL :
- Le post DOIT faire moins de ${formatSpec.maxLength} caractères
- PAS de lien dans content
- PAS de hashtags
- PAS d'appel à l'action explicite
- Écris comme tu PENSES, pas comme tu VENDRAIS`;
}

/**
 * Construit le prompt utilisateur pour une plateforme spécifique (séminaires)
 */
export function buildSeminarUserPrompt(
  seminar: SeminarInput,
  platform: SocialPlatform,
  options: SeminarGenerationOptions
): string {
  // Utiliser les prompts avancés pour chaque plateforme
  if (platform === 'INSTAGRAM') {
    return buildSeminarInstagramPrompt(seminar, options);
  }

  if (platform === 'LINKEDIN') {
    return buildSeminarLinkedInPrompt(seminar, options);
  }

  if (platform === 'FACEBOOK') {
    return buildSeminarFacebookPrompt(seminar, options);
  }

  if (platform === 'THREADS') {
    return buildSeminarThreadsPrompt(seminar, options);
  }

  // Fallback pour Twitter et autres plateformes
  const spec = PLATFORM_GENERATION_SPECS[platform];
  const toneSpec = CONTENT_TONES[options.tone];
  const angleSpec = CONTENT_ANGLES[options.angle];

  const formattedDates = formatSeminarDates(seminar.startAt, seminar.endAt);
  const formattedSpeakers = formatSpeakers(seminar.speakers);
  const formattedPrice = formatPrice(seminar.price, seminar.deposit);

  const prompt = `Génère un post ${spec.name} pour promouvoir ce séminaire et susciter des inscriptions.

═══════════════════════════════════════════
SÉMINAIRE À PROMOUVOIR
═══════════════════════════════════════════

Titre: ${seminar.title}
Description: ${seminar.description}
Intervenants: ${formattedSpeakers}
Dates: ${formattedDates}
Capacité: ${seminar.capacity} places (CRÉER UN SENTIMENT D'URGENCE)
Prix: ${formattedPrice}
Thématiques: ${seminar.tags.join(', ')}

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

Lien: ${spec.linkPlacement === 'inline' ? 'Dans le post (mentionner le lien vers les inscriptions)' : spec.linkPlacement === 'comment' ? 'Mentionner qu\'il sera en commentaire' : 'Mentionner "lien en bio"'}
Émojis: ${spec.emojiUsage === 'minimal' ? 'Peu ou pas' : spec.emojiUsage === 'moderate' ? 'Avec modération' : 'Librement'}

═══════════════════════════════════════════
PARAMÈTRES DE GÉNÉRATION
═══════════════════════════════════════════

Ton demandé: ${toneSpec.name} - ${toneSpec.description}
Instructions ton: ${toneSpec.promptInstructions}

Angle demandé: ${angleSpec.name} - ${angleSpec.description}
Instructions angle: ${angleSpec.promptInstructions}

${options.customInstructions ? `Instructions personnalisées: ${options.customInstructions}` : ''}

═══════════════════════════════════════════
OBJECTIFS SPÉCIFIQUES AU SÉMINAIRE
═══════════════════════════════════════════

1. Créer un sentiment d'URGENCE POSITIVE :
   - Mentionner le nombre limité de places (${seminar.capacity} places)
   - Suggérer que les places partent vite
   - Encourager à réserver rapidement

2. Mettre en valeur l'EXPÉRIENCE UNIQUE :
   - Le cadre exceptionnel
   - L'accompagnement de qualité
   - La transformation possible

3. Appel à l'action CLAIR :
   - Inciter à s'inscrire
   - Mentionner comment réserver

═══════════════════════════════════════════
FORMAT DE RÉPONSE ATTENDU
═══════════════════════════════════════════

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks):

{
  "content": "Le contenu du post ici (respecte les sauts de ligne avec \\n)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

  return prompt;
}

/**
 * Construit un prompt pour générer plusieurs plateformes en une seule requête (séminaires)
 */
export function buildSeminarMultiPlatformPrompt(
  seminar: SeminarInput,
  platforms: SocialPlatform[],
  options: SeminarGenerationOptions
): string {
  const toneSpec = CONTENT_TONES[options.tone];
  const angleSpec = CONTENT_ANGLES[options.angle];
  const daysUntil = getDaysUntilEvent(seminar.startAt);

  const formattedDates = formatSeminarDates(seminar.startAt, seminar.endAt);
  const formattedSpeakers = formatSpeakers(seminar.speakers);
  const formattedPrice = formatPrice(seminar.price, seminar.deposit);
  const location = extractLocation(seminar.tags);

  // Déterminer le niveau d'urgence
  const urgencyLevel = options.urgencyLevel || calculateUrgencyLevel(
    daysUntil,
    options.placesRemaining || Math.floor(seminar.capacity * 0.6),
    seminar.capacity
  );
  const urgencySpec = SEMINAR_URGENCY_LEVELS[urgencyLevel];

  const platformSpecs = platforms.map(platform => {
    if (platform === 'THREADS') {
      const format = options.threadsFormat || suggestSeminarThreadsFormat(options.tone);
      const formatSpec = SEMINAR_THREADS_FORMATS[format];
      return `
### THREADS
- ⚠️ LIMITE: ${formatSpec.maxLength} CARACTÈRES maximum
- Format: ${formatSpec.name} - ${formatSpec.description}
- Ton: pensée spontanée, authentique
- Hashtags: 0-1 maximum
- PAS de lien dans le texte`;
    }

    if (platform === 'INSTAGRAM') {
      const format = options.instagramFormat || suggestSeminarInstagramFormat(options.tone, daysUntil);
      const formatSpec = SEMINAR_INSTAGRAM_FORMATS[format];
      return `
### INSTAGRAM
- Format: ${formatSpec.name}
- ${formatSpec.description}
- 100-150 mots
- Mentionner "lien en bio"
- Hashtags: 8-10
- Urgence niveau ${urgencyLevel}: ${urgencySpec.name}`;
    }

    if (platform === 'LINKEDIN') {
      const format = options.linkedinFormat || suggestSeminarLinkedInFormat(options.tone, daysUntil);
      const formatSpec = SEMINAR_LINKEDIN_FORMATS[format];
      return `
### LINKEDIN
- Format: ${formatSpec.name}
- ${formatSpec.description}
- ${formatSpec.optimalLength.min}-${formatSpec.optimalLength.max} mots
- Paragraphes ultra-courts (1-3 lignes)
- Lien "en commentaire"
- Hashtags: 4-5
- Question d'engagement à la fin`;
    }

    if (platform === 'FACEBOOK') {
      const format = options.facebookFormat || suggestSeminarFacebookFormat(options.tone, daysUntil);
      const formatSpec = SEMINAR_FACEBOOK_FORMATS[format];
      return `
### FACEBOOK
- Format: ${formatSpec.name}
- ${formatSpec.description}
- ${formatSpec.optimalLength.min}-${formatSpec.optimalLength.max} mots
- Ton chaleureux
- Inclure [LIEN]
- Hashtags: 2-3
- Question pour l'engagement`;
    }

    const spec = PLATFORM_GENERATION_SPECS[platform];
    return `
### ${spec.name.toUpperCase()}
- Longueur: ${spec.optimalLength} mots
- Ton: ${spec.tone}
- Hashtags: ${spec.optimalHashtags}
- Lien: ${spec.linkPlacement === 'inline' ? 'dans le post' : spec.linkPlacement === 'comment' ? 'en commentaire' : 'lien en bio'}`;
  }).join('\n');

  return `Génère des posts pour TOUTES les plateformes suivantes afin de promouvoir ce séminaire et susciter des inscriptions.

═══════════════════════════════════════════
SÉMINAIRE À PROMOUVOIR
═══════════════════════════════════════════

Titre: ${seminar.title}
Description: ${seminar.description}
Intervenants: ${formattedSpeakers}
Dates: ${formattedDates}
Lieu: ${location}
Capacité: ${seminar.capacity} places
Places restantes: ${options.placesRemaining || 'non précisé'}
Prix: ${formattedPrice}
Thématiques: ${seminar.tags.join(', ')}
Jours avant l'événement: ${daysUntil}

═══════════════════════════════════════════
NIVEAU D'URGENCE : ${urgencyLevel}/5 - ${urgencySpec.name}
═══════════════════════════════════════════

${urgencySpec.description}

Caractéristiques à appliquer :
${urgencySpec.characteristics.map(c => `• ${c}`).join('\n')}

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
OBJECTIFS POUR TOUS LES POSTS
═══════════════════════════════════════════

1. URGENCE POSITIVE (niveau ${urgencyLevel}/5): ${urgencySpec.examplePhrase}
2. EXPÉRIENCE UNIQUE: Cadre exceptionnel (${location}), accompagnement de qualité
3. APPEL À L'ACTION: Inciter à s'inscrire

═══════════════════════════════════════════
CONTRAINTES DÉONTOLOGIQUES
═══════════════════════════════════════════

• Ne jamais promettre de résultats thérapeutiques
• L'urgence doit rester BIENVEILLANTE, pas anxiogène
• Éviter le vocabulaire médical réservé
• Rester humble : "ouvre un espace", "permet d'explorer"

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
 * Estime le nombre de tokens pour un texte
 */
export function estimateSeminarTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
