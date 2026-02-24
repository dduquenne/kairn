/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Rate limiter générique avec support Redis et fallback en mémoire
 *
 * En production, utilise Redis pour le scaling horizontal.
 * Si Redis n'est pas disponible, utilise un fallback en mémoire avec éviction LRU.
 */

import { getRedisClient, isRedisConnected } from '@/lib/cache/redis';

interface RateLimitEntry {
  attempts: number;
  resetTime: number;
  lastAccess: number;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

// Configuration par type d'endpoint
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMs: 60 * 1000 }, // 5 tentatives/minute
  contact: { maxAttempts: 5, windowMs: 60 * 1000 }, // 5 messages/minute
  'quick-contact': { maxAttempts: 5, windowMs: 60 * 1000 }, // 5 messages/minute
  appointment: { maxAttempts: 5, windowMs: 60 * 1000 }, // 5 demandes/minute
  registration: { maxAttempts: 3, windowMs: 60 * 1000 }, // 3 inscriptions/minute
  assistant: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 requêtes/heure
  chat: { maxAttempts: 20, windowMs: 60 * 60 * 1000 }, // 20 messages/heure
  improveText: { maxAttempts: 20, windowMs: 60 * 60 * 1000 }, // 20 requêtes/heure
  analytics: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 requêtes/minute
};

// ============================================
// REDIS RATE LIMITING (Production)
// ============================================

const REDIS_KEY_PREFIX = 'ratelimit:';

/**
 * Build Redis key for rate limiting
 */
function buildRedisKey(type: string, identifier: string): string {
  return `${REDIS_KEY_PREFIX}${type}:${identifier}`;
}

/**
 * Check and record attempt using Redis (atomic operation)
 */
async function redisRateLimitCheck(
  type: string,
  identifier: string
): Promise<{ limited: boolean; remaining: number; resetTime: number } | null> {
  const client = getRedisClient();
  if (!client || !isRedisConnected()) {
    return null; // Fallback to memory
  }

  const config = RATE_LIMITS[type];
  if (!config) {
    throw new Error(`Unknown rate limit type: ${type}`);
  }

  const key = buildRedisKey(type, identifier);
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  try {
    // Use Redis MULTI for atomic increment with expiry
    const pipeline = client.multi();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    if (!results) {
      return null;
    }

    const [incrResult, ttlResult] = results;
    const attempts = (incrResult?.[1] as number) || 1;
    let ttl = (ttlResult?.[1] as number) || -1;

    // Set expiry if this is the first attempt (ttl === -1 means no expiry set)
    if (ttl === -1 || ttl === -2) {
      await client.expire(key, windowSeconds);
      ttl = windowSeconds;
    }

    const resetTime = Date.now() + ttl * 1000;
    const remaining = Math.max(0, config.maxAttempts - attempts);
    const limited = attempts > config.maxAttempts;

    return { limited, remaining, resetTime };
  } catch (error) {
    console.error('[RateLimiter] Redis error:', error);
    return null; // Fallback to memory
  }
}

/**
 * Clear rate limit entry in Redis
 */
async function redisClearAttempts(type: string, identifier: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !isRedisConnected()) {
    return false;
  }

  try {
    const key = buildRedisKey(type, identifier);
    await client.del(key);
    return true;
  } catch (error) {
    console.error('[RateLimiter] Redis clear error:', error);
    return false;
  }
}

// ============================================
// IN-MEMORY RATE LIMITING (Fallback)
// ============================================

// Taille maximale de la Map pour éviter les fuites mémoire
const MAX_ENTRIES = 10000;

// Maps séparées par type pour isoler les limites
const rateLimitStores = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Récupère ou crée le store pour un type d'endpoint
 */
function getStore(type: string): Map<string, RateLimitEntry> {
  let store = rateLimitStores.get(type);
  if (!store) {
    store = new Map();
    rateLimitStores.set(type, store);
  }
  return store;
}

/**
 * Éviction LRU : supprime les entrées les plus anciennes si le store est plein
 */
function evictOldestIfNeeded(store: Map<string, RateLimitEntry>): void {
  if (store.size >= MAX_ENTRIES) {
    // Trouver la clé avec le lastAccess le plus ancien
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of store.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      store.delete(oldestKey);
    }
  }
}

/**
 * In-memory rate limit check
 */
function memoryRateLimitCheck(
  type: string,
  identifier: string
): { limited: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[type];
  if (!config) {
    throw new Error(`Unknown rate limit type: ${type}`);
  }

  const store = getStore(type);
  const now = Date.now();

  // Éviction LRU si nécessaire
  evictOldestIfNeeded(store);

  let entry = store.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Nouvelle entrée ou expirée
    entry = {
      attempts: 1,
      resetTime: now + config.windowMs,
      lastAccess: now,
    };
  } else {
    // Incrémenter
    entry.attempts++;
    entry.lastAccess = now;
  }

  store.set(identifier, entry);

  const remaining = Math.max(0, config.maxAttempts - entry.attempts);
  const limited = entry.attempts > config.maxAttempts;

  return {
    limited,
    remaining,
    resetTime: entry.resetTime,
  };
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Vérifie si un identifiant est rate limited (legacy API for backwards compatibility)
 */
export function isRateLimited(
  type: string,
  identifier: string
): { limited: boolean; resetTime?: number } {
  const config = RATE_LIMITS[type];
  if (!config) {
    throw new Error(`Unknown rate limit type: ${type}`);
  }

  const store = getStore(type);
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry) {
    return { limited: false };
  }

  // Nettoyer si expiré
  if (now > entry.resetTime) {
    store.delete(identifier);
    return { limited: false };
  }

  if (entry.attempts >= config.maxAttempts) {
    return { limited: true, resetTime: entry.resetTime };
  }

  return { limited: false };
}

/**
 * Enregistre une tentative (utilise Redis si disponible, sinon mémoire)
 */
export async function recordAttemptAsync(
  type: string,
  identifier: string
): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
  // Try Redis first
  const redisResult = await redisRateLimitCheck(type, identifier);
  if (redisResult) {
    return redisResult;
  }

  // Fallback to memory
  return memoryRateLimitCheck(type, identifier);
}

/**
 * Enregistre une tentative (version synchrone, mémoire uniquement)
 * @deprecated Use recordAttemptAsync for Redis support
 */
export function recordAttempt(
  type: string,
  identifier: string
): {
  limited: boolean;
  remaining: number;
  resetTime: number;
} {
  return memoryRateLimitCheck(type, identifier);
}

/**
 * Réinitialise les tentatives (après succès)
 */
export async function clearAttemptsAsync(type: string, identifier: string): Promise<void> {
  // Clear from Redis
  await redisClearAttempts(type, identifier);

  // Also clear from memory (for fallback consistency)
  const store = getStore(type);
  store.delete(identifier);
}

/**
 * Réinitialise les tentatives (version synchrone, mémoire uniquement)
 * @deprecated Use clearAttemptsAsync for Redis support
 */
export function clearAttempts(type: string, identifier: string): void {
  const store = getStore(type);
  store.delete(identifier);

  // Fire and forget Redis clear
  redisClearAttempts(type, identifier).catch(() => {
    // Ignore errors
  });
}

/**
 * Nettoie les entrées expirées de tous les stores
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();

  for (const store of rateLimitStores.values()) {
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }
}

/**
 * Récupère l'IP du client depuis les headers Next.js
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

// Nettoyer les entrées expirées toutes les 5 minutes
if (typeof window === 'undefined' && typeof setInterval !== 'undefined') {
  const interval = setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
  // Permettre au processus d'exit
  if (interval.unref) {
    interval.unref();
  }
}
