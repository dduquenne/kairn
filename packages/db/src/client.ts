/**
 * Prisma Client Singleton
 *
 * Provides a singleton Prisma client instance that is cached in development
 * to prevent multiple instances during hot reloading.
 */

import { PrismaClient } from '@prisma/client';

// Declare global type for development caching
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Create Prisma client with appropriate configuration
 */
function createPrismaClient(): PrismaClient {
  const isDev = process.env.NODE_ENV === 'development';

  return new PrismaClient({
    log: isDev
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ]
      : [{ emit: 'stdout', level: 'error' }],
    errorFormat: 'pretty',
  });
}

/**
 * Get or create the Prisma client singleton
 */
function getPrismaClientInstance(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    return createPrismaClient();
  }

  // In development, cache the client to prevent multiple instances
  if (!globalThis.__prisma) {
    globalThis.__prisma = createPrismaClient();

    // Log queries in development (optional, can be verbose)
    if (process.env.LOG_QUERIES === 'true') {
      globalThis.__prisma.$on('query' as never, (e: { query: string; duration: number }) => {
        // eslint-disable-next-line no-console
        console.log(`Query: ${e.query}`);
        // eslint-disable-next-line no-console
        console.log(`Duration: ${e.duration}ms`);
      });
    }
  }

  return globalThis.__prisma;
}

/**
 * The Prisma client instance
 */
export const prisma = getPrismaClientInstance();

/**
 * Get the Prisma client (alias for consistency with other packages)
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}

/**
 * Gracefully disconnect from the database
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Check database connectivity
 */
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
