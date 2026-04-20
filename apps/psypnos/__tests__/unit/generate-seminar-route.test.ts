/**
 * Tests unitaires pour la route POST /api/social/generate-seminar.
 *
 * Scénarios clés couverts (voir #456 + #462) :
 * - 422 si le séminaire n'a pas de `thumbnail` (code `SEMINAR_THUMBNAIL_REQUIRED`)
 * - 200 + `suggestedMediaUrl === seminar.thumbnail` si présent
 * - 404 si le séminaire n'est pas trouvé (isolation multi-tenant par siteId)
 * - 400 si le body est invalide
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks — déclarés AVANT les imports ───────────────────────────

const {
  getSeminarByIdMock,
  messagesCreateMock,
  withAdminAuthMock,
  parseGenerationResponseMock,
  parseMultiPlatformResponseMock,
  buildSeminarSystemPromptMock,
  buildSeminarUserPromptMock,
  buildSeminarMultiPlatformPromptMock,
} = vi.hoisted(() => ({
  getSeminarByIdMock: vi.fn(),
  messagesCreateMock: vi.fn(),
  withAdminAuthMock: vi.fn(),
  parseGenerationResponseMock: vi.fn(),
  parseMultiPlatformResponseMock: vi.fn(),
  buildSeminarSystemPromptMock: vi.fn(),
  buildSeminarUserPromptMock: vi.fn(),
  buildSeminarMultiPlatformPromptMock: vi.fn(),
}));

vi.mock('@/app/api/auth/middleware', () => ({
  withAdminAuth: withAdminAuthMock,
}));

vi.mock('@/app/api/seminars/prisma-store', () => ({
  getSeminarById: getSeminarByIdMock,
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: messagesCreateMock };
  },
}));

vi.mock('@/lib/social/prompts/builder', () => ({
  parseGenerationResponse: parseGenerationResponseMock,
  parseMultiPlatformResponse: parseMultiPlatformResponseMock,
}));

vi.mock('@/lib/social/prompts/seminar-builder', () => ({
  buildSeminarSystemPrompt: buildSeminarSystemPromptMock,
  buildSeminarUserPrompt: buildSeminarUserPromptMock,
  buildSeminarMultiPlatformPrompt: buildSeminarMultiPlatformPromptMock,
}));

// ─── Imports (après les mocks) ────────────────────────────────────

import { POST } from '../../app/api/social/generate-seminar/route';

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Construit une requête POST JSON.
 */
function buildRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/social/generate-seminar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  seminarId: 'sem-1',
  platforms: ['INSTAGRAM'],
  tone: 'inspirant',
  angle: 'benefices',
};

const SEMINAR_WITH_THUMBNAIL = {
  id: 'sem-1',
  title: 'Respirer la Lumière',
  description: 'Séminaire test',
  speakers: [
    { firstName: 'David', lastName: 'Duquenne' },
    { firstName: 'Nathalie', lastName: 'Duquenne' },
  ],
  startAt: '2026-05-30T08:00:00.000Z',
  endAt: '2026-05-31T17:00:00.000Z',
  capacity: 18,
  tags: ['respiration'],
  thumbnail: 'https://supabase.example/seminar-1.webp',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// ─── Tests ────────────────────────────────────────────────────────

describe('POST /api/social/generate-seminar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    withAdminAuthMock.mockResolvedValue({ user: { sub: 'admin-1', role: 'admin' } });
    messagesCreateMock.mockResolvedValue({
      content: [{ type: 'text', text: '{"content":"x","hashtags":["y"]}' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });
    parseGenerationResponseMock.mockReturnValue({ content: 'Post généré', hashtags: ['test'] });
    parseMultiPlatformResponseMock.mockReturnValue([
      { platform: 'INSTAGRAM', content: 'Post IG', hashtags: ['test'] },
    ]);
    buildSeminarSystemPromptMock.mockReturnValue('system');
    buildSeminarUserPromptMock.mockReturnValue('user');
    buildSeminarMultiPlatformPromptMock.mockReturnValue('multi');
  });

  it("retourne 422 SEMINAR_THUMBNAIL_REQUIRED si le séminaire n'a pas de thumbnail", async () => {
    getSeminarByIdMock.mockResolvedValueOnce({ ...SEMINAR_WITH_THUMBNAIL, thumbnail: undefined });

    const response = await POST(buildRequest(VALID_BODY));
    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.error).toBe('SEMINAR_THUMBNAIL_REQUIRED');
    expect(data.message).toBe('Le séminaire doit avoir une image avant de générer un post social.');
  });

  it('retourne 422 si thumbnail est une chaîne vide', async () => {
    getSeminarByIdMock.mockResolvedValueOnce({ ...SEMINAR_WITH_THUMBNAIL, thumbnail: '   ' });

    const response = await POST(buildRequest(VALID_BODY));
    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.error).toBe('SEMINAR_THUMBNAIL_REQUIRED');
  });

  it('retourne 200 + suggestedMediaUrl === seminar.thumbnail si thumbnail présent', async () => {
    getSeminarByIdMock.mockResolvedValueOnce(SEMINAR_WITH_THUMBNAIL);

    const response = await POST(buildRequest(VALID_BODY));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.generations)).toBe(true);
    expect(data.generations[0].suggestedMediaUrl).toBe(SEMINAR_WITH_THUMBNAIL.thumbnail);
  });

  it('retourne 404 si getSeminarById renvoie null (isolation siteId)', async () => {
    getSeminarByIdMock.mockResolvedValueOnce(null);

    const response = await POST(buildRequest(VALID_BODY));
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toContain('non trouvé');
  });

  it('retourne 400 si le body est invalide', async () => {
    const response = await POST(buildRequest({ seminarId: 'x' }));
    expect(response.status).toBe(400);
  });
});
