// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Spécifications des plateformes pour la génération de contenu
 *
 * Définit les caractéristiques, contraintes et bonnes pratiques
 * pour chaque réseau social supporté.
 */

import type { SocialPlatform, ContentTone, ContentAngle } from '../types';

// ===========================================
// Spécifications par plateforme
// ===========================================

export interface PlatformGenerationSpec {
  platform: SocialPlatform;
  name: string;

  // Limites de texte
  minLength: number;
  optimalLength: number;
  maxLength: number;

  // Ton et style
  tone: string;
  style: string;

  // Structure recommandée
  structure: string[];

  // Hashtags
  minHashtags: number;
  optimalHashtags: number;
  maxHashtags: number;
  hashtagStyle: string;

  // Particularités
  supportsLinks: boolean;
  linkPlacement: 'inline' | 'comment' | 'bio';
  supportsEmojis: boolean;
  emojiUsage: 'minimal' | 'moderate' | 'liberal';

  // Conseils spécifiques
  tips: string[];
  avoid: string[];

  // Exemples de structure
  exampleStructure: string;
}

export const PLATFORM_GENERATION_SPECS: Record<SocialPlatform, PlatformGenerationSpec> = {
  FACEBOOK: {
    platform: 'FACEBOOK',
    name: 'Facebook',

    minLength: 30,
    optimalLength: 80,
    maxLength: 200,

    tone: 'chaleureux et accessible',
    style: 'conversationnel, comme une discussion entre amis',

    structure: [
      'Accroche émotionnelle ou question',
      'Contexte bref (1-2 phrases)',
      'Bénéfice ou insight clé',
      'Appel à l\'action direct avec lien',
      '1-2 hashtags discrets',
    ],

    minHashtags: 0,
    optimalHashtags: 2,
    maxHashtags: 3,
    hashtagStyle: 'discrets en fin de post',

    supportsLinks: true,
    linkPlacement: 'inline',
    supportsEmojis: true,
    emojiUsage: 'moderate',

    tips: [
      'Commencer par une question ou une émotion',
      'Utiliser le "vous" pour créer de la proximité',
      'Inclure le lien vers l\'article',
      'Les posts avec images génèrent plus d\'engagement',
      'Horaires optimaux : 9h-10h et 13h-14h en semaine',
    ],

    avoid: [
      'Textes trop longs (plus de 200 mots)',
      'Trop de hashtags (max 3)',
      'Ton trop professionnel ou distant',
      'Promesses thérapeutiques exagérées',
    ],

    exampleStructure: `Et si votre anxiété était un messager plutôt qu'un ennemi ? 🌿

L'hypnose ericksonienne nous apprend à écouter ces signaux autrement.
Dans ce nouvel article, je vous partage 3 clés pour transformer votre relation à l'anxiété.

👉 Découvrez l'article complet : [LIEN]

#hypnose #bienetre`,
  },

  LINKEDIN: {
    platform: 'LINKEDIN',
    name: 'LinkedIn',

    minLength: 100,
    optimalLength: 200,
    maxLength: 400,

    tone: 'professionnel et expert',
    style: 'informatif avec une touche personnelle, positionnement d\'expert',

    structure: [
      'Hook percutant (première ligne visible)',
      'Saut de ligne',
      'Développement en paragraphes courts (2-3 lignes max)',
      'Liste à puces si pertinent (3-5 points)',
      'Question d\'engagement',
      '---',
      '3-5 hashtags professionnels',
      '[Lien en premier commentaire]',
    ],

    minHashtags: 3,
    optimalHashtags: 5,
    maxHashtags: 7,
    hashtagStyle: 'professionnels et ciblés, après une ligne de séparation',

    supportsLinks: true,
    linkPlacement: 'comment',
    supportsEmojis: true,
    emojiUsage: 'minimal',

    tips: [
      'La première ligne est cruciale (visible avant le "voir plus")',
      'Paragraphes très courts (1-3 lignes)',
      'Utiliser les flèches (→) pour les listes',
      'Poser une question pour encourager les commentaires',
      'Mettre le lien en premier commentaire pour un meilleur reach',
      'Horaires optimaux : 7h-8h et 12h-13h (mardi-jeudi)',
    ],

    avoid: [
      'Textes en bloc sans aération',
      'Trop d\'émojis',
      'Ton trop décontracté',
      'Lien direct dans le post (réduit la portée)',
    ],

    exampleStructure: `J'accompagne des dirigeants depuis 15 ans.

Une constante : le burn-out ne prévient pas.
Il s'installe en silence.

Voici les 3 signaux que j'observe systématiquement :

→ Une fatigue que le repos ne soulage plus
→ Un détachement émotionnel progressif
→ Une perte de sens dans les actions quotidiennes

La bonne nouvelle ? Ces signaux sont réversibles.

Quel signal vous parle le plus ?

---
#burnout #bienetre #psychotherapie #developpementpersonnel #sante

[Lien vers l'article en commentaire]`,
  },

  INSTAGRAM: {
    platform: 'INSTAGRAM',
    name: 'Instagram',

    minLength: 80,
    optimalLength: 150,
    maxLength: 300,

    tone: 'inspirant et visuel',
    style: 'poétique et évocateur, connexion émotionnelle',

    structure: [
      'Première ligne captivante (visible avant "...plus")',
      'Saut de ligne',
      'Corps du texte avec sauts de ligne fréquents',
      'Appel à l\'action (sauvegarder, commenter)',
      '"Lien en bio" si pertinent',
      '.',
      '.',
      '.',
      '5-10 hashtags en bloc',
    ],

    minHashtags: 5,
    optimalHashtags: 10,
    maxHashtags: 15,
    hashtagStyle: 'en bloc à la fin après des points de séparation',

    supportsLinks: false,
    linkPlacement: 'bio',
    supportsEmojis: true,
    emojiUsage: 'moderate',

    tips: [
      'La première ligne doit donner envie de cliquer sur "plus"',
      'Utiliser des sauts de ligne pour aérer',
      'Émojis en début de ligne pour le visuel',
      'Encourager à sauvegarder le post',
      'Rappeler le lien en bio',
      'Les 3 points avant les hashtags les "cachent" visuellement',
      'Horaires optimaux : 11h-13h et 19h-21h',
    ],

    avoid: [
      'Texte en bloc sans aération',
      'Mettre des liens (ils ne sont pas cliquables)',
      'Trop de hashtags non pertinents',
      'Oublier l\'appel à l\'action',
    ],

    exampleStructure: `Le silence de la méditation vous effraie ? C'est normal. ✨

Notre esprit n'est pas habitué au calme.
Il cherche constamment à s'occuper.

La respiration holotropique offre une alternative :
Un voyage intérieur actif et guidé.

→ Sauvegardez ce post si vous voulez essayer
→ Lien vers l'article complet en bio

.
.
.
#respirationholotropique #meditation #developpementpersonnel
#therapie #bienetre #hypnose #psychotherapie #yonne
#saintjuliendusault #consciencea`,
  },

  TWITTER: {
    platform: 'TWITTER',
    name: 'Twitter/X',

    minLength: 50,
    optimalLength: 100,
    maxLength: 280,

    tone: 'concis et percutant',
    style: 'direct, informatif, parfois provocateur',

    structure: [
      'Message principal concis',
      'Lien vers l\'article',
      '1-2 hashtags',
    ],

    minHashtags: 0,
    optimalHashtags: 2,
    maxHashtags: 3,
    hashtagStyle: 'intégrés au texte ou en fin',

    supportsLinks: true,
    linkPlacement: 'inline',
    supportsEmojis: true,
    emojiUsage: 'minimal',

    tips: [
      'Aller droit au but',
      'Utiliser des threads pour développer',
      'Les visuels augmentent l\'engagement',
    ],

    avoid: [
      'Dépasser 280 caractères',
      'Trop de hashtags',
    ],

    exampleStructure: `L'hypnose ericksonienne n'est pas ce que vous croyez.

Ce n'est pas du spectacle, c'est une conversation avec votre inconscient.

Découvrez comment dans ce nouvel article 👇
[LIEN]

#hypnose #bienetre`,
  },

  THREADS: {
    platform: 'THREADS',
    name: 'Threads',

    // IMPORTANT: Ces valeurs sont en CARACTÈRES, pas en mots
    // Threads a une limite stricte de 500 caractères
    // On vise beaucoup plus court pour respecter la culture de la plateforme
    minLength: 50,
    optimalLength: 150,
    maxLength: 250, // Bien en dessous des 500 pour rester authentique

    tone: 'authentique et humain - comme une pensée à voix haute',
    style: 'spontané, brut, conversationnel - pas de marketing, pas de structure',

    structure: [
      'Une pensée directe et percutante (1-2 phrases courtes)',
      'Optionnel: une nuance ou question ouverte',
      'Le lien est ajouté automatiquement après',
    ],

    minHashtags: 0,
    optimalHashtags: 0,
    maxHashtags: 1,
    hashtagStyle: 'AUCUN hashtag idéalement - Threads privilégie le contenu brut et authentique',

    supportsLinks: true,
    linkPlacement: 'inline',
    supportsEmojis: true,
    emojiUsage: 'minimal', // 1 emoji max, en fin de post si vraiment pertinent

    tips: [
      'TRÈS COURT : viser 100-150 caractères idéalement',
      'Écrire comme on pense, pas comme on vend',
      'Une seule idée par post, pas de développement',
      'Pas d\'introduction ("Dans cet article...") - entrer direct',
      'Finir sur une note ouverte ou suspendue',
      'Le silence et les pauses sont des forces',
      'Phrases courtes. Rythme haché. Respiration.',
      'L\'imperfection est plus authentique que le poli',
    ],

    avoid: [
      'Posts trop longs (garder sous 200 caractères)',
      'Appels à l\'action explicites (découvrez, cliquez, lien en bio)',
      'Hashtags (0-1 max, et seulement si vraiment pertinent)',
      'Ton corporate, marketing ou promotionnel',
      'Listes à puces ou formatage élaboré',
      'Émojis en excès (1 max)',
      'Introductions et conclusions',
      'Phrases trop longues ou complexes',
    ],

    exampleStructure: `L'anxiété n'est pas votre ennemie. C'est un messager.`,
  },
};

// ===========================================
// Tons de contenu
// ===========================================

export interface ToneSpec {
  id: ContentTone;
  name: string;
  description: string;
  keywords: string[];
  promptInstructions: string;
}

export const CONTENT_TONES: Record<ContentTone, ToneSpec> = {
  informatif: {
    id: 'informatif',
    name: 'Informatif',
    description: 'Factuel et éducatif, partage de connaissances',
    keywords: ['savoir', 'comprendre', 'découvrir', 'apprendre'],
    promptInstructions: 'Adopte un ton informatif et éducatif. Partage des connaissances de manière claire et accessible. Utilise des faits et des explications.',
  },
  inspirant: {
    id: 'inspirant',
    name: 'Inspirant',
    description: 'Motivant et encourageant, suscite l\'espoir',
    keywords: ['possible', 'transformer', 'grandir', 'potentiel'],
    promptInstructions: 'Adopte un ton inspirant et motivant. Suscite l\'espoir et l\'envie de changement. Utilise des formulations positives et encourageantes.',
  },
  promotionnel: {
    id: 'promotionnel',
    name: 'Promotionnel',
    description: 'Met en avant les services et bénéfices',
    keywords: ['découvrir', 'bénéficier', 'profiter', 'rdv'],
    promptInstructions: 'Adopte un ton promotionnel mais subtil. Met en avant les bénéfices sans être trop commercial. Inclus un appel à l\'action clair.',
  },
  educatif: {
    id: 'educatif',
    name: 'Éducatif',
    description: 'Pédagogique, vulgarisation de concepts',
    keywords: ['expliquer', 'définir', 'illustrer', 'démontrer'],
    promptInstructions: 'Adopte un ton pédagogique. Vulgarise les concepts sans les simplifier à l\'excès. Utilise des exemples concrets.',
  },
  personnel: {
    id: 'personnel',
    name: 'Personnel',
    description: 'Partage d\'expérience, témoignage',
    keywords: ['j\'ai', 'mon expérience', 'je remarque', 'personnellement'],
    promptInstructions: 'Adopte un ton personnel et authentique. Partage depuis ton expérience de praticien. Crée une connexion humaine.',
  },
};

// ===========================================
// Angles de contenu
// ===========================================

export interface AngleSpec {
  id: ContentAngle;
  name: string;
  description: string;
  focusPoints: string[];
  promptInstructions: string;
}

export const CONTENT_ANGLES: Record<ContentAngle, AngleSpec> = {
  benefices: {
    id: 'benefices',
    name: 'Bénéfices',
    description: 'Focus sur les avantages et résultats',
    focusPoints: ['résultats', 'transformation', 'amélioration', 'gain'],
    promptInstructions: 'Concentre-toi sur les bénéfices concrets pour le lecteur. Qu\'est-ce qu\'il va gagner ? Comment sa vie peut s\'améliorer ?',
  },
  probleme: {
    id: 'probleme',
    name: 'Problème',
    description: 'Identification du problème et solution',
    focusPoints: ['difficulté', 'défi', 'obstacle', 'solution'],
    promptInstructions: 'Commence par identifier un problème ou une difficulté commune. Montre que tu comprends, puis présente la solution apportée par l\'article.',
  },
  histoire: {
    id: 'histoire',
    name: 'Histoire',
    description: 'Approche narrative et storytelling',
    focusPoints: ['récit', 'parcours', 'transformation', 'témoignage'],
    promptInstructions: 'Utilise une approche narrative. Raconte une histoire ou un parcours. Engage émotionnellement le lecteur.',
  },
  expert: {
    id: 'expert',
    name: 'Expert',
    description: 'Point de vue professionnel et expertise',
    focusPoints: ['expertise', 'expérience', 'observation', 'conseil'],
    promptInstructions: 'Positionne-toi en expert du domaine. Partage des insights professionnels. Apporte de la valeur par ton expertise.',
  },
  pratique: {
    id: 'pratique',
    name: 'Pratique',
    description: 'Conseils concrets et applicables',
    focusPoints: ['conseils', 'astuces', 'étapes', 'méthode'],
    promptInstructions: 'Donne des conseils pratiques et applicables immédiatement. Liste des actions concrètes. Sois utile et actionnable.',
  },
};
