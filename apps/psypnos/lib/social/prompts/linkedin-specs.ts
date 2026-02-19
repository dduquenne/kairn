/**
 * Spécifications avancées pour la génération de posts LinkedIn
 *
 * Ce fichier contient les éléments natifs LinkedIn pour créer
 * des posts plus engageants et en accord avec les codes de la plateforme.
 *
 * LinkedIn privilégie :
 * - Le positionnement d'expertise et la crédibilité
 * - Les observations professionnelles et insights de terrain
 * - Les posts qui génèrent des commentaires (algorithme favorise l'engagement)
 * - Un formatage aéré avec paragraphes courts
 * - Les listes à puces et flèches visuelles
 */

import type {
  LinkedInPostFormat,
  LinkedInExpertiseLevel,
  ContentTone,
  ContentAngle,
} from '../types';

// ===========================================
// Formats de posts LinkedIn
// ===========================================

export interface LinkedInFormatSpec {
  id: LinkedInPostFormat;
  name: string;
  description: string;
  structure: string[];
  example: string;
  bestFor: string[];
  tips: string[];
  optimalLength: { min: number; max: number }; // en mots
}

export const LINKEDIN_FORMATS: Record<LinkedInPostFormat, LinkedInFormatSpec> = {
  observation_pro: {
    id: 'observation_pro',
    name: 'Observation professionnelle',
    description: "Partage d'une observation de terrain qui démontre l'expertise",
    structure: [
      'Accroche avec durée d\'expérience ("J\'accompagne depuis X ans...", "En 15 ans de pratique...")',
      "L'observation ou le pattern constaté",
      "Pourquoi c'est important (2-3 phrases)",
      'Ce que cela nous apprend',
      "Question d'engagement pour le lecteur",
      'Lien en commentaire mentionné',
      '3-5 hashtags professionnels',
    ],
    example: `J'accompagne des dirigeants depuis 15 ans.

Une constante : le burn-out ne prévient pas.

Il s'installe dans le silence.
Dans les "ça va aller".
Dans les week-ends qui ne rechargent plus.

Ce que j'observe systématiquement :

→ Une fatigue que le repos ne soulage plus
→ Un détachement émotionnel progressif
→ Une perte de sens dans les actions quotidiennes

La bonne nouvelle ?
Ces signaux sont réversibles. Mais il faut les voir.

Quel signal résonne le plus pour vous ?

---
Lien vers l'article complet en commentaire 👇

#burnout #bienetre #psychotherapie #santementale #dirigeants`,
    bestFor: ['Articles "Comprendre"', 'Insights cliniques', 'Positionnement expert'],
    tips: [
      "Commencer par établir la crédibilité (années d'expérience)",
      'Utiliser des flèches → pour les listes',
      'Paragraphes ultra-courts (1-3 lignes max)',
      "Terminer par une question ouverte qui invite au partage d'expérience",
    ],
    optimalLength: { min: 80, max: 180 },
  },

  contre_intuition: {
    id: 'contre_intuition',
    name: 'Contre-intuition',
    description: 'Remet en question une croyance commune de manière professionnelle',
    structure: [
      'Affirmation contre-intuitive ("Ce qu\'on croit : X. La réalité : Y.")',
      'Pause (saut de ligne)',
      'Explication du paradoxe (2-3 phrases)',
      'Illustration concrète',
      'La nuance ou le reframe',
      'Question de réflexion',
      'Mention du lien en commentaire',
    ],
    example: `L'anxiété n'est pas votre problème.

Je sais. Dit comme ça, ça surprend.

Pourtant, en 15 ans d'accompagnement, j'ai observé ceci :

L'anxiété est souvent le symptôme d'autre chose.
→ Une exigence excessive envers soi-même
→ Un besoin de contrôle qui déborde
→ Des limites qui n'ont jamais été posées

Ce n'est pas l'anxiété qu'il faut "combattre".
C'est le message qu'elle porte qu'il faut écouter.

Ça change tout dans l'accompagnement.

Quelle est votre relation avec l'anxiété ?

---
J'approfondis ce sujet dans un article → lien en commentaire

#anxiete #santementale #psychotherapie #bienetre`,
    bestFor: [
      'Déconstruction de mythes',
      'Changement de perspective',
      'Positionnement différenciant',
    ],
    tips: [
      "L'affirmation doit créer une dissonance cognitive",
      'Ne pas donner toute la réponse — créer la curiosité',
      "Valider l'émotion du lecteur",
      'Proposer un reframe positif sans être moralisateur',
    ],
    optimalLength: { min: 70, max: 150 },
  },

  liste_puces: {
    id: 'liste_puces',
    name: 'Liste structurée',
    description: 'Format "3 signes que...", "5 erreurs...", etc.',
    structure: [
      'Accroche avec chiffre et promesse de valeur',
      'Introduction courte (1-2 phrases)',
      'Liste de 3-5 points avec flèches ou numéros',
      'Chaque point = 1-2 phrases max',
      'Transition vers le lien',
      "Question d'engagement",
    ],
    example: `3 signaux que le stress chronique s'est installé :

(Que vous ne reconnaissez peut-être pas)

1️⃣ Vous dormez mais vous êtes toujours fatigué
Le sommeil ne régénère plus. Le corps est en alerte permanente.

2️⃣ Les petites choses vous irritent
Avant, ça passait. Maintenant, tout devient "trop".

3️⃣ Vous avez du mal à profiter des bons moments
Même en vacances, la tête ne déconnecte pas vraiment.

Ce ne sont pas des faiblesses.
Ce sont des signaux.

Vous vous reconnaissez dans l'un d'eux ?

---
Plus de détails dans l'article (lien en commentaire)

#stress #burnout #bienetre #santementale`,
    bestFor: ['Articles éducatifs', 'Conseils pratiques', 'Contenu à forte valeur ajoutée'],
    tips: [
      'Le chiffre doit être précis (3, 5, 7 — pas "plusieurs")',
      'Chaque point doit être auto-suffisant',
      'Utiliser des émojis numérotés ou des flèches',
      'Le dernier point peut être le plus impactant',
    ],
    optimalLength: { min: 100, max: 200 },
  },

  storytelling_court: {
    id: 'storytelling_court',
    name: 'Storytelling court',
    description: "Récit d'accompagnement anonymisé en 3 actes",
    structure: [
      'Début in medias res ("Récemment, un patient m\'a dit...")',
      'Le contexte et la problématique (anonymisé)',
      'Le tournant ou la prise de conscience',
      'Ce que cela nous apprend',
      'Ouverture vers le lecteur',
      'Lien pour approfondir',
    ],
    example: `"Je n'arrive plus à décrocher."

C'est ce que m'a dit un dirigeant récemment.

Week-ends, vacances, soirées — son cerveau tournait en permanence.
Il avait tout essayé : sport, méditation apps, "digital detox".

Le problème ?

Il cherchait à SUPPRIMER les pensées.
Au lieu de comprendre ce qu'elles lui demandaient.

En hypnose, on ne cherche pas à "vider la tête".
On apprend à dialoguer avec elle.

Trois séances plus tard, quelque chose avait changé.
Pas sa charge de travail. Sa relation à cette charge.

Vous aussi, vous cherchez à "décrocher" sans y arriver ?

---
J'en parle plus en détail dans mon dernier article → commentaire

#hypnose #stress #dirigeants #bienetre #santementale`,
    bestFor: ['Articles "Traverser"', 'Témoignages de pratique', 'Connexion émotionnelle'],
    tips: [
      'Anonymiser complètement (aucun détail identifiant)',
      "L'histoire doit avoir une résolution ou un insight",
      'Focus sur le vécu émotionnel, pas les symptômes cliniques',
      'Le lecteur doit pouvoir se reconnaître',
    ],
    optimalLength: { min: 90, max: 180 },
  },

  question_provocante: {
    id: 'question_provocante',
    name: 'Question provocante',
    description: 'Question qui remet en cause les certitudes',
    structure: [
      'Question provocante ou paradoxale',
      'Pause (saut de ligne)',
      'Développement qui intrigue (3-4 phrases)',
      'Élément de réponse (sans tout dévoiler)',
      "Question de relance pour l'engagement",
      "Invitation à découvrir l'article",
    ],
    example: `Et si le problème n'était pas le stress ?

Mais la façon dont vous le combattez ?

J'observe souvent ça en cabinet.

Des personnes épuisées.
Qui luttent.
Qui résistent.
Qui se battent contre elles-mêmes.

Le stress ne disparaît pas quand on le combat.
Il s'amplifie.

Ce qui change la donne ?
Apprendre à l'accueillir autrement.

Paradoxal ? Peut-être.
Efficace ? Systématiquement.

Ça vous parle ?

---
L'article complet est en commentaire

#stress #bienetre #gestiondustress #psychotherapie`,
    bestFor: ['Articles "Comprendre"', 'Changement de paradigme', 'Engagement fort'],
    tips: [
      'La question doit toucher une croyance courante',
      'Ne pas donner la réponse complète — créer la curiosité',
      'Le développement doit créer un "aha moment"',
      'Terminer par une question simple qui invite au partage',
    ],
    optimalLength: { min: 60, max: 130 },
  },

  temoignage_terrain: {
    id: 'temoignage_terrain',
    name: 'Témoignage terrain',
    description: 'Partage authentique de la pratique quotidienne',
    structure: [
      'Ancrage temporel ("Cette semaine...", "Récemment...")',
      'La situation ou le moment vécu',
      "La réflexion qu'il a suscitée",
      "L'insight ou l'apprentissage",
      "Connexion avec l'expérience du lecteur",
      'Lien vers un contenu qui approfondit',
    ],
    example: `Cette semaine, quelque chose m'a frappé.

Trois personnes différentes.
Trois profils différents.
Même phrase exacte :

"J'ai l'impression de ne jamais en faire assez."

Ce n'est pas un hasard.

C'est le signe d'une époque.
Où la performance est devenue une injonction.
Où le repos est vécu comme une faiblesse.
Où "prendre soin de soi" est encore culpabilisant.

Mon travail, souvent, c'est de rappeler une évidence :
Vous avez le droit d'aller bien.

Vous aussi, vous vous reconnaissez dans cette phrase ?

---
J'écris régulièrement sur ces sujets → lien en commentaire

#bienetre #santementale #burnout #developpementpersonnel`,
    bestFor: ['Articles "Cheminer"', 'Authenticité', 'Connexion humaine'],
    tips: [
      "L'ancrage temporel crée de l'authenticité",
      'Montrer une observation récurrente renforce la crédibilité',
      "L'insight doit être universel",
      'Éviter le ton moralisateur',
    ],
    optimalLength: { min: 80, max: 160 },
  },
};

// ===========================================
// Patterns d'accroche LinkedIn
// ===========================================

export interface LinkedInHookPattern {
  id: string;
  name: string;
  pattern: string;
  examples: string[];
  bestFor: ContentTone[];
}

export const LINKEDIN_HOOK_PATTERNS: LinkedInHookPattern[] = [
  {
    id: 'statistique_choc',
    name: 'Pattern "Statistique choc"',
    pattern: "[Pourcentage] des [audience] que j'accompagne partagent ce point commun.",
    examples: [
      "85% des dirigeants que j'accompagne partagent ce point commun.",
      '9 personnes sur 10 que je reçois en cabinet font cette erreur.',
      "70% de mes patients découvrent ceci pendant l'accompagnement.",
    ],
    bestFor: ['informatif', 'educatif'],
  },
  {
    id: 'affirmation_contre_intuitive',
    name: 'Pattern "Contre-intuitif"',
    pattern: "[Élément perçu négativement] n'est pas [ce qu'on croit].",
    examples: [
      "L'anxiété n'est pas votre problème.",
      "Le stress n'est pas votre ennemi.",
      "La procrastination n'est pas de la paresse.",
    ],
    bestFor: ['inspirant', 'educatif'],
  },
  {
    id: 'confession_pro',
    name: 'Pattern "Confession professionnelle"',
    pattern: "Pendant [durée], j'ai cru que...",
    examples: [
      "Pendant 10 ans, j'ai cru que l'hypnose ne fonctionnait que sur certaines personnes.",
      'Au début de ma pratique, je pensais que...',
      "J'ai longtemps cru que la thérapie devait être longue pour être efficace.",
    ],
    bestFor: ['personnel', 'inspirant'],
  },
  {
    id: 'question_rhetorique',
    name: 'Pattern "Question rhétorique"',
    pattern: 'Et si [croyance inverse] ?',
    examples: [
      'Et si votre fatigue était un message ?',
      "Et si le problème n'était pas le stress ?",
      'Et si lâcher prise était la vraie force ?',
    ],
    bestFor: ['inspirant', 'educatif'],
  },
  {
    id: 'observation_terrain',
    name: 'Pattern "Observation terrain"',
    pattern: "Ce que j'observe en cabinet depuis [X] ans :",
    examples: [
      "Ce que j'observe en cabinet depuis 15 ans :",
      'Ce que je constate systématiquement chez mes patients :',
      "En 15 ans de pratique, une chose m'a toujours frappé :",
    ],
    bestFor: ['informatif', 'personnel'],
  },
  {
    id: 'mythe_brise',
    name: 'Pattern "Mythe brisé"',
    pattern: 'On vous a menti sur [sujet].',
    examples: [
      'On vous a menti sur le burn-out.',
      "Ce qu'on ne vous dit pas sur l'hypnose.",
      'La vérité que personne ne veut entendre sur le stress.',
    ],
    bestFor: ['educatif', 'informatif'],
  },
  {
    id: 'ancrage_temporel',
    name: 'Pattern "Ancrage temporel"',
    pattern: "Cette semaine, [événement] m'a fait réaliser...",
    examples: [
      "Cette semaine, une conversation m'a marqué.",
      "Récemment, un patient m'a dit quelque chose de bouleversant.",
      "Hier, j'ai compris quelque chose d'important.",
    ],
    bestFor: ['personnel', 'inspirant'],
  },
  {
    id: 'citation_patient',
    name: 'Pattern "Citation patient"',
    pattern: '"[Citation courte du patient]"',
    examples: [
      '"Je n\'arrive plus à décrocher."',
      '"J\'ai l\'impression de ne jamais en faire assez."',
      '"Je ne sais plus qui je suis vraiment."',
    ],
    bestFor: ['personnel', 'inspirant'],
  },
];

// ===========================================
// Appels à l'action LinkedIn
// ===========================================

export interface LinkedInCTATemplate {
  id: string;
  category: 'commentaire' | 'partage' | 'lien' | 'reflexion' | 'connexion';
  templates: string[];
}

export const LINKEDIN_CTA_TEMPLATES: LinkedInCTATemplate[] = [
  {
    id: 'commentaire',
    category: 'commentaire',
    templates: [
      'Quel signal résonne le plus pour vous ?',
      'Vous vous reconnaissez dans cette description ?',
      'Ça vous parle ?',
      'Et vous, quelle est votre expérience ?',
      'Vous aussi, vous vivez ça ?',
      "Qu'en pensez-vous ?",
      "D'accord ou pas d'accord ?",
    ],
  },
  {
    id: 'reflexion',
    category: 'reflexion',
    templates: [
      'Quelle est votre relation avec [sujet] ?',
      'Comment gérez-vous ça au quotidien ?',
      "Qu'est-ce qui a fonctionné pour vous ?",
      "C'est quelque chose que vous avez déjà ressenti ?",
    ],
  },
  {
    id: 'lien',
    category: 'lien',
    templates: [
      "Lien vers l'article complet en commentaire 👇",
      "J'approfondis ce sujet dans un article → lien en commentaire",
      "Plus de détails dans l'article (lien en commentaire)",
      "L'article complet est en commentaire",
      '---\nLien en commentaire pour aller plus loin',
    ],
  },
  {
    id: 'partage',
    category: 'partage',
    templates: [
      "Partagez si ça peut aider quelqu'un dans votre réseau",
      "N'hésitez pas à partager avec quelqu'un qui en a besoin",
      "Taguez quelqu'un qui devrait lire ça",
    ],
  },
  {
    id: 'connexion',
    category: 'connexion',
    templates: [
      'Suivez-moi pour plus de contenu sur la santé mentale',
      'Je publie régulièrement sur ces sujets',
      'Activez la cloche pour ne rien manquer 🔔',
    ],
  },
];

// ===========================================
// Stratégie de formatage LinkedIn
// ===========================================

export interface LinkedInFormattingRule {
  id: string;
  name: string;
  description: string;
  example: string;
}

export const LINKEDIN_FORMATTING_RULES: LinkedInFormattingRule[] = [
  {
    id: 'paragraphes_courts',
    name: 'Paragraphes ultra-courts',
    description: 'Maximum 1-3 lignes par paragraphe pour faciliter la lecture sur mobile',
    example:
      'Pas ça :\n"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."\n\nMais ça :\n"Lorem ipsum dolor sit amet.\n\nConsectetur adipiscing elit.\n\nSed do eiusmod tempor."',
  },
  {
    id: 'fleches',
    name: 'Flèches visuelles',
    description: 'Utiliser → pour les listes au lieu de tirets classiques',
    example: '→ Premier point\n→ Deuxième point\n→ Troisième point',
  },
  {
    id: 'separateur',
    name: 'Séparateur avant le lien',
    description: 'Utiliser --- pour séparer visuellement le contenu du CTA/lien',
    example: 'Votre contenu ici...\n\n---\nLien en commentaire 👇',
  },
  {
    id: 'espacement',
    name: 'Espacement généreux',
    description: 'Laisser des lignes vides entre les sections pour aérer',
    example: 'Première idée.\n\n\nDeuxième idée.\n\n\nConclusion.',
  },
  {
    id: 'emojis_nombres',
    name: 'Émojis numérotés pour les listes',
    description: 'Utiliser 1️⃣ 2️⃣ 3️⃣ pour les listes numérotées',
    example: '1️⃣ Premier point\n\n2️⃣ Deuxième point\n\n3️⃣ Troisième point',
  },
];

// ===========================================
// Stratégie Émojis LinkedIn
// ===========================================

export interface LinkedInEmojiStrategy {
  category: string;
  description: string;
  emojis: string[];
  usage: string;
}

export const LINKEDIN_EMOJI_STRATEGY: LinkedInEmojiStrategy[] = [
  {
    category: 'direction',
    description: 'Pour pointer vers le lien ou le CTA',
    emojis: ['👇', '👉', '↓'],
    usage: 'Un seul, pour indiquer le commentaire ou le lien',
  },
  {
    category: 'listes',
    description: 'Pour les listes numérotées',
    emojis: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'],
    usage: 'Pour structurer les points clés',
  },
  {
    category: 'contraste',
    description: 'Pour les oppositions',
    emojis: ['→', '✓', '✗'],
    usage: 'Dans les formats liste ou avant/après',
  },
  {
    category: 'notification',
    description: "Pour l'engagement",
    emojis: ['🔔'],
    usage: 'Uniquement pour inviter à suivre (avec parcimonie)',
  },
];

// Émojis à éviter sur LinkedIn
export const LINKEDIN_EMOJIS_TO_AVOID = [
  '🔥', // Trop "bro culture"
  '🚀', // Suremployé, perd son impact
  '💪', // Trop fitness/motivation
  '🎯', // Trop corporate/objectifs
  '💰', // Trop commercial
  '😂',
  '🤣', // Trop familier pour LinkedIn
  '💯', // Trop familier
  '🙏', // Suremployé
  '✨', // Trop Instagram
  '❤️', // Réserver aux réactions
];

// ===========================================
// Niveaux d'expertise LinkedIn
// ===========================================

export interface LinkedInExpertiseSpec {
  level: LinkedInExpertiseLevel;
  name: string;
  description: string;
  characteristics: string[];
  exampleOpening: string;
  recommendedFormats: LinkedInPostFormat[];
}

export const LINKEDIN_EXPERTISE_LEVELS: Record<LinkedInExpertiseLevel, LinkedInExpertiseSpec> = {
  1: {
    level: 1,
    name: 'Informatif neutre',
    description: 'Partage d\'information factuelle, peu de "je"',
    characteristics: [
      'Utilise "on" et "nous"',
      'Partage des informations générales',
      'Ton bienveillant mais distant',
      'Focus sur la valeur éducative',
    ],
    exampleOpening: 'Le burn-out se caractérise par trois dimensions principales...',
    recommendedFormats: ['liste_puces', 'contre_intuition'],
  },
  2: {
    level: 2,
    name: 'Observateur',
    description: "Partage d'observations sans trop s'impliquer personnellement",
    characteristics: [
      'Utilise "je remarque", "j\'observe"',
      'Partage des patterns constatés',
      "Montre l'expérience sans la mettre en avant",
      'Crédibilité implicite',
    ],
    exampleOpening:
      'Je remarque souvent que les personnes anxieuses partagent cette caractéristique...',
    recommendedFormats: ['observation_pro', 'liste_puces'],
  },
  3: {
    level: 3,
    name: 'Expert accessible',
    description: 'Expertise affirmée avec proximité et humilité',
    characteristics: [
      "Références à l'expérience (années de pratique)",
      "Partage d'insights professionnels",
      'Pédagogie et vulgarisation',
      'Autorité bienveillante',
    ],
    exampleOpening: "En 15 ans d'accompagnement, une chose m'a toujours frappé...",
    recommendedFormats: ['observation_pro', 'storytelling_court', 'temoignage_terrain'],
  },
  4: {
    level: 4,
    name: 'Autorité affirmée',
    description: 'Positionnement fort, déclarations assumées',
    characteristics: [
      'Affirmations directes',
      'Déconstruction de mythes',
      'Prise de position claire',
      "Leadership d'opinion",
    ],
    exampleOpening: 'Voici ce que la plupart des gens ignorent sur le stress...',
    recommendedFormats: ['contre_intuition', 'question_provocante'],
  },
  5: {
    level: 5,
    name: 'Témoignage personnel',
    description: "Vulnérabilité contrôlée, partage d'expérience personnelle",
    characteristics: [
      'Partage de son propre parcours',
      'Vulnérabilité professionnelle',
      'Authenticité maximale',
      'Connexion émotionnelle forte',
    ],
    exampleOpening: "J'ai moi-même traversé une période difficile. Voici ce que j'ai appris...",
    recommendedFormats: ['storytelling_court', 'temoignage_terrain'],
  },
};

// ===========================================
// Base de hashtags LinkedIn
// ===========================================

export interface LinkedInHashtagCategory {
  id: string;
  name: string;
  tier: 'niche' | 'medium' | 'large';
  hashtags: string[];
  description: string;
}

export const LINKEDIN_HASHTAG_DATABASE: LinkedInHashtagCategory[] = [
  // Tier NICHE (ciblage précis)
  {
    id: 'pratiques',
    name: 'Pratiques spécifiques',
    tier: 'niche',
    hashtags: [
      'hypnoseericksonienne',
      'respirationholotropique',
      'therapiebreve',
      'hypnotherapie',
      'psychotherapietranspersonnelle',
    ],
    description: 'Hashtags métier très ciblés',
  },
  {
    id: 'local',
    name: 'Géographique',
    tier: 'niche',
    hashtags: ['yonne', 'bourgogne', 'bourgognefranchecomte'],
    description: 'Ancrage territorial',
  },
  // Tier MEDIUM (visibilité équilibrée)
  {
    id: 'themes',
    name: 'Thématiques',
    tier: 'medium',
    hashtags: [
      'gestiondustress',
      'burnoutprevention',
      'equilibrevie',
      'mieuxetre',
      'accompagnement',
    ],
    description: 'Thématiques de pratique',
  },
  {
    id: 'audience',
    name: 'Audience cible',
    tier: 'medium',
    hashtags: ['dirigeants', 'entrepreneurs', 'rh', 'managers', 'leadership'],
    description: 'Ciblage professionnel',
  },
  // Tier LARGE (découvrabilité)
  {
    id: 'core',
    name: 'Hashtags principaux',
    tier: 'large',
    hashtags: ['bienetre', 'santementale', 'psychotherapie', 'developpementpersonnel', 'hypnose'],
    description: 'Hashtags à forte visibilité',
  },
  {
    id: 'tendances',
    name: 'Tendances',
    tier: 'large',
    hashtags: ['mentalhealth', 'wellbeing', 'mindfulness', 'stress', 'burnout'],
    description: 'Hashtags tendance internationaux',
  },
];

// ===========================================
// Règles LinkedIn essentielles
// ===========================================

export const LINKEDIN_RULES = {
  optimalLength: {
    min: 100,
    max: 200,
    description: 'Longueur optimale en mots',
  },
  hashtagStrategy: {
    optimal: 4,
    min: 3,
    max: 5,
    placement: 'À la fin du post, après le séparateur',
    style: 'Mélanger 1 niche + 2 medium + 1-2 large',
  },
  linkPlacement: 'Toujours en commentaire (meilleur reach)',
  formatting: {
    paragraphs: 'Maximum 3 lignes par paragraphe',
    spacing: 'Ligne vide entre chaque paragraphe',
    separator: '--- avant le CTA/lien',
    emojis: 'Minimal et stratégique (max 3-4 par post)',
  },
  timing: {
    bestDays: ['mardi', 'mercredi', 'jeudi'],
    bestHours: ['7h-8h', '12h-13h', '17h-18h'],
    avoid: ['week-end', 'après 19h'],
  },
  engagement: {
    rule: 'LinkedIn favorise les posts qui génèrent des commentaires dans les 90 premières minutes',
    tip: 'Toujours terminer par une question ouverte',
  },
  tone: {
    do: [
      'Paragraphes ultra-courts (1-3 lignes)',
      'Sauts de ligne généreux',
      'Flèches → pour les listes',
      "Question d'engagement en fin de post",
      'Lien mentionné "en commentaire"',
      'Ton expert mais accessible',
    ],
    avoid: [
      'Blocs de texte compacts',
      'Plus de 5 hashtags',
      'Émojis excessifs',
      'Ton trop promotionnel',
      'Jargon technique sans explication',
      'Promesses thérapeutiques',
    ],
  },
};

// ===========================================
// Fonctions utilitaires
// ===========================================

/**
 * Sélectionne un format LinkedIn approprié selon le ton et l'angle
 */
export function suggestLinkedInFormat(tone: ContentTone, angle: ContentAngle): LinkedInPostFormat {
  const suggestions: Record<string, LinkedInPostFormat[]> = {
    // Informatif
    informatif_benefices: ['liste_puces', 'observation_pro'],
    informatif_probleme: ['contre_intuition', 'liste_puces'],
    informatif_histoire: ['storytelling_court', 'observation_pro'],
    informatif_expert: ['observation_pro', 'liste_puces'],
    informatif_pratique: ['liste_puces', 'observation_pro'],

    // Inspirant
    inspirant_benefices: ['storytelling_court', 'temoignage_terrain'],
    inspirant_probleme: ['question_provocante', 'contre_intuition'],
    inspirant_histoire: ['storytelling_court', 'temoignage_terrain'],
    inspirant_expert: ['observation_pro', 'contre_intuition'],
    inspirant_pratique: ['temoignage_terrain', 'liste_puces'],

    // Personnel
    personnel_benefices: ['temoignage_terrain', 'storytelling_court'],
    personnel_probleme: ['question_provocante', 'temoignage_terrain'],
    personnel_histoire: ['storytelling_court', 'temoignage_terrain'],
    personnel_expert: ['observation_pro', 'temoignage_terrain'],
    personnel_pratique: ['temoignage_terrain', 'storytelling_court'],

    // Éducatif
    educatif_benefices: ['liste_puces', 'observation_pro'],
    educatif_probleme: ['contre_intuition', 'liste_puces'],
    educatif_histoire: ['storytelling_court', 'observation_pro'],
    educatif_expert: ['observation_pro', 'liste_puces'],
    educatif_pratique: ['liste_puces', 'observation_pro'],

    // Promotionnel
    promotionnel_benefices: ['observation_pro', 'liste_puces'],
    promotionnel_probleme: ['question_provocante', 'contre_intuition'],
    promotionnel_histoire: ['storytelling_court', 'temoignage_terrain'],
    promotionnel_expert: ['observation_pro', 'liste_puces'],
    promotionnel_pratique: ['liste_puces', 'observation_pro'],
  };

  const key = `${tone}_${angle}`;
  const options = suggestions[key] || ['observation_pro'];
  return options[0]!;
}

/**
 * Sélectionne des patterns d'accroche appropriés selon le ton
 */
export function getLinkedInHookPatternsForTone(tone: ContentTone): LinkedInHookPattern[] {
  return LINKEDIN_HOOK_PATTERNS.filter(hook => hook.bestFor.includes(tone));
}

/**
 * Génère des hashtags LinkedIn adaptés selon la stratégie en 3 tiers
 */
export function generateLinkedInHashtags(theme: string, count: number = 4): string[] {
  const result: string[] = [];
  const themeLower = theme.toLowerCase();

  // 1. Ajouter un hashtag niche si pertinent
  const nicheCategories = LINKEDIN_HASHTAG_DATABASE.filter(c => c.tier === 'niche');
  for (const category of nicheCategories) {
    if (result.length >= 1) break;
    for (const tag of category.hashtags) {
      if (themeLower.includes(tag.replace(/[^a-z]/g, '').substring(0, 5))) {
        result.push(tag);
        break;
      }
    }
  }

  // 2. Ajouter des hashtags medium
  const mediumCategories = LINKEDIN_HASHTAG_DATABASE.filter(c => c.tier === 'medium');
  for (const category of mediumCategories) {
    if (result.length >= 3) break;
    for (const tag of category.hashtags) {
      if (!result.includes(tag)) {
        // Vérifier la pertinence thématique
        if (
          (themeLower.includes('stress') && tag.includes('stress')) ||
          (themeLower.includes('burn') && tag.includes('burn')) ||
          (themeLower.includes('dirigeant') && tag === 'dirigeants') ||
          (themeLower.includes('entrepre') && tag === 'entrepreneurs') ||
          result.length < 2 // Ajouter de toute façon si on n'a pas assez
        ) {
          result.push(tag);
          if (result.length >= 3) break;
        }
      }
    }
  }

  // 3. Compléter avec des hashtags large
  const largeCategories = LINKEDIN_HASHTAG_DATABASE.filter(c => c.tier === 'large');
  for (const category of largeCategories) {
    if (result.length >= count) break;
    for (const tag of category.hashtags) {
      if (!result.includes(tag) && result.length < count) {
        // Prioriser selon le thème
        if (
          (themeLower.includes('hypnose') && tag === 'hypnose') ||
          (themeLower.includes('stress') && tag === 'stress') ||
          (themeLower.includes('burn') && tag === 'burnout') ||
          tag === 'bienetre' ||
          tag === 'santementale'
        ) {
          result.push(tag);
        }
      }
    }
  }

  // Compléter si pas assez
  if (result.length < count) {
    const defaults = ['bienetre', 'santementale', 'psychotherapie', 'developpementpersonnel'];
    for (const tag of defaults) {
      if (!result.includes(tag) && result.length < count) {
        result.push(tag);
      }
    }
  }

  return Array.from(new Set(result)).slice(0, count);
}

/**
 * Obtient un CTA LinkedIn approprié selon la catégorie
 */
export function getRandomLinkedInCTA(category: LinkedInCTATemplate['category']): string {
  const ctaGroup = LINKEDIN_CTA_TEMPLATES.find(c => c.category === category);
  if (!ctaGroup) return "Lien vers l'article complet en commentaire 👇";
  const templates = ctaGroup.templates;
  return (
    templates[Math.floor(Math.random() * templates.length)] ||
    "Lien vers l'article complet en commentaire 👇"
  );
}

/**
 * Suggère un niveau d'expertise selon la catégorie d'article
 */
export function suggestLinkedInExpertiseLevel(articleCategory: string): LinkedInExpertiseLevel {
  const categoryMap: Record<string, LinkedInExpertiseLevel> = {
    comprendre: 2, // Observateur
    traverser: 4, // Autorité affirmée (sujets émotionnels)
    découvrir: 3, // Expert accessible
    cheminer: 3, // Expert accessible
  };

  const categoryLower = articleCategory.toLowerCase();
  for (const [key, level] of Object.entries(categoryMap)) {
    if (categoryLower.includes(key)) {
      return level;
    }
  }

  return 3; // Par défaut : Expert accessible
}
