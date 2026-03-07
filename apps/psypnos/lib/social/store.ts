/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — pre-existing type issues (SocialTemplate/SocialGenerationLog models, SocialAccount fields)
/**
 * Store pour les opérations CRUD sur les données des réseaux sociaux
 *
 * MIGRATION: Ce module réexporte les fonctions depuis @kairn/social/store
 * en injectant l'instance Prisma locale.
 */

import { createSocialStore } from '@kairn/social/store';

import { prisma } from '@/lib/db/prisma';

// Créer l'instance du store avec le Prisma local
const store = createSocialStore(prisma as any);

// ===========================================
// Comptes Sociaux
// ===========================================

/** Récupère tous les comptes sociaux (sans tokens déchiffrés) */
export const getAllSocialAccounts = store.getAllSocialAccounts;

/** Récupère les comptes actifs pour une plateforme */
export const getActiveAccountsByPlatform = store.getActiveAccountsByPlatform;

/** Récupère un compte par son ID (avec tokens déchiffrés) */
export const getSocialAccountById = store.getSocialAccountById;

/** Récupère un compte par plateforme et ID externe */
export const getSocialAccountByPlatformId = store.getSocialAccountByPlatformId;

/** Crée un nouveau compte social */
export const createSocialAccount = store.createSocialAccount;

/** Met à jour un compte social */
export const updateSocialAccount = store.updateSocialAccount;

/** Marque un compte comme utilisé */
export const markAccountAsUsed = store.markAccountAsUsed;

/** Supprime un compte social (et tous ses posts) */
export const deleteSocialAccount = store.deleteSocialAccount;

// ===========================================
// Posts Sociaux
// ===========================================

/** Récupère les posts avec filtres */
export const getSocialPosts = store.getSocialPosts;

/** Récupère les posts avec leurs relations */
export const getSocialPostsWithRelations = store.getSocialPostsWithRelations;

/** Récupère les posts à publier (scheduled et date passée) */
export const getPostsToPublish = store.getPostsToPublish;

/** Récupère un post par son ID */
export const getSocialPostById = store.getSocialPostById;

/** Crée un nouveau post */
export const createSocialPost = store.createSocialPost;

/** Met à jour un post */
export const updateSocialPost = store.updateSocialPost;

/** Marque un post comme publié */
export const markPostAsPublished = store.markPostAsPublished;

/** Marque un post comme échoué */
export const markPostAsFailed = store.markPostAsFailed;

/** Supprime un post */
export const deleteSocialPost = store.deleteSocialPost;

/** Incrémente le compteur de retry d'un post */
export const incrementRetryCount = store.incrementRetryCount;

/**
 * Récupère les posts à publier :
 * - Posts en SCHEDULED dont l'heure est passée
 * - Posts bloqués en PUBLISHING depuis plus de 10 minutes
 */
export const getScheduledPosts = store.getScheduledPosts;

/**
 * Tente de réserver un post pour publication de manière atomique.
 */
export const claimPostForPublishing = store.claimPostForPublishing;

/**
 * Récupère les posts planifiés dans le futur.
 */
export const getFutureScheduledPosts = store.getFutureScheduledPosts;

/** Compte les posts par statut */
export const countPostsByStatus = store.countPostsByStatus;

// ===========================================
// Analytics des Posts
// ===========================================

/** Récupère ou crée les analytics d'un post */
export const getOrCreatePostAnalytics = store.getOrCreatePostAnalytics;

/** Met à jour les analytics d'un post */
export const updatePostAnalytics = store.updatePostAnalytics;

// ===========================================
// Templates
// ===========================================

/** Récupère tous les templates */
export const getAllTemplates = store.getAllTemplates;

/** Récupère les templates pour une plateforme */
export const getTemplatesByPlatform = store.getTemplatesByPlatform;

/** Récupère le template par défaut pour une plateforme */
export const getDefaultTemplate = store.getDefaultTemplate;

/** Récupère un template par son ID */
export const getTemplateById = store.getTemplateById;

/** Crée un nouveau template */
export const createTemplate = store.createTemplate;

/** Met à jour un template */
export const updateTemplate = store.updateTemplate;

/** Incrémente le compteur d'utilisation d'un template */
export const incrementTemplateUsage = store.incrementTemplateUsage;

/** Supprime un template */
export const deleteTemplate = store.deleteTemplate;

// ===========================================
// Logs de Génération
// ===========================================

/** Crée un log de génération */
export const createGenerationLog = store.createGenerationLog;

/** Marque un log comme accepté/modifié */
export const updateGenerationLogStatus = store.updateGenerationLogStatus;

/** Récupère les logs de génération pour un article */
export const getGenerationLogsByBlogSlug = store.getGenerationLogsByBlogSlug;

/** Récupère les derniers logs de génération */
export const getRecentGenerationLogs = store.getRecentGenerationLogs;
