/**
 * Prisma Client Singleton
 *
 * Provides a singleton instance of the Prisma client
 * to be used throughout the application.
 *
 * Note: This module requires @prisma/client to be installed
 * and Prisma to be generated in the consuming application.
 */

// Generic type for Prisma client (to work without schema generation)
export type PrismaClientLike = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $queryRaw: <T = unknown>(query: TemplateStringsArray, ...values: unknown[]) => Promise<T>;
  [key: string]: unknown;
};

// Declare global type for the Prisma client in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientLike | undefined;
}

export interface PrismaClientConfig {
  /** Log queries in development */
  logQueries?: boolean;
  /** Custom log configuration */
  log?: Array<'query' | 'info' | 'warn' | 'error'>;
}

let prismaClient: PrismaClientLike | null = null;

/**
 * Create Prisma client with logging configuration
 * @param PrismaClientClass The PrismaClient class from @prisma/client
 * @param config Configuration options
 */
export function createPrismaClient<T extends new (opts: unknown) => PrismaClientLike>(
  PrismaClientClass: T,
  config?: PrismaClientConfig
): InstanceType<T> {
  const logConfig = config?.log ?? ["error"];

  const client = new PrismaClientClass({
    log: logConfig as Array<'query' | 'info' | 'warn' | 'error'>,
    errorFormat: "pretty",
  }) as InstanceType<T>;

  // Cache in development
  if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = client;
  }

  prismaClient = client;
  return client;
}

/**
 * Get the Prisma client instance
 * @throws Error if client hasn't been initialized
 */
export function getPrisma(): PrismaClientLike {
  if (globalThis.prisma) {
    return globalThis.prisma;
  }
  if (prismaClient) {
    return prismaClient;
  }
  throw new Error(
    "Prisma client not initialized. Call createPrismaClient first with your PrismaClient class."
  );
}

/**
 * Check if database is configured and connected
 */
export async function isDatabaseConnected(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  try {
    const prisma = getPrisma();
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
  try {
    const prisma = getPrisma();
    await prisma.$disconnect();
  } catch {
    // Client not initialized, nothing to disconnect
  }
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
