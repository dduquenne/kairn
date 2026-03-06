/**
 * Storage Info
 *
 * Returns diagnostics information about the analytics storage backend.
 */

/**
 * Get storage backend information
 */
export function getStorageInfo() {
  return {
    mode: 'postgres' as const,
    description: 'PostgreSQL with Prisma ORM',
  };
}
