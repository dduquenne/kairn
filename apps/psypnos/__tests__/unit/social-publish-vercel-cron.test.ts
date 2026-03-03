/**
 * Tests unitaires pour le flux de publication sociale et l'authentification CRON.
 *
 * Vérifie que :
 * - vercel.json ne contient PAS de bloc crons (scheduling via QStash uniquement)
 * - L'authentification supporte CRON_SECRET et signature QStash
 * - Le handler GET est bien exporté
 * - Le handler POST est bien exporté (compatibilité QStash)
 * - Les logs de diagnostic sont présents pour le traçage
 * - Le CRON utilise PostScheduler avec PrismaPostStorage
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import { describe, it, expect } from 'vitest';

const APP_DIR = join(__dirname, '../..');
const CRON_ROUTE = join(APP_DIR, 'app/api/cron/social-publish/route.ts');
const POSTS_ROUTE = join(APP_DIR, 'app/api/social/posts/route.ts');

// ─── Test 1 : Absence de CRON natif Vercel ──────────────────────

describe('Vercel CRON — absence de crons natifs dans vercel.json', () => {
  const vercelConfig = JSON.parse(readFileSync(join(APP_DIR, 'vercel.json'), 'utf-8'));

  it('ne devrait PAS contenir de bloc crons (scheduling via QStash)', () => {
    expect(vercelConfig.crons).toBeUndefined();
  });
});

// ─── Test 2 : Authentification CRON_SECRET ───────────────────────

describe('Authentification CRON — support CRON_SECRET', () => {
  const verifySource = readFileSync(
    join(__dirname, '../../../../packages/core/src/scheduler/verify-qstash.ts'),
    'utf-8'
  );

  it('devrait vérifier le header Authorization Bearer', () => {
    expect(verifySource).toContain('authorization');
    expect(verifySource).toContain('Bearer');
  });

  it('devrait supporter CRON_SECRET via variable environnement', () => {
    expect(verifySource).toContain('CRON_SECRET');
  });

  it('devrait supporter la signature QStash comme mécanisme alternatif', () => {
    expect(verifySource).toContain('upstash-signature');
  });

  it('devrait retourner source: cron_secret pour les auth Vercel CRON', () => {
    expect(verifySource).toContain("source: 'cron_secret'");
  });
});

// ─── Test 3 : Route CRON — handlers HTTP ─────────────────────────

describe('Route social-publish — handlers HTTP', () => {
  const routeSource = readFileSync(CRON_ROUTE, 'utf-8');

  it('devrait exporter un handler GET (Vercel CRON envoie GET)', () => {
    expect(routeSource).toContain('export async function GET');
  });

  it('devrait exporter un handler POST (compatibilité QStash)', () => {
    expect(routeSource).toContain('export { GET as POST }');
  });

  it('devrait configurer runtime nodejs', () => {
    expect(routeSource).toContain("export const runtime = 'nodejs'");
  });

  it('devrait configurer maxDuration à 60 secondes', () => {
    expect(routeSource).toContain('export const maxDuration = 60');
  });
});

// ─── Test 4 : Logs de diagnostic ─────────────────────────────────

describe('Logs de diagnostic — traçabilité des invocations', () => {
  const routeSource = readFileSync(CRON_ROUTE, 'utf-8');

  it('devrait générer un invocationId unique par exécution', () => {
    expect(routeSource).toContain('invocationId');
  });

  it('devrait loguer le démarrage de chaque invocation', () => {
    expect(routeSource).toContain('Invocation démarrée');
  });

  it('devrait loguer la source authentification utilisée', () => {
    expect(routeSource).toContain('Auth OK via');
  });

  it('devrait loguer quand aucun post à publier', () => {
    expect(routeSource).toContain('Aucun post à publier');
  });

  it('devrait loguer le résumé à la fin de chaque invocation', () => {
    expect(routeSource).toContain('Terminé en');
  });

  it('devrait loguer les accès non autorisés', () => {
    expect(routeSource).toContain('Accès non autorisé');
  });
});

// ─── Test 5 : Architecture — PostScheduler + PrismaPostStorage ───

describe('Architecture — délégation au PostScheduler', () => {
  const routeSource = readFileSync(CRON_ROUTE, 'utf-8');

  it('devrait utiliser PostScheduler depuis @kairn/social/posting', () => {
    expect(routeSource).toContain("import { PostScheduler } from '@kairn/social/posting'");
  });

  it('devrait utiliser PrismaPostStorage comme couche de stockage', () => {
    expect(routeSource).toContain('PrismaPostStorage');
    expect(routeSource).toContain('new PrismaPostStorage()');
  });

  it('devrait instancier le scheduler avec le storage et les callbacks', () => {
    expect(routeSource).toContain('new PostScheduler(storage');
    expect(routeSource).toContain('onPublished');
    expect(routeSource).toContain('onFailed');
  });

  it('devrait appeler processDuePosts pour la publication', () => {
    expect(routeSource).toContain('scheduler.processDuePosts()');
  });

  it("devrait envoyer une notification email en cas d'échec définitif via onFailed", () => {
    expect(routeSource).toContain('sendFailureNotification');
  });
});

// ─── Test 6 : Création de post — trigger QStash non-bloquant ─────

describe('Création de post — fallback Vercel CRON', () => {
  const postsRouteSource = readFileSync(POSTS_ROUTE, 'utf-8');

  it('devrait tenter un trigger QStash lors de la création de post schedulé', () => {
    expect(postsRouteSource).toContain('publishDelayed');
  });

  it('devrait être non-bloquant : erreur QStash ne bloque pas la création', () => {
    expect(postsRouteSource).toContain('catch (scheduleError)');
  });

  it('devrait loguer clairement que le Vercel CRON prend le relais en cas échec', () => {
    expect(postsRouteSource).toContain('Vercel CRON prendra le relais');
  });

  it('devrait loguer un warning si NEXT_PUBLIC_SITE_URL est absent', () => {
    expect(postsRouteSource).toContain('NEXT_PUBLIC_SITE_URL non défini');
  });
});

// ─── Test 7 : getScheduledPosts — requête correcte ───────────────

describe('getScheduledPosts — requête Prisma', () => {
  const storeSource = readFileSync(join(APP_DIR, 'lib/social/store.ts'), 'utf-8');

  it('devrait filtrer les posts SCHEDULED avec scheduledAt <= now', () => {
    const funcStart = storeSource.indexOf('export async function getScheduledPosts');
    const funcBody = storeSource.slice(funcStart, storeSource.indexOf('\nexport ', funcStart + 1));

    expect(funcBody).toContain("status: 'SCHEDULED'");
    expect(funcBody).toContain('lte: now');
  });

  it('devrait inclure les posts bloqués en PUBLISHING (stuck recovery)', () => {
    const funcStart = storeSource.indexOf('export async function getScheduledPosts');
    const funcBody = storeSource.slice(funcStart, storeSource.indexOf('\nexport ', funcStart + 1));

    expect(funcBody).toContain("status: 'PUBLISHING'");
    expect(funcBody).toContain('stuckThreshold');
  });

  it('devrait utiliser OR pour combiner les deux conditions', () => {
    const funcStart = storeSource.indexOf('export async function getScheduledPosts');
    const funcBody = storeSource.slice(funcStart, storeSource.indexOf('\nexport ', funcStart + 1));

    expect(funcBody).toContain('OR:');
  });

  it('devrait trier par scheduledAt ascendant', () => {
    const funcStart = storeSource.indexOf('export async function getScheduledPosts');
    const funcBody = storeSource.slice(funcStart, storeSource.indexOf('\nexport ', funcStart + 1));

    expect(funcBody).toContain("orderBy: { scheduledAt: 'asc' }");
  });
});
