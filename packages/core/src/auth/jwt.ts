/**
 * JWT Token Management
 *
 * Provides JWT creation and verification with support for
 * key rotation and multiple secret versions.
 */

import { jwtVerify, SignJWT, decodeProtectedHeader, type KeyLike } from 'jose';

import { createLogger } from '../logger';

const jwtLogger = createLogger('JWT');

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface JWTConfig {
  /** Primary secret for signing (required) */
  secret: string;
  /** Token expiration time (default: "24h") */
  expiresIn?: string;
  /** Algorithm to use (default: "HS256") */
  algorithm?: 'HS256' | 'HS384' | 'HS512';
  /** Issuer claim */
  issuer?: string;
  /** Audience claim */
  audience?: string;
}

export interface SecretsManagerInterface {
  getSigningKey(): Promise<KeyLike | Uint8Array>;
  getVerificationKey(kid: string): Promise<KeyLike | Uint8Array | null>;
  getCurrentAlgorithm(): string;
  getCurrentKid(): string;
  getValidVersions(): Array<{ kid: string }>;
}

let secretsManager: SecretsManagerInterface | null = null;
let jwtConfig: JWTConfig | null = null;

/**
 * Configure JWT settings
 */
export function configureJWT(config: JWTConfig): void {
  jwtConfig = config;
}

/**
 * Set a custom secrets manager for key rotation
 */
export function setSecretsManager(manager: SecretsManagerInterface): void {
  secretsManager = manager;
}

/**
 * Get secret as Uint8Array
 */
function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/**
 * Validate that JWT is properly configured
 */
function validateConfig(): void {
  if (process.env.NODE_ENV === 'production') {
    if (!jwtConfig?.secret && !secretsManager) {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT must be configured. ' +
          'Call configureJWT() or setSecretsManager() before using JWT functions.'
      );
    }
  }
}

/**
 * Create a JWT token for an authenticated user
 */
export async function createToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  options?: Partial<JWTConfig>
): Promise<string> {
  validateConfig();

  const config = { ...jwtConfig, ...options };
  const expiresIn = config?.expiresIn || '24h';
  const algorithm = config?.algorithm || 'HS256';

  // Try to use secrets manager if available
  if (secretsManager) {
    try {
      const signingKey = await secretsManager.getSigningKey();
      const kid = secretsManager.getCurrentKid();
      const alg = secretsManager.getCurrentAlgorithm();

      let builder = new SignJWT(payload)
        .setProtectedHeader({ alg, kid })
        .setIssuedAt()
        .setExpirationTime(expiresIn);

      if (config?.issuer) builder = builder.setIssuer(config.issuer);
      if (config?.audience) builder = builder.setAudience(config.audience);

      return builder.sign(signingKey);
    } catch (err) {
      jwtLogger.warn('Secrets manager signing failed, falling back to legacy secret', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Use configured secret
  const secret = config?.secret || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret not configured');
  }

  let builder = new SignJWT(payload)
    .setProtectedHeader({ alg: algorithm })
    .setIssuedAt()
    .setExpirationTime(expiresIn);

  if (config?.issuer) builder = builder.setIssuer(config.issuer);
  if (config?.audience) builder = builder.setAudience(config.audience);

  return builder.sign(getSecretKey(secret));
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    // Try secrets manager first
    if (secretsManager) {
      // 1. Try to decode header for kid
      let kid: string | undefined;
      try {
        const header = decodeProtectedHeader(token);
        kid = header.kid;
      } catch (err) {
        jwtLogger.warn('Failed to decode token header', {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      // 2. If we have a kid, try that version
      if (kid) {
        const verificationKey = await secretsManager.getVerificationKey(kid);
        if (verificationKey) {
          try {
            const verified = await jwtVerify(token, verificationKey);
            return verified.payload as unknown as JWTPayload;
          } catch (err) {
            jwtLogger.warn('Token verification failed for kid, trying other versions', {
              kid,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      }

      // 3. Try all valid versions
      const validVersions = secretsManager.getValidVersions();
      for (const version of validVersions) {
        try {
          const verificationKey = await secretsManager.getVerificationKey(version.kid);
          if (!verificationKey) continue;

          const verified = await jwtVerify(token, verificationKey);
          return verified.payload as unknown as JWTPayload;
        } catch (err) {
          jwtLogger.warn('Token verification failed for version, trying next', {
            kid: version.kid,
            error: err instanceof Error ? err.message : String(err),
          });
          continue;
        }
      }
    }

    // Fallback to configured secret
    const secret = jwtConfig?.secret || process.env.JWT_SECRET;
    if (!secret) {
      return null;
    }

    const verified = await jwtVerify(token, getSecretKey(secret));
    return verified.payload as unknown as JWTPayload;
  } catch (err) {
    jwtLogger.warn('Token verification failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function getTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadPart = parts[1];
    if (!payloadPart) return null;

    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8'));
    return payload as JWTPayload;
  } catch {
    return null;
  }
}
