// @ts-nocheck
// TODO: Migration - Prisma/type incompatibilities to fix
/**
 * Prisma Client Singleton
 * Phase 4: Scalability & Performance
 *
 * This module provides a singleton instance of the Prisma client
 * to be used throughout the application.
 */

import { PrismaClient } from "@prisma/client";

// Declare global type for the Prisma client in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with logging configuration
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["error"],
    errorFormat: "pretty",
  });
};

// Use global instance in development to prevent too many connections during hot reloading
const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { prisma };
export default prisma;

// Helper to check if database is configured and connected
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

// Graceful shutdown helper
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
