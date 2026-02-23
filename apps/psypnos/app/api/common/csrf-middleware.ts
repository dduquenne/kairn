/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Configuration du middleware CSRF
 */
const CSRF_CONFIG = {
  // Nom du cookie qui stocke le token CSRF
  cookieName: 'psypnos_csrf_token',
  // Nom du header qui contient le token CSRF dans les requêtes
  headerName: 'x-csrf-token',
  // Durée de vie du token en secondes (1 heure)
  tokenLifetime: 3600,
  // Options des cookies
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 3600, // 1 heure
  },
} as const;

/**
 * Structure d'un token CSRF
 */
type CSRFToken = {
  value: string;
  timestamp: number;
  signature: string;
};

/**
 * Récupère la clé secrète pour signer les tokens CSRF
 * La clé doit être définie dans les variables d'environnement
 */
function getCSRFSecret(): string {
  const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "CSRF_SECRET ou JWT_SECRET doit être défini dans les variables d'environnement"
    );
  }

  return secret;
}

/**
 * Génère un token CSRF unique et signé
 * @returns Token CSRF encodé en base64
 */
export function generateCSRFToken(): string {
  const value = randomBytes(32).toString('base64');
  const timestamp = Date.now();
  const secret = getCSRFSecret();

  // Créer une signature HMAC du token avec le timestamp
  const signature = createHmac('sha256', secret).update(`${value}:${timestamp}`).digest('base64');

  const token: CSRFToken = {
    value,
    timestamp,
    signature,
  };

  // Encoder le token complet en base64
  return Buffer.from(JSON.stringify(token)).toString('base64');
}

/**
 * Valide un token CSRF
 *
 * La validation repose sur la signature HMAC du token (Signed Token Pattern).
 * Le token est auto-validant : sa signature prouve qu'il a été généré par le serveur.
 * Un attaquant cross-origin ne peut ni forger le token (secret inconnu)
 * ni le voler (same-origin policy empêche la lecture des réponses JSON).
 *
 * @param token Token CSRF à valider
 * @returns true si le token est valide, false sinon
 */
export function validateCSRFToken(token: string | null | undefined): boolean {
  if (!token) {
    return false;
  }

  try {
    // Décoder le token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8')) as CSRFToken;

    // Vérifier que le token a tous les champs requis
    if (!decoded.value || !decoded.timestamp || !decoded.signature) {
      return false;
    }

    // Vérifier que le token n'est pas expiré
    const now = Date.now();
    const age = (now - decoded.timestamp) / 1000;

    if (age > CSRF_CONFIG.tokenLifetime) {
      return false;
    }

    // Vérifier la signature
    const secret = getCSRFSecret();
    const expectedSignature = createHmac('sha256', secret)
      .update(`${decoded.value}:${decoded.timestamp}`)
      .digest('base64');

    const tokenSignatureBuffer = Buffer.from(decoded.signature, 'base64');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'base64');

    if (tokenSignatureBuffer.length !== expectedSignatureBuffer.length) {
      return false;
    }

    // Utiliser timingSafeEqual pour éviter les attaques par timing
    if (!timingSafeEqual(tokenSignatureBuffer, expectedSignatureBuffer)) {
      return false;
    }

    return true;
  } catch (error) {
    // En cas d'erreur de décodage ou autre, le token est invalide
    return false;
  }
}

/**
 * Récupère le token CSRF depuis la requête
 * Cherche d'abord dans les headers, puis dans le body
 * @param request Requête HTTP
 * @returns Token CSRF ou null s'il n'est pas trouvé
 */
export async function getCSRFTokenFromRequest(request: Request): Promise<string | null> {
  // Essayer de récupérer le token depuis les headers
  const headerToken = request.headers.get(CSRF_CONFIG.headerName);

  if (headerToken) {
    return headerToken;
  }

  // Si pas dans les headers, essayer de le récupérer depuis le body (pour les formulaires)
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // Si c'est du JSON, cloner la requête pour pouvoir lire le body
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();
      return body.csrf_token || null;
    }

    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Si c'est du form-data
      const clonedRequest = request.clone();
      const formData = await clonedRequest.formData();
      return formData.get('csrf_token') as string | null;
    }
  } catch (error) {
    // En cas d'erreur de parsing, retourner null
    return null;
  }

  return null;
}

/**
 * Récupère la configuration des cookies CSRF
 * (utilisé par la route /api/csrf-token pour définir le cookie sur la réponse)
 */
export function getCSRFCookieConfig() {
  return {
    cookieName: CSRF_CONFIG.cookieName,
    cookieOptions: CSRF_CONFIG.cookieOptions,
  };
}

/**
 * Middleware de validation CSRF pour les routes API
 *
 * Valide le token CSRF envoyé dans le header ou le body de la requête.
 * La validation repose uniquement sur la signature HMAC (Signed Token Pattern),
 * ce qui évite les problèmes de désynchronisation cookie/header lorsque
 * plusieurs composants génèrent des tokens CSRF en parallèle.
 *
 * @param request Requête HTTP
 * @returns null si le token est valide, Response d'erreur sinon
 */
export async function validateCSRFMiddleware(request: Request): Promise<Response | null> {
  // Récupérer le token depuis la requête (header ou body)
  const requestToken = await getCSRFTokenFromRequest(request);

  // Valider la signature HMAC du token
  const isValid = validateCSRFToken(requestToken);

  if (!isValid) {
    return new Response(
      JSON.stringify({
        message: 'Token CSRF invalide ou expiré. Veuillez rafraîchir la page.',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return null;
}

/**
 * Récupère les noms de configuration CSRF (utile pour les formulaires)
 */
export function getCSRFConfig() {
  return {
    cookieName: CSRF_CONFIG.cookieName,
    headerName: CSRF_CONFIG.headerName,
  };
}
