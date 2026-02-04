/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Deployment Utilities
 */

import { randomBytes } from "crypto";

/**
 * Generate a secure deployment token
 */
export function generateDeployToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Get token expiration time (10 minutes from now)
 */
export function getTokenExpiration(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}

/**
 * Validate deployment token
 */
export function isTokenValid(expiresAt: Date): boolean {
  return new Date() < expiresAt;
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Sanitize log output (remove sensitive data)
 */
export function sanitizeLogs(logs: string): string {
  // Remove potential secrets
  const patterns = [
    /Bearer\s+[a-zA-Z0-9\-._~+\/]+=*/g,
    /password[=:]\s*["']?[^"'\s]+["']?/gi,
    /secret[=:]\s*["']?[^"'\s]+["']?/gi,
    /api[_-]?key[=:]\s*["']?[^"'\s]+["']?/gi,
    /token[=:]\s*["']?[^"'\s]+["']?/gi,
  ];

  let sanitized = logs;
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  return sanitized;
}

/**
 * Get deployment status color for UI
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "success":
      return "green";
    case "failed":
      return "red";
    case "rolled_back":
      return "orange";
    case "in_progress":
      return "blue";
    case "pending":
      return "gray";
    default:
      return "gray";
  }
}

/**
 * Get phase display name
 */
export function getPhaseDisplayName(phase: string | null): string {
  const names: Record<string, string> = {
    prerequisites: "Vérification des prérequis",
    backup: "Création du backup",
    git: "Mise à jour du code",
    dependencies: "Installation des dépendances",
    migrations: "Migrations base de données",
    build: "Build de l'application",
    deploy: "Déploiement",
    healthcheck: "Vérification de santé",
    rollback: "Rollback en cours",
    complete: "Terminé",
  };

  return names[phase || ""] || phase || "En attente";
}
