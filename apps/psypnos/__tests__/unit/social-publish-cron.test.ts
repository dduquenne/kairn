/**
 * Tests unitaires pour le cron de publication sociale.
 *
 * Vérifie que :
 * - Les routes CRON exportent bien GET et POST (QStash envoie POST)
 * - markPostAsFailed ne double-incrémente pas retryCount
 * - Le script setup-qstash-schedules passe method: 'GET'
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
