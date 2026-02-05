/**
 * Site Configuration Helper
 *
 * Provides the site ID for multi-tenant database queries.
 * The PSYPNOS site is configured in the Kairn multi-tenant database.
 */

import prisma from '@/lib/db/prisma';

// PSYPNOS site slug
const SITE_SLUG = 'psypnos';

// Cache for site ID to avoid repeated database lookups
let cachedSiteId: string | null = null;

/**
 * Get the PSYPNOS site ID from the database
 * Uses caching to avoid repeated queries
 */
export async function getSiteId(): Promise<string> {
  if (cachedSiteId) {
    // eslint-disable-next-line no-console
    console.log('[getSiteId] Using cached siteId:', cachedSiteId);
    return cachedSiteId;
  }

  // eslint-disable-next-line no-console
  console.log('[getSiteId] Fetching site from database, slug:', SITE_SLUG);

  const site = await prisma.site.findUnique({
    where: { slug: SITE_SLUG },
    select: { id: true },
  });

  if (!site) {
    // eslint-disable-next-line no-console
    console.error('[getSiteId] Site not found:', SITE_SLUG);
    throw new Error(`Site "${SITE_SLUG}" not found in database`);
  }

  // eslint-disable-next-line no-console
  console.log('[getSiteId] Found site:', site.id);

  cachedSiteId = site.id;
  return cachedSiteId;
}

/**
 * Get the site ID synchronously (requires prior async initialization)
 * @throws if getSiteId() was never called
 */
export function getSiteIdSync(): string {
  if (!cachedSiteId) {
    throw new Error('Site ID not initialized. Call getSiteId() first.');
  }
  return cachedSiteId;
}

/**
 * Clear the cached site ID (useful for testing)
 */
export function clearSiteIdCache(): void {
  cachedSiteId = null;
}
