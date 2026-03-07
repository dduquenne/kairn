/**
 * Deployment module
 *
 * Shared types, utilities, and API clients for Vercel-based
 * deployment tracking and monitoring.
 */

// Types — Vercel, GitHub, Health, Maintenance, Dashboard
export type {
  VercelDeploymentState,
  VercelDeploymentTarget,
  VercelGitMeta,
  VercelDeployment,
  VercelProjectInfo,
  GitHubRunStatus,
  GitHubRunConclusion,
  GitHubCheckRun,
  GitHubWorkflowRun,
  ServiceHealth,
  RuntimeHealth,
  MaintenanceModeInfo,
  DeploymentConfig,
  DeploymentDashboardData,
  DiagnosticFinding,
  DiagnosticRecommendation,
  DiagnosticAnalysis,
} from './types';

// Legacy types (backward compatibility)
export type {
  DeploymentStatus,
  DeploymentPhase,
  DeploymentInfo,
  DeploymentTriggerRequest,
  DeploymentTriggerResponse,
  BranchInfo,
  MaintenanceFlag,
} from './types';

// Utilities
export {
  formatDuration,
  formatDurationMs,
  formatTimestamp,
  formatRelativeTime,
  VERCEL_STATE_COLORS,
  VERCEL_STATE_LABELS,
  getVercelStateColor,
  getVercelStateLabel,
  getCIColor,
  getCILabel,
  sanitizeLogs,
  checkDeploymentConfig,
} from './utils';

// Legacy utility re-exports (backward compatibility)
export {
  ALLOWED_REFS,
  VERSION_TAG_PATTERN,
  isAllowedRef,
  generateDeployToken,
  getTokenExpiration,
  isTokenValid,
  getStatusColor,
  getPhaseDisplayName,
} from './utils';

// Vercel API client
export {
  fetchVercelDeployments,
  fetchVercelDeployment,
  fetchVercelProject,
  type VercelClientConfig,
} from './vercel-client';

// GitHub API client
export {
  fetchWorkflowRuns,
  fetchCheckRunsForCommit,
  fetchLatestCIRun,
  type GitHubClientConfig,
} from './github-client';

// Maintenance flag (filesystem-based — deprecated on Vercel)
export {
  writeMaintenanceFlag,
  removeMaintenanceFlag,
  setMaintenanceInactive,
  setMaintenanceActive,
} from './maintenance-flag';
