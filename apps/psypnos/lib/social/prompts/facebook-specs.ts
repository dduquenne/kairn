// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Spécifications avancées pour la génération de posts Facebook
 *
 * Ce fichier contient les éléments natifs Facebook pour créer
 * des posts plus engageants et en accord avec les codes de la plateforme.
 *
 * Facebook privilégie :
 * - Le storytelling et les émotions
 * - Les posts conversationnels et authentiques
 * - Les questions qui suscitent des commentaires
 * - Un ton plus personnel que professionnel
 */

import type { FacebookPostFormat, FacebookToneLevel, ContentTone, ContentAngle } from '../types';

// ===========================================
// Formats de posts Facebook
// ===========================================

export interface FacebookFormatSpec {
  id: FacebookPostFormat;
  name: string;
  description: string;
  structure: string[];
  example: string;
  bestFor: string[];
  tips: string[];
  optimalLength: { min: number; max: number }; // en mots
}

export const FACEBOOK_FORMATS: Record<FacebookPostFormat, FacebookFormatSpec> = {
  confession: {
    id: 'confession',
    name: 'Confession / Réalisation',
    description: 'Partage d\'un apprentissage personnel ou d\'une prise de conscience professionnelle',
    structure: [
      'Accroche personnelle ("Je dois vous avouer...", "Il m\'a fallu du temps pour comprendre...")',
      'Contexte bref (1-2 phrases)',
      'La réalisation ou l\'apprentissage',
      'Comment cela a changé votre approche',
      'Question d\'engagement pour le lecteur',
      'Lien vers l\'article',
      '1-2 hashtags discrets',
    ],
    example: `Je dois vous avouer quelque chose...

Pendant longtemps, j'ai cru que l'hypnose était réservée aux gens "réceptifs".

Puis j'ai compris que tout le monde l'est. Différemment.

Ce qui change, c'est la façon dont on accompagne chaque personne vers cet état naturel.

Dans ce nouvel article, je vous explique pourquoi l'hypnose fonctionne pour tout le monde — et pourquoi certains pensent le contraire.

👉 [LIEN]

Et vous, avez-vous déjà essayé l'hypnose ? Qu'en avez-vous pensé ?

#hypnose #bienetre`,
    bestFor: ['Articles "Découvrir"', 'Déconstruction de mythes', 'Positionnement personnel'],
    tips: [
      'Commencer par "Je" crée une connexion immédiate',
      'Montrer une vulnérabilité contrôlée (erreur passée, apprentissage)',
      'Terminer par une question ouverte pour les commentaires',
    ],
    optimalLength: { min: 60, max: 120 },
  },

  question_provocante: {
    id: 'question_provocante',
    name: 'Question provocante',
    description: 'Remet en question une croyance commune pour susciter la réflexion',
    structure: [
      'Question contre-intuitive ou provocante',
      'Pause (saut de ligne)',
      'Développement qui intrigue (2-3 phrases)',
      'Promesse de réponse dans l\'article',
      'Lien',
      'Question d\'engagement',
    ],
    example: `Et si votre anxiété essayait de vous aider ?

Je sais, dit comme ça, ça semble absurde.

Pourtant, c'est exactement ce que j'observe en cabinet depuis 15 ans.
L'anxiété n'est pas votre ennemie — c'est un signal mal calibré.

Dans cet article, je vous partage comment changer votre relation à l'anxiété.

👉 [LIEN]

Ça vous parle ? Dites-le moi en commentaire 👇`,
    bestFor: ['Articles "Comprendre"', 'Sujets anxiété/stress', 'Changement de perspective'],
    tips: [
      'La question doit créer une dissonance cognitive',
      'Ne pas donner toute la réponse — créer la curiosité',
      'Valider l\'émotion du lecteur ("Je sais, ça semble...")',
    ],
    optimalLength: { min: 50, max: 100 },
  },

  micro_histoire: {
    id: 'micro_histoire',
    name: 'Micro-histoire',
    description: 'Courte anecdote de cabinet avec une leçon universelle',
    structure: [
      'Début in medias res ("Hier, une patiente m\'a dit...")',
      'La situation ou le dialogue',
      'Le tournant',
      'La leçon ou l\'insight',
      'Connexion avec le lecteur',
      'Lien vers l\'article pour aller plus loin',
    ],
    example: `Hier, une patiente m'a dit : "J'ai tout essayé, rien ne marche."

Je lui ai demandé : "Et qu'est-ce qui marcherait, selon vous ?"

Silence.

Puis elle a réalisé qu'elle cherchait la solution parfaite... au lieu de la solution qui lui convient.

Parfois, ce n'est pas la méthode qui bloque. C'est l'attente qu'on en a.

Vous aussi, vous attendez parfois la solution "parfaite" ?

👉 L'article qui pourrait vous aider : [LIEN]`,
    bestFor: ['Articles "Traverser"', 'Témoignages anonymisés', 'Insights de pratique'],
    tips: [
      'L\'anecdote doit être courte (3-5 phrases)',
      'Anonymiser complètement (pas de détails identifiants)',
      'La leçon doit être universelle et applicable',
    ],
    optimalLength: { min: 70, max: 130 },
  },

  liste_inversee: {
    id: 'liste_inversee',
    name: 'Liste inversée',
    description: 'Format "Ce que je ne fais plus" ou "Ce qui ne marche pas"',
    structure: [
      'Accroche avec chiffre et angle négatif/inversé',
      'Liste de 3-5 points avec brève explication',
      'Transition vers la solution',
      'Lien vers l\'article',
      'Question d\'engagement',
    ],
    example: `3 choses que je ne dis plus jamais à mes patients :

❌ "Il faut positiver" — ça invalide leurs émotions
❌ "Vous êtes trop sensible" — la sensibilité n'est pas un défaut
❌ "C'est dans votre tête" — oui, et alors ? C'est pas moins réel

Ce qu'on dit a un impact. Ce qu'on ne dit pas aussi.

Dans cet article, je vous parle de ce qui aide vraiment.

👉 [LIEN]

Et vous, quelle phrase vous a déjà blessé venant d'un "professionnel" ?`,
    bestFor: ['Articles éducatifs', 'Déconstruction de pratiques', 'Positionnement différenciant'],
    tips: [
      'L\'angle "négatif" attire plus l\'attention',
      'Chaque point doit être court (1 ligne + explication brève)',
      'Finir sur du positif (la solution existe)',
    ],
    optimalLength: { min: 80, max: 150 },
  },

  observation_cabinet: {
    id: 'observation_cabinet',
    name: 'Observation de cabinet',
    description: 'Partage d\'un pattern observé chez les patients',
    structure: [
      'Accroche "Ce que j\'observe..." ou "En 15 ans de pratique..."',
      'Le pattern ou la tendance observée',
      'Pourquoi c\'est important',
      'Ce que ça implique',
      'Lien vers l\'article qui approfondit',
      'Question pour valider avec l\'audience',
    ],
    example: `Ce que j'observe souvent en cabinet :

Les personnes anxieuses sont rarement "faibles".
Au contraire. Elles sont souvent très exigeantes envers elles-mêmes.

L'anxiété, c'est parfois le prix d'un sens des responsabilités hyper-développé.

Le travail n'est pas de "supprimer" l'anxiété.
C'est d'apprendre à la réguler.

👉 J'en parle plus en détail ici : [LIEN]

Vous vous reconnaissez dans cette description ?`,
    bestFor: ['Articles "Comprendre"', 'Insights cliniques', 'Positionnement expert'],
    tips: [
      'Montrer l\'expertise sans être condescendant',
      'Valider l\'expérience du lecteur',
      'Proposer un reframe positif',
    ],
    optimalLength: { min: 60, max: 110 },
  },

  avant_apres: {
    id: 'avant_apres',
    name: 'Avant / Après émotionnel',
    description: 'Transformation sans promesse thérapeutique, focus sur le vécu',
    structure: [
      'Description du "avant" (état émotionnel, pas symptômes)',
      'Le processus (sans détails cliniques)',
      'Le "après" (ressenti, pas résultats)',
      'Ce que ça nous apprend',
      'Invitation à découvrir l\'approche',
      'Lien',
    ],
    example: `Avant : "Je me sens submergé(e) en permanence"
Après : "J'ai appris à accueillir ce qui vient"

Ce n'est pas que les problèmes ont disparu.
C'est que la relation à ces problèmes a changé.

L'hypnose ne fait pas de miracles.
Elle ouvre un espace. Un espace où autre chose devient possible.

Si vous êtes curieux de découvrir comment, j'en parle dans cet article.

👉 [LIEN]`,
    bestFor: ['Articles "Cheminer"', 'Présentation des approches', 'Témoignages transformationnels'],
    tips: [
      'Ne jamais promettre de résultats spécifiques',
      'Focus sur le vécu émotionnel, pas les symptômes',
      'Rester humble ("ouvre un espace", pas "guérit")',
    ],
    optimalLength: { min: 50, max: 100 },
  },
};

// ===========================================
// Patterns d'accroche Facebook
// ===========================================

export interface FacebookHookPattern {
  id: string;
  name: string;
  pattern: string;
  examples: string[];
  bestFor: ContentTone[];
}

export const FACEBOOK_HOOK_PATTERNS: FacebookHookPattern[] = [
  {
    id: 'confession',
    name: 'Pattern "Confession"',
    pattern: 'Je dois vous avouer quelque chose...',
    examples: [
      'Je dois vous avouer quelque chose : j\'ai longtemps douté de l\'hypnose.',
      'Je dois être honnête avec vous...',
      'Il m\'a fallu des années pour comprendre ça...',
    ],
    bestFor: ['personnel', 'inspirant'],
  },
  {
    id: 'observation',
    name: 'Pattern "Observation"',
    pattern: 'Ce que j\'observe en cabinet depuis X ans...',
    examples: [
      'Ce que j\'observe en cabinet depuis 15 ans m\'a surpris.',
      'En 15 ans de pratique, une chose m\'a toujours frappé...',
      'Ce que je remarque souvent chez mes patients...',
    ],
    bestFor: ['informatif', 'educatif'],
  },
  {
    id: 'contre_intuitif',
    name: 'Pattern "Contre-intuitif"',
    pattern: 'Et si [croyance inverse] ?',
    examples: [
      'Et si votre anxiété essayait de vous aider ?',
      'Et si le problème n\'était pas le stress, mais comment vous le combattez ?',
      'Et si lâcher prise était la vraie force ?',
    ],
    bestFor: ['inspirant', 'educatif'],
  },
  {
    id: 'question_directe',
    name: 'Pattern "Question directe"',
    pattern: 'Vous êtes-vous déjà demandé pourquoi...',
    examples: [
      'Vous êtes-vous déjà demandé pourquoi certaines personnes gèrent mieux le stress ?',
      'Avez-vous déjà remarqué que...',
      'Est-ce que ça vous arrive aussi de...',
    ],
    bestFor: ['personnel', 'informatif'],
  },
  {
    id: 'moment_declic',
    name: 'Pattern "Moment déclic"',
    pattern: 'Ce moment où l\'on réalise que...',
    examples: [
      'Ce moment où l\'on réalise que tout ce qu\'on croyait savoir est faux.',
      'Il y a des moments qui changent tout.',
      'Parfois, une seule phrase suffit à tout bouleverser.',
    ],
    bestFor: ['inspirant', 'personnel'],
  },
  {
    id: 'erreur_commune',
    name: 'Pattern "Erreur commune"',
    pattern: 'L\'erreur que font 90% des personnes avec...',
    examples: [
      'L\'erreur que font la plupart des gens avec leur anxiété.',
      'Ce que presque tout le monde fait mal avec le stress.',
      'Le piège dans lequel tombent 9 personnes sur 10.',
    ],
    bestFor: ['educatif', 'informatif'],
  },
  {
    id: 'hier',
    name: 'Pattern "Hier"',
    pattern: 'Hier, [événement de cabinet]...',
    examples: [
      'Hier, une patiente m\'a dit quelque chose de bouleversant.',
      'Cette semaine, un patient m\'a posé LA question.',
      'Récemment, quelqu\'un m\'a demandé...',
    ],
    bestFor: ['personnel', 'inspirant'],
  },
  {
    id: 'verite_difficile',
    name: 'Pattern "Vérité difficile"',
    pattern: 'La vérité que personne ne veut entendre sur...',
    examples: [
      'La vérité que personne ne veut entendre sur le bien-être.',
      'Ce que les gens ne veulent pas savoir sur l\'hypnose.',
      'La réalité derrière le "tout va bien".',
    ],
    bestFor: ['educatif', 'informatif'],
  },
];

// ===========================================
// Appels à l'action Facebook
// ===========================================

export interface FacebookCTATemplate {
  id: string;
  category: 'commentaire' | 'partage' | 'reaction' | 'lien' | 'tag';
  templates: string[];
}

export const FACEBOOK_CTA_TEMPLATES: FacebookCTATemplate[] = [
  {
    id: 'commentaire',
    category: 'commentaire',
    templates: [
      'Et vous, qu\'en pensez-vous ?',
      'Ça vous parle ? Dites-le moi en commentaire 👇',
      'Vous vous reconnaissez dans cette description ?',
      'Partagez votre expérience en commentaire',
      'Quelqu\'un d\'autre vit ça ?',
      'D\'accord ou pas d\'accord ?',
      'Quelle est votre expérience avec ça ?',
    ],
  },
  {
    id: 'partage',
    category: 'partage',
    templates: [
      'Partagez si ça peut aider quelqu\'un autour de vous',
      'N\'hésitez pas à partager avec quelqu\'un qui en a besoin',
      'Partagez à quelqu\'un qui a besoin de lire ça aujourd\'hui',
    ],
  },
  {
    id: 'reaction',
    category: 'reaction',
    templates: [
      'Un ❤️ si ça vous parle',
      'Dites-moi avec un emoji comment vous vous sentez',
    ],
  },
  {
    id: 'lien',
    category: 'lien',
    templates: [
      '👉 Découvrez l\'article complet ici : [LIEN]',
      '👉 Pour aller plus loin : [LIEN]',
      '👉 L\'article qui en parle : [LIEN]',
      '👉 J\'en parle plus en détail ici : [LIEN]',
      '👉 Lire l\'article : [LIEN]',
    ],
  },
  {
    id: 'tag',
    category: 'tag',
    templates: [
      'Taguez quelqu\'un qui a besoin de lire ça',
      'Identifiez une personne à qui ça pourrait parler',
    ],
  },
];

// ===========================================
// Stratégie Émojis Facebook
// ===========================================

export interface FacebookEmojiStrategy {
  category: string;
  description: string;
  emojis: string[];
  usage: string;
}

export const FACEBOOK_EMOJI_STRATEGY: FacebookEmojiStrategy[] = [
  {
    category: 'direction',
    description: 'Pour pointer vers le lien ou le CTA',
    emojis: ['👉', '👇', '↓'],
    usage: 'Avant le lien ou pour inviter aux commentaires',
  },
  {
    category: 'contraste',
    description: 'Pour les listes et oppositions',
    emojis: ['❌', '✅', '→'],
    usage: 'Dans les formats liste inversée ou avant/après',
  },
  {
    category: 'accroche',
    description: 'Pour attirer l\'attention modérément',
    emojis: ['✨', '💫', '🌟'],
    usage: 'Un seul, en fin de phrase clé (pas en accroche)',
  },
  {
    category: 'thematique',
    description: 'En lien avec le bien-être et la thérapie',
    emojis: ['🧠', '💭', '🌱', '🦋', '🪷'],
    usage: 'Occasionnellement, en cohérence avec le sujet',
  },
];

// Émojis à éviter sur Facebook
export const FACEBOOK_EMOJIS_TO_AVOID = [
  '🔥', // Trop "marketing"
  '🚀', // Trop startup/coach
  '💪', // Trop fitness
  '🎯', // Trop corporate
  '😂', '🤣', // Inappropriés pour un praticien
  '🙏', // Suremployé
  '💯', // Trop familier
];

// ===========================================
// Niveaux de ton Facebook
// ===========================================

export interface FacebookToneSpec {
  level: FacebookToneLevel;
  name: string;
  description: string;
  characteristics: string[];
  exampleOpening: string;
}

export const FACEBOOK_TONE_LEVELS: Record<FacebookToneLevel, FacebookToneSpec> = {
  1: {
    level: 1,
    name: 'Informatif-chaleureux',
    description: 'Expert mais accessible, peu de "je"',
    characteristics: [
      'Utilise "on" et "vous"',
      'Partage des informations factuelles',
      'Ton bienveillant sans être personnel',
      'Focus sur la valeur éducative',
    ],
    exampleOpening: 'L\'hypnose ericksonienne est souvent mal comprise. Voici ce qu\'il faut vraiment savoir...',
  },
  2: {
    level: 2,
    name: 'Personnel-authentique',
    description: 'Partage d\'expériences et observations de pratique',
    characteristics: [
      'Utilise "je" régulièrement',
      'Partage des observations de cabinet',
      'Montre sa personnalité professionnelle',
      'Crée une connexion avec le lecteur',
    ],
    exampleOpening: 'Ce que j\'observe souvent en cabinet, c\'est que les personnes anxieuses sont loin d\'être faibles...',
  },
  3: {
    level: 3,
    name: 'Confidentiel-intime',
    description: 'Comme une confidence à un ami proche',
    characteristics: [
      'Vulnérabilité contrôlée',
      'Partage de doutes ou d\'apprentissages personnels',
      'Ton très proche et chaleureux',
      'Connexion émotionnelle forte',
    ],
    exampleOpening: 'Je dois être honnête avec vous : pendant longtemps, je n\'y croyais pas moi-même...',
  },
  4: {
    level: 4,
    name: 'Expert-accessible',
    description: 'Positionnement d\'expertise avec proximité',
    characteristics: [
      'Partage d\'insights professionnels',
      'Références à l\'expérience clinique',
      'Pédagogie et vulgarisation',
      'Autorité bienveillante',
    ],
    exampleOpening: 'Après 15 ans d\'accompagnement, une chose m\'a toujours frappé dans ma pratique...',
  },
};

// ===========================================
// Base de hashtags Facebook
// ===========================================

export interface FacebookHashtagCategory {
  id: string;
  name: string;
  hashtags: string[];
  priority: 'primary' | 'secondary';
}

export const FACEBOOK_HASHTAG_DATABASE: FacebookHashtagCategory[] = [
  {
    id: 'core',
    name: 'Hashtags principaux Psypnos',
    hashtags: ['hypnose', 'bienetre', 'psychotherapie'],
    priority: 'primary',
  },
  {
    id: 'pratiques',
    name: 'Pratiques spécifiques',
    hashtags: [
      'hypnoseericksonienne',
      'respirationholotropique',
      'therapiebreve',
    ],
    priority: 'secondary',
  },
  {
    id: 'themes',
    name: 'Thématiques',
    hashtags: [
      'gestiondustress',
      'anxiete',
      'developpementpersonnel',
      'santementale',
      'mieuxetre',
    ],
    priority: 'secondary',
  },
  {
    id: 'local',
    name: 'Géographique',
    hashtags: ['yonne', 'bourgogne', 'sens89'],
    priority: 'secondary',
  },
];

// ===========================================
// Fonctions utilitaires
// ===========================================

/**
 * Sélectionne un format Facebook approprié selon le ton et l'angle
 */
export function suggestFacebookFormat(
  tone: ContentTone,
  angle: ContentAngle
): FacebookPostFormat {
  const suggestions: Record<string, FacebookPostFormat[]> = {
    // Informatif
    'informatif_benefices': ['observation_cabinet', 'liste_inversee'],
    'informatif_probleme': ['question_provocante', 'liste_inversee'],
    'informatif_histoire': ['micro_histoire', 'observation_cabinet'],
    'informatif_expert': ['observation_cabinet', 'liste_inversee'],
    'informatif_pratique': ['liste_inversee', 'observation_cabinet'],

    // Inspirant
    'inspirant_benefices': ['avant_apres', 'confession'],
    'inspirant_probleme': ['question_provocante', 'confession'],
    'inspirant_histoire': ['micro_histoire', 'confession'],
    'inspirant_expert': ['observation_cabinet', 'confession'],
    'inspirant_pratique': ['avant_apres', 'observation_cabinet'],

    // Personnel
    'personnel_benefices': ['confession', 'micro_histoire'],
    'personnel_probleme': ['confession', 'question_provocante'],
    'personnel_histoire': ['micro_histoire', 'confession'],
    'personnel_expert': ['confession', 'observation_cabinet'],
    'personnel_pratique': ['micro_histoire', 'confession'],

    // Éducatif
    'educatif_benefices': ['liste_inversee', 'observation_cabinet'],
    'educatif_probleme': ['question_provocante', 'liste_inversee'],
    'educatif_histoire': ['micro_histoire', 'observation_cabinet'],
    'educatif_expert': ['observation_cabinet', 'liste_inversee'],
    'educatif_pratique': ['liste_inversee', 'observation_cabinet'],

    // Promotionnel
    'promotionnel_benefices': ['avant_apres', 'observation_cabinet'],
    'promotionnel_probleme': ['question_provocante', 'avant_apres'],
    'promotionnel_histoire': ['micro_histoire', 'avant_apres'],
    'promotionnel_expert': ['observation_cabinet', 'avant_apres'],
    'promotionnel_pratique': ['avant_apres', 'liste_inversee'],
  };

  const key = `${tone}_${angle}`;
  const options = suggestions[key] || ['observation_cabinet'];
  return options[0];
}

/**
 * Sélectionne des patterns d'accroche appropriés selon le ton
 */
export function getFacebookHookPatternsForTone(tone: ContentTone): FacebookHookPattern[] {
  return FACEBOOK_HOOK_PATTERNS.filter(hook => hook.bestFor.includes(tone));
}

/**
 * Génère des hashtags Facebook adaptés (2-3 max)
 */
export function generateFacebookHashtags(
  theme: string,
  count: number = 2
): string[] {
  const result: string[] = [];

  // Toujours inclure un hashtag core
  const coreCategory = FACEBOOK_HASHTAG_DATABASE.find(c => c.id === 'core');
  if (coreCategory) {
    // Sélectionner le hashtag core le plus pertinent selon le thème
    const themeLower = theme.toLowerCase();
    if (themeLower.includes('hypnose')) {
      result.push('hypnose');
    } else if (themeLower.includes('stress') || themeLower.includes('anxiété')) {
      result.push('bienetre');
    } else {
      result.push(coreCategory.hashtags[0]);
    }
  }

  // Ajouter un hashtag thématique si pertinent
  const themesCategory = FACEBOOK_HASHTAG_DATABASE.find(c => c.id === 'themes');
  if (themesCategory && result.length < count) {
    const themeLower = theme.toLowerCase();
    for (const tag of themesCategory.hashtags) {
      if (themeLower.includes(tag.replace('gestion', '').replace('du', ''))) {
        result.push(tag);
        break;
      }
    }
  }

  // Compléter si nécessaire
  if (result.length < count) {
    const practicesCategory = FACEBOOK_HASHTAG_DATABASE.find(c => c.id === 'pratiques');
    if (practicesCategory) {
      for (const tag of practicesCategory.hashtags) {
        if (!result.includes(tag) && result.length < count) {
          result.push(tag);
          break;
        }
      }
    }
  }

  return Array.from(new Set(result)).slice(0, count);
}

/**
 * Obtient un CTA Facebook approprié selon la catégorie
 */
export function getRandomFacebookCTA(category: FacebookCTATemplate['category']): string {
  const ctaGroup = FACEBOOK_CTA_TEMPLATES.find(c => c.category === category);
  if (!ctaGroup) return '👉 Découvrez l\'article complet ici : [LIEN]';
  const templates = ctaGroup.templates;
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Suggère un niveau de ton Facebook selon la catégorie d'article
 */
export function suggestFacebookToneLevel(articleCategory: string): FacebookToneLevel {
  const categoryMap: Record<string, FacebookToneLevel> = {
    'comprendre': 1, // Informatif-chaleureux
    'traverser': 3, // Confidentiel-intime (sujets émotionnels)
    'découvrir': 2, // Personnel-authentique
    'cheminer': 2, // Personnel-authentique
  };

  const categoryLower = articleCategory.toLowerCase();
  for (const [key, level] of Object.entries(categoryMap)) {
    if (categoryLower.includes(key)) {
      return level;
    }
  }

  return 2; // Par défaut : Personnel-authentique
}
