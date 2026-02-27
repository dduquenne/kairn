/**
 * Tests unitaires pour le cron de publication sociale.
 *
 * Vérifie que :
 * - Les routes CRON exportent bien GET et POST (QStash envoie POST)
 * - markPostAsFailed ne double-incrémente pas retryCount
 * - Le script setup-qstash-schedules passe method: 'GET'
 * - claimPostForPublishing utilise updateMany atomique
 * - Le CRON marque les posts FAILED quand retryCount >= maxRetries
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
    'cleanup-data',
    'cleanup-jobs',
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

describe('markPostAsFailed - pas de double incrémentation retryCount', () => {
  it('ne devrait PAS contenir retryCount: { increment } dans markPostAsFailed', () => {
    const storePath = join(__dirname, '../../lib/social/store.ts');
    const content = readFileSync(storePath, 'utf-8');

    // Extraire le corps de la fonction markPostAsFailed
    const funcStart = content.indexOf('export async function markPostAsFailed');
    expect(funcStart).toBeGreaterThan(-1);

    // Trouver la fin de la fonction (première occurrence de "export" après le début)
    const afterFunc = content.slice(funcStart + 50);
    const funcEnd = afterFunc.indexOf('\nexport ');
    const funcBody = funcEnd > 0 ? afterFunc.slice(0, funcEnd) : afterFunc;

    // Vérifier que retryCount n'est PAS incrémenté dans cette fonction
    expect(funcBody).not.toContain('retryCount');
  });

  it('devrait toujours contenir status: FAILED et errorMessage', () => {
    const storePath = join(__dirname, '../../lib/social/store.ts');
    const content = readFileSync(storePath, 'utf-8');

    const funcStart = content.indexOf('export async function markPostAsFailed');
    const afterFunc = content.slice(funcStart);
    const funcEnd = afterFunc.indexOf('\nexport ');
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

// ─── Test 5 : CRON social-publish — isolation par post ──────────────

describe('CRON social-publish - isolation des erreurs par post', () => {
  const routePath = join(CRON_DIR, 'social-publish', 'route.ts');

  it('devrait avoir un try/catch autour de publishPostWithRetry dans la boucle', () => {
    const content = readFileSync(routePath, 'utf-8');

    // Vérifier que la boucle for contient un try/catch interne
    // Le pattern attendu : for ... { try { ... publishPostWithRetry ... } catch
    const forLoopStart = content.indexOf('for (const post of posts)');
    expect(forLoopStart).toBeGreaterThan(-1);

    const afterLoop = content.slice(forLoopStart);
    const publishCall = afterLoop.indexOf('publishPostWithRetry(post)');
    expect(publishCall).toBeGreaterThan(-1);

    // Le try doit apparaître AVANT publishPostWithRetry dans la boucle
    const tryBeforePublish = afterLoop.slice(0, publishCall).includes('try {');
    expect(tryBeforePublish).toBe(true);

    // Le catch doit capturer l'erreur par post (pas juste le catch global)
    const catchAfterPublish = afterLoop.indexOf('} catch (postError)');
    expect(catchAfterPublish).toBeGreaterThan(publishCall);
  });

  it("devrait logger l'erreur et continuer avec les posts suivants", () => {
    const content = readFileSync(routePath, 'utf-8');

    // Le catch par post doit pousser un résultat d'erreur dans results
    expect(content).toContain('Unexpected error on post');
    expect(content).toContain('results.push({');
  });
});

// ─── Test 6 : CRON social-publish — protection getSocialAccountById ─

describe('CRON social-publish - protection getSocialAccountById', () => {
  it('devrait protéger getSocialAccountById avec un try/catch dans publishPostWithRetry', () => {
    const routePath = join(CRON_DIR, 'social-publish', 'route.ts');
    const content = readFileSync(routePath, 'utf-8');

    // Trouver la fonction publishPostWithRetry
    const funcStart = content.indexOf('async function publishPostWithRetry');
    expect(funcStart).toBeGreaterThan(-1);

    const funcBody = content.slice(funcStart, content.indexOf('\n// ===', funcStart + 1));

    // getSocialAccountById doit être dans un try/catch
    const accountCallIndex = funcBody.indexOf('getSocialAccountById(post.accountId)');
    expect(accountCallIndex).toBeGreaterThan(-1);

    // Un try doit précéder l'appel
    const beforeCall = funcBody.slice(0, accountCallIndex);
    expect(beforeCall).toContain('try {');

    // Un catch (accountError) doit suivre
    expect(funcBody).toContain('catch (accountError)');
  });

  it("devrait retourner une erreur descriptive en cas d'échec de décryptage", () => {
    const routePath = join(CRON_DIR, 'social-publish', 'route.ts');
    const content = readFileSync(routePath, 'utf-8');

    expect(content).toContain('Erreur lors de la récupération du compte social');
  });
});

// ─── Test 7 : claimPostForPublishing — verrouillage atomique ────────

describe('claimPostForPublishing - verrouillage atomique', () => {
  it('devrait exister dans le store', () => {
    const storePath = join(__dirname, '../../lib/social/store.ts');
    const content = readFileSync(storePath, 'utf-8');

    expect(content).toContain('export async function claimPostForPublishing');
  });

  it('devrait utiliser updateMany avec filtre sur le status', () => {
    const storePath = join(__dirname, '../../lib/social/store.ts');
    const content = readFileSync(storePath, 'utf-8');

    // Extraire le corps de la fonction
    const funcStart = content.indexOf('export async function claimPostForPublishing');
    expect(funcStart).toBeGreaterThan(-1);

    const afterFunc = content.slice(funcStart);
    const funcEnd = afterFunc.indexOf('\nexport ');
    const funcBody = funcEnd > 0 ? afterFunc.slice(0, funcEnd) : afterFunc;

    // Doit utiliser updateMany (pas update simple) pour l'atomicité
    expect(funcBody).toContain('updateMany');
    // Doit filtrer par status
    expect(funcBody).toContain('status');
    // Doit retourner un booléen basé sur count
    expect(funcBody).toContain('result.count');
  });

  it('devrait être utilisé dans le CRON avant la publication', () => {
    const routePath = join(CRON_DIR, 'social-publish', 'route.ts');
    const content = readFileSync(routePath, 'utf-8');

    // Le CRON doit importer et utiliser claimPostForPublishing
    expect(content).toContain('claimPostForPublishing');
  });
});

// ─── Test 8 : CRON — marquer FAILED quand maxRetries atteint ────────

describe('CRON social-publish - gestion du max retries', () => {
  it('devrait appeler markPostAsFailed quand retryCount >= maxRetries', () => {
    const routePath = join(CRON_DIR, 'social-publish', 'route.ts');
    const content = readFileSync(routePath, 'utf-8');

    // Trouver la fonction publishPostWithRetry
    const funcStart = content.indexOf('async function publishPostWithRetry');
    expect(funcStart).toBeGreaterThan(-1);

    const funcBody = content.slice(funcStart, content.indexOf('\n// ===', funcStart + 1));

    // Le check retryCount >= maxRetries doit appeler markPostAsFailed
    const maxRetriesCheck = funcBody.indexOf('post.retryCount >= DEFAULT_RETRY_CONFIG.maxRetries');
    expect(maxRetriesCheck).toBeGreaterThan(-1);

    // Après le check, markPostAsFailed doit être appelé (pas juste un return)
    const afterCheck = funcBody.slice(maxRetriesCheck);
    const nextMarkFailed = afterCheck.indexOf('markPostAsFailed');
    expect(nextMarkFailed).toBeGreaterThan(-1);
    // Le markPostAsFailed doit être proche du check (dans les 300 chars)
    expect(nextMarkFailed).toBeLessThan(300);
  });
});
