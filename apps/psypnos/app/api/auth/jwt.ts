// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { jwtVerify, SignJWT, decodeProtectedHeader } from "jose";
import { getSecretsManager } from "./secrets-manager";

// SÉCURITÉ : JWT_SECRET est obligatoire en production
// La vérification est faite uniquement au runtime en production, pas au build time
function validateSecrets() {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET && !process.env.JWT_SECRETS_VERSIONED) {
      throw new Error(
        "CRITICAL SECURITY ERROR: JWT_SECRET or JWT_SECRETS_VERSIONED must be set. " +
        "Never use default secrets in production."
      );
    }
  }
}

// Fallback pour compatibilité legacy (si JWT_SECRETS_VERSIONED n'est pas configuré)
// En développement/build, on utilise un secret par défaut ; en production, c'est vérifié au runtime
function getLegacySecret() {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  return new TextEncoder().encode(secret);
}

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Crée un JWT token pour un utilisateur authentifié
 *
 * Utilise le système de versionnage si JWT_SECRETS_VERSIONED est configuré,
 * sinon utilise le secret legacy pour compatibilité ascendante.
 */
export async function createToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  // Valider les secrets en production
  validateSecrets();

  // Essayer d'utiliser le nouveau système de versionnage
  try {
    const secretsManager = getSecretsManager();
    const signingKey = await secretsManager.getSigningKey();
    const algorithm = secretsManager.getCurrentAlgorithm();
    const kid = secretsManager.getCurrentKid();

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: algorithm, kid })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(signingKey);

    return token;
  } catch (error) {
    // Fallback sur l'ancien système si le nouveau n'est pas configuré
    // Le secret est validé au démarrage, donc on sait qu'il existe
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(getLegacySecret());

    return token;
  }
}

/**
 * Vérifie et décode un JWT token
 *
 * Supporte plusieurs versions de secrets pour permettre la rotation sans casser
 * les tokens existants. Essaie d'abord avec le kid du header, puis avec tous
 * les secrets valides si le kid n'est pas trouvé ou absent (tokens legacy).
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    // Essayer d'utiliser le nouveau système de versionnage
    const secretsManager = getSecretsManager();

    // 1. Essayer de décoder le header pour récupérer le kid
    let kid: string | undefined;
    try {
      const header = decodeProtectedHeader(token);
      kid = header.kid;
    } catch {
      // Token invalide ou mal formé, on continuera avec le fallback
    }

    // 2. Si on a un kid, essayer avec la version correspondante
    if (kid) {
      const verificationKey = await secretsManager.getVerificationKey(kid);
      if (verificationKey) {
        try {
          const verified = await jwtVerify(token, verificationKey);
          const payload = verified.payload as unknown as JWTPayload;
          return payload;
        } catch {
          // Le token ne correspond pas à cette version, continuer
        }
      }
    }

    // 3. Si pas de kid ou échec, essayer avec toutes les versions valides
    // (compatibilité avec les anciens tokens qui n'ont pas de kid)
    const validVersions = secretsManager.getValidVersions();
    for (const version of validVersions) {
      try {
        const verificationKey = await secretsManager.getVerificationKey(version.kid);
        if (!verificationKey) continue;

        const verified = await jwtVerify(token, verificationKey);
        const payload = verified.payload as unknown as JWTPayload;
        return payload;
      } catch {
        // Continuer avec la prochaine version
        continue;
      }
    }

    // Aucune version n'a fonctionné
    return null;
  } catch {
    // Si le système de versionnage n'est pas disponible, fallback sur legacy
    try {
      const verified = await jwtVerify(token, getLegacySecret());
      const payload = verified.payload as unknown as JWTPayload;
      return payload;
    } catch {
      return null;
    }
  }
}

/**
 * Extrait le token du header Authorization
 */
export function getTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}
