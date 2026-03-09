/**
 * Deployment Utilities — re-exports from @kairn/core/deployment
 */

export {
  formatDuration,
  formatDurationMs,
  formatTimestamp,
  formatRelativeTime,
  getVercelStateColor,
  getVercelStateLabel,
  getCIColor,
  getCILabel,
  sanitizeLogs,
  checkDeploymentConfig,
  // Legacy
  generateDeployToken,
  getTokenExpiration,
  isTokenValid,
  getStatusColor,
  getPhaseDisplayName,
} from '@kairn/core/deployment';
