/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Threads OAuth 2.0 Implementation
 *
 * Gère l'authentification OAuth avec Threads pour publier du contenu.
 *
 * Scopes requis:
 * - threads_basic: Accès de base au profil Threads
 * - threads_content_publish: Publier sur Threads
 * - threads_manage_insights: Lire les statistiques (optionnel)
 * - threads_manage_replies: Gérer les réponses (optionnel)
 *
 * @see https://developers.facebook.com/docs/threads/overview
 */

import { SocialAccountMetadata } from '../types';

// ===========================================
// Configuration
// ===========================================

const THREADS_APP_ID = process.env.THREADS_APP_ID || process.env.FACEBOOK_APP_ID;
const THREADS_APP_SECRET = process.env.THREADS_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
const THREADS_API_VERSION = 'v1.0';
const THREADS_API_BASE = 'https://graph.threads.net';
const THREADS_AUTH_BASE = 'https://threads.net';

/**
 * Scopes demandés pour Threads
 */
export const THREADS_SCOPES = [
  'threads_basic',           // Accès de base au profil
  'threads_content_publish', // Publier du contenu
  'threads_manage_insights', // Lire les statistiques
  'threads_manage_replies',  // Gérer les réponses
];

/**
 * Scopes minimaux (juste publication)
 */
export const THREADS_MINIMAL_SCOPES = [
  'threads_basic',
  'threads_content_publish',
];

// ===========================================
// Types
// ===========================================

interface ThreadsTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface ThreadsLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ThreadsUser {
  id: string;
  username: string;
  name?: string;
  threads_profile_picture_url?: string;
  threads_biography?: string;
}

export interface ThreadsAccountInfo {
  userId: string;
  username: string;
  name?: string;
  profilePictureUrl?: string;
  biography?: string;
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Vérifie que les credentials Threads sont configurés
 */
export function checkThreadsConfig(): { valid: boolean; error?: string } {
  if (!THREADS_APP_ID) {
    return { valid: false, error: 'THREADS_APP_ID (ou FACEBOOK_APP_ID) non configuré' };
  }
  if (!THREADS_APP_SECRET) {
    return { valid: false, error: 'THREADS_APP_SECRET (ou FACEBOOK_APP_SECRET) non configuré' };
  }
  return { valid: true };
}

/**
 * Génère l'URL d'autorisation OAuth Threads
 */
export function getAuthorizationUrl(redirectUri: string, state: string): string {
  const config = checkThreadsConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const params = new URLSearchParams({
    client_id: THREADS_APP_ID!,
    redirect_uri: redirectUri,
    state,
    scope: THREADS_SCOPES.join(','),
    response_type: 'code',
  });

  return `${THREADS_AUTH_BASE}/oauth/authorize?${params.toString()}`;
}

/**
 * Échange le code d'autorisation contre un access token court terme
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresIn?: number }> {
  const config = checkThreadsConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const params = new URLSearchParams({
    client_id: THREADS_APP_ID!,
    client_secret: THREADS_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
    grant_type: 'authorization_code',
  });

  const response = await fetch(`${THREADS_API_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Erreur Threads OAuth: ${error.error_message || error.error?.message || 'Échec de l\'échange de token'}`
    );
  }

  const data: ThreadsTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Échange un token court terme contre un token long terme (60 jours)
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const config = checkThreadsConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const params = new URLSearchParams({
    grant_type: 'th_exchange_token',
    client_secret: THREADS_APP_SECRET!,
    access_token: shortLivedToken,
  });

  const response = await fetch(`${THREADS_API_BASE}/access_token?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Erreur échange token long terme Threads: ${error.error_message || error.error?.message || 'Échec de l\'échange'}`
    );
  }

  const data: ThreadsLongLivedTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000, // 60 jours par défaut
  };
}

/**
 * Rafraîchit un token long terme Threads (avant expiration)
 * Les tokens peuvent être rafraîchis si non expirés
 */
export async function refreshLongLivedToken(
  longLivedToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const config = checkThreadsConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const params = new URLSearchParams({
    grant_type: 'th_refresh_token',
    access_token: longLivedToken,
  });

  const response = await fetch(`${THREADS_API_BASE}/refresh_access_token?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Erreur rafraîchissement token Threads: ${error.error_message || error.error?.message || 'Échec du rafraîchissement'}`
    );
  }

  const data: ThreadsLongLivedTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000,
  };
}

/**
 * Récupère les informations du profil Threads
 */
export async function getThreadsUser(accessToken: string): Promise<ThreadsUser> {
  const fields = 'id,username,name,threads_profile_picture_url,threads_biography';
  const response = await fetch(
    `${THREADS_API_BASE}/${THREADS_API_VERSION}/me?fields=${fields}&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Erreur récupération profil Threads: ${error.error_message || error.error?.message || 'Échec de la requête'}`
    );
  }

  return response.json();
}

/**
 * Vérifie si un token Threads est valide
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${THREADS_API_BASE}/${THREADS_API_VERSION}/me?fields=id&access_token=${accessToken}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Construit les métadonnées du compte Threads
 */
export function buildAccountMetadata(user: ThreadsUser): SocialAccountMetadata {
  return {
    threadsUserId: user.id,
    threadsUsername: user.username,
    avatarUrl: user.threads_profile_picture_url,
  };
}

/**
 * Convertit les données utilisateur en infos de compte
 */
export function toAccountInfo(user: ThreadsUser): ThreadsAccountInfo {
  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    profilePictureUrl: user.threads_profile_picture_url,
    biography: user.threads_biography,
  };
}

/**
 * Calcule la date d'expiration du token
 */
export function calculateTokenExpiry(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000);
}
