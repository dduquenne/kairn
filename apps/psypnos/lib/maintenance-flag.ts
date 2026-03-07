/**
 * Maintenance Flag — re-exports from @kairn/core/deployment
 *
 * @deprecated On Vercel, filesystem-based maintenance flags are not persistent.
 * Use the DB-backed MaintenanceMode model instead (via /api/admin/deployment/maintenance).
 */

export {
  writeMaintenanceFlag,
  removeMaintenanceFlag,
  setMaintenanceInactive,
  setMaintenanceActive,
} from '@kairn/core/deployment';

export type { MaintenanceFlag } from '@kairn/core/deployment';
