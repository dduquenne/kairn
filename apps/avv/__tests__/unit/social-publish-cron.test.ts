/**
 * Tests unitaires pour le cron de publication sociale.
 *
 * Vérifie que :
 * - Les routes CRON exportent bien GET et POST (QStash envoie POST)
 * - markPostAsFailed ne double-incrémente pas retryCount
 * - Le script setup-qstash-schedules passe method: 'GET'
 * - claimPostForPublishing utilise updateMany atomique
 * - Le CRON utilise PostScheduler via PrismaPostStorage
 * - PrismaPostStorage implémente correctement PostStorage
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import { describe, it, expect } from 'vitest';

const CRON_DIR = join(__dirname, '../../app/api/cron');

/**
 * Vérifie qu'un fichier route.ts exporte GET et POST.
 * Détecte les deux patterns : `export { GET as POST }` et `export async function POST`
 */
function routeExportsPostHandler(routePath: string): boolean {
  const content = readFileSync(routePath, 'utf-8');
  return (
    content.includes('export { GET as POST }') ||
    content.includes('export async function POST') ||
    content.includes('export function POST')
  );
}

/**
 * Vérifie qu'un fichier route.ts exporte GET.
 */
function routeExportsGetHandler(routePath: string): boolean {
  const content = readFileSync(routePath, 'utf-8');
  return content.includes('export async function GET') || content.includes('export function GET');
}

// ─── Test 1 : Routes CRON — compatibilité QStash POST ─────────────

describe('routes CRON - compatibilité QStash POST', () => {
  const cronRoutes = [
    'social-publish',
    'refresh-tokens',
    'cleanup',
    'check-alerts',
    'daily-report',
    'weekly-report',
    'process-reports',
    'fetch-social-analytics',
    'snapshot-social-accounts',
    'aggregate',
  ];

  for (const route of cronRoutes) {
    it(`/api/cron/${route} devrait exporter un handler GET`, () => {
      const routePath = join(CRON_DIR, route, 'route.ts');
      expect(routeExportsGetHandler(routePath)).toBe(true);
    });

    it(`/api/cron/${route} devrait exporter un handler POST (QStash compatibilité)`, () => {
      const routePath = join(CRON_DIR, route, 'route.ts');
      expect(routeExportsPostHandler(routePath)).toBe(true);
    });
  }
});

// ─── Test 2 : markPostAsFailed sans double incrémentation ──────────
// NOTE: La logique CRUD est maintenant dans @kairn/social/store (social-store.ts)
// Les tests vérifient l'implémentation dans le package partagé.

const SOCIAL_STORE_PATH = join(__dirname, '../../../../packages/social/src/store/social-store.ts');

describe('markPostAsFailed - pas de double incrémentation retryCount', () => {
  it('ne devrait PAS contenir retryCount: { increment } dans markPostAsFailed', () => {
    const content = readFileSync(SOCIAL_STORE_PATH, 'utf-8');

    // Extraire le corps de la fonction markPostAsFailed
    const funcStart = content.indexOf('async markPostAsFailed');
    expect(funcStart).toBeGreaterThan(-1);

    // Trouver la fin de la fonction
    const afterFunc = content.slice(funcStart + 30);
    const funcEnd = afterFunc.indexOf('\n    async ');
    const funcBody = funcEnd > 0 ? afterFunc.slice(0, funcEnd) : afterFunc;

    // Vérifier que retryCount n'est PAS incrémenté dans cette fonction
    expect(funcBody).not.toContain('retryCount');
  });

  it('devrait toujours contenir status: FAILED et errorMessage', () => {
    const content = readFileSync(SOCIAL_STORE_PATH, 'utf-8');

    const funcStart = content.indexOf('async markPostAsFailed');
    const afterFunc = content.slice(funcStart);
    const funcEnd = afterFunc.indexOf('\n    async ');
    const funcBody = funcEnd > 0 ? afterFunc.slice(0, funcEnd) : afterFunc;

    expect(funcBody).toContain("status: 'FAILED'");
    expect(funcBody).toContain('errorMessage');
  });
});

// ─── Test 3 : Script setup-qstash-schedules ────────────────────────

describe('setup-qstash-schedules - méthode HTTP', () => {
  it('devrait spécifier method: GET dans schedules.create', () => {
    const scriptPath = join(__dirname, '../../../../scripts/setup-qstash-schedules.ts');
    const content = readFileSync(scriptPath, 'utf-8');

    // Vérifier que le script passe method: 'GET' lors de la création
    expect(content).toContain("method: 'GET'");
  });
});

// ─── Test 4 : DEFAULT_RETRY_CONFIG — retryableErrors présent ────────

describe('DEFAULT_RETRY_CONFIG - retryableErrors', () => {
  it('devrait contenir la propriété retryableErrors dans le type RetryConfig', () => {
    const clientsPath = join(__dirname, '../../lib/social/clients/index.ts');
    const content = readFileSync(clientsPath, 'utf-8');

    // Vérifier que l'interface RetryConfig définit retryableErrors
    expect(content).toContain('retryableErrors');
  });

  it("devrait contenir les patterns d'erreurs réseau classiques", () => {
    const clientsPath = join(__dirname, '../../lib/social/clients/index.ts');
    const content = readFileSync(clientsPath, 'utf-8');

    const expectedPatterns = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '429', '503'];
    for (const pattern of expectedPatterns) {
      expect(content).toContain(pattern);
    }
  });
});

// ─── Test 5 : CRON social-publish — utilise PostScheduler ──────────

describe('CRON social-publish - utilisation de PostScheduler', () => {
  const routePath = join(CRON_DIR, 'social-publish', 'route.ts');

  it('devrait importer PostScheduler depuis @kairn/social/posting', () => {
    const content = readFileSync(routePath, 'utf-8');
    expect(content).toContain("import { PostScheduler } from '@kairn/social/posting'");
  });

  it('devrait importer PrismaPostStorage', () => {
    const content = readFileSync(routePath, 'utf-8');
    expect(content).toContain('PrismaPostStorage');
  });

  it('devrait appeler scheduler.processDuePosts()', () => {
    const content = readFileSync(routePath, 'utf-8');
    expect(content).toContain('scheduler.processDuePosts()');
  });

  it('devrait configurer un callback onFailed pour les notifications email', () => {
    const content = readFileSync(routePath, 'utf-8');
    expect(content).toContain('onFailed');
    expect(content).toContain('sendFailureNotification');
  });

  it('devrait configurer un callback onPublished pour le logging', () => {
    const content = readFileSync(routePath, 'utf-8');
    expect(content).toContain('onPublished');
  });
});

// ─── Test 6 : PrismaPostStorage — implémentation correcte ──────────

describe('PrismaPostStorage - implémentation PostStorage', () => {
  const storagePath = join(__dirname, '../../lib/social/prisma-post-storage.ts');

  it('devrait implémenter PostStorage', () => {
    const content = readFileSync(storagePath, 'utf-8');
    expect(content).toContain('implements PostStorage');
  });

  it('devrait implémenter getPostsDueForPublishing', () => {
    const content = readFileSync(storagePath, 'utf-8');
    expect(content).toContain('async getPostsDueForPublishing()');
  });

  it('devrait implémenter updatePostStatus', () => {
    const content = readFileSync(storagePath, 'utf-8');
    expect(content).toContain('async updatePostStatus(');
  });

  it('devrait implémenter getAccountForPublishing', () => {
    const content = readFileSync(storagePath, 'utf-8');
    expect(content).toContain('async getAccountForPublishing(');
  });

  it('devrait mapper les statuts Prisma vers les statuts PostScheduler', () => {
    const content = readFileSync(storagePath, 'utf-8');
    expect(content).toContain('PRISMA_TO_SCHEDULER_STATUS');
    expect(content).toContain("SCHEDULED: 'pending'");
    expect(content).toContain("PUBLISHING: 'processing'");
    expect(content).toContain("PUBLISHED: 'published'");
    expect(content).toContain("FAILED: 'failed'");
  });

  it('devrait utiliser claimPostForPublishing pour le verrouillage atomique', () => {
    const content = readFileSync(storagePath, 'utf-8');
    expect(content).toContain('claimPostForPublishing');
  });

  it('devrait utiliser getScheduledPosts pour récupérer les posts (incluant stuck)', () => {
    const content = readFileSync(storagePath, 'utf-8');
    expect(content).toContain('getScheduledPosts');
  });

  it('devrait gérer le paramètre stuckTimeoutMinutes', () => {
    const content = readFileSync(storagePath, 'utf-8');
    expect(content).toContain('stuckTimeoutMinutes');
  });
});

// ─── Test 7 : claimPostForPublishing — verrouillage atomique ────────

describe('claimPostForPublishing - verrouillage atomique', () => {
  it('devrait être exporté depuis le store (wrapper ou direct)', () => {
    const storePath = join(__dirname, '../../lib/social/store.ts');
    const content = readFileSync(storePath, 'utf-8');

    expect(content).toContain('claimPostForPublishing');
  });

  it('devrait utiliser updateMany avec filtre sur le status dans @kairn/social', () => {
    const content = readFileSync(SOCIAL_STORE_PATH, 'utf-8');

    // Extraire le corps de la fonction
    const funcStart = content.indexOf('async claimPostForPublishing');
    expect(funcStart).toBeGreaterThan(-1);

    const afterFunc = content.slice(funcStart);
    const funcEnd = afterFunc.indexOf('\n    async ');
    const funcBody = funcEnd > 0 ? afterFunc.slice(0, funcEnd) : afterFunc;

    // Doit utiliser updateMany (pas update simple) pour l'atomicité
    expect(funcBody).toContain('updateMany');
    // Doit filtrer par status
    expect(funcBody).toContain('status');
    // Doit retourner un booléen basé sur count
    expect(funcBody).toContain('result.count');
  });

  it('devrait être utilisé dans PrismaPostStorage', () => {
    const storagePath = join(__dirname, '../../lib/social/prisma-post-storage.ts');
    const content = readFileSync(storagePath, 'utf-8');

    expect(content).toContain('claimPostForPublishing');
  });
});

// ─── Test 8 : getScheduledPosts — requête correcte ────────────────
// NOTE: Implémentation maintenant dans @kairn/social/store

describe('getScheduledPosts — requête Prisma', () => {
  const storeSource = readFileSync(SOCIAL_STORE_PATH, 'utf-8');

  it('devrait filtrer les posts SCHEDULED avec scheduledAt <= now', () => {
    const funcStart = storeSource.indexOf('async getScheduledPosts');
    const afterFunc = storeSource.slice(funcStart);
    const funcEnd = afterFunc.indexOf('\n    async ');
    const funcBody = funcEnd > 0 ? afterFunc.slice(0, funcEnd) : afterFunc;

    expect(funcBody).toContain("status: 'SCHEDULED'");
    expect(funcBody).toContain('lte: now');
  });

  it('devrait inclure les posts bloqués en PUBLISHING (stuck recovery)', () => {
    const funcStart = storeSource.indexOf('async getScheduledPosts');
    const afterFunc = storeSource.slice(funcStart);
    const funcEnd = afterFunc.indexOf('\n    async ');
    const funcBody = funcEnd > 0 ? afterFunc.slice(0, funcEnd) : afterFunc;

    expect(funcBody).toContain("status: 'PUBLISHING'");
    expect(funcBody).toContain('stuckThreshold');
  });

  it('devrait utiliser OR pour combiner les deux conditions', () => {
    const funcStart = storeSource.indexOf('async getScheduledPosts');
    const afterFunc = storeSource.slice(funcStart);
    const funcEnd = afterFunc.indexOf('\n    async ');
    const funcBody = funcEnd > 0 ? afterFunc.slice(0, funcEnd) : afterFunc;

    expect(funcBody).toContain('OR:');
  });

  it('devrait trier par scheduledAt ascendant', () => {
    const funcStart = storeSource.indexOf('async getScheduledPosts');
    const afterFunc = storeSource.slice(funcStart);
    const funcEnd = afterFunc.indexOf('\n    async ');
    const funcBody = funcEnd > 0 ? afterFunc.slice(0, funcEnd) : afterFunc;

    expect(funcBody).toContain("orderBy: { scheduledAt: 'asc' }");
  });
});
