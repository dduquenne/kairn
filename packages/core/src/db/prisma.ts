/**
 * Prisma Client Singleton
 *
 * Provides a singleton instance of the Prisma client
 * to be used throughout the application.
 */

import { PrismaClient } from "@prisma/client";

// Declare global type for the Prisma client in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export interface PrismaClientConfig {
  /** Log queries in development */
  logQueries?: boolean;
  /** Custom log configuration */
  log?: Array<'query' | 'info' | 'warn' | 'error'>;
}

/**
 * Create Prisma client with logging configuration
 */
function createPrismaClient(config?: PrismaClientConfig) {
  const isDev = process.env.NODE_ENV === "development";
  const logConfig = config?.log ?? (isDev && config?.logQueries !== false
    ? ["query", "error", "warn"]
    : ["error"]);

  return new PrismaClient({
    log: logConfig as Array<'query' | 'info' | 'warn' | 'error'>,
    errorFormat: "pretty",
  });
}

// Use global instance in development to prevent too many connections during hot reloading
const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { prisma };
export default prisma;

/**
 * Check if database is configured and connected
 */
export async function isDatabaseConnected(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Graceful shutdown helper
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Execute a function with database connection check
 */
export async function withDatabase<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  const connected = await isDatabaseConnected();
  if (!connected) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error("Database is not connected");
  }
  return fn();
}
