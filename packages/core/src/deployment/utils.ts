/**
 * Deployment Utilities
 *
 * Shared helper functions for deployment management.
 */

import { randomBytes } from 'crypto';

/** Whitelisted branches/tags that can be deployed */
export const ALLOWED_REFS = ['main', 'master', 'develop', 'staging', 'production'] as const;

/** Pattern for version tags (v1.0.0, v2.1.3-beta, etc.) */
export const VERSION_TAG_PATTERN = /^v\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;

/** Allowed branch prefixes beyond the whitelist */
const ALLOWED_PREFIXES = ['release/', 'hotfix/'];

/** Check if a git ref is allowed for deployment */
export function isAllowedRef(ref: string): boolean {
  if ((ALLOWED_REFS as readonly string[]).includes(ref)) {
    return true;
  }
  if (VERSION_TAG_PATTERN.test(ref)) {
    return true;
  }
  return ALLOWED_PREFIXES.some(prefix => ref.startsWith(prefix));
}

/** Generate a secure deployment token (64 hex chars) */
export function generateDeployToken(): string {
  return randomBytes(32).toString('hex');
}

/** Get token expiration time (10 minutes from now) */
export function getTokenExpiration(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}

/** Validate that a deploy token has not expired */
export function isTokenValid(expiresAt: Date): boolean {
  return new Date() < expiresAt;
}

/** Format duration in human readable format */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/** Regex patterns for sensitive data to redact from logs */
const SENSITIVE_PATTERNS = [
  /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g,
  /password[=:]\s*["']?[^"'\s]+["']?/gi,
  /secret[=:]\s*["']?[^"'\s]+["']?/gi,
  /api[_-]?key[=:]\s*["']?[^"'\s]+["']?/gi,
  /token[=:]\s*["']?[^"'\s]+["']?/gi,
];

/** Sanitize log output by removing sensitive data */
export function sanitizeLogs(logs: string): string {
  let sanitized = logs;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

/** Get deployment status color for UI */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'green';
    case 'failed':
      return 'red';
    case 'rolled_back':
      return 'orange';
    case 'in_progress':
      return 'blue';
    case 'pending':
      return 'gray';
    default:
      return 'gray';
  }
}

/** French display name for deployment phases */
const PHASE_NAMES: Record<string, string> = {
  prerequisites: 'Vérification des prérequis',
  backup: 'Création du backup',
  git: 'Mise à jour du code',
  dependencies: 'Installation des dépendances',
  migrations: 'Migrations base de données',
  build: "Build de l'application",
  deploy: 'Déploiement',
  healthcheck: 'Vérification de santé',
  rollback: 'Rollback en cours',
  complete: 'Terminé',
};

/** Get phase display name in French */
export function getPhaseDisplayName(phase: string | null): string {
  return PHASE_NAMES[phase || ''] || phase || 'En attente';
}
