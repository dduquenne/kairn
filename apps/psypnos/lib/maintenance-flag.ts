/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Maintenance Flag File Manager
 *
 * Gère un fichier statique dans /public/ pour indiquer le statut de maintenance.
 * Ce fichier est servi directement par Next.js sans passer par le middleware,
 * évitant ainsi le problème de requête auto-référentielle en Edge Runtime.
 */

import { existsSync } from 'fs';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

// Le fichier est dans public/ pour être servi comme asset statique
const FLAG_FILE_PATH = path.join(process.cwd(), 'public', '.maintenance.json');
const FLAG_DIR = path.join(process.cwd(), 'public');

interface MaintenanceFlag {
  active: boolean;
  reason?: string;
  message?: string;
  activatedBy?: string;
  activatedAt?: string;
  estimatedEnd?: string;
}

/**
 * Écrit le fichier de flag maintenance
 * Ce fichier sera accessible via /.maintenance.json
 */
export async function writeMaintenanceFlag(data: MaintenanceFlag): Promise<void> {
  try {
    // S'assurer que le dossier public existe
    if (!existsSync(FLAG_DIR)) {
      await mkdir(FLAG_DIR, { recursive: true });
    }

    const content = JSON.stringify(data, null, 2);
    await writeFile(FLAG_FILE_PATH, content, 'utf-8');
    console.log(`[Maintenance Flag] Written: active=${data.active}`);
  } catch (error) {
    console.error('[Maintenance Flag] Write error:', error);
    throw error;
  }
}

/**
 * Supprime le fichier de flag (équivalent à désactiver la maintenance)
 */
export async function removeMaintenanceFlag(): Promise<void> {
  try {
    if (existsSync(FLAG_FILE_PATH)) {
      await unlink(FLAG_FILE_PATH);
      console.log('[Maintenance Flag] Removed');
    }
  } catch (error) {
    console.error('[Maintenance Flag] Remove error:', error);
    // Ignore errors if file doesn't exist
  }
}

/**
 * Crée un flag "maintenance inactive" (pour que le fetch fonctionne toujours)
 */
export async function setMaintenanceInactive(): Promise<void> {
  await writeMaintenanceFlag({ active: false });
}

/**
 * Active le mode maintenance avec les détails
 */
export async function setMaintenanceActive(details: {
  reason?: string;
  message?: string;
  activatedBy?: string;
  estimatedEnd?: Date | null;
}): Promise<void> {
  await writeMaintenanceFlag({
    active: true,
    reason: details.reason,
    message: details.message,
    activatedBy: details.activatedBy,
    activatedAt: new Date().toISOString(),
    estimatedEnd: details.estimatedEnd?.toISOString(),
  });
}
