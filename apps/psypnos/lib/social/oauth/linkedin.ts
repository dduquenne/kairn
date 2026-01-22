// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * LinkedIn OAuth 2.0 Implementation
 *
 * Gère l'authentification OAuth avec LinkedIn pour publier sur:
 * - Le profil personnel de l'utilisateur
 * - Les pages d'entreprise (organisations)
 *
 * Scopes requis:
 * - openid: OpenID Connect
 * - profile: Informations de base du profil
 * - w_member_social: Poster au nom du membre
 * - r_organization_social: Lire les infos de l'organisation
 * - w_organization_social: Poster au nom de l'organisation
 *
 * @see https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 */

import { SocialAccountMetadata } from '../types';

// ===========================================
// Configuration
// ===========================================

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_AUTH_BASE = 'https://www.linkedin.com/oauth/v2';

/**
 * Scopes demandés pour LinkedIn
 *
 * Produits LinkedIn requis :
 * - "Share on LinkedIn" : w_member_social
 * - "Sign In with LinkedIn using OpenID Connect" : openid, profile, email
 *
 * Les deux produits doivent être activés sur l'application LinkedIn Developer
 */
export const LINKEDIN_SCOPES = [
  'openid',            // Identification OpenID Connect
  'profile',           // Informations de base du profil (nom, photo)
  'w_member_social',   // Poster au nom du membre
  // 'email',          // Optionnel - adresse email
  // Scopes organisation (nécessitent Marketing Developer Platform)
  // 'r_organization_social',
  // 'w_organization_social',
];

// ===========================================
// Types
// ===========================================

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
  token_type: string;
}

interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    displayImage: string;
  };
}

interface LinkedInUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
}

interface LinkedInOrganization {
  id: number;
  localizedName: string;
  vanityName?: string;
  logoV2?: {
    original: string;
  };
}

export interface LinkedInAccountInfo {
  personId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  profilePictureUrl?: string;
  organizations?: LinkedInOrganization[];
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Vérifie que les credentials LinkedIn sont configurés
 */
export function checkLinkedInConfig(): { valid: boolean; error?: string } {
  if (!LINKEDIN_CLIENT_ID) {
    return { valid: false, error: 'LINKEDIN_CLIENT_ID non configuré' };
  }
  if (!LINKEDIN_CLIENT_SECRET) {
    return { valid: false, error: 'LINKEDIN_CLIENT_SECRET non configuré' };
  }
  return { valid: true };
}

/**
 * Génère l'URL d'autorisation OAuth LinkedIn
 */
export function getAuthorizationUrl(redirectUri: string, state: string): string {
  const config = checkLinkedInConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID!,
    redirect_uri: redirectUri,
    state,
    scope: LINKEDIN_SCOPES.join(' '),
  });

  return `${LINKEDIN_AUTH_BASE}/authorization?${params.toString()}`;
}

/**
 * Échange le code d'autorisation contre un access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  refreshExpiresIn?: number;
  scope: string;
}> {
  const config = checkLinkedInConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: LINKEDIN_CLIENT_ID!,
    client_secret: LINKEDIN_CLIENT_SECRET!,
  });

  const response = await fetch(`${LINKEDIN_AUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Erreur LinkedIn OAuth: ${error.error_description || error.error || 'Échec de l\'échange de token'}`
    );
  }

  const data: LinkedInTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    refreshExpiresIn: data.refresh_token_expires_in,
    scope: data.scope,
  };
}

/**
 * Rafraîchit un access token LinkedIn
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  refreshExpiresIn?: number;
}> {
  const config = checkLinkedInConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: LINKEDIN_CLIENT_ID!,
    client_secret: LINKEDIN_CLIENT_SECRET!,
  });

  const response = await fetch(`${LINKEDIN_AUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Erreur refresh token LinkedIn: ${error.error_description || error.error || 'Échec du rafraîchissement'}`
    );
  }

  const data: LinkedInTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    refreshExpiresIn: data.refresh_token_expires_in,
  };
}

/**
 * Récupère les informations de l'utilisateur via OpenID Connect
 * @see https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2
 */
export async function getUserInfo(accessToken: string): Promise<LinkedInUserInfo> {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'LinkedIn-Version': '202401',
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Échec de la requête';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error_description || errorText;
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    throw new Error(`Erreur récupération profil LinkedIn: ${errorMessage}`);
  }

  return response.json();
}

/**
 * Récupère le profil LinkedIn complet (méthode alternative)
 */
export async function getProfile(accessToken: string): Promise<LinkedInProfile> {
  const response = await fetch(`${LINKEDIN_API_BASE}/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Erreur récupération profil LinkedIn: ${error.message || 'Échec de la requête'}`
    );
  }

  return response.json();
}

/**
 * Récupère les informations complètes du compte LinkedIn
 * Utilise l'API OpenID Connect /userinfo (nécessite scope 'openid' et 'profile')
 */
export async function getLinkedInAccountInfo(accessToken: string): Promise<LinkedInAccountInfo> {
  const userInfo = await getUserInfo(accessToken);

  return {
    personId: userInfo.sub,
    firstName: userInfo.given_name,
    lastName: userInfo.family_name,
    fullName: userInfo.name,
    email: userInfo.email,
    profilePictureUrl: userInfo.picture,
  };
}

/**
 * Vérifie l'introspection d'un token (si l'app le supporte)
 */
export async function introspectToken(accessToken: string): Promise<{
  active: boolean;
  expiresAt?: Date;
  scope?: string;
  clientId?: string;
}> {
  const config = checkLinkedInConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  try {
    const params = new URLSearchParams({
      token: accessToken,
      client_id: LINKEDIN_CLIENT_ID!,
      client_secret: LINKEDIN_CLIENT_SECRET!,
    });

    const response = await fetch(`${LINKEDIN_AUTH_BASE}/introspectToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      // L'introspection peut ne pas être disponible
      return { active: false };
    }

    const data = await response.json();

    return {
      active: data.active,
      expiresAt: data.exp ? new Date(data.exp * 1000) : undefined,
      scope: data.scope,
      clientId: data.client_id,
    };
  } catch {
    // En cas d'erreur, on considère le token comme potentiellement actif
    // et on laisse les appels API déterminer s'il est vraiment valide
    return { active: true };
  }
}

/**
 * Construit les métadonnées du compte à partir des infos LinkedIn
 */
export function buildAccountMetadata(info: LinkedInAccountInfo): SocialAccountMetadata {
  return {
    personId: info.personId,
    profileUrl: `https://www.linkedin.com/in/${info.personId}`,
    avatarUrl: info.profilePictureUrl,
  };
}

/**
 * Calcule la date d'expiration du token
 */
export function calculateTokenExpiry(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000);
}

/**
 * Vérifie si un token doit être rafraîchi (expire dans moins de 7 jours)
 */
export function shouldRefreshToken(tokenExpiry: Date | null): boolean {
  if (!tokenExpiry) return true;

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return tokenExpiry < sevenDaysFromNow;
}
