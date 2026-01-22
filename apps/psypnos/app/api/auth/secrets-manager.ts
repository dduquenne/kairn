// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * JWT Secrets Manager
 *
 * Gestion centralisée des secrets JWT avec support :
 * - Multi-secrets avec versionnage (kid)
 * - Rotation des secrets
 * - Expiration automatique après 30 jours
 * - Support HS256 (HMAC) et RS256 (asymétrique)
 */

import { importJWK, exportJWK, generateKeyPair } from "jose";

// Type pour les clés (jose utilise CryptoKey en interne)
type JoseKey = CryptoKey | Uint8Array;

export type JWTAlgorithm = "HS256" | "RS256";

export interface JWTSecretVersion {
  kid: string; // Key ID unique
  algorithm: JWTAlgorithm;
  secret?: string; // Pour HS256 (HMAC symétrique)
  publicKey?: string; // Pour RS256 (clé publique PEM)
  privateKey?: string; // Pour RS256 (clé privée PEM)
  createdAt: string; // ISO 8601 date
  expiresAt?: string; // ISO 8601 date (optionnel, 30 jours par défaut)
  isActive: boolean; // false = ne pas utiliser pour signer, mais encore valide pour vérifier
}

export interface JWTSecretsConfig {
  current: string; // kid du secret actuel (utilisé pour signer)
  versions: JWTSecretVersion[];
}

/**
 * Gestionnaire de secrets JWT
 */
export class SecretsManager {
  private config: JWTSecretsConfig;
  private rsaKeyPairs: Map<string, { publicKey: JoseKey; privateKey: JoseKey }> = new Map();

  constructor(config?: JWTSecretsConfig) {
    this.config = config || this.getDefaultConfig();
    this.validateConfig();
  }

  /**
   * Charge la configuration depuis les variables d'environnement
   */
  static fromEnv(): SecretsManager {
    const configJson = process.env.JWT_SECRETS_VERSIONED;

    if (configJson) {
      try {
        const config = JSON.parse(configJson) as JWTSecretsConfig;
        return new SecretsManager(config);
      } catch (error) {
        console.error("Erreur lors du parsing de JWT_SECRETS_VERSIONED:", error);
      }
    }

    // Fallback: créer une config basique depuis JWT_SECRET pour compatibilité
    const legacySecret = process.env.JWT_SECRET;
    if (legacySecret) {
      return SecretsManager.fromLegacySecret(legacySecret);
    }

    throw new Error("Aucune configuration JWT trouvée (JWT_SECRETS_VERSIONED ou JWT_SECRET)");
  }

  /**
   * Crée un gestionnaire depuis un secret legacy (migration HS256)
   */
  static fromLegacySecret(secret: string): SecretsManager {
    const now = new Date();
    const config: JWTSecretsConfig = {
      current: "legacy-v1",
      versions: [
        {
          kid: "legacy-v1",
          algorithm: "HS256",
          secret,
          createdAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
        },
      ],
    };
    return new SecretsManager(config);
  }

  /**
   * Génère une paire de clés RS256
   */
  static async generateRS256KeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const { publicKey, privateKey } = await generateKeyPair("RS256");

    const publicJWK = await exportJWK(publicKey);
    const privateJWK = await exportJWK(privateKey);

    return {
      publicKey: JSON.stringify(publicJWK),
      privateKey: JSON.stringify(privateJWK),
    };
  }

  /**
   * Ajoute une nouvelle version de secret (rotation)
   */
  async addVersion(algorithm: JWTAlgorithm, secret?: string): Promise<string> {
    const kid = this.generateKid();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 jours

    let newVersion: JWTSecretVersion;

    if (algorithm === "HS256") {
      if (!secret) {
        throw new Error("Le secret est requis pour HS256");
      }
      newVersion = {
        kid,
        algorithm: "HS256",
        secret,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActive: true,
      };
    } else if (algorithm === "RS256") {
      const { publicKey, privateKey } = await SecretsManager.generateRS256KeyPair();
      newVersion = {
        kid,
        algorithm: "RS256",
        publicKey,
        privateKey,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActive: true,
      };
    } else {
      throw new Error(`Algorithme non supporté: ${algorithm}`);
    }

    // Marquer l'ancienne version comme inactive (mais toujours valide pour vérification)
    const currentVersion = this.getCurrentVersion();
    if (currentVersion) {
      currentVersion.isActive = false;
    }

    this.config.versions.push(newVersion);
    this.config.current = kid;

    return kid;
  }

  /**
   * Récupère le secret actuel (pour signer)
   */
  getCurrentVersion(): JWTSecretVersion | null {
    return this.config.versions.find((v) => v.kid === this.config.current) || null;
  }

  /**
   * Récupère toutes les versions valides (non expirées)
   */
  getValidVersions(): JWTSecretVersion[] {
    const now = new Date();
    return this.config.versions.filter((v) => {
      if (!v.expiresAt) return true;
      return new Date(v.expiresAt) > now;
    });
  }

  /**
   * Récupère une version spécifique par kid
   */
  getVersion(kid: string): JWTSecretVersion | null {
    return this.config.versions.find((v) => v.kid === kid) || null;
  }

  /**
   * Récupère le secret pour signer (version actuelle)
   */
  async getSigningKey(): Promise<JoseKey> {
    const current = this.getCurrentVersion();
    if (!current) {
      throw new Error("Aucun secret actuel configuré");
    }

    if (current.algorithm === "HS256") {
      return new TextEncoder().encode(current.secret);
    } else if (current.algorithm === "RS256") {
      if (!current.privateKey) {
        throw new Error("Clé privée manquante pour RS256");
      }
      return await this.loadRS256PrivateKey(current.kid, current.privateKey);
    }

    throw new Error(`Algorithme non supporté: ${current.algorithm}`);
  }

  /**
   * Récupère le secret pour vérifier un token avec un kid spécifique
   */
  async getVerificationKey(kid?: string): Promise<JoseKey | null> {
    const version = kid ? this.getVersion(kid) : this.getCurrentVersion();

    if (!version) {
      return null;
    }

    // Vérifier que la version n'est pas expirée
    if (version.expiresAt && new Date(version.expiresAt) < new Date()) {
      return null;
    }

    if (version.algorithm === "HS256") {
      return new TextEncoder().encode(version.secret);
    } else if (version.algorithm === "RS256") {
      if (!version.publicKey) {
        throw new Error("Clé publique manquante pour RS256");
      }
      return await this.loadRS256PublicKey(version.kid, version.publicKey);
    }

    return null;
  }

  /**
   * Nettoie les versions expirées (à appeler périodiquement)
   */
  cleanupExpiredVersions(): number {
    const now = new Date();
    const initialLength = this.config.versions.length;

    this.config.versions = this.config.versions.filter((v) => {
      if (!v.expiresAt) return true; // Garder les versions sans expiration
      const expiresAt = new Date(v.expiresAt);
      // Ajouter une grâce de 24h après expiration pour les tokens en cours
      return expiresAt.getTime() + 24 * 60 * 60 * 1000 > now.getTime();
    });

    return initialLength - this.config.versions.length;
  }

  /**
   * Exporte la configuration (pour sauvegarder dans .env)
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Récupère l'algorithme du secret actuel
   */
  getCurrentAlgorithm(): JWTAlgorithm {
    const current = this.getCurrentVersion();
    return current?.algorithm || "HS256";
  }

  /**
   * Récupère le kid du secret actuel
   */
  getCurrentKid(): string {
    return this.config.current;
  }

  // ========== Méthodes privées ==========

  private validateConfig(): void {
    if (!this.config.current) {
      throw new Error("Configuration invalide: 'current' manquant");
    }

    if (!this.config.versions || this.config.versions.length === 0) {
      throw new Error("Configuration invalide: aucune version de secret");
    }

    const currentVersion = this.getCurrentVersion();
    if (!currentVersion) {
      throw new Error(`Version actuelle '${this.config.current}' introuvable`);
    }

    // Vérifier que chaque version a les champs requis
    for (const version of this.config.versions) {
      if (!version.kid) {
        throw new Error("Version invalide: 'kid' manquant");
      }
      if (!version.algorithm) {
        throw new Error(`Version ${version.kid}: 'algorithm' manquant`);
      }
      if (version.algorithm === "HS256" && !version.secret) {
        throw new Error(`Version ${version.kid}: 'secret' manquant pour HS256`);
      }
      if (version.algorithm === "RS256" && (!version.publicKey || !version.privateKey)) {
        throw new Error(`Version ${version.kid}: clés publique/privée manquantes pour RS256`);
      }
    }
  }

  private generateKid(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `v${timestamp}-${random}`;
  }

  private getDefaultConfig(): JWTSecretsConfig {
    // Configuration par défaut (ne devrait jamais être utilisée en production)
    const now = new Date();
    return {
      current: "default-v1",
      versions: [
        {
          kid: "default-v1",
          algorithm: "HS256",
          secret: "default-secret-change-me",
          createdAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
        },
      ],
    };
  }

  private async loadRS256PublicKey(kid: string, publicKeyJWK: string): Promise<JoseKey> {
    const cached = this.rsaKeyPairs.get(kid);
    if (cached?.publicKey) {
      return cached.publicKey;
    }

    const jwk = JSON.parse(publicKeyJWK);
    const publicKey = await importJWK(jwk, "RS256");

    const existing = this.rsaKeyPairs.get(kid) || { publicKey, privateKey: null as any };
    existing.publicKey = publicKey;
    this.rsaKeyPairs.set(kid, existing);

    return publicKey;
  }

  private async loadRS256PrivateKey(kid: string, privateKeyJWK: string): Promise<JoseKey> {
    const cached = this.rsaKeyPairs.get(kid);
    if (cached?.privateKey) {
      return cached.privateKey;
    }

    const jwk = JSON.parse(privateKeyJWK);
    const privateKey = await importJWK(jwk, "RS256");

    const existing = this.rsaKeyPairs.get(kid) || { publicKey: null as any, privateKey };
    existing.privateKey = privateKey;
    this.rsaKeyPairs.set(kid, existing);

    return privateKey;
  }
}

// Instance singleton pour l'application
let secretsManagerInstance: SecretsManager | null = null;
let lastEnvHash: string | null = null;

/**
 * Calcule un hash simple des variables JWT pour détecter les changements
 */
function getEnvHash(): string {
  return `${process.env.JWT_SECRETS_VERSIONED || ''}-${process.env.JWT_SECRET || ''}`;
}

/**
 * Récupère l'instance singleton du gestionnaire de secrets
 * Réinitialise automatiquement si les variables d'environnement ont changé
 */
export function getSecretsManager(): SecretsManager {
  const currentHash = getEnvHash();

  // Réinitialiser si les variables d'environnement ont changé
  if (lastEnvHash !== null && lastEnvHash !== currentHash) {
    secretsManagerInstance = null;
  }

  if (!secretsManagerInstance) {
    secretsManagerInstance = SecretsManager.fromEnv();
    lastEnvHash = currentHash;
  }

  return secretsManagerInstance;
}

/**
 * Réinitialise l'instance (utile pour les tests)
 */
export function resetSecretsManager(): void {
  secretsManagerInstance = null;
  lastEnvHash = null;
}
