/**
 * Maintenance Flag File Manager
 *
 * Manages a static JSON file in /public/ to indicate maintenance status.
 * This file is served directly by Next.js without going through middleware,
 * avoiding self-referential request issues in Edge Runtime.
 */

import { existsSync } from 'fs';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

import type { MaintenanceFlag } from './types';

/** Default flag file path relative to cwd */
const DEFAULT_FLAG_PATH = path.join('public', '.maintenance.json');

/** Resolve the full flag file path */
function getFlagPath(customPath?: string): string {
  return path.join(process.cwd(), customPath ?? DEFAULT_FLAG_PATH);
}

/** Write the maintenance flag file */
export async function writeMaintenanceFlag(
  data: MaintenanceFlag,
  flagPath?: string
): Promise<void> {
  const fullPath = getFlagPath(flagPath);
  const dir = path.dirname(fullPath);

  try {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    const content = JSON.stringify(data, null, 2);
    await writeFile(fullPath, content, 'utf-8');
  } catch (error) {
    console.error('[Maintenance Flag] Write error:', error);
    throw error;
  }
}

/** Remove the maintenance flag file */
export async function removeMaintenanceFlag(flagPath?: string): Promise<void> {
  const fullPath = getFlagPath(flagPath);
  try {
    if (existsSync(fullPath)) {
      await unlink(fullPath);
    }
  } catch {
    // Ignore errors if file doesn't exist
  }
}

/** Set flag to inactive state */
export async function setMaintenanceInactive(flagPath?: string): Promise<void> {
  await writeMaintenanceFlag({ active: false }, flagPath);
}

/** Activate maintenance mode with details */
export async function setMaintenanceActive(
  details: {
    reason?: string;
    message?: string;
    activatedBy?: string;
    estimatedEnd?: Date | null;
  },
  flagPath?: string
): Promise<void> {
  await writeMaintenanceFlag(
    {
      active: true,
      reason: details.reason,
      message: details.message,
      activatedBy: details.activatedBy,
      activatedAt: new Date().toISOString(),
      estimatedEnd: details.estimatedEnd?.toISOString(),
    },
    flagPath
  );
}
