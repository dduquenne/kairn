/**
 * Deployment System Types
 *
 * Shared type definitions for the deployment management module.
 */

/** Possible statuses for a deployment */
export type DeploymentStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back';

/** Deployment execution phases */
export type DeploymentPhase =
  | 'prerequisites'
  | 'backup'
  | 'git'
  | 'dependencies'
  | 'migrations'
  | 'build'
  | 'deploy'
  | 'healthcheck'
  | 'rollback'
  | 'complete';

/** Full deployment record */
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

/** Request body to trigger a deployment */
export interface DeploymentTriggerRequest {
  targetRef: string;
  force?: boolean;
}

/** Response from deployment trigger */
export interface DeploymentTriggerResponse {
  success: boolean;
  deploymentId?: string;
  message: string;
  error?: string;
}

/** Maintenance mode status */
export interface MaintenanceModeInfo {
  isActive: boolean;
  reason?: string | null;
  message?: string | null;
  activatedBy?: string | null;
  activatedAt?: string | null;
  estimatedEnd?: string | null;
}

/** Git branch/tag info for deployment selection */
export interface BranchInfo {
  name: string;
  commit: string;
  isDefault: boolean;
  lastUpdated?: string;
}

/** Maintenance flag file structure */
export interface MaintenanceFlag {
  active: boolean;
  reason?: string;
  message?: string;
  activatedBy?: string;
  activatedAt?: string;
  estimatedEnd?: string;
}
