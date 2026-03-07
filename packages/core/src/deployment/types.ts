/**
 * Deployment System Types
 *
 * Shared type definitions for the Vercel-based deployment management module.
 * Covers Vercel deployments, GitHub CI, runtime health, and maintenance mode.
 */

// ---------------------------------------------------------------------------
// Vercel Deployment Types
// ---------------------------------------------------------------------------

/** Vercel deployment states (from Vercel REST API v6) */
export type VercelDeploymentState =
  | 'BUILDING'
  | 'ERROR'
  | 'INITIALIZING'
  | 'QUEUED'
  | 'READY'
  | 'CANCELED';

/** Vercel deployment target environment */
export type VercelDeploymentTarget = 'production' | 'preview' | null;

/** Git metadata attached to a Vercel deployment */
export interface VercelGitMeta {
  commitSha: string;
  commitMessage: string;
  commitAuthorName: string;
  commitRef: string;
  org: string;
  repo: string;
}

/** Vercel deployment record (normalized from API response) */
export interface VercelDeployment {
  /** Vercel deployment UID */
  uid: string;
  /** Deployment URL (e.g. project-xxx.vercel.app) */
  url: string;
  /** Full inspect URL on Vercel dashboard */
  inspectorUrl: string | null;
  /** Deployment state */
  state: VercelDeploymentState;
  /** Target environment */
  target: VercelDeploymentTarget;
  /** Creation timestamp (ms) */
  createdAt: number;
  /** Build start timestamp (ms) */
  buildingAt: number | null;
  /** Ready timestamp (ms) */
  readyAt: number | null;
  /** Git metadata */
  git: VercelGitMeta | null;
  /** Creator email */
  creatorEmail: string | null;
  /** Vercel project name */
  projectName: string;
}

/** Vercel project info (subset) */
export interface VercelProjectInfo {
  id: string;
  name: string;
  framework: string | null;
  nodeVersion: string | null;
  /** Link to the connected git repository */
  gitRepository: {
    type: string;
    repo: string;
  } | null;
}

// ---------------------------------------------------------------------------
// GitHub CI Types
// ---------------------------------------------------------------------------

/** GitHub Actions workflow run status */
export type GitHubRunStatus = 'completed' | 'in_progress' | 'queued' | 'waiting';

/** GitHub Actions workflow run conclusion */
export type GitHubRunConclusion =
  | 'success'
  | 'failure'
  | 'cancelled'
  | 'skipped'
  | 'timed_out'
  | 'action_required'
  | null;

/** GitHub Actions check run (individual job/step) */
export interface GitHubCheckRun {
  id: number;
  name: string;
  status: GitHubRunStatus;
  conclusion: GitHubRunConclusion;
  startedAt: string | null;
  completedAt: string | null;
  /** HTML URL to the check run on GitHub */
  htmlUrl: string;
}

/** GitHub Actions workflow run (top-level CI run) */
export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: GitHubRunStatus;
  conclusion: GitHubRunConclusion;
  headSha: string;
  headBranch: string;
  event: string;
  createdAt: string;
  updatedAt: string;
  /** HTML URL to the workflow run on GitHub */
  htmlUrl: string;
  /** Individual jobs within this workflow */
  jobs: GitHubCheckRun[];
}

// ---------------------------------------------------------------------------
// Runtime Health Types
// ---------------------------------------------------------------------------

/** Individual service health check result */
export interface ServiceHealth {
  status: 'up' | 'down' | 'disabled';
  latencyMs?: number;
  error?: string;
}

/** Runtime health status for the application */
export interface RuntimeHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  buildId: string;
  environment: string;
  region: string | null;
  checks: {
    database: ServiceHealth;
    redis: ServiceHealth;
    memory: {
      heapUsedMB: number;
      rssMB: number;
      percentUsed: number;
    };
  };
}

// ---------------------------------------------------------------------------
// Maintenance Mode Types
// ---------------------------------------------------------------------------

/** Maintenance mode status (DB-backed) */
export interface MaintenanceModeInfo {
  isActive: boolean;
  reason?: string | null;
  message?: string | null;
  activatedBy?: string | null;
  activatedAt?: string | null;
  estimatedEnd?: string | null;
}

// ---------------------------------------------------------------------------
// Configuration Status Types
// ---------------------------------------------------------------------------

/** Deployment configuration status */
export interface DeploymentConfig {
  /** Whether Vercel integration is configured */
  vercel: {
    configured: boolean;
    hasToken: boolean;
    hasProjectId: boolean;
    hasTeamId: boolean;
  };
  /** Whether GitHub integration is configured */
  github: {
    configured: boolean;
    hasToken: boolean;
    repository: string | null;
  };
  /** Whether AI diagnostic is available */
  ai: {
    configured: boolean;
  };
}

// ---------------------------------------------------------------------------
// Dashboard Aggregate Types
// ---------------------------------------------------------------------------

/** Full deployment dashboard data */
export interface DeploymentDashboardData {
  config: DeploymentConfig;
  latestDeployment: VercelDeployment | null;
  deployments: VercelDeployment[];
  ci: GitHubWorkflowRun | null;
  health: RuntimeHealth | null;
  maintenance: MaintenanceModeInfo;
}

// ---------------------------------------------------------------------------
// AI Diagnostic Types
// ---------------------------------------------------------------------------

/** Diagnostic finding from AI analysis */
export interface DiagnosticFinding {
  category: string;
  status: 'ok' | 'warning' | 'critical';
  message: string;
  details?: string;
}

/** Diagnostic recommendation from AI analysis */
export interface DiagnosticRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

/** AI-powered diagnostic analysis result */
export interface DiagnosticAnalysis {
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  summary: string;
  findings: DiagnosticFinding[];
  recommendations: DiagnosticRecommendation[];
  performanceInsights: string[];
}

// ---------------------------------------------------------------------------
// Legacy types (kept for backward compatibility during migration)
// ---------------------------------------------------------------------------

/** @deprecated Use VercelDeploymentState instead */
export type DeploymentStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back';

/** @deprecated VPS deployment phases — no longer applicable on Vercel */
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

/** @deprecated Use VercelDeployment instead */
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

/** @deprecated VPS-specific */
export interface DeploymentTriggerRequest {
  targetRef: string;
  force?: boolean;
}

/** @deprecated VPS-specific */
export interface DeploymentTriggerResponse {
  success: boolean;
  deploymentId?: string;
  message: string;
  error?: string;
}

/** @deprecated Use structured BranchInfo from git provider instead */
export interface BranchInfo {
  name: string;
  commit: string;
  isDefault: boolean;
  lastUpdated?: string;
}

/** @deprecated Filesystem-based maintenance flag — use DB-backed MaintenanceModeInfo */
export interface MaintenanceFlag {
  active: boolean;
  reason?: string;
  message?: string;
  activatedBy?: string;
  activatedAt?: string;
  estimatedEnd?: string;
}
