// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Types pour les clients de publication sur les réseaux sociaux
 */

import type { SocialPlatform, SocialAccountMetadata } from '../types';

/**
 * Données pour publier un post
 */
export interface PublishPostInput {
  content: string;
  mediaUrls: string[];
  hashtags: string[];
  linkUrl: string | null;
  accessToken: string;
  accountMetadata: SocialAccountMetadata | null;
}

/**
 * Résultat de publication
 */
export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  platformUrl?: string;
  error?: string;
  rawResponse?: unknown;
}

/**
 * Données pour récupérer les analytics
 */
export interface GetAnalyticsInput {
  externalPostId: string;
  accessToken: string;
  accountMetadata: SocialAccountMetadata | null;
}

/**
 * Résultat des analytics
 */
export interface AnalyticsResult {
  success: boolean;
  impressions?: number;
  reach?: number;
  engagements?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  rawData?: Record<string, unknown>;
  error?: string;
}

/**
 * Interface commune pour les clients sociaux
 */
export interface SocialClient {
  platform: SocialPlatform;

  /**
   * Publie un post sur la plateforme
   */
  publish(input: PublishPostInput): Promise<PublishResult>;

  /**
   * Récupère les analytics d'un post
   */
  getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult>;

  /**
   * Valide que le contenu respecte les limites de la plateforme
   */
  validateContent(content: string, hashtags: string[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

/**
 * Configuration pour le retry
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrors: string[];
}

/**
 * Configuration par défaut pour le retry
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'rate_limit',
    'temporarily_unavailable',
    '429',
    '500',
    '502',
    '503',
    '504',
  ],
};
