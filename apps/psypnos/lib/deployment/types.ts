// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Deployment System Types
 */

export type DeploymentStatus =
  | "pending"
  | "in_progress"
  | "success"
  | "failed"
  | "rolled_back";

export type DeploymentPhase =
  | "prerequisites"
  | "backup"
  | "git"
  | "dependencies"
  | "migrations"
  | "build"
  | "deploy"
  | "healthcheck"
  | "rollback"
  | "complete";

export interface DeploymentInfo {
  id: string;
  status: DeploymentStatus;
  targetRef: string;
  targetCommit?: string | null;
  previousCommit?: string | null;
  triggeredBy: string;
  triggeredAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  currentPhase?: DeploymentPhase | null;
  progress: number;
  logs?: string | null;
  errorMessage?: string | null;
  healthCheckPassed: boolean;
  rolledBackAt?: string | null;
  rollbackReason?: string | null;
}

export interface DeploymentTriggerRequest {
  targetRef: string; // Branch or tag name
  force?: boolean; // Skip confirmation checks
}

export interface DeploymentTriggerResponse {
  success: boolean;
  deploymentId?: string;
  message: string;
  error?: string;
}

export interface MaintenanceModeInfo {
  isActive: boolean;
  reason?: string | null;
  message?: string | null;
  activatedBy?: string | null;
  activatedAt?: string | null;
  estimatedEnd?: string | null;
}

export interface BranchInfo {
  name: string;
  commit: string;
  isDefault: boolean;
  lastUpdated?: string;
}

// Whitelisted branches/tags that can be deployed
export const ALLOWED_REFS = [
  "main",
  "master",
  "develop",
  "staging",
  "production",
  // Allow version tags
] as const;

// Pattern for version tags (v1.0.0, v2.1.3, etc.)
export const VERSION_TAG_PATTERN = /^v\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;

export function isAllowedRef(ref: string): boolean {
  // Check if it's in the whitelist
  if (ALLOWED_REFS.includes(ref as typeof ALLOWED_REFS[number])) {
    return true;
  }

  // Check if it's a version tag
  if (VERSION_TAG_PATTERN.test(ref)) {
    return true;
  }

  // Check if it starts with allowed prefixes
  const allowedPrefixes = ["release/", "hotfix/"];
  for (const prefix of allowedPrefixes) {
    if (ref.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}
