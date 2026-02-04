/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Spécifications avancées pour la génération de posts Instagram
 *
 * Ce fichier contient les éléments natifs Instagram pour créer
 * des posts plus engageants et en accord avec les codes de la plateforme.
 */

import type { InstagramPostFormat, AuthenticityLevel, ContentTone, ContentAngle } from '../types';

// ===========================================
// Formats de posts Instagram
// ===========================================

export interface InstagramFormatSpec {
  id: InstagramPostFormat;
  name: string;
  description: string;
  structure: string[];
  example: string;
  bestFor: string[];
  tips: string[];
}

export const INSTAGRAM_FORMATS: Record<InstagramPostFormat, InstagramFormatSpec> = {
  hook_reveal: {
    id: 'hook_reveal',
    name: 'Hook + Reveal',
    description: 'Accroche choc en première ligne, révélation progressive du message',
    structure: [
      'Accroche percutante (max 125 caractères, visible avant "...plus")',
      'Saut de ligne',
      'Élément de suspense ou transition',
      'Révélation progressive (2-3 phrases courtes)',
      'Message clé ou leçon',
      'CTA engageant',
      'Séparateur (3 points)',
      'Hashtags en bloc',
    ],
    example: `Stop. Ce que vous croyez savoir sur l'hypnose est probablement faux.

Non, vous n'allez pas aboyer comme un chien.
Non, vous ne perdrez pas le contrôle.

L'hypnose ericksonienne, c'est simplement une conversation avec votre inconscient.

Un espace où le changement devient possible.

→ Sauvegardez si vous voulez en savoir plus

.
.
.
#hypnose #hypnoseericksonienne #bienetre`,
    bestFor: ['Articles informatifs', 'Déconstruction de mythes', 'Contenus éducatifs'],
    tips: [
      'Le premier mot doit créer un "arrêt" mental',
      'Créer de la tension avant la révélation',
      'La révélation doit apporter une vraie valeur',
    ],
  },

  liste_visuelle: {
    id: 'liste_visuelle',
    name: 'Liste visuelle',
    description: 'Format "X signes/conseils/erreurs" avec émojis numérotés',
    structure: [
      'Titre accrocheur avec chiffre ("3 signes que...", "5 erreurs qui...")',
      'Saut de ligne',
      'Point 1 avec émoji numéroté (1️⃣)',
      'Point 2 avec émoji numéroté (2️⃣)',
      'Point 3 avec émoji numéroté (3️⃣)',
      '(Optionnel: points 4 et 5)',
      'Saut de ligne',
      'Conclusion ou question engageante',
      'CTA',
      'Séparateur et hashtags',
    ],
    example: `3 signes que votre corps vous demande une pause 🧠

1️⃣ Vous vous réveillez fatigué(e), même après 8h de sommeil

2️⃣ Les petites contrariétés deviennent insurmontables

3️⃣ Vous avez du mal à vous concentrer plus de 10 minutes

Vous vous reconnaissez ?

C'est peut-être le moment d'écouter ces signaux.

→ Quel signe résonne le plus avec vous ? Dites-le en commentaire

.
.
.
#burnout #fatigue #bienetre #ecouter`,
    bestFor: ['Conseils pratiques', 'Symptômes/signaux', 'Listes de bénéfices'],
    tips: [
      'Le chiffre dans le titre attire l\'attention',
      'Chaque point doit être concis (1 ligne idéalement)',
      'Utiliser les émojis numérotés pour la lisibilité',
    ],
  },

  micro_storytelling: {
    id: 'micro_storytelling',
    name: 'Micro-storytelling',
    description: 'Petite histoire personnelle avec une leçon ou un apprentissage',
    structure: [
      'Début de l\'histoire (situation initiale)',
      'Saut de ligne',
      'Développement (le problème ou le défi)',
      'Le tournant',
      'La leçon ou l\'apprentissage',
      'Saut de ligne',
      'Connexion avec le lecteur',
      'CTA',
      'Séparateur et hashtags',
    ],
    example: `Il y a 5 ans, je ne croyais pas à l'hypnose.

Je pensais que c'était du spectacle.
Des gens qui font semblant sur scène.

Puis j'ai vécu ma première séance.

Pas de pendule. Pas de "dormez".
Juste une conversation profonde avec moi-même.

Ce jour-là, quelque chose a changé.

Et vous, avez-vous déjà été surpris par quelque chose que vous pensiez connaître ?

.
.
.
#hypnose #transformation #developpementpersonnel`,
    bestFor: ['Témoignages', 'Parcours du praticien', 'Transformations clients (anonymisées)'],
    tips: [
      'Commencer in medias res (au milieu de l\'action)',
      'Être vulnérable et authentique',
      'La leçon doit être universelle',
    ],
  },

  question_rhethorique: {
    id: 'question_rhethorique',
    name: 'Question rhétorique',
    description: 'Question provocante ou inattendue suivie d\'une réponse qui surprend',
    structure: [
      'Question provocante ou contre-intuitive',
      'Saut de ligne',
      'Pause ou relance ("La réponse va vous surprendre")',
      'Réponse développée',
      'Explication ou nuance',
      'Saut de ligne',
      'Question ouverte au lecteur',
      'CTA',
      'Séparateur et hashtags',
    ],
    example: `Et si votre anxiété était votre meilleure alliée ?

Je sais, ça semble contre-intuitif.

Mais l'anxiété est avant tout un signal.
Elle vous dit : "Attention, quelque chose mérite ton attention."

Le problème n'est pas l'anxiété elle-même.
C'est de ne pas savoir l'écouter.

Comment vous sentez-vous quand je dis ça ?

→ Partagez votre ressenti en commentaire

.
.
.
#anxiete #gestiondustress #sante`,
    bestFor: ['Sujets controversés', 'Changement de perspective', 'Déconstruction d\'idées reçues'],
    tips: [
      'La question doit créer une dissonance cognitive',
      'La réponse doit être vraiment surprenante',
      'Terminer par une question pour engager',
    ],
  },

  citation_reflexion: {
    id: 'citation_reflexion',
    name: 'Citation + Réflexion',
    description: 'Citation inspirante suivie d\'une réflexion personnelle',
    structure: [
      'Citation entre guillemets',
      'Attribution (auteur)',
      'Saut de ligne',
      'Réflexion personnelle sur la citation',
      'Application concrète ou exemple',
      'Saut de ligne',
      'Question au lecteur',
      'CTA',
      'Séparateur et hashtags',
    ],
    example: `"Entre le stimulus et la réponse, il y a un espace. Dans cet espace réside notre pouvoir de choisir."

— Viktor Frankl

Cet espace, c'est exactement ce que l'hypnose permet d'agrandir.

Elle crée une pause.
Un moment pour choisir autrement.

Pour ne plus réagir en pilote automatique.

Quelle est la réaction automatique que vous aimeriez changer ?

.
.
.
#citation #viktorfrankl #hypnose #changement`,
    bestFor: ['Contenu inspirant', 'Réflexions profondes', 'Positionnement expert'],
    tips: [
      'Choisir des citations peu connues si possible',
      'La réflexion doit apporter un angle personnel',
      'Relier la citation au domaine d\'expertise',
    ],
  },

  mythe_realite: {
    id: 'mythe_realite',
    name: 'Mythe vs Réalité',
    description: 'Déconstruction d\'une idée reçue avec explication de la réalité',
    structure: [
      'Introduction du mythe ("On vous a dit que...")',
      'Saut de ligne',
      '❌ Le mythe (en gras ou avec émoji)',
      'Saut de ligne',
      '✅ La réalité',
      'Explication développée',
      'Saut de ligne',
      'Conclusion ou invitation',
      'CTA',
      'Séparateur et hashtags',
    ],
    example: `On vous a dit que méditer, c'est "ne penser à rien" ?

❌ MYTHE : La méditation = vide mental total

✅ RÉALITÉ : La méditation, c'est observer ses pensées sans s'y accrocher.

Votre esprit va vagabonder.
C'est normal.
C'est même le but.

L'exercice, c'est de remarquer... et de revenir.

Encore. Et encore.

Sauvegardez ce post si ça vous parle

.
.
.
#meditation #mytheetréalité #bienetre #mindfulness`,
    bestFor: ['Éducation', 'Déconstruction de préjugés', 'Positionnement expert'],
    tips: [
      'Le mythe doit être vraiment répandu',
      'La réalité doit être claire et rassurante',
      'Utiliser les émojis ❌ et ✅ pour le contraste visuel',
    ],
  },
};

// ===========================================
// Patterns d'accroche (Hooks)
// ===========================================

export interface HookPattern {
  id: string;
  name: string;
  pattern: string;
  examples: string[];
  bestFor: ContentTone[];
}

export const INSTAGRAM_HOOK_PATTERNS: HookPattern[] = [
  {
    id: 'stop',
    name: 'Pattern "Arrêt"',
    pattern: 'Stop. [affirmation contre-intuitive ou révélation]',
    examples: [
      'Stop. L\'hypnose n\'est pas ce que vous croyez.',
      'Stop. Votre anxiété essaie de vous dire quelque chose.',
      'Stop. Vous n\'avez pas besoin de "tout contrôler".',
    ],
    bestFor: ['informatif', 'educatif'],
  },
  {
    id: 'confession',
    name: 'Pattern "Confession"',
    pattern: 'Je vais être honnête avec vous... [révélation personnelle]',
    examples: [
      'Je vais être honnête avec vous : je n\'y croyais pas non plus.',
      'Je vais être honnête : ce n\'est pas toujours facile.',
      'Je vais être honnête avec vous : le changement prend du temps.',
    ],
    bestFor: ['personnel', 'inspirant'],
  },
  {
    id: 'chiffre_choc',
    name: 'Pattern "Chiffre choc"',
    pattern: '[X]% des gens [comportement commun]. Et si [alternative] ?',
    examples: [
      '80% des gens respirent mal sans le savoir.',
      '9 personnes sur 10 confondent hypnose et manipulation.',
      '1 adulte sur 3 souffre de troubles du sommeil.',
    ],
    bestFor: ['informatif', 'educatif'],
  },
  {
    id: 'contraste',
    name: 'Pattern "Contraste"',
    pattern: 'Ce n\'est pas [A], c\'est [B].',
    examples: [
      'Ce n\'est pas de la faiblesse, c\'est du courage.',
      'Ce n\'est pas perdre le contrôle, c\'est le retrouver.',
      'Ce n\'est pas fuir ses émotions, c\'est les accueillir.',
    ],
    bestFor: ['inspirant', 'educatif'],
  },
  {
    id: 'interpellation',
    name: 'Pattern "Interpellation"',
    pattern: 'Vous aussi vous [comportement/ressenti commun] ?',
    examples: [
      'Vous aussi vous avez du mal à déconnecter le soir ?',
      'Vous aussi vous vous sentez parfois submergé(e) ?',
      'Vous aussi vous repoussez toujours ce moment pour vous ?',
    ],
    bestFor: ['personnel', 'inspirant'],
  },
  {
    id: 'promesse',
    name: 'Pattern "Promesse"',
    pattern: 'Ce que personne ne vous dit sur [sujet]...',
    examples: [
      'Ce que personne ne vous dit sur la méditation...',
      'Ce que personne ne vous dit sur l\'hypnose...',
      'Ce que personne ne vous dit sur la gestion du stress...',
    ],
    bestFor: ['informatif', 'educatif'],
  },
  {
    id: 'et_si',
    name: 'Pattern "Et si"',
    pattern: 'Et si [perspective inattendue] ?',
    examples: [
      'Et si votre anxiété était un messager ?',
      'Et si le problème n\'était pas vous ?',
      'Et si lâcher prise était la vraie force ?',
    ],
    bestFor: ['inspirant', 'personnel'],
  },
  {
    id: 'verite_inconfortable',
    name: 'Pattern "Vérité inconfortable"',
    pattern: 'La vérité que vous n\'avez pas envie d\'entendre : [vérité]',
    examples: [
      'La vérité que vous n\'avez pas envie d\'entendre : personne ne viendra vous sauver.',
      'La vérité que vous n\'avez pas envie d\'entendre : le changement demande du travail.',
      'La vérité que vous n\'avez pas envie d\'entendre : vous méritez de prendre soin de vous.',
    ],
    bestFor: ['personnel', 'inspirant'],
  },
];

// ===========================================
// Appels à l'action (CTA)
// ===========================================

export interface CTATemplate {
  id: string;
  category: 'engagement' | 'sauvegarde' | 'partage' | 'discussion' | 'action';
  templates: string[];
}

export const INSTAGRAM_CTA_TEMPLATES: CTATemplate[] = [
  {
    id: 'engagement',
    category: 'engagement',
    templates: [
      '→ Dites-moi en commentaire : [question ouverte]',
      '→ Taguez quelqu\'un qui a besoin de lire ça',
      '→ Double-tap si ça résonne avec vous',
      '→ Lequel de ces points vous parle le plus ?',
      '→ Partagez votre expérience en commentaire',
    ],
  },
  {
    id: 'sauvegarde',
    category: 'sauvegarde',
    templates: [
      '→ Sauvegardez ce post pour y revenir',
      '→ Gardez ce post sous le coude',
      '→ Épinglez pour ne pas oublier',
      '→ Sauvegardez si ça vous parle',
      '→ À garder précieusement',
    ],
  },
  {
    id: 'partage',
    category: 'partage',
    templates: [
      '→ Partagez en story si vous êtes d\'accord',
      '→ Envoyez à quelqu\'un qui en a besoin',
      '→ Partagez avec quelqu\'un qui traverse ça',
      '→ Story si ça vous parle',
    ],
  },
  {
    id: 'discussion',
    category: 'discussion',
    templates: [
      '→ D\'accord ou pas d\'accord ? Dites-moi',
      '→ Qu\'en pensez-vous ?',
      '→ Votre avis m\'intéresse',
      '→ Ça vous parle ?',
      '→ Vous vous reconnaissez ?',
    ],
  },
  {
    id: 'action',
    category: 'action',
    templates: [
      '→ Testez dès aujourd\'hui',
      '→ Essayez et dites-moi',
      '→ Commencez par [action simple]',
      '→ Lien en bio pour aller plus loin',
      '→ RDV en bio pour en savoir plus',
    ],
  },
];

// ===========================================
// Stratégie Émojis
// ===========================================

export interface EmojiStrategy {
  category: string;
  description: string;
  emojis: string[];
  usage: string;
}

export const INSTAGRAM_EMOJI_STRATEGY: EmojiStrategy[] = [
  {
    category: 'ouverture',
    description: 'Émojis pour attirer l\'attention en début de post',
    emojis: ['✨', '🔥', '⚡', '💫', '🌟', '✴️'],
    usage: 'Un seul en fin de première ligne pour attirer l\'œil',
  },
  {
    category: 'structure',
    description: 'Émojis pour structurer visuellement le texte',
    emojis: ['→', '•', '▪️', '➤', '↳', '»'],
    usage: 'En début de ligne pour les listes et CTA',
  },
  {
    category: 'numeros',
    description: 'Émojis numérotés pour les listes',
    emojis: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'],
    usage: 'Pour les formats "liste visuelle"',
  },
  {
    category: 'contraste',
    description: 'Émojis pour marquer les oppositions',
    emojis: ['❌', '✅', '⚠️', '💡'],
    usage: 'Pour les formats "mythe vs réalité"',
  },
  {
    category: 'thematique_mental',
    description: 'Émojis thématiques pour le bien-être mental',
    emojis: ['🧠', '💭', '🌀', '🔮', '🪷', '🧘'],
    usage: 'Avec parcimonie, en cohérence avec le sujet',
  },
  {
    category: 'thematique_emotion',
    description: 'Émojis thématiques pour les émotions',
    emojis: ['💫', '✨', '🌱', '🦋', '🌈', '☀️'],
    usage: 'Pour les contenus inspirants et transformationnels',
  },
];

// Émojis à éviter
export const INSTAGRAM_EMOJIS_TO_AVOID = [
  '😂', '🤣', // Trop familiers pour un praticien
  '👍', '👎', // Trop génériques
  '🙏', // Suremployé
  '💪', // Peut sembler "coach fitness"
  '🎯', // Trop corporate
  '🚀', // Trop startup
];

// ===========================================
// Niveaux d'authenticité
// ===========================================

export interface AuthenticitySpec {
  level: AuthenticityLevel;
  name: string;
  description: string;
  characteristics: string[];
  exampleOpening: string;
}

export const AUTHENTICITY_LEVELS: Record<AuthenticityLevel, AuthenticitySpec> = {
  1: {
    level: 1,
    name: 'Professionnel',
    description: 'Ton expert, informatif, peu de "je"',
    characteristics: [
      'Utilise "on" ou formulations impersonnelles',
      'Focus sur les faits et la pédagogie',
      'Peu d\'éléments personnels',
    ],
    exampleOpening: 'La respiration holotropique est une technique qui...',
  },
  2: {
    level: 2,
    name: 'Expert accessible',
    description: 'Ton expert mais chaleureux, quelques touches personnelles',
    characteristics: [
      'Utilise "vous" pour créer de la proximité',
      'Partage parfois son point de vue',
      'Reste centré sur le lecteur',
    ],
    exampleOpening: 'Ce que j\'observe souvent en consultation, c\'est que...',
  },
  3: {
    level: 3,
    name: 'Praticien humain',
    description: 'Équilibre entre expertise et partage personnel',
    characteristics: [
      'Alterne "je" et "vous"',
      'Partage des observations de sa pratique',
      'Montre sa personnalité',
    ],
    exampleOpening: 'Après 15 ans d\'accompagnement, une chose m\'a toujours frappé...',
  },
  4: {
    level: 4,
    name: 'Authentique',
    description: 'Ton personnel, partage d\'expériences, vulnérabilité modérée',
    characteristics: [
      'Utilise souvent "je"',
      'Partage ses apprentissages personnels',
      'Montre ses questionnements',
    ],
    exampleOpening: 'Je vais être honnête avec vous : je n\'ai pas toujours cru à ça...',
  },
  5: {
    level: 5,
    name: 'Vulnérable',
    description: 'Très personnel, partage de doutes et d\'échecs, connexion émotionnelle forte',
    characteristics: [
      'Partage ses propres difficultés',
      'Montre sa vulnérabilité',
      'Crée une connexion émotionnelle profonde',
    ],
    exampleOpening: 'Il y a des jours où moi aussi, je doute. Où je me demande si...',
  },
};

// ===========================================
// Base de hashtags catégorisés
// ===========================================

export interface HashtagCategory {
  id: string;
  name: string;
  tier: 'niche' | 'medium' | 'large';
  estimatedPosts: string;
  hashtags: string[];
}

export const INSTAGRAM_HASHTAG_DATABASE: HashtagCategory[] = [
  // Hashtags de niche (< 1M posts) - Ciblage précis
  {
    id: 'hypnose_niche',
    name: 'Hypnose (niche)',
    tier: 'niche',
    estimatedPosts: '100K-500K',
    hashtags: [
      'hypnoseericksonienne',
      'hypnotherapie',
      'hypnoseconversationnelle',
      'autohypnose',
      'seancehypnose',
    ],
  },
  {
    id: 'respiration_niche',
    name: 'Respiration (niche)',
    tier: 'niche',
    estimatedPosts: '100K-500K',
    hashtags: [
      'respirationholotropique',
      'breathwork',
      'coherencecardiaque',
      'respirationconsciente',
      'pranayama',
    ],
  },
  {
    id: 'therapie_niche',
    name: 'Thérapie (niche)',
    tier: 'niche',
    estimatedPosts: '100K-500K',
    hashtags: [
      'psychotherapie',
      'psychopraticien',
      'therapiebreve',
      'accompagnementtherapeutique',
      'therapieholistique',
    ],
  },
  {
    id: 'local',
    name: 'Géographique (local)',
    tier: 'niche',
    estimatedPosts: '<100K',
    hashtags: [
      'yonne',
      'bourgogne',
      'sens89',
      'auxerre',
      'saintjuliendusault',
    ],
  },

  // Hashtags moyens (1M-5M posts) - Visibilité équilibrée
  {
    id: 'bienetre_medium',
    name: 'Bien-être (medium)',
    tier: 'medium',
    estimatedPosts: '1M-5M',
    hashtags: [
      'bienetre',
      'mieuxetre',
      'equilibre',
      'prendresoindesoi',
      'santenaturelle',
    ],
  },
  {
    id: 'mental_medium',
    name: 'Santé mentale (medium)',
    tier: 'medium',
    estimatedPosts: '1M-5M',
    hashtags: [
      'santementale',
      'gestiondustress',
      'anxiete',
      'gestiondesemotions',
      'apaisement',
    ],
  },
  {
    id: 'devperso_medium',
    name: 'Développement personnel (medium)',
    tier: 'medium',
    estimatedPosts: '1M-5M',
    hashtags: [
      'developpementpersonnel',
      'croissancepersonnelle',
      'connaissancedesoi',
      'cheminement',
      'evolution',
    ],
  },

  // Hashtags larges (5M+ posts) - Découvrabilité
  {
    id: 'lifestyle_large',
    name: 'Lifestyle (large)',
    tier: 'large',
    estimatedPosts: '5M+',
    hashtags: [
      'meditation',
      'mindfulness',
      'zen',
      'relaxation',
      'inspiration',
    ],
  },
  {
    id: 'france_large',
    name: 'France (large)',
    tier: 'large',
    estimatedPosts: '5M+',
    hashtags: [
      'france',
      'french',
      'paris',
      'vie',
      'bonheur',
    ],
  },
];

// ===========================================
// Fonctions utilitaires
// ===========================================

/**
 * Sélectionne un format Instagram approprié selon le ton et l'angle
 */
export function suggestInstagramFormat(
  tone: ContentTone,
  angle: ContentAngle
): InstagramPostFormat {
  const suggestions: Record<string, InstagramPostFormat[]> = {
    'informatif_benefices': ['liste_visuelle', 'hook_reveal'],
    'informatif_probleme': ['mythe_realite', 'hook_reveal'],
    'informatif_histoire': ['micro_storytelling'],
    'informatif_expert': ['liste_visuelle', 'mythe_realite'],
    'informatif_pratique': ['liste_visuelle'],
    'inspirant_benefices': ['citation_reflexion', 'question_rhethorique'],
    'inspirant_probleme': ['question_rhethorique', 'hook_reveal'],
    'inspirant_histoire': ['micro_storytelling', 'citation_reflexion'],
    'inspirant_expert': ['citation_reflexion'],
    'inspirant_pratique': ['liste_visuelle', 'hook_reveal'],
    'personnel_benefices': ['micro_storytelling'],
    'personnel_probleme': ['micro_storytelling', 'question_rhethorique'],
    'personnel_histoire': ['micro_storytelling'],
    'personnel_expert': ['micro_storytelling', 'citation_reflexion'],
    'personnel_pratique': ['micro_storytelling', 'liste_visuelle'],
    'educatif_benefices': ['liste_visuelle', 'mythe_realite'],
    'educatif_probleme': ['mythe_realite', 'hook_reveal'],
    'educatif_histoire': ['micro_storytelling'],
    'educatif_expert': ['mythe_realite', 'liste_visuelle'],
    'educatif_pratique': ['liste_visuelle'],
    'promotionnel_benefices': ['liste_visuelle', 'hook_reveal'],
    'promotionnel_probleme': ['hook_reveal', 'question_rhethorique'],
    'promotionnel_histoire': ['micro_storytelling'],
    'promotionnel_expert': ['citation_reflexion'],
    'promotionnel_pratique': ['liste_visuelle'],
  };

  const key = `${tone}_${angle}`;
  const options = suggestions[key] || ['hook_reveal'];
  return options[0];
}

/**
 * Sélectionne des patterns d'accroche appropriés selon le ton
 */
export function getHookPatternsForTone(tone: ContentTone): HookPattern[] {
  return INSTAGRAM_HOOK_PATTERNS.filter(hook => hook.bestFor.includes(tone));
}

/**
 * Génère un ensemble de hashtags équilibré (stratégie 3 tiers)
 */
export function generateBalancedHashtags(
  theme: string,
  count: number = 10
): string[] {
  const result: string[] = [];

  // Déterminer les catégories pertinentes selon le thème
  const themeKeywords: Record<string, string[]> = {
    hypnose: ['hypnose_niche', 'bienetre_medium', 'lifestyle_large'],
    respiration: ['respiration_niche', 'bienetre_medium', 'lifestyle_large'],
    meditation: ['respiration_niche', 'mental_medium', 'lifestyle_large'],
    anxiete: ['therapie_niche', 'mental_medium', 'lifestyle_large'],
    stress: ['therapie_niche', 'mental_medium', 'lifestyle_large'],
    developpement: ['therapie_niche', 'devperso_medium', 'lifestyle_large'],
    default: ['therapie_niche', 'bienetre_medium', 'lifestyle_large'],
  };

  const themeLower = theme.toLowerCase();
  let categoryIds = themeKeywords.default;
  for (const [keyword, ids] of Object.entries(themeKeywords)) {
    if (themeLower.includes(keyword)) {
      categoryIds = ids;
      break;
    }
  }

  // Récupérer les hashtags par tier
  const nicheCount = Math.floor(count * 0.4); // 40% niche
  const mediumCount = Math.floor(count * 0.4); // 40% medium
  const largeCount = count - nicheCount - mediumCount; // 20% large

  // Ajouter les hashtags locaux en priorité (1-2)
  const localCategory = INSTAGRAM_HASHTAG_DATABASE.find(c => c.id === 'local');
  if (localCategory) {
    result.push(...localCategory.hashtags.slice(0, 2));
  }

  // Ajouter les hashtags par catégorie
  for (const categoryId of categoryIds) {
    const category = INSTAGRAM_HASHTAG_DATABASE.find(c => c.id === categoryId);
    if (category) {
      const toAdd = category.tier === 'niche' ? nicheCount :
                    category.tier === 'medium' ? mediumCount : largeCount;
      result.push(...category.hashtags.slice(0, toAdd));
    }
  }

  // Retourner sans doublons, limité au count demandé
  return Array.from(new Set(result)).slice(0, count);
}

/**
 * Obtient un CTA approprié selon le type d'engagement souhaité
 */
export function getRandomCTA(category: CTATemplate['category']): string {
  const ctaGroup = INSTAGRAM_CTA_TEMPLATES.find(c => c.category === category);
  if (!ctaGroup) return '→ Lien en bio pour en savoir plus';
  const templates = ctaGroup.templates;
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Retourne les émojis recommandés pour une catégorie
 */
export function getEmojisForCategory(category: string): string[] {
  const strategy = INSTAGRAM_EMOJI_STRATEGY.find(s => s.category === category);
  return strategy?.emojis || [];
}
