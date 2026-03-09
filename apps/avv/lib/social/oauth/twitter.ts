/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Twitter/X OAuth 2.0 Implementation avec PKCE
 *
 * Gère l'authentification OAuth 2.0 avec Twitter pour publier du contenu.
 * Twitter utilise OAuth 2.0 avec PKCE (Proof Key for Code Exchange) pour la sécurité.
 *
 * Scopes requis:
 * - tweet.read: Lire les tweets
 * - tweet.write: Publier des tweets
 * - users.read: Lire les informations utilisateur
 * - offline.access: Obtenir un refresh token pour renouveler l'accès
 *
 * @see https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
 */

import { randomBytes, createHash } from 'crypto';

import type { SocialAccountMetadata } from '../types';

// ===========================================
// Configuration
// ===========================================

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_AUTH_BASE = 'https://twitter.com/i/oauth2';
const TWITTER_API_BASE = 'https://api.twitter.com/2';

/**
 * Scopes demandés pour Twitter
 */
export const TWITTER_SCOPES = [
  'tweet.read',     // Lire les tweets
  'tweet.write',    // Publier des tweets
  'users.read',     // Lire les infos utilisateur
  'offline.access', // Refresh token
];

/**
 * Scopes minimaux (juste publication)
 */
export const TWITTER_MINIMAL_SCOPES = [
  'tweet.write',
  'users.read',
];

// ===========================================
// Types
// ===========================================

interface TwitterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  description?: string;
}

interface TwitterUserResponse {
  data: TwitterUser;
}

export interface TwitterAccountInfo {
  userId: string;
  username: string;
  name: string;
  profilePictureUrl?: string;
  description?: string;
}

// ===========================================
// PKCE Helper Functions
// ===========================================

/**
 * Génère un code_verifier aléatoire pour PKCE
 * Le code_verifier doit avoir entre 43 et 128 caractères
 */
export function generateCodeVerifier(): string {
  return randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Génère le code_challenge à partir du code_verifier
 * Utilise SHA256 puis base64url encode
 */
export function generateCodeChallenge(codeVerifier: string): string {
  return createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Vérifie que les credentials Twitter sont configurés
 */
export function checkTwitterConfig(): { valid: boolean; error?: string } {
  if (!TWITTER_CLIENT_ID) {
    return { valid: false, error: 'TWITTER_CLIENT_ID non configuré' };
  }
  if (!TWITTER_CLIENT_SECRET) {
    return { valid: false, error: 'TWITTER_CLIENT_SECRET non configuré' };
  }
  return { valid: true };
}

/**
 * Génère l'URL d'autorisation OAuth Twitter avec PKCE
 *
 * @param redirectUri - URI de redirection après autorisation
 * @param state - Token CSRF pour la sécurité
 * @param codeChallenge - Challenge PKCE généré à partir du code_verifier
 */
export function getAuthorizationUrl(
  redirectUri: string,
  state: string,
  codeChallenge: string
): string {
  const config = checkTwitterConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: TWITTER_CLIENT_ID!,
    redirect_uri: redirectUri,
    state,
    scope: TWITTER_SCOPES.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${TWITTER_AUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Échange le code d'autorisation contre un access token
 *
 * @param code - Code d'autorisation reçu du callback
 * @param redirectUri - URI de redirection (doit être identique à celui utilisé pour l'autorisation)
 * @param codeVerifier - Code verifier PKCE original
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope: string;
}> {
  const config = checkTwitterConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  // Twitter utilise Basic Auth pour l'échange de token
  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${TWITTER_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Échec de l\'échange de token';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error_description || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    throw new Error(`Erreur Twitter OAuth: ${errorMessage}`);
  }

  const data: TwitterTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

/**
 * Rafraîchit un access token Twitter
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const config = checkTwitterConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(`${TWITTER_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Échec du rafraîchissement';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error_description || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    throw new Error(`Erreur refresh token Twitter: ${errorMessage}`);
  }

  const data: TwitterTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Récupère les informations de l'utilisateur Twitter connecté
 */
export async function getTwitterUser(accessToken: string): Promise<TwitterUser> {
  const response = await fetch(
    `${TWITTER_API_BASE}/users/me?user.fields=id,name,username,profile_image_url,description`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Échec de la requête';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorJson.title || errorMessage;
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    throw new Error(`Erreur récupération profil Twitter: ${errorMessage}`);
  }

  const data: TwitterUserResponse = await response.json();
  return data.data;
}

/**
 * Vérifie si un token Twitter est valide
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${TWITTER_API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Récupère les informations complètes du compte Twitter
 */
export async function getTwitterAccountInfo(accessToken: string): Promise<TwitterAccountInfo> {
  const user = await getTwitterUser(accessToken);

  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    profilePictureUrl: user.profile_image_url,
    description: user.description,
  };
}

/**
 * Construit les métadonnées du compte Twitter
 */
export function buildAccountMetadata(user: TwitterUser): SocialAccountMetadata {
  return {
    profileUrl: `https://twitter.com/${user.username}`,
    avatarUrl: user.profile_image_url,
  };
}

/**
 * Convertit les données utilisateur en infos de compte
 */
export function toAccountInfo(user: TwitterUser): TwitterAccountInfo {
  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    profilePictureUrl: user.profile_image_url,
    description: user.description,
  };
}

/**
 * Calcule la date d'expiration du token
 */
export function calculateTokenExpiry(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000);
}

/**
 * Vérifie si un token doit être rafraîchi (expire dans moins de 5 minutes)
 */
export function shouldRefreshToken(tokenExpiry: Date | null): boolean {
  if (!tokenExpiry) return true;

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return tokenExpiry < fiveMinutesFromNow;
}
