/**
 * Maintenance Flag File Manager — re-exports from @kairn/core/deployment
 *
 * Gère un fichier statique dans /public/ pour indiquer le statut de maintenance.
 * Ce fichier est servi directement par Next.js sans passer par le middleware,
 * évitant ainsi le problème de requête auto-référentielle en Edge Runtime.
 */

export {
  writeMaintenanceFlag,
  removeMaintenanceFlag,
  setMaintenanceInactive,
  setMaintenanceActive,
} from '@kairn/core/deployment';

export type { MaintenanceFlag } from '@kairn/core/deployment';
