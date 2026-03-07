/**
 * Deployment Utilities
 *
 * Shared helper functions for deployment management.
 * Adapted for Vercel-based deployment tracking.
 */

import type { VercelDeploymentState } from './types';

// ---------------------------------------------------------------------------
// Duration & Formatting
// ---------------------------------------------------------------------------

/**
 * Format a duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g. "2m 15s")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format a duration from millisecond timestamps
 * @param startMs - Start timestamp in milliseconds
 * @param endMs - End timestamp in milliseconds (defaults to now)
 * @returns Formatted duration string
 */
export function formatDurationMs(startMs: number, endMs?: number): string {
  const elapsed = ((endMs ?? Date.now()) - startMs) / 1000;
  return formatDuration(elapsed);
}

/**
 * Format a timestamp to a localized French date-time string
 * @param timestamp - Timestamp in ms or ISO string
 * @returns Formatted date-time string
 */
export function formatTimestamp(timestamp: number | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a relative time string (e.g. "il y a 5 minutes")
 * @param timestamp - Timestamp in ms or ISO string
 * @returns Relative time string in French
 */
export function formatRelativeTime(timestamp: number | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "à l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return formatTimestamp(timestamp);
}

// ---------------------------------------------------------------------------
// Vercel Deployment Status Helpers
// ---------------------------------------------------------------------------

/** Color identifiers for Vercel deployment states */
export const VERCEL_STATE_COLORS: Record<VercelDeploymentState, string> = {
  READY: 'green',
  ERROR: 'red',
  BUILDING: 'blue',
  INITIALIZING: 'blue',
  QUEUED: 'gray',
  CANCELED: 'orange',
};

/**
 * Get display color for a Vercel deployment state
 * @param state - Vercel deployment state
 * @returns Color identifier string
 */
export function getVercelStateColor(state: VercelDeploymentState): string {
  return VERCEL_STATE_COLORS[state] ?? 'gray';
}

/** French display labels for Vercel deployment states */
export const VERCEL_STATE_LABELS: Record<VercelDeploymentState, string> = {
  READY: 'En ligne',
  ERROR: 'Erreur',
  BUILDING: 'Build en cours',
  INITIALIZING: 'Initialisation',
  QUEUED: "En file d'attente",
  CANCELED: 'Annulé',
};

/**
 * Get French display label for a Vercel deployment state
 * @param state - Vercel deployment state
 * @returns French label
 */
export function getVercelStateLabel(state: VercelDeploymentState): string {
  return VERCEL_STATE_LABELS[state] ?? state;
}

// ---------------------------------------------------------------------------
// GitHub CI Status Helpers
// ---------------------------------------------------------------------------

/**
 * Get display color for a GitHub CI conclusion
 * @param conclusion - GitHub workflow conclusion
 * @returns Color identifier string
 */
export function getCIColor(conclusion: string | null): string {
  switch (conclusion) {
    case 'success':
      return 'green';
    case 'failure':
      return 'red';
    case 'cancelled':
      return 'orange';
    case 'skipped':
      return 'gray';
    case 'timed_out':
      return 'red';
    default:
      return 'blue';
  }
}

/**
 * Get French label for a GitHub CI conclusion
 * @param conclusion - GitHub workflow conclusion
 * @param status - GitHub workflow status (used when conclusion is null)
 * @returns French label
 */
export function getCILabel(conclusion: string | null, status?: string): string {
  if (!conclusion) {
    switch (status) {
      case 'in_progress':
        return 'En cours';
      case 'queued':
        return 'En attente';
      case 'waiting':
        return 'En attente';
      default:
        return 'En cours';
    }
  }

  switch (conclusion) {
    case 'success':
      return 'Réussi';
    case 'failure':
      return 'Échoué';
    case 'cancelled':
      return 'Annulé';
    case 'skipped':
      return 'Ignoré';
    case 'timed_out':
      return 'Timeout';
    default:
      return conclusion;
  }
}

// ---------------------------------------------------------------------------
// Log Sanitization
// ---------------------------------------------------------------------------

/** Regex patterns for sensitive data to redact from logs */
const SENSITIVE_PATTERNS = [
  /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g,
  /password[=:]\s*["']?[^"'\s]+["']?/gi,
  /secret[=:]\s*["']?[^"'\s]+["']?/gi,
  /api[_-]?key[=:]\s*["']?[^"'\s]+["']?/gi,
  /token[=:]\s*["']?[^"'\s]+["']?/gi,
];

/**
 * Sanitize log output by removing sensitive data
 * @param logs - Raw log string
 * @returns Sanitized log string with secrets redacted
 */
export function sanitizeLogs(logs: string): string {
  let sanitized = logs;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

// ---------------------------------------------------------------------------
// Configuration Helpers
// ---------------------------------------------------------------------------

/**
 * Check deployment configuration from environment variables
 * @returns Configuration status object
 */
export function checkDeploymentConfig(): {
  vercel: {
    configured: boolean;
    hasToken: boolean;
    hasProjectId: boolean;
    hasTeamId: boolean;
  };
  github: {
    configured: boolean;
    hasToken: boolean;
    repository: string | null;
  };
  ai: { configured: boolean };
} {
  const hasVercelToken = Boolean(process.env.VERCEL_TOKEN);
  const hasVercelProjectId = Boolean(process.env.VERCEL_PROJECT_ID);
  const hasVercelTeamId = Boolean(process.env.VERCEL_TEAM_ID);
  const hasGitHubToken = Boolean(process.env.GITHUB_TOKEN);
  const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);

  return {
    vercel: {
      configured: hasVercelToken && hasVercelProjectId,
      hasToken: hasVercelToken,
      hasProjectId: hasVercelProjectId,
      hasTeamId: hasVercelTeamId,
    },
    github: {
      configured: hasGitHubToken,
      hasToken: hasGitHubToken,
      repository: process.env.GITHUB_REPOSITORY ?? null,
    },
    ai: {
      configured: hasAnthropicKey,
    },
  };
}

// ---------------------------------------------------------------------------
// Legacy re-exports (backward compatibility)
// ---------------------------------------------------------------------------

/** @deprecated Use VERCEL_STATE_COLORS instead */
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

/** @deprecated VPS deployment phases */
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

/** @deprecated VPS-specific */
export function getPhaseDisplayName(phase: string | null): string {
  return PHASE_NAMES[phase || ''] || phase || 'En attente';
}

/** @deprecated VPS-specific — Vercel deploys from any branch via git push */
export const ALLOWED_REFS = ['main', 'master', 'develop', 'staging', 'production'] as const;

/** @deprecated VPS-specific */
export const VERSION_TAG_PATTERN = /^v\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;

/** @deprecated VPS-specific */
export function isAllowedRef(ref: string): boolean {
  if ((ALLOWED_REFS as readonly string[]).includes(ref)) return true;
  if (VERSION_TAG_PATTERN.test(ref)) return true;
  return ['release/', 'hotfix/'].some(prefix => ref.startsWith(prefix));
}

/** @deprecated VPS-specific — no deploy tokens on Vercel */
export function generateDeployToken(): string {
  return '';
}

/** @deprecated VPS-specific */
export function getTokenExpiration(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}

/** @deprecated VPS-specific */
export function isTokenValid(expiresAt: Date): boolean {
  return new Date() < expiresAt;
}
