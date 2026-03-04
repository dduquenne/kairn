/**
 * Tests unitaires pour la route /api/blog/jobs.
 *
 * Vérifie que :
 * - Le worker de génération est lancé via after() (et non setImmediate)
 * - maxDuration est correctement exporté à 300
 * - Les cas d'erreur sont gérés (auth, validation, clé API manquante)
 * - Le job est créé en base avec le bon statut initial
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks hoistés — vi.hoisted() évite les erreurs de référence ──

const { mockAfter, mockCreate, mockFindMany, mockWithAdminAuth, mockRunWorker } = vi.hoisted(
  () => ({
    mockAfter: vi.fn(),
    mockCreate: vi.fn(),
    mockFindMany: vi.fn(),
    mockWithAdminAuth: vi.fn(),
    mockRunWorker: vi.fn(),
  })
);

// ─── Mocks — déclarés AVANT les imports ───────────────────────────

vi.mock('next/server', () => ({
  after: (...args: unknown[]) => mockAfter(...args),
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

vi.mock('../../app/api/blog/jobs/worker', () => ({
  runBlogGenerationWorker: (...args: unknown[]) => mockRunWorker(...args),
}));

// ─── Imports (après les mocks) ────────────────────────────────────

import { POST, maxDuration } from '../../app/api/blog/jobs/route';

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
  usePsypnosStyle: true,
};

// ─── Tests ────────────────────────────────────────────────────────

describe('/api/blog/jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithAdminAuth.mockResolvedValue({ error: null });
    process.env.ANTHROPIC_API_KEY = 'test-key-123';

    mockCreate.mockResolvedValue({
      id: 'job-abc-123',
      status: 'PENDING',
      input: VALID_BODY,
      progress: 0,
      currentStep: 'En attente de traitement',
      totalSteps: 9,
    });

    mockRunWorker.mockResolvedValue(undefined);
  });

  describe('maxDuration', () => {
    it('doit être exporté à 300 secondes pour supporter la génération complète', () => {
      expect(maxDuration).toBe(300);
    });
  });

  describe('POST — Cas nominal', () => {
    it('doit créer un job et lancer le worker via after()', async () => {
      const request = createRequest(VALID_BODY);
      const response = await POST(request);

      // Vérifie que le job est créé en BDD
      expect(mockCreate).toHaveBeenCalledOnce();
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            progress: 0,
            totalSteps: 9,
          }),
        })
      );

      // Vérifie que after() est appelé (et non setImmediate)
      expect(mockAfter).toHaveBeenCalledOnce();
      expect(mockAfter).toHaveBeenCalledWith(expect.any(Function));

      // Vérifie la réponse
      expect(response.body).toEqual(
        expect.objectContaining({
          jobId: 'job-abc-123',
          status: 'PENDING',
        })
      );
    });

    it('doit appeler runBlogGenerationWorker quand le callback after() est exécuté', async () => {
      const request = createRequest(VALID_BODY);
      await POST(request);

      // Récupérer et exécuter le callback passé à after()
      const afterCallback = mockAfter.mock.calls[0]?.[0] as (() => Promise<void>) | undefined;
      expect(afterCallback).toBeDefined();
      await afterCallback!();

      expect(mockRunWorker).toHaveBeenCalledOnce();
      expect(mockRunWorker).toHaveBeenCalledWith('job-abc-123', 'test-key-123');
    });

    it('doit gérer les erreurs du worker sans les propager', async () => {
      mockRunWorker.mockRejectedValue(new Error('Worker crash'));

      const request = createRequest(VALID_BODY);
      await POST(request);

      // Exécuter le callback after() — ne doit pas throw
      const afterCallback = mockAfter.mock.calls[0]?.[0] as (() => Promise<void>) | undefined;
      expect(afterCallback).toBeDefined();
      await expect(afterCallback!()).resolves.toBeUndefined();
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
      expect(mockAfter).not.toHaveBeenCalled();
    });

    it('doit retourner 400 si le topic est manquant', async () => {
      const request = createRequest({ ...VALID_BODY, topic: '' });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockAfter).not.toHaveBeenCalled();
    });

    it('doit retourner 400 si la catégorie est invalide', async () => {
      const request = createRequest({ ...VALID_BODY, category: 'Invalide' });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('doit retourner 500 si ANTHROPIC_API_KEY est manquante', async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const request = createRequest(VALID_BODY);
      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(response.body).toEqual(
        expect.objectContaining({ message: "Le service n'est pas configuré." })
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('doit retourner 500 si la création du job en BDD échoue', async () => {
      mockCreate.mockRejectedValue(new Error('DB connection error'));

      const request = createRequest(VALID_BODY);
      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(mockAfter).not.toHaveBeenCalled();
    });
  });
});
