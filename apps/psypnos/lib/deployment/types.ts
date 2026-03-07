/**
 * Deployment System Types — re-exports from @kairn/core/deployment
 */

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
} from '@kairn/core/deployment';

// Legacy types (backward compatibility)
export type {
  DeploymentStatus,
  DeploymentPhase,
  DeploymentInfo,
  DeploymentTriggerRequest,
  DeploymentTriggerResponse,
  BranchInfo,
} from '@kairn/core/deployment';

export { ALLOWED_REFS, VERSION_TAG_PATTERN, isAllowedRef } from '@kairn/core/deployment';
