// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Module d'automatisation des réseaux sociaux
 *
 * Ce module exporte toutes les fonctionnalités nécessaires pour:
 * - Gérer les comptes sociaux (avec tokens chiffrés)
 * - Créer et programmer des posts
 * - Générer du contenu via IA
 * - Suivre les analytics des publications
 *
 * @example
 * import { createSocialPost, SocialPlatform } from '@/lib/social';
 */

// Types
export * from './types';

// Crypto
export {
  encryptToken,
  decryptToken,
  isEncryptedToken,
  generateEncryptionKey,
  testEncryption,
} from './crypto';

// Store (CRUD operations)
export {
  // Comptes
  getAllSocialAccounts,
  getActiveAccountsByPlatform,
  getSocialAccountById,
  getSocialAccountByPlatformId,
  createSocialAccount,
  updateSocialAccount,
  markAccountAsUsed,
  deleteSocialAccount,
  // Posts
  getSocialPosts,
  getSocialPostsWithRelations,
  getPostsToPublish,
  getSocialPostById,
  createSocialPost,
  updateSocialPost,
  markPostAsPublished,
  markPostAsFailed,
  deleteSocialPost,
  countPostsByStatus,
  // Analytics
  getOrCreatePostAnalytics,
  updatePostAnalytics,
  // Templates
  getAllTemplates,
  getTemplatesByPlatform,
  getDefaultTemplate,
  getTemplateById,
  createTemplate,
  updateTemplate,
  incrementTemplateUsage,
  deleteTemplate,
  // Logs de génération
  createGenerationLog,
  updateGenerationLogStatus,
  getGenerationLogsByBlogSlug,
  getRecentGenerationLogs,
} from './store';

// Generation (AI content)
export {
  generateForPlatform,
  generateForMultiplePlatforms,
  regenerateWithFeedback,
  checkGenerationConfig,
  estimateGenerationCost,
  type GenerationRequest,
  type GenerationResult,
  type SingleGenerationResult,
} from './generation';

// Prompts
export {
  PLATFORM_GENERATION_SPECS,
  CONTENT_TONES,
  CONTENT_ANGLES,
  buildSystemPrompt,
  buildUserPrompt,
  type BlogArticleInput,
  type PlatformGenerationSpec,
  type ToneSpec,
  type AngleSpec,
} from './prompts';

// UTM (tracking parameters)
export {
  buildUrlWithUtm,
  buildBlogUrlWithUtm,
  buildSeminarUrlWithUtm,
  extractUtmParams,
  type UtmParams,
} from './utm';
