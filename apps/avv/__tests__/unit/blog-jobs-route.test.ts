/**
 * Tests unitaires pour la route /api/blog/jobs.
 *
 * Vérifie que :
 * - Le job est créé en base avec le bon statut initial (PENDING)
 * - after() n'est plus utilisé (architecture step-by-step)
 * - currentStepIndex est initialisé à 0
 * - Les cas d'erreur sont gérés (auth, validation)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks hoistés — vi.hoisted() évite les erreurs de référence ──

const { mockCreate, mockFindMany, mockWithAdminAuth, mockGetSiteId } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindMany: vi.fn(),
  mockWithAdminAuth: vi.fn(),
  mockGetSiteId: vi.fn(),
}));

// ─── Mocks — déclarés AVANT les imports ───────────────────────────

vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    })),
  },
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    blogGenerationJob: {
      create: mockCreate,
      findMany: mockFindMany,
    },
  },
}));

vi.mock('../../app/api/auth/middleware', () => ({
  withAdminAuth: () => mockWithAdminAuth(),
}));

vi.mock('@/lib/db/site', () => ({
  getSiteId: () => mockGetSiteId(),
}));

// ─── Imports (après les mocks) ────────────────────────────────────

import { POST } from '../../app/api/blog/jobs/route';

// ─── Helpers ──────────────────────────────────────────────────────

/** Crée une fausse NextRequest avec un body JSON */
function createRequest(body: Record<string, unknown>) {
  return {
    json: vi.fn().mockResolvedValue(body),
    nextUrl: { searchParams: new URLSearchParams() },
  } as unknown as Parameters<typeof POST>[0];
}

const VALID_BODY = {
  topic: 'Les bienfaits de la méditation',
  category: 'Comprendre',
  targetLength: 'medium',
  preferredTones: ['pédagogique'],
  useAvvStyle: true,
};

// ─── Tests ────────────────────────────────────────────────────────

describe('/api/blog/jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithAdminAuth.mockResolvedValue({ error: null });
    mockGetSiteId.mockResolvedValue('site-test-123');

    mockCreate.mockResolvedValue({
      id: 'job-abc-123',
      status: 'PENDING',
      input: VALID_BODY,
      progress: 0,
      currentStep: 'En attente de traitement',
      currentStepIndex: 0,
      totalSteps: 9,
    });
  });

  describe('POST — Architecture step-by-step', () => {
    it('ne doit pas exporter maxDuration (plus de worker en arrière-plan)', async () => {
      // maxDuration n'est plus exporté — la génération est pilotée par le frontend
      const routeModule = await import('../../app/api/blog/jobs/route');
      expect(routeModule).not.toHaveProperty('maxDuration');
    });
  });

  describe('POST — Cas nominal', () => {
    it('doit créer un job avec currentStepIndex à 0 sans lancer de worker', async () => {
      const request = createRequest(VALID_BODY);
      const response = await POST(request);

      // Vérifie que le job est créé en BDD
      expect(mockCreate).toHaveBeenCalledOnce();
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            progress: 0,
            currentStepIndex: 0,
            totalSteps: 9,
          }),
        })
      );

      // Vérifie la réponse
      expect(response.body).toEqual(
        expect.objectContaining({
          jobId: 'job-abc-123',
          status: 'PENDING',
        })
      );
    });
  });

  describe("POST — Cas d'erreur", () => {
    it("doit retourner 401 si l'authentification échoue", async () => {
      const errorResponse = { status: 401, body: { message: 'Non autorisé' } };
      mockWithAdminAuth.mockResolvedValue({ error: errorResponse });

      const request = createRequest(VALID_BODY);
      const response = await POST(request);

      expect(response).toBe(errorResponse);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('doit retourner 400 si le topic est manquant', async () => {
      const request = createRequest({ ...VALID_BODY, topic: '' });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('doit retourner 400 si la catégorie est invalide', async () => {
      const request = createRequest({ ...VALID_BODY, category: 'Invalide' });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('doit retourner 500 si la création du job en BDD échoue', async () => {
      mockCreate.mockRejectedValue(new Error('DB connection error'));

      const request = createRequest(VALID_BODY);
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
