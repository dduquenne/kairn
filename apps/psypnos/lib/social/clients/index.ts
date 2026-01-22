// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Factory pour les clients de publication sur les réseaux sociaux
 */

import type { SocialClient } from './types';
import type { SocialPlatform } from '../types';
import { FacebookClient } from './facebook';
import { LinkedInClient } from './linkedin';
import { InstagramClient } from './instagram';
import { ThreadsClient } from './threads';
import { TwitterClient } from './twitter';

// Singleton instances pour éviter de recréer les clients
const clients: Map<SocialPlatform, SocialClient> = new Map();

/**
 * Obtient le client de publication pour une plateforme donnée
 */
export function getSocialClient(platform: SocialPlatform): SocialClient {
  // Vérifier si on a déjà une instance
  const existing = clients.get(platform);
  if (existing) {
    return existing;
  }

  // Créer une nouvelle instance
  let client: SocialClient;

  switch (platform) {
    case 'FACEBOOK':
      client = new FacebookClient();
      break;
    case 'LINKEDIN':
      client = new LinkedInClient();
      break;
    case 'INSTAGRAM':
      client = new InstagramClient();
      break;
    case 'THREADS':
      client = new ThreadsClient();
      break;
    case 'TWITTER':
      client = new TwitterClient();
      break;
    default:
      throw new Error(`Plateforme non supportée: ${platform}`);
  }

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

// Réexporter les types et clients
export type { SocialClient, PublishPostInput, PublishResult, GetAnalyticsInput, AnalyticsResult, RetryConfig } from './types';
export { DEFAULT_RETRY_CONFIG } from './types';
export { FacebookClient } from './facebook';
export { LinkedInClient } from './linkedin';
export { InstagramClient } from './instagram';
export { ThreadsClient } from './threads';
export { TwitterClient } from './twitter';
