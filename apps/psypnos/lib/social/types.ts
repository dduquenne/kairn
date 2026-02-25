/**
 * Types TypeScript pour le système d'automatisation des réseaux sociaux
 *
 * Ces types définissent les structures de données utilisées dans:
 * - La gestion des comptes sociaux
 * - La création et programmation des posts
 * - La génération de contenu par IA
 * - Les analytics des publications
 */

// ===========================================
// Enums et constantes
// ===========================================

/**
 * Plateformes sociales supportées
 */
export type SocialPlatform = 'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM' | 'TWITTER' | 'THREADS';

/**
 * Plateformes actuellement implémentées
 */
export const IMPLEMENTED_PLATFORMS: SocialPlatform[] = [
  'FACEBOOK',
  'LINKEDIN',
  'INSTAGRAM',
  'THREADS',
  'TWITTER',
];

/**
 * Statuts possibles d'un post
 */
export type PostStatus =
  | 'DRAFT' // Brouillon
  | 'SCHEDULED' // Programmé
  | 'PUBLISHING' // En cours de publication
  | 'PUBLISHED' // Publié avec succès
  | 'FAILED' // Échec de publication
  | 'CANCELLED'; // Annulé

/**
 * Sources de génération de contenu
 */
export type GenerationSource = 'ai' | 'manual';

/**
 * Tons de génération pour le contenu
 */
export type ContentTone = 'informatif' | 'inspirant' | 'promotionnel' | 'educatif' | 'personnel';

/**
 * Angles de contenu pour la génération
 */
export type ContentAngle =
  | 'benefices' // Focus sur les bénéfices pour le lecteur
  | 'probleme' // Focus sur le problème résolu
  | 'histoire' // Approche narrative
  | 'expert' // Point de vue expert
  | 'pratique'; // Conseils pratiques

/**
 * Formats de posts Instagram natifs
 * Ces formats sont optimisés pour l'engagement sur Instagram
 */
export type InstagramPostFormat =
  | 'hook_reveal' // Accroche choc + révélation progressive
  | 'liste_visuelle' // "3 signes que..." avec émojis numérotés
  | 'micro_storytelling' // Histoire personnelle courte + leçon
  | 'question_rhethorique' // Question provocante + réponse inattendue
  | 'citation_reflexion' // Citation inspirante + analyse personnelle
  | 'mythe_realite'; // Déconstruction d'idées reçues

/**
 * Formats de posts Threads natifs
 * Ces formats sont optimisés pour la culture Threads (authentique, conversationnel)
 */
export type ThreadsPostFormat =
  | 'pensee_brute' // Réflexion courte comme si on pensait à voix haute
  | 'observation_cabinet' // Partage d'insight anonymisé du quotidien
  | 'question_ouverte' // Invite à la réflexion sans réponse
  | 'micro_confession' // Vulnérabilité du praticien
  | 'fragment_poetique' // Style quasi-littéraire, évocateur
  | 'contre_intuitif'; // Affirmation qui surprend

/**
 * Formats de posts Facebook natifs
 * Ces formats sont optimisés pour l'engagement sur Facebook
 */
export type FacebookPostFormat =
  | 'confession' // Partage d'un apprentissage personnel
  | 'question_provocante' // Remet en question une croyance commune
  | 'micro_histoire' // Courte anecdote de cabinet avec leçon
  | 'liste_inversee' // "Ce que je ne fais plus" ou "Ce qui ne marche pas"
  | 'observation_cabinet' // Pattern observé chez les patients
  | 'avant_apres'; // Transformation émotionnelle sans promesse

/**
 * Formats de posts LinkedIn natifs
 * Ces formats sont optimisés pour l'engagement professionnel sur LinkedIn
 */
export type LinkedInPostFormat =
  | 'observation_pro' // Partage d'observation de terrain avec expertise
  | 'contre_intuition' // Remet en question une croyance commune de manière pro
  | 'liste_puces' // Format "3 signes que...", "5 erreurs..."
  | 'storytelling_court' // Récit d'accompagnement anonymisé
  | 'question_provocante' // Question qui remet en cause les certitudes
  | 'temoignage_terrain'; // Partage authentique de la pratique quotidienne

/**
 * Niveau d'authenticité pour les posts Instagram
 * Plus le niveau est élevé, plus le ton sera personnel et vulnérable
 */
export type AuthenticityLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Niveau d'authenticité pour les posts Threads
 * Threads valorise davantage l'authenticité que les autres plateformes
 */
export type ThreadsAuthenticityLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Niveau de ton pour les posts Facebook
 * Adapté aux différentes catégories d'articles
 */
export type FacebookToneLevel = 1 | 2 | 3 | 4;

/**
 * Niveau d'expertise pour les posts LinkedIn
 * Contrôle le positionnement d'autorité dans le post
 */
export type LinkedInExpertiseLevel = 1 | 2 | 3 | 4 | 5;

// ===========================================
// Types spécifiques aux séminaires
// ===========================================

/**
 * Formats de posts Instagram pour la promotion de séminaires
 */
export type SeminarInstagramFormat =
  | 'compte_rebours' // Urgence avec décompte des jours/places
  | 'apercu_experience' // Prévisualisation de l'expérience
  | 'temoignage_passe' // Retour sur un séminaire précédent
  | 'question_reflexive' // Question qui fait réfléchir sur le besoin
  | 'liste_benefices' // Liste des bénéfices de participation
  | 'coulisses'; // Behind-the-scenes de la préparation

/**
 * Formats de posts LinkedIn pour la promotion de séminaires
 */
export type SeminarLinkedInFormat =
  | 'annonce_expert' // Annonce avec positionnement d'expertise
  | 'probleme_solution' // Problème courant + séminaire comme solution
  | 'observation_terrain' // Observation qui justifie le séminaire
  | 'invitation_reflexion' // Question pro + invitation au séminaire
  | 'programme_detaille' // Présentation structurée du programme
  | 'derniere_chance'; // Urgence professionnelle

/**
 * Formats de posts Facebook pour la promotion de séminaires
 */
export type SeminarFacebookFormat =
  | 'invitation_chaleureuse' // Ton conversationnel et accueillant
  | 'histoire_transformation' // Récit d'un participant passé
  | 'question_engagement' // Question + invitation
  | 'details_pratiques' // Infos concrètes avec CTA
  | 'derniers_jours' // Urgence bienveillante
  | 'partage_vision'; // Pourquoi ce séminaire existe

/**
 * Formats de posts Threads pour la promotion de séminaires
 */
export type SeminarThreadsFormat =
  | 'pensee_spontanee' // Réflexion naturelle sur le séminaire
  | 'micro_confession' // Partage personnel du praticien
  | 'question_ouverte' // Question sans réponse directe
  | 'fragment_anticipation' // Évocation poétique de l'expérience
  | 'rappel_humain'; // Rappel simple et authentique

/**
 * Niveau d'urgence pour les posts de séminaires
 * Plus le niveau est élevé, plus l'urgence est marquée
 */
export type SeminarUrgencyLevel = 1 | 2 | 3 | 4 | 5;

// ===========================================
// Comptes sociaux
// ===========================================

/**
 * Données d'un compte social (sans tokens sensibles)
 */
export interface SocialAccountPublic {
  id: string;
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  tokenExpiry: Date | null;
  scope: string[];
  isActive: boolean;
  lastUsed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Données complètes d'un compte social (avec tokens chiffrés)
 */
export interface SocialAccountFull extends SocialAccountPublic {
  accessToken: string; // Chiffré
  refreshToken: string | null; // Chiffré
  metadata: SocialAccountMetadata | null;
}

/**
 * Métadonnées spécifiques à chaque plateforme
 */
export interface SocialAccountMetadata {
  // Facebook
  pageId?: string;
  pageName?: string;

  // LinkedIn
  organizationId?: string;
  organizationName?: string;
  personId?: string;

  // Instagram
  igUserId?: string;
  igUsername?: string;
  linkedFacebookPageId?: string;

  // Threads
  threadsUserId?: string;
  threadsUsername?: string;

  // Twitter
  twitterUserId?: string;
  twitterUsername?: string;

  // Données génériques
  profileUrl?: string;
  avatarUrl?: string;
}

/**
 * Données pour créer un compte social
 */
export interface CreateSocialAccountInput {
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  accessToken: string; // Sera chiffré avant stockage
  refreshToken?: string; // Sera chiffré avant stockage
  tokenExpiry?: Date | null;
  scope: string[];
  metadata?: SocialAccountMetadata;
}

/**
 * Données pour mettre à jour un compte social
 */
export interface UpdateSocialAccountInput {
  accountName?: string;
  accessToken?: string; // Sera chiffré avant stockage
  refreshToken?: string | null; // Sera chiffré avant stockage
  tokenExpiry?: Date | null;
  scope?: string[];
  metadata?: SocialAccountMetadata;
  isActive?: boolean;
}

// ===========================================
// Posts sociaux
// ===========================================

/**
 * Données d'un post social
 */
export interface SocialPost {
  id: string;
  blogSlug: string | null;
  blogTitle: string | null;
  platform: SocialPlatform;
  content: string;
  mediaUrls: string[];
  hashtags: string[];
  linkUrl: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  status: PostStatus;
  externalPostId: string | null;
  platformUrl: string | null; // Direct link to view published post
  errorMessage: string | null;
  retryCount: number;
  generatedBy: GenerationSource | null;
  aiPrompt: string | null;
  aiModel: string | null;
  metadata: SocialPostMetadata | null;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Post avec les relations chargées
 */
export interface SocialPostWithRelations extends SocialPost {
  account: SocialAccountPublic;
  analytics: SocialPostAnalytics | null;
}

/**
 * Métadonnées d'un post
 */
export interface SocialPostMetadata {
  // Paramètres de génération
  tone?: ContentTone;
  angle?: ContentAngle;
  customInstructions?: string;

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

  // Informations sur l'article source
  articleCategory?: string;
  articleTags?: string[];

  // Données de publication
  publishAttempts?: number;
  lastPublishError?: string;
}

/**
 * Données pour créer un post
 */
export interface CreateSocialPostInput {
  accountId: string;
  platform: SocialPlatform;
  content: string;
  blogSlug?: string;
  blogTitle?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  linkUrl?: string;
  scheduledAt?: Date;
  generatedBy?: GenerationSource;
  aiPrompt?: string;
  aiModel?: string;
  metadata?: SocialPostMetadata;
}

/**
 * Données pour mettre à jour un post
 */
export interface UpdateSocialPostInput {
  content?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  linkUrl?: string;
  scheduledAt?: Date | null;
  status?: PostStatus;
  externalPostId?: string;
  platformUrl?: string | null;
  errorMessage?: string | null;
  retryCount?: number;
  metadata?: SocialPostMetadata;
}

/**
 * Filtres pour la recherche de posts
 */
export interface SocialPostFilters {
  platform?: SocialPlatform;
  status?: PostStatus;
  accountId?: string;
  blogSlug?: string;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  limit?: number;
  offset?: number;
}

// ===========================================
// Analytics des posts
// ===========================================

/**
 * Analytics d'un post
 */
export interface SocialPostAnalytics {
  id: string;
  postId: string;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  rawData: Record<string, unknown> | null;
  fetchedAt: Date;
  updatedAt: Date;
}

/**
 * Données pour mettre à jour les analytics
 */
export interface UpdateSocialPostAnalyticsInput {
  impressions?: number;
  reach?: number;
  engagements?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  rawData?: Record<string, unknown>;
}

// ===========================================
// Templates de génération
// ===========================================

/**
 * Template de génération
 */
export interface SocialTemplate {
  id: string;
  name: string;
  platform: SocialPlatform;
  description: string | null;
  promptTemplate: string;
  defaultTone: ContentTone | null;
  defaultHashtags: string[];
  isDefault: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Données pour créer un template
 */
export interface CreateSocialTemplateInput {
  name: string;
  platform: SocialPlatform;
  description?: string;
  promptTemplate: string;
  defaultTone?: ContentTone;
  defaultHashtags?: string[];
  isDefault?: boolean;
}

/**
 * Données pour mettre à jour un template
 */
export interface UpdateSocialTemplateInput {
  name?: string;
  description?: string | null;
  promptTemplate?: string;
  defaultTone?: ContentTone | null;
  defaultHashtags?: string[];
  isDefault?: boolean;
}

// ===========================================
// Logs de génération
// ===========================================

/**
 * Log de génération IA
 */
export interface SocialGenerationLog {
  id: string;
  blogSlug: string;
  platform: SocialPlatform;
  inputContent: string;
  promptUsed: string;
  generatedContent: string;
  tokensUsed: number | null;
  wasAccepted: boolean;
  wasModified: boolean;
  createdAt: Date;
}

/**
 * Données pour créer un log de génération
 */
export interface CreateSocialGenerationLogInput {
  blogSlug: string;
  platform: SocialPlatform;
  inputContent: string;
  promptUsed: string;
  generatedContent: string;
  tokensUsed?: number;
}

// ===========================================
// Génération de contenu
// ===========================================

/**
 * Options de génération de contenu
 */
export interface GenerationOptions {
  tone: ContentTone;
  angle: ContentAngle;
  customInstructions?: string;
  templateId?: string;
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

/**
 * Résultat de génération pour une plateforme
 */
export interface GeneratedContent {
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  suggestedMediaUrl?: string;
  tokensUsed?: number;
}

/**
 * Requête de génération multi-plateforme
 */
export interface GenerateContentRequest {
  blogSlug: string;
  platforms: SocialPlatform[];
  options: GenerationOptions;
}

/**
 * Réponse de génération multi-plateforme
 */
export interface GenerateContentResponse {
  generations: GeneratedContent[];
  totalTokensUsed: number;
}

// ===========================================
// Publication
// ===========================================

/**
 * Résultat de publication
 */
export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  errorMessage?: string;
  platformData?: Record<string, unknown>;
}

/**
 * Statistiques de publication (pour le cron)
 */
export interface PublishBatchResult {
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{
    postId: string;
    platform: SocialPlatform;
    error: string;
  }>;
}

// ===========================================
// Configuration plateforme
// ===========================================

/**
 * Spécifications d'une plateforme
 */
export interface PlatformSpecs {
  platform: SocialPlatform;
  name: string;
  maxTextLength: number;
  optimalTextLength: number;
  maxHashtags: number;
  optimalHashtags: number;
  supportsLinks: boolean;
  linkInComment: boolean; // LinkedIn style
  requiresMedia: boolean;
  imageRatio: string;
  imageWidth: number;
  imageHeight: number;
}

/**
 * Spécifications par plateforme
 */
export const PLATFORM_SPECS: Record<SocialPlatform, PlatformSpecs> = {
  FACEBOOK: {
    platform: 'FACEBOOK',
    name: 'Facebook',
    maxTextLength: 63206,
    optimalTextLength: 80,
    maxHashtags: 30,
    optimalHashtags: 2,
    supportsLinks: true,
    linkInComment: false,
    requiresMedia: false,
    imageRatio: '1.91:1',
    imageWidth: 1200,
    imageHeight: 630,
  },
  LINKEDIN: {
    platform: 'LINKEDIN',
    name: 'LinkedIn',
    maxTextLength: 3000,
    optimalTextLength: 200,
    maxHashtags: 30,
    optimalHashtags: 5,
    supportsLinks: true,
    linkInComment: true,
    requiresMedia: false,
    imageRatio: '1.91:1',
    imageWidth: 1200,
    imageHeight: 627,
  },
  INSTAGRAM: {
    platform: 'INSTAGRAM',
    name: 'Instagram',
    maxTextLength: 2200,
    optimalTextLength: 150,
    maxHashtags: 30,
    optimalHashtags: 10,
    supportsLinks: false,
    linkInComment: false,
    requiresMedia: true,
    imageRatio: '1:1',
    imageWidth: 1080,
    imageHeight: 1080,
  },
  TWITTER: {
    platform: 'TWITTER',
    name: 'Twitter/X',
    maxTextLength: 280,
    optimalTextLength: 100,
    maxHashtags: 5,
    optimalHashtags: 2,
    supportsLinks: true,
    linkInComment: false,
    requiresMedia: false,
    imageRatio: '16:9',
    imageWidth: 1200,
    imageHeight: 675,
  },
  THREADS: {
    platform: 'THREADS',
    name: 'Threads',
    maxTextLength: 500,
    optimalTextLength: 150,
    maxHashtags: 10,
    optimalHashtags: 3,
    supportsLinks: true,
    linkInComment: false,
    requiresMedia: false,
    imageRatio: '1:1',
    imageWidth: 1080,
    imageHeight: 1080,
  },
};

// ===========================================
// Horaires optimaux
// ===========================================

/**
 * Créneaux horaires optimaux par plateforme
 */
export interface OptimalTimeSlot {
  dayOfWeek: number; // 0 = dimanche, 1 = lundi, etc.
  hour: number; // 0-23
  priority: 'primary' | 'secondary';
}

export const OPTIMAL_POSTING_TIMES: Record<SocialPlatform, OptimalTimeSlot[]> = {
  FACEBOOK: [
    { dayOfWeek: 1, hour: 9, priority: 'primary' },
    { dayOfWeek: 2, hour: 9, priority: 'primary' },
    { dayOfWeek: 3, hour: 9, priority: 'primary' },
    { dayOfWeek: 4, hour: 9, priority: 'primary' },
    { dayOfWeek: 5, hour: 9, priority: 'primary' },
    { dayOfWeek: 1, hour: 13, priority: 'secondary' },
    { dayOfWeek: 2, hour: 13, priority: 'secondary' },
    { dayOfWeek: 3, hour: 13, priority: 'secondary' },
    { dayOfWeek: 6, hour: 10, priority: 'secondary' },
    { dayOfWeek: 0, hour: 10, priority: 'secondary' },
  ],
  LINKEDIN: [
    { dayOfWeek: 2, hour: 7, priority: 'primary' },
    { dayOfWeek: 3, hour: 7, priority: 'primary' },
    { dayOfWeek: 4, hour: 7, priority: 'primary' },
    { dayOfWeek: 2, hour: 12, priority: 'secondary' },
    { dayOfWeek: 3, hour: 12, priority: 'secondary' },
    { dayOfWeek: 3, hour: 17, priority: 'secondary' },
  ],
  INSTAGRAM: [
    { dayOfWeek: 0, hour: 10, priority: 'primary' },
    { dayOfWeek: 1, hour: 11, priority: 'primary' },
    { dayOfWeek: 2, hour: 11, priority: 'primary' },
    { dayOfWeek: 3, hour: 11, priority: 'primary' },
    { dayOfWeek: 4, hour: 11, priority: 'primary' },
    { dayOfWeek: 5, hour: 11, priority: 'primary' },
    { dayOfWeek: 6, hour: 10, priority: 'primary' },
    { dayOfWeek: 0, hour: 19, priority: 'secondary' },
    { dayOfWeek: 1, hour: 19, priority: 'secondary' },
    { dayOfWeek: 2, hour: 19, priority: 'secondary' },
  ],
  TWITTER: [
    { dayOfWeek: 1, hour: 8, priority: 'primary' },
    { dayOfWeek: 2, hour: 8, priority: 'primary' },
    { dayOfWeek: 3, hour: 8, priority: 'primary' },
    { dayOfWeek: 4, hour: 8, priority: 'primary' },
    { dayOfWeek: 5, hour: 8, priority: 'primary' },
  ],
  THREADS: [
    { dayOfWeek: 1, hour: 10, priority: 'primary' },
    { dayOfWeek: 2, hour: 10, priority: 'primary' },
    { dayOfWeek: 3, hour: 10, priority: 'primary' },
  ],
};
