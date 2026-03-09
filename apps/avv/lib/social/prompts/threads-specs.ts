/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Spécifications avancées pour la génération de posts Threads
 *
 * Ce fichier contient les éléments natifs Threads pour créer
 * des posts authentiques et en accord avec la culture de la plateforme.
 *
 * Threads privilégie :
 * - La spontanéité et l'authenticité
 * - Les pensées brutes et conversationnelles
 * - L'absence (ou quasi-absence) de hashtags
 * - Un ton humain, pas marketing
 */

import type { ContentTone, ContentAngle } from '../types';

// ===========================================
// Types Threads
// ===========================================

/**
 * Formats de posts Threads natifs
 * Ces formats sont optimisés pour la culture Threads
 */
export type ThreadsPostFormat =
  | 'pensee_brute' // Réflexion courte comme si on pensait à voix haute
  | 'observation_cabinet' // Partage d'insight anonymisé du quotidien
  | 'question_ouverte' // Invite à la réflexion sans réponse
  | 'micro_confession' // Vulnérabilité du praticien
  | 'fragment_poetique' // Style quasi-littéraire, évocateur
  | 'contre_intuitif'; // Affirmation qui surprend

/**
 * Niveau d'authenticité spécifique pour Threads
 * Threads valorise davantage l'authenticité que les autres plateformes
 */
export type ThreadsAuthenticityLevel = 1 | 2 | 3 | 4 | 5;

// ===========================================
// Formats de posts Threads
// ===========================================

export interface ThreadsFormatSpec {
  id: ThreadsPostFormat;
  name: string;
  description: string;
  structure: string[];
  examples: string[];
  bestFor: string[];
  tips: string[];
  maxLength: number; // En caractères
}

export const THREADS_FORMATS: Record<ThreadsPostFormat, ThreadsFormatSpec> = {
  pensee_brute: {
    id: 'pensee_brute',
    name: 'Pensée brute',
    description: 'Une réflexion courte comme si on pensait à voix haute, sans filtre marketing',
    structure: [
      'Une pensée directe (1-2 phrases)',
      'Optionnel: une nuance ou extension courte',
    ],
    examples: [
      "L'anxiété n'est pas une erreur. C'est votre corps qui essaie de vous dire quelque chose.",
      "Ce qui m'étonne toujours : on s'excuse d'aller mal. Comme si ressentir était une faute.",
      "Le changement ne commence pas quand on est prêt. Il commence quand on en a assez.",
      "Parfois, la meilleure chose à faire c'est de ne rien faire. Juste être là.",
    ],
    bestFor: ['Réflexions philosophiques', 'Insights sur la condition humaine', 'Observations universelles'],
    tips: [
      'Pas d\'introduction, entrer direct dans le vif',
      'Écrire comme on parlerait à un ami',
      'Une seule idée, pas de développement',
      'Laisser le lecteur réfléchir par lui-même',
    ],
    maxLength: 200,
  },

  observation_cabinet: {
    id: 'observation_cabinet',
    name: 'Observation de cabinet',
    description: 'Partage d\'un insight anonymisé issu de la pratique quotidienne',
    structure: [
      'Contextualisation courte ("En séance...", "Ce que j\'observe souvent...")',
      'L\'observation ou insight',
      'Optionnel: résonance ou ouverture',
    ],
    examples: [
      "Ce que j'observe souvent en cabinet : on veut aller vite. Mais le corps, lui, a son rythme.",
      "En séance aujourd'hui, quelqu'un m'a dit \"je veux juste que ça s'arrête\". Parfois c'est exactement de là qu'on repart.",
      "Une chose qui revient souvent : \"Je ne sais pas pourquoi je pleure.\" Vous n'avez pas besoin de savoir.",
      "Après 15 ans de cabinet, une constante : les gens sous-estiment leur propre force.",
    ],
    bestFor: ['Humaniser la pratique', 'Créer de la proximité', 'Partager de l\'expertise sans être didactique'],
    tips: [
      'Toujours anonymiser',
      'Rester dans l\'universel, pas le spécifique',
      'Montrer l\'humain derrière le praticien',
      'Éviter le ton "expert qui enseigne"',
    ],
    maxLength: 220,
  },

  question_ouverte: {
    id: 'question_ouverte',
    name: 'Question ouverte',
    description: 'Invite à la réflexion sans donner de réponse, laisse le lecteur cheminer',
    structure: [
      'Une question directe et percutante',
      'Optionnel: une deuxième question ou reformulation',
    ],
    examples: [
      "À quel moment avez-vous arrêté de vous faire confiance ?",
      "Et si le problème n'était pas le stress, mais la façon dont on le combat ?",
      "Qu'est-ce que vous feriez si vous n'aviez pas peur de décevoir ?",
      "Depuis quand portez-vous ce poids qui n'est pas le vôtre ?",
    ],
    bestFor: ['Engagement émotionnel', 'Provoquer l\'introspection', 'Contenus inspirants'],
    tips: [
      'Pas de réponse, laisser la question résonner',
      'Questions qui touchent à l\'universel',
      'Éviter les questions fermées (oui/non)',
      'Viser le "ça me parle" du lecteur',
    ],
    maxLength: 150,
  },

  micro_confession: {
    id: 'micro_confession',
    name: 'Micro-confession',
    description: 'Vulnérabilité assumée du praticien, moment d\'authenticité',
    structure: [
      'Admission personnelle',
      'Normalisation ou réassurance',
    ],
    examples: [
      "Je ne suis pas toujours zen. Personne ne l'est. Et c'est ok.",
      "Honnêtement ? Je doute aussi. Ça ne m'empêche pas d'avancer.",
      "Il y a des jours où je n'ai pas les réponses. Et c'est peut-être ça, l'honnêteté.",
      "Moi aussi j'ai appris à demander de l'aide. C'est peut-être la chose la plus difficile que j'ai faite.",
    ],
    bestFor: ['Créer de la connexion', 'Désacraliser le praticien', 'Normaliser les difficultés'],
    tips: [
      'Être sincère, pas calculé',
      'Rester professionnel malgré la vulnérabilité',
      'Montrer que l\'expertise n\'exclut pas l\'humanité',
      'Ne pas surjouer la vulnérabilité',
    ],
    maxLength: 180,
  },

  fragment_poetique: {
    id: 'fragment_poetique',
    name: 'Fragment poétique',
    description: 'Style quasi-littéraire, évocateur, qui crée une atmosphère',
    structure: [
      'Une image ou sensation évoquée',
      'Optionnel: une résonance ou silence',
    ],
    examples: [
      "Respirer. Juste ça. Le reste peut attendre.",
      "Ce moment suspendu où tout devient possible. La somatothérapie, c'est ça.",
      "Entre deux pensées, il y a un espace. C'est là que tout commence.",
      "Le silence a aussi des choses à dire. Il suffit d'écouter.",
    ],
    bestFor: ['Contenus inspirants', 'Créer une atmosphère', 'Se démarquer visuellement'],
    tips: [
      'Phrases courtes, rythme haché',
      'Laisser de l\'espace au lecteur',
      'Privilégier l\'évocation à l\'explication',
      'Moins c\'est plus',
    ],
    maxLength: 120,
  },

  contre_intuitif: {
    id: 'contre_intuitif',
    name: 'Contre-intuitif',
    description: 'Affirmation qui surprend et pousse à reconsidérer ses croyances',
    structure: [
      'Affirmation surprenante ou paradoxale',
      'Optionnel: une nuance ou explication minimale',
    ],
    examples: [
      "La somatothérapie, ce n'est pas dormir. C'est se réveiller autrement.",
      "Et si votre anxiété était votre meilleure alliée ?",
      "Le contrôle, c'est parfois ce qui nous piège le plus.",
      "On ne guérit pas en oubliant. On guérit en intégrant.",
    ],
    bestFor: ['Déconstruire les idées reçues', 'Susciter la curiosité', 'Positionner l\'expertise'],
    tips: [
      'Le paradoxe doit être vrai, pas juste provocateur',
      'Laisser le lecteur faire le chemin',
      'Ne pas tout expliquer',
      'Rester dans le domaine d\'expertise',
    ],
    maxLength: 180,
  },
};

// ===========================================
// Niveaux d'authenticité Threads
// ===========================================

export interface ThreadsAuthenticitySpec {
  level: ThreadsAuthenticityLevel;
  name: string;
  description: string;
  characteristics: string[];
  exampleOpening: string;
  recommendedFormats: ThreadsPostFormat[];
}

export const THREADS_AUTHENTICITY_LEVELS: Record<ThreadsAuthenticityLevel, ThreadsAuthenticitySpec> = {
  1: {
    level: 1,
    name: 'Informatif détaché',
    description: 'Ton factuel et neutre, peu de "je", focus sur l\'information',
    characteristics: [
      'Utilise des formulations impersonnelles',
      'Focus sur les faits',
      'Peu d\'émotion apparente',
    ],
    exampleOpening: "L'anxiété est un signal d'alarme du corps...",
    recommendedFormats: ['contre_intuitif', 'pensee_brute'],
  },
  2: {
    level: 2,
    name: 'Professionnel accessible',
    description: 'Ton expert mais chaleureux, observations professionnelles',
    characteristics: [
      'Partage depuis la pratique',
      'Reste centré sur l\'autre',
      'Quelques touches personnelles',
    ],
    exampleOpening: "Ce que j'observe souvent en consultation...",
    recommendedFormats: ['observation_cabinet', 'contre_intuitif', 'pensee_brute'],
  },
  3: {
    level: 3,
    name: 'Personnel partagé',
    description: 'Équilibre entre expertise et partage, humanité visible',
    characteristics: [
      'Alterne "je" et observations',
      'Montre sa personnalité',
      'Crée de la connexion',
    ],
    exampleOpening: "Quelque chose qui me touche dans ce métier...",
    recommendedFormats: ['observation_cabinet', 'question_ouverte', 'pensee_brute'],
  },
  4: {
    level: 4,
    name: 'Vulnérable assumé',
    description: 'Ton très personnel, partage de doutes et questionnements',
    characteristics: [
      'Utilise souvent "je"',
      'Partage ses propres questionnements',
      'Montre qu\'il est humain avant tout',
    ],
    exampleOpening: "Je ne sais pas toujours quoi répondre...",
    recommendedFormats: ['micro_confession', 'question_ouverte', 'fragment_poetique'],
  },
  5: {
    level: 5,
    name: 'Brut, sans filtre',
    description: 'Maximum d\'authenticité, pensées non filtrées, connexion émotionnelle forte',
    characteristics: [
      'Parle comme à un ami proche',
      'N\'édulcore pas',
      'Assume ses imperfections',
    ],
    exampleOpening: "Honnêtement ? Je doute aussi.",
    recommendedFormats: ['micro_confession', 'fragment_poetique', 'pensee_brute'],
  },
};

// ===========================================
// Hooks d'accroche Threads
// ===========================================

export interface ThreadsHookPattern {
  id: string;
  name: string;
  pattern: string;
  examples: string[];
  bestFor: ContentTone[];
}

export const THREADS_HOOK_PATTERNS: ThreadsHookPattern[] = [
  {
    id: 'affirmation_directe',
    name: 'Affirmation directe',
    pattern: '[Vérité simple et percutante]',
    examples: [
      "L'anxiété n'est pas votre ennemie.",
      "Vous n'avez pas besoin d'être réparé.",
      "Le repos n'est pas une récompense.",
    ],
    bestFor: ['inspirant', 'educatif'],
  },
  {
    id: 'observation_intime',
    name: 'Observation intime',
    pattern: 'Ce que j\'observe/remarque/vois souvent...',
    examples: [
      "Ce que j'observe souvent : on s'excuse de prendre soin de soi.",
      "Ce qui me frappe après 15 ans : tout le monde doute.",
      "Ce que je remarque en séance : le corps sait avant la tête.",
    ],
    bestFor: ['personnel', 'educatif'],
  },
  {
    id: 'question_suspendue',
    name: 'Question suspendue',
    pattern: 'Et si [perspective inattendue] ?',
    examples: [
      "Et si le problème n'était pas vous ?",
      "Et si lâcher prise était la vraie force ?",
      "Et si votre fatigue essayait de vous dire quelque chose ?",
    ],
    bestFor: ['inspirant', 'personnel'],
  },
  {
    id: 'confession_simple',
    name: 'Confession simple',
    pattern: 'Honnêtement, [admission personnelle]',
    examples: [
      "Honnêtement, je n'ai pas toujours les réponses.",
      "Honnêtement, le changement ça prend du temps.",
      "Honnêtement, je comprends qu'on ait peur.",
    ],
    bestFor: ['personnel'],
  },
  {
    id: 'fragment_evocateur',
    name: 'Fragment évocateur',
    pattern: '[Action simple]. [Pause/impact].',
    examples: [
      "Respirer. Juste ça.",
      "S'arrêter. Enfin.",
      "Écouter. Sans chercher à répondre.",
    ],
    bestFor: ['inspirant'],
  },
  {
    id: 'paradoxe',
    name: 'Paradoxe',
    pattern: '[A] n\'est pas [attendu], c\'est [surprenant]',
    examples: [
      "La somatothérapie, ce n'est pas dormir. C'est se réveiller.",
      "Accepter, ce n'est pas abandonner. C'est choisir ses batailles.",
      "Le silence, ce n'est pas l'absence. C'est une présence différente.",
    ],
    bestFor: ['educatif', 'informatif'],
  },
];

// ===========================================
// Règles spécifiques Threads
// ===========================================

export const THREADS_RULES = {
  // Longueur
  minLength: 50,
  optimalLength: 150,
  maxLength: 250, // Bien en dessous des 500 pour rester "court"

  // Hashtags
  minHashtags: 0,
  maxHashtags: 1, // Quasi jamais de hashtags sur Threads
  hashtagStyle: 'Aucun hashtag ou 1 maximum en fin de post, jamais dans le corps du texte',

  // Formatage
  formatting: {
    lineBreaks: 'Minimal - 1 saut de ligne max pour créer une pause',
    emojis: 'Très rare - 1 maximum en fin de post si vraiment pertinent',
    links: 'Le lien est ajouté automatiquement après le texte, ne pas l\'inclure',
    mentions: 'Éviter sauf contexte spécifique',
  },

  // Ton
  tone: {
    do: [
      'Écrire comme on pense',
      'Phrases courtes et directes',
      'Assumer le "je" ou l\'impersonnel',
      'Laisser respirer le texte',
      'Finir sur une note ouverte',
    ],
    avoid: [
      'Appels à l\'action explicites',
      'Ton marketing ou promotionnel',
      'Listes à puces ou formatage élaboré',
      'Trop d\'émojis',
      'Phrases trop longues',
      'Introductions ("Dans cet article...")',
      'Conclusions récapitulatives',
    ],
  },
};

// ===========================================
// Fonctions utilitaires
// ===========================================

/**
 * Suggère un format Threads approprié selon le ton et l'angle
 */
export function suggestThreadsFormat(
  tone: ContentTone,
  angle: ContentAngle
): ThreadsPostFormat {
  const suggestions: Record<string, ThreadsPostFormat[]> = {
    // Informatif
    'informatif_benefices': ['contre_intuitif', 'pensee_brute'],
    'informatif_probleme': ['observation_cabinet', 'contre_intuitif'],
    'informatif_histoire': ['observation_cabinet'],
    'informatif_expert': ['observation_cabinet', 'contre_intuitif'],
    'informatif_pratique': ['pensee_brute'],

    // Inspirant
    'inspirant_benefices': ['fragment_poetique', 'pensee_brute'],
    'inspirant_probleme': ['question_ouverte', 'contre_intuitif'],
    'inspirant_histoire': ['fragment_poetique', 'micro_confession'],
    'inspirant_expert': ['pensee_brute', 'fragment_poetique'],
    'inspirant_pratique': ['fragment_poetique'],

    // Personnel
    'personnel_benefices': ['micro_confession', 'observation_cabinet'],
    'personnel_probleme': ['micro_confession', 'question_ouverte'],
    'personnel_histoire': ['micro_confession', 'observation_cabinet'],
    'personnel_expert': ['observation_cabinet', 'micro_confession'],
    'personnel_pratique': ['observation_cabinet'],

    // Éducatif
    'educatif_benefices': ['contre_intuitif', 'pensee_brute'],
    'educatif_probleme': ['contre_intuitif', 'observation_cabinet'],
    'educatif_histoire': ['observation_cabinet'],
    'educatif_expert': ['contre_intuitif', 'observation_cabinet'],
    'educatif_pratique': ['pensee_brute'],

    // Promotionnel (rare sur Threads, on garde soft)
    'promotionnel_benefices': ['pensee_brute', 'question_ouverte'],
    'promotionnel_probleme': ['question_ouverte'],
    'promotionnel_histoire': ['observation_cabinet'],
    'promotionnel_expert': ['contre_intuitif'],
    'promotionnel_pratique': ['pensee_brute'],
  };

  const key = `${tone}_${angle}`;
  const options = suggestions[key] || ['pensee_brute'];
  return options[0];
}

/**
 * Obtient les patterns d'accroche appropriés pour le ton
 */
export function getThreadsHookPatternsForTone(tone: ContentTone): ThreadsHookPattern[] {
  return THREADS_HOOK_PATTERNS.filter(hook => hook.bestFor.includes(tone));
}

/**
 * Suggère un niveau d'authenticité selon le ton
 */
export function suggestThreadsAuthenticityLevel(tone: ContentTone): ThreadsAuthenticityLevel {
  const suggestions: Record<ContentTone, ThreadsAuthenticityLevel> = {
    informatif: 2,
    educatif: 2,
    inspirant: 3,
    personnel: 4,
    promotionnel: 2,
  };
  return suggestions[tone] || 3;
}

/**
 * Valide qu'un contenu Threads respecte les règles
 */
export function validateThreadsContent(content: string): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Vérifier la longueur
  if (content.length > 500) {
    errors.push(`Le contenu dépasse 500 caractères (${content.length}). Maximum absolu Threads.`);
  } else if (content.length > THREADS_RULES.maxLength) {
    warnings.push(`Le contenu fait ${content.length} caractères. Idéalement moins de ${THREADS_RULES.maxLength}.`);
  }

  if (content.length < THREADS_RULES.minLength) {
    warnings.push(`Le contenu est très court (${content.length} caractères). Minimum suggéré: ${THREADS_RULES.minLength}.`);
  }

  // Vérifier les hashtags
  const hashtagCount = (content.match(/#\w+/g) || []).length;
  if (hashtagCount > THREADS_RULES.maxHashtags) {
    warnings.push(`Trop de hashtags (${hashtagCount}). Threads privilégie 0-1 hashtag.`);
  }

  // Vérifier les émojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojiCount = (content.match(emojiRegex) || []).length;
  if (emojiCount > 2) {
    warnings.push(`Beaucoup d'émojis (${emojiCount}). Threads préfère un style sobre.`);
  }

  // Vérifier les liens dans le contenu
  if (content.includes('http://') || content.includes('https://')) {
    warnings.push('Le lien devrait être ajouté automatiquement, pas dans le contenu.');
  }

  // Vérifier les call-to-action explicites
  const ctaPatterns = [
    /découvrez/i,
    /cliquez/i,
    /en savoir plus/i,
    /lien en bio/i,
    /suivez/i,
    /partagez/i,
    /abonnez/i,
  ];
  for (const pattern of ctaPatterns) {
    if (pattern.test(content)) {
      warnings.push('Éviter les call-to-action explicites sur Threads. Préférer un ton naturel.');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}
