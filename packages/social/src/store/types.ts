/**
 * Types pour l'abstraction du store social
 *
 * Définit l'interface PrismaLike pour le pattern d'injection de dépendance,
 * permettant au store d'être utilisé avec n'importe quelle instance Prisma.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Interface minimale du PrismaClient requise par le store social.
 * Permet l'injection de dépendance sans coupler directement à @prisma/client.
 */
export interface SocialPrismaClient {
  socialAccount: {
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any | null>;
    findFirst: (args: any) => Promise<any | null>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    updateMany: (args: any) => Promise<{ count: number }>;
    delete: (args: any) => Promise<any>;
    groupBy: (args: any) => Promise<any[]>;
  };
  socialPost: {
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any | null>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    updateMany: (args: any) => Promise<{ count: number }>;
    delete: (args: any) => Promise<any>;
    groupBy: (args: any) => Promise<any[]>;
    count: (args?: any) => Promise<number>;
  };
  socialPostAnalytics: {
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any | null>;
    create: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
    aggregate: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
  };
  socialTemplate: {
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any | null>;
    findFirst: (args: any) => Promise<any | null>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    updateMany: (args: any) => Promise<{ count: number }>;
    delete: (args: any) => Promise<any>;
  };
  socialGenerationLog: {
    findMany: (args?: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
  socialAccountSnapshot: {
    findMany: (args?: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any | null>;
    upsert: (args: any) => Promise<any>;
  };
}
