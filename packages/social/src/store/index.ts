/**
 * Store centralisé pour les opérations CRUD des réseaux sociaux
 *
 * Utilise le pattern factory : appeler createSocialStore(prisma) avec une instance
 * PrismaClient pour obtenir toutes les fonctions CRUD.
 *
 * @example
 * ```typescript
 * import { createSocialStore } from '@kairn/social/store';
 * import { prisma } from '@/lib/db/prisma';
 *
 * const store = createSocialStore(prisma);
 * const accounts = await store.getAllSocialAccounts();
 * ```
 */

export { createSocialStore } from './social-store';
export type { SocialPrismaClient } from './types';
export type { SocialStore } from './social-store';
