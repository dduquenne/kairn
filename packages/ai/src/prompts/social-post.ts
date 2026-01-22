/**
 * Social media post generation prompt templates
 * @package @kairn/ai
 */

import type { SocialPlatform, SocialTone, SocialAngle, SocialFormat } from '../services/types.js';

// ============================================
// Platform Configuration
// ============================================

export const PLATFORM_CONFIG: Record<
  SocialPlatform,
  {
    maxLength: number;
    supportsHashtags: boolean;
    supportsLinks: boolean;
    mediaRequired: boolean;
    characterName: string;
  }
> = {
  facebook: {
    maxLength: 2000,
    supportsHashtags: true,
    supportsLinks: true,
    mediaRequired: false,
    characterName: 'Facebook',
  },
  instagram: {
    maxLength: 2200,
    supportsHashtags: true,
    supportsLinks: false,
    mediaRequired: true,
    characterName: 'Instagram',
  },
  linkedin: {
    maxLength: 3000,
    supportsHashtags: true,
    supportsLinks: true,
    mediaRequired: false,
    characterName: 'LinkedIn',
  },
  twitter: {
    maxLength: 280,
    supportsHashtags: true,
    supportsLinks: true,
    mediaRequired: false,
    characterName: 'X (Twitter)',
  },
  threads: {
    maxLength: 500,
    supportsHashtags: false,
    supportsLinks: true,
    mediaRequired: false,
    characterName: 'Threads',
  },
};

// ============================================
// Tone Descriptions
// ============================================

export const SOCIAL_TONE_DESCRIPTIONS: Record<SocialTone, string> = {
  informative: 'Informatif et factuel, partage de connaissances',
  inspirational: 'Inspirant et motivant, éveille les émotions positives',
  promotional: 'Promotionnel mais subtil, met en valeur sans être agressif',
  educational: 'Éducatif et pédagogique, explique clairement',
  personal: "Personnel et authentique, partage d'expérience",
  entertaining: "Divertissant et engageant, capte l'attention",
  thought_provoking: 'Qui fait réfléchir, questionne les certitudes',
};

// ============================================
// Angle Descriptions
// ============================================

export const SOCIAL_ANGLE_DESCRIPTIONS: Record<SocialAngle, string> = {
  benefits: 'Met en avant les bénéfices et avantages',
  problem: "Part d'un problème ou d'une frustration",
  story: 'Raconte une histoire ou anecdote',
  expert: "Position d'expert, partage de savoir",
  practical: 'Conseils pratiques et actionnables',
  curiosity: 'Suscite la curiosité, intrigue',
  controversy: 'Prend position, va à contre-courant',
  social_proof: 'Témoignages, résultats, preuves',
};

// ============================================
// Instagram Formats
// ============================================

export const INSTAGRAM_FORMATS: Partial<Record<SocialFormat, string>> = {
  hook_reveal: `Format "Hook & Reveal":
- Ligne 1: Accroche choc ou contre-intuitive
- Ligne 2-3: Développement court
- Ligne 4: Révélation ou conseil actionnable
- Emojis stratégiques (2-3 max)`,

  visual_list: `Format "Liste Visuelle":
- Titre accrocheur
- 3-5 points numérotés avec emojis
- Chaque point = 1 ligne
- Call-to-action final`,

  micro_storytelling: `Format "Micro-Storytelling":
- Situation initiale (1 ligne)
- Tension/problème (1 ligne)
- Résolution/leçon (1-2 lignes)
- Question pour engager`,

  rhetorical_question: `Format "Question Rhétorique":
- Question d'ouverture percutante
- Réponse développée en 2-3 lignes
- Perspective ou conseil
- Question finale pour engagement`,

  quote_reflection: `Format "Citation & Réflexion":
- Citation inspirante avec guillemets
- Interprétation personnelle (2-3 lignes)
- Application concrète
- Invitation à réflexion`,

  myth_reality: `Format "Mythe vs Réalité":
- "On croit souvent que..." (mythe)
- "En réalité..." (vérité)
- Explication courte
- Prise de conscience finale`,
};

// ============================================
// Threads Formats
// ============================================

export const THREADS_FORMATS: Partial<Record<SocialFormat, string>> = {
  raw_thought: `Format "Pensée Brute":
- Pensée spontanée et authentique
- Ton conversationnel
- Pas de structure forcée
- Invitation au dialogue`,

  observation: `Format "Observation":
- Observation du quotidien professionnel
- Ton réflexif
- Question implicite ou explicite`,

  open_question: `Format "Question Ouverte":
- Question sans réponse évidente
- Ouvre le débat
- Encourage les réponses diverses`,

  micro_confession: `Format "Micro-Confession":
- Aveu personnel ou professionnel
- Vulnérabilité mesurée
- Leçon apprise`,

  poetic_fragment: `Format "Fragment Poétique":
- Expression métaphorique
- Évocateur et imagé
- Court et percutant`,

  counter_intuitive: `Format "Contre-Intuitif":
- Affirmation surprenante
- Explication rapide
- Invite à reconsidérer`,
};

// ============================================
// LinkedIn Formats
// ============================================

export const LINKEDIN_FORMATS: Partial<Record<SocialFormat, string>> = {
  observation_pro: `Format "Observation Pro":
- Observation du monde professionnel
- Analyse courte (2-3 lignes)
- Conclusion ou question`,

  counter_intuitive: `Format "Contre-Intuition":
- Affirmation qui va à contre-courant
- Arguments en 3-4 points
- Conclusion nuancée`,

  visual_list: `Format "Liste à Puces":
- Introduction accrocheuse (1 ligne)
- 5-7 points courts
- Conclusion avec call-to-action`,

  micro_storytelling: `Format "Storytelling Court":
- Situation de départ
- Challenge rencontré
- Solution trouvée
- Leçon partagée`,

  rhetorical_question: `Format "Question Provocante":
- Question qui challenge
- Réponse argumentée
- Invitation au débat`,

  social_proof: `Format "Témoignage Terrain":
- Expérience vécue
- Résultat concret
- Apprentissage applicable`,
};

// ============================================
// Prompt Configuration
// ============================================

export interface SocialPromptConfig {
  sourceContent: string;
  sourceTitle?: string;
  platform: SocialPlatform;
  tone?: SocialTone;
  angle?: SocialAngle;
  format?: SocialFormat;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  includeCallToAction?: boolean;
  maxLength?: number;
  language?: 'fr' | 'en';
  link?: string;
  authenticityLevel?: 1 | 2 | 3 | 4 | 5;
  expertiseLevel?: 1 | 2 | 3 | 4 | 5;
}

// ============================================
// Prompt Builders
// ============================================

/**
 * Build social post generation prompt
 */
export function buildSocialPostPrompt(config: SocialPromptConfig): string {
  const {
    sourceContent,
    sourceTitle,
    platform,
    tone = 'informative',
    angle = 'benefits',
    format,
    includeHashtags = true,
    includeEmojis = true,
    includeCallToAction = true,
    maxLength,
    language = 'fr',
    link,
    authenticityLevel,
    expertiseLevel,
  } = config;

  const platformConfig = PLATFORM_CONFIG[platform];
  const effectiveMaxLength = maxLength ?? platformConfig.maxLength;

  const parts: string[] = [
    `Crée un post ${platformConfig.characterName} à partir du contenu suivant :`,
    '',
    `${sourceTitle ? `Titre: ${sourceTitle}\n` : ''}Contenu:`,
    sourceContent.slice(0, 2000),
    '',
  ];

  // Platform specifications
  parts.push('Spécifications de la plateforme :');
  parts.push(`- Longueur max : ${effectiveMaxLength} caractères`);
  parts.push(`- Ton : ${SOCIAL_TONE_DESCRIPTIONS[tone]}`);
  parts.push(`- Angle : ${SOCIAL_ANGLE_DESCRIPTIONS[angle]}`);

  if (format) {
    const formatDescription = getFormatDescription(platform, format);
    if (formatDescription) {
      parts.push(`\nFormat demandé :\n${formatDescription}`);
    }
  }

  // Options
  parts.push('\nOptions :');
  parts.push(
    `- Hashtags : ${includeHashtags && platformConfig.supportsHashtags ? 'Oui (3-5 pertinents)' : 'Non'}`
  );
  parts.push(`- Emojis : ${includeEmojis ? 'Oui (avec parcimonie)' : 'Non'}`);
  parts.push(`- Call-to-action : ${includeCallToAction ? 'Oui' : 'Non'}`);
  parts.push(`- Langue : ${language === 'fr' ? 'Français' : 'Anglais'}`);

  if (link && platformConfig.supportsLinks) {
    parts.push(`- Lien à inclure : ${link}`);
  }

  if (authenticityLevel) {
    parts.push(
      `- Niveau d'authenticité : ${authenticityLevel}/5 (${authenticityLevel <= 2 ? 'formel' : authenticityLevel >= 4 ? 'très personnel' : 'équilibré'})`
    );
  }

  if (expertiseLevel) {
    parts.push(
      `- Niveau d'expertise affiché : ${expertiseLevel}/5 (${expertiseLevel <= 2 ? 'accessible' : expertiseLevel >= 4 ? 'expert' : 'intermédiaire'})`
    );
  }

  parts.push('\nGénère uniquement le post, prêt à être publié, sans explications.');

  return parts.join('\n');
}

/**
 * Get format description for a platform
 */
function getFormatDescription(platform: SocialPlatform, format: SocialFormat): string | null {
  switch (platform) {
    case 'instagram':
      return INSTAGRAM_FORMATS[format] || null;
    case 'threads':
      return THREADS_FORMATS[format] || null;
    case 'linkedin':
      return LINKEDIN_FORMATS[format] || null;
    default:
      return null;
  }
}

/**
 * Build prompt for multi-platform generation
 */
export function buildMultiPlatformPrompt(
  sourceContent: string,
  sourceTitle: string | undefined,
  platforms: SocialPlatform[],
  options: Partial<SocialPromptConfig> = {}
): string {
  const parts: string[] = [
    `Adapte le contenu suivant pour plusieurs réseaux sociaux :`,
    '',
    `${sourceTitle ? `Titre: ${sourceTitle}\n` : ''}Contenu:`,
    sourceContent.slice(0, 2000),
    '',
    'Plateformes demandées :',
  ];

  for (const platform of platforms) {
    const config = PLATFORM_CONFIG[platform];
    parts.push(`- ${config.characterName} (max ${config.maxLength} car.)`);
  }

  parts.push('\nRègles générales :');
  parts.push('- Adapter le ton à chaque plateforme');
  parts.push('- Respecter les limites de caractères');
  parts.push('- Messages cohérents mais différenciés');

  if (options.includeHashtags !== false) {
    parts.push('- Inclure des hashtags pertinents (sauf Threads)');
  }

  parts.push(`\nFormat de sortie JSON :
{
  "posts": {
    "facebook": "Contenu du post Facebook...",
    "instagram": "Contenu du post Instagram...",
    "linkedin": "Contenu du post LinkedIn...",
    "twitter": "Contenu du post Twitter...",
    "threads": "Contenu du post Threads..."
  }
}`);

  return parts.join('\n');
}
