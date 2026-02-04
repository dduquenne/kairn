/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Rate limiter for login attempts
 * Utilise le rate limiter générique avec éviction LRU
 * En production, migrer vers Redis pour le scaling horizontal
 */

import {
  isRateLimited as genericIsRateLimited,
  recordAttempt as genericRecordAttempt,
  clearAttempts as genericClearAttempts,
} from "../common/rate-limiter";

const RATE_LIMIT_TYPE = "login";

/**
 * Vérifie si une adresse IP/email a dépassé la limite de tentatives
 */
export function isRateLimited(identifier: string): boolean {
  const result = genericIsRateLimited(RATE_LIMIT_TYPE, identifier);
  return result.limited;
}

/**
 * Enregistre une tentative échouée et retourne true si la limite est atteinte
 */
export function recordFailedAttempt(identifier: string): boolean {
  const result = genericRecordAttempt(RATE_LIMIT_TYPE, identifier);
  return result.limited;
}

/**
 * Réinitialise les tentatives après une authentification réussie
 */
export function clearAttempts(identifier: string): void {
  genericClearAttempts(RATE_LIMIT_TYPE, identifier);
}
