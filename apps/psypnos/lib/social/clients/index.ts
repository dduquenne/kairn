/**
 * Factory pour les clients de publication sur les réseaux sociaux
 *
 * MIGRATION PHASE 6: Ce module utilise maintenant @kairn/social/posting
 * pour mutualiser le code de publication.
 */

import { getPublisher as getKairnPublisher, type SocialPublisher } from '@kairn/social/posting';

import type { SocialPlatform } from '../types';

// Type adapter for backward compatibility
export interface SocialClient {
  publish(input: PublishPostInput): Promise<PublishResult>;
  getAnalytics?(input: GetAnalyticsInput): Promise<AnalyticsResult>;
}

export interface PublishPostInput {
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  linkUrl?: string | null;
  accessToken: string;
  accountMetadata?: Record<string, unknown>;
}

export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  platformUrl?: string;
  error?: string;
}

export interface GetAnalyticsInput {
  externalPostId: string;
  accessToken: string;
  accountMetadata?: Record<string, unknown>;
}

export interface AnalyticsResult {
  success: boolean;
  data?: {
    impressions?: number;
    reach?: number;
    engagements?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    clicks?: number;
  };
  error?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

/**
 * Adapter that wraps @kairn/social publisher to match local SocialClient interface
 */
class PublisherAdapter implements SocialClient {
  private publisher: SocialPublisher;

  constructor(publisher: SocialPublisher) {
    this.publisher = publisher;
  }

  async publish(input: PublishPostInput): Promise<PublishResult> {
    return this.publisher.publish({
      content: input.content,
      mediaUrls: input.mediaUrls || [],
      hashtags: input.hashtags || [],
      linkUrl: input.linkUrl ?? null,
      accessToken: input.accessToken,
      accountMetadata: input.accountMetadata ?? null,
    });
  }

  async getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult> {
    if (!this.publisher.getAnalytics) {
      return { success: false, error: 'Analytics not supported for this platform' };
    }
    return this.publisher.getAnalytics({
      externalPostId: input.externalPostId,
      accessToken: input.accessToken,
      accountMetadata: input.accountMetadata || {},
    });
  }
}

// Singleton instances pour éviter de recréer les clients
const clients: Map<SocialPlatform, SocialClient> = new Map();

/**
 * Obtient le client de publication pour une plateforme donnée
 *
 * Uses @kairn/social/posting under the hood
 */
export function getSocialClient(platform: SocialPlatform): SocialClient {
  // Vérifier si on a déjà une instance
  const existing = clients.get(platform);
  if (existing) {
    return existing;
  }

  // Get publisher from @kairn/social and wrap it
  const publisher = getKairnPublisher(platform);
  const client = new PublisherAdapter(publisher);

  // Mettre en cache
  clients.set(platform, client);

  return client;
}

/**
 * Vérifie si une plateforme est supportée
 */
export function isPlatformSupported(platform: string): platform is SocialPlatform {
  return ['FACEBOOK', 'LINKEDIN', 'INSTAGRAM', 'THREADS', 'TWITTER'].includes(platform);
}

// Re-export from @kairn/social for direct access
export { getPublisher } from '@kairn/social/posting';
export type { SocialPublisher } from '@kairn/social/posting';
