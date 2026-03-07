/**
 * Deployment module
 *
 * Shared types, utilities, and maintenance flag management
 * for the deployment system.
 */

// Types
export type {
  DeploymentStatus,
  DeploymentPhase,
  DeploymentInfo,
  DeploymentTriggerRequest,
  DeploymentTriggerResponse,
  MaintenanceModeInfo,
  BranchInfo,
  MaintenanceFlag,
} from './types';

// Utilities
export {
  ALLOWED_REFS,
  VERSION_TAG_PATTERN,
  isAllowedRef,
  generateDeployToken,
  getTokenExpiration,
  isTokenValid,
  formatDuration,
  sanitizeLogs,
  getStatusColor,
  getPhaseDisplayName,
} from './utils';

// Maintenance flag
export {
  writeMaintenanceFlag,
  removeMaintenanceFlag,
  setMaintenanceInactive,
  setMaintenanceActive,
} from './maintenance-flag';
