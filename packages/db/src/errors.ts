/**
 * Prisma Error Handler
 *
 * Maps Prisma error codes to user-friendly API responses.
 * Prevents exposure of internal database details to clients.
 */

import { Prisma } from '@prisma/client';

/**
 * Standardized Prisma error result for API handlers
 */
export interface PrismaErrorResult {
  code: string;
  message: string;
  statusCode: number;
}

/**
 * Map of Prisma error codes to user-friendly responses
 */
const PRISMA_ERROR_MAP: Record<string, PrismaErrorResult> = {
  P2002: {
    code: 'CONFLICT',
    message: 'Une ressource avec ces données existe déjà',
    statusCode: 409,
  },
  P2025: {
    code: 'NOT_FOUND',
    message: 'Ressource introuvable',
    statusCode: 404,
  },
  P2003: {
    code: 'VALIDATION_ERROR',
    message: 'Référence invalide : la ressource liée est introuvable',
    statusCode: 400,
  },
  P2014: {
    code: 'VALIDATION_ERROR',
    message: 'Modification impossible : une contrainte de relation serait violée',
    statusCode: 400,
  },
};

/**
 * Handle a Prisma error and return a safe API response.
 * Logs the full error server-side and returns only a safe message for the client.
 *
 * @param err - The caught error
 * @param operation - Description of the operation for logging (e.g., 'creating post')
 * @returns PrismaErrorResult if it's a Prisma error, null otherwise
 */
export function handlePrismaError(err: unknown, operation?: string): PrismaErrorResult | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_ERROR_MAP[err.code];

    console.warn(
      `[DB] Prisma error during ${operation || 'operation'}: code=${err.code}`,
      err.meta
    );

    if (mapped) {
      return mapped;
    }

    console.error(`[DB] Unhandled Prisma error code: ${err.code}`, err.message);

    return {
      code: 'INTERNAL_ERROR',
      message: 'Erreur de base de données',
      statusCode: 500,
    };
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error(`[DB] Prisma validation error during ${operation || 'operation'}:`, err.message);
    return {
      code: 'VALIDATION_ERROR',
      message: 'Données invalides',
      statusCode: 400,
    };
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error(
      `[DB] Prisma initialization error during ${operation || 'operation'}:`,
      err.message
    );
    return {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporairement indisponible',
      statusCode: 503,
    };
  }

  return null;
}
