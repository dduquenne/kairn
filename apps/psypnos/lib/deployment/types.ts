/**
 * Deployment System Types — re-exports from @kairn/core/deployment
 */

export type {
  DeploymentStatus,
  DeploymentPhase,
  DeploymentInfo,
  DeploymentTriggerRequest,
  DeploymentTriggerResponse,
  MaintenanceModeInfo,
  BranchInfo,
} from '@kairn/core/deployment';

export { ALLOWED_REFS, VERSION_TAG_PATTERN, isAllowedRef } from '@kairn/core/deployment';
