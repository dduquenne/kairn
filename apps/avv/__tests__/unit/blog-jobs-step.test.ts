/**
 * Tests unitaires pour le step-executor et la route /api/blog/jobs/[id]/step.
 *
 * Vérifie que :
 * - executeNextStep lit l'état du job et exécute une seule étape
 * - Les jobs COMPLETED/FAILED sont retournés directement sans exécution
 * - Les jobs PENDING sont passés en PROCESSING au premier appel
 * - Les résultats partiels sont sauvegardés entre les étapes
 * - Les erreurs sont correctement gérées (job marqué FAILED)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks hoistés ──

const { mockFindUnique, mockUpdate, mockWithAdminAuth, mockGetSiteId } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockWithAdminAuth: vi.fn(),
  mockGetSiteId: vi.fn(),
}));

// ─── Mocks ──

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
      findUnique: mockFindUnique,
      findFirst: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

vi.mock('../../../app/api/auth/middleware', () => ({
  withAdminAuth: () => mockWithAdminAuth(),
}));

vi.mock('@/lib/db/site', () => ({
  getSiteId: () => mockGetSiteId(),
}));

// Mock des modules IA pour éviter les appels réels
vi.mock('../../../app/api/common/claude-article-generator-sectional', () => ({
  generateArticleSectional: vi.fn(),
}));

const { mockWithRetryAndTimeout } = vi.hoisted(() => ({
  mockWithRetryAndTimeout: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}));

vi.mock('../../../app/api/common/ai-utils', () => ({
  parseJsonFromText: vi.fn((text: string) => JSON.parse(text)),
  withRetryAndTimeout: mockWithRetryAndTimeout,
}));

vi.mock('../../../app/api/common/avv-system-prompt', () => ({
  AVV_STYLE_SYSTEM_PROMPT: 'mock-system-prompt',
}));

vi.mock('../../../app/api/common/avv-image-prompt-generator', () => ({
  AVV_IMAGE_GENERATION_PROMPT: 'mock-image-prompt',
  enrichImagePromptWithThematics: vi.fn((p: string) => p),
  validatePromptForMandatoryElements: vi.fn(() => ({ isValid: true, missingElements: [] })),
}));

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: '{"mainThesis":"test","targetAudience":"test","keyMessages":[],"introduction":{"hook":"","contextSetup":"","promiseToReader":""},"sections":[],"conclusion":{"keyTakeaways":[],"callToAction":"","closingThought":""}}',
          },
        ],
      }),
    },
  })),
}));

// ─── Import après mocks ──

import { executeNextStep } from '../../app/api/blog/jobs/step-executor';

// ─── Helpers ──

const BASE_JOB = {
  id: 'job-test-001',
  status: 'PENDING',
  progress: 0,
  currentStep: 'En attente de traitement',
  currentStepIndex: 0,
  totalSteps: 9,
  input: {
    topic: 'Test article',
    category: 'Comprendre',
    targetLength: 'medium',
    preferredTones: ['pédagogique'],
    useAvvStyle: true,
  },
  partialResult: null,
  result: null,
  error: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  usedAt: null,
  articleSlug: null,
};

// ─── Tests ──

describe('executeNextStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
    mockUpdate.mockResolvedValue({});
    mockGetSiteId.mockResolvedValue('site-test-123');
  });

  it('doit retourner COMPLETED directement si le job est déjà terminé', async () => {
    mockFindUnique.mockResolvedValue({
      ...BASE_JOB,
      status: 'COMPLETED',
      result: { success: true, article: {} },
    });

    const result = await executeNextStep('job-test-001');

    expect(result.status).toBe('COMPLETED');
    expect(result.progress).toBe(100);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('doit retourner FAILED directement si le job a échoué', async () => {
    mockFindUnique.mockResolvedValue({
      ...BASE_JOB,
      status: 'FAILED',
      error: 'Erreur précédente',
    });

    const result = await executeNextStep('job-test-001');

    expect(result.status).toBe('FAILED');
    expect(result.error).toBe('Erreur précédente');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('doit lancer une erreur si le job est introuvable', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(executeNextStep('job-inexistant')).rejects.toThrow('Job non trouvé');
  });

  it('doit retourner FAILED si ANTHROPIC_API_KEY est manquante', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    mockFindUnique.mockResolvedValue(BASE_JOB);

    const result = await executeNextStep('job-test-001');

    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('configuré');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-test-001' },
        data: expect.objectContaining({
          status: 'FAILED',
        }),
      })
    );
  });

  it('doit passer le job en PROCESSING au premier appel (PENDING → PROCESSING)', async () => {
    mockFindUnique.mockResolvedValue(BASE_JOB);

    await executeNextStep('job-test-001');

    // Vérifier que le premier update passe en PROCESSING
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-test-001' },
        data: expect.objectContaining({
          status: 'PROCESSING',
          startedAt: expect.any(Date),
        }),
      })
    );
  });

  it('doit marquer le job FAILED si une étape échoue (erreur API)', async () => {
    mockFindUnique.mockResolvedValue(BASE_JOB);

    const result = await executeNextStep('job-test-001');

    // L'étape échoue car le mock Anthropic ne produit pas de réponse valide
    // dans ce contexte. Le step-executor doit marquer le job FAILED.
    expect(result.status).toBe('FAILED');
    expect(result.error).toBeDefined();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-test-001' },
        data: expect.objectContaining({
          status: 'FAILED',
        }),
      })
    );
  });

  it('doit faire un graceful degradation si l étape 5 (cohérence) timeout', async () => {
    // Simuler un job à l'étape 5 avec du contenu assemblé
    const assembledContent = '# Intro\n\nContenu des sections\n\n## Conclusion';
    mockFindUnique.mockResolvedValue({
      ...BASE_JOB,
      status: 'PROCESSING',
      currentStepIndex: 4, // Étape 5 (0-based index 4)
      partialResult: {
        outline: {
          mainThesis: 'test',
          targetAudience: 'test',
          keyMessages: [],
          introduction: { hook: '', contextSetup: '', promiseToReader: '' },
          sections: [],
          conclusion: { keyTakeaways: [], callToAction: '', closingThought: '' },
        },
        introduction: 'Intro',
        sections: ['Section 1'],
        conclusion: 'Conclusion',
        assembledContent,
      },
    });

    // Simuler un timeout sur l'appel API de l'étape 5
    mockWithRetryAndTimeout.mockRejectedValueOnce(new Error('Appel API timeout après 50000ms'));

    const result = await executeNextStep('job-test-001');

    // Le job doit continuer (PROCESSING) et non échouer (FAILED)
    expect(result.status).toBe('PROCESSING');
    expect(result.currentStepIndex).toBe(5); // Passé à l'étape suivante

    // Le contenu original doit être conservé dans le partialResult
    const updateCall = mockUpdate.mock.calls.find(
      (call: unknown[]) =>
        (call[0] as { data?: { currentStepIndex?: number } })?.data?.currentStepIndex === 5
    );
    expect(updateCall).toBeDefined();
    const savedPartial = (
      updateCall![0] as {
        data: { partialResult: { revisedContent: string; coherenceScore: number } };
      }
    ).data.partialResult;
    expect(savedPartial.revisedContent).toBe(assembledContent);
    expect(savedPartial.coherenceScore).toBe(70);
  });
});
