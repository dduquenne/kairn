/**
 * Tests unitaires pour le store Prisma du blog.
 *
 * Vérifie que :
 * - La date de publication (publishedAt) est toujours persistée, même pour les brouillons
 * - Les modifications d'un article sont correctement enregistrées
 * - Le formatage de sortie retourne la bonne date
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks hoistés — vi.hoisted() évite les erreurs de référence ──

const {
  mockFindUnique,
  mockCreate,
  mockUpdate,
  mockFindMany,
  mockGetSiteId,
  mockTagFindUnique,
  mockTagCreate,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockFindMany: vi.fn(),
  mockGetSiteId: vi.fn(),
  mockTagFindUnique: vi.fn(),
  mockTagCreate: vi.fn(),
}));

// ─── Mocks — déclarés AVANT les imports ───────────────────────────

vi.mock('@/lib/db/prisma', () => ({
  default: {
    blogPost: {
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      findMany: mockFindMany,
    },
    tag: {
      findUnique: mockTagFindUnique,
      create: mockTagCreate,
    },
  },
}));

vi.mock('@/lib/db/site', () => ({
  getSiteId: () => mockGetSiteId(),
}));

// ─── Imports (après les mocks) ────────────────────────────────────

import { createBlogPost, updateBlogPost, getBlogPostBySlug } from '../../app/api/blog/prisma-store';

// ─── Helpers ──────────────────────────────────────────────────────

const SITE_ID = 'site-test-123';

/** Génère un objet post Prisma simulé */
function makePrismaPost(overrides: Record<string, unknown> = {}) {
  return {
    id: 'post-1',
    siteId: SITE_ID,
    slug: 'test-article',
    title: 'Article de test',
    excerpt: 'Description de test',
    content: 'Contenu de test',
    coverImage: null,
    status: 'PUBLISHED',
    category: 'Comprendre',
    imagePrompt: null,
    seoIntent: null,
    persona: null,
    tones: [],
    faq: null,
    jsonLd: null,
    featured: false,
    authorName: 'David Duquenne',
    publishedAt: new Date('2026-01-15T00:00:00.000Z'),
    createdAt: new Date('2025-12-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-15T00:00:00.000Z'),
    tags: [],
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────

describe('Blog Prisma Store — publishedAt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSiteId.mockResolvedValue(SITE_ID);
  });

  describe('updateBlogPost', () => {
    it('devrait mettre à jour publishedAt quand la date change sur un article publié', async () => {
      const existingPost = makePrismaPost();

      mockFindUnique.mockResolvedValueOnce(existingPost);
      mockUpdate.mockResolvedValueOnce(
        makePrismaPost({
          publishedAt: new Date('2026-03-04T00:00:00.000Z'),
          tags: [],
        })
      );

      const result = await updateBlogPost('test-article', {
        date: '2026-03-04',
        published: true,
      });

      expect(result).not.toBeNull();
      expect(result!.date).toBe('2026-03-04');

      // Vérifier que Prisma reçoit la bonne date
      const prismaUpdateCall = mockUpdate.mock.calls[0]![1] as {
        data: Record<string, unknown>;
      };
      // L'argument est passé comme { where, data, include }
      const updateArgs = mockUpdate.mock.calls[0]![0] as {
        data: { publishedAt: Date };
      };
      expect(updateArgs.data.publishedAt).toEqual(new Date('2026-03-04T00:00:00.000Z'));
    });

    it('devrait conserver publishedAt même pour un brouillon', async () => {
      const existingPost = makePrismaPost({ status: 'DRAFT', publishedAt: null });

      mockFindUnique.mockResolvedValueOnce(existingPost);
      mockUpdate.mockResolvedValueOnce(
        makePrismaPost({
          status: 'DRAFT',
          publishedAt: new Date('2026-05-15T00:00:00.000Z'),
          tags: [],
        })
      );

      const result = await updateBlogPost('test-article', {
        date: '2026-05-15',
        published: false,
      });

      expect(result).not.toBeNull();
      expect(result!.date).toBe('2026-05-15');

      const updateArgs = mockUpdate.mock.calls[0]![0] as {
        data: { publishedAt: Date; status: string };
      };
      // publishedAt doit être la date choisie, pas null
      expect(updateArgs.data.publishedAt).toEqual(new Date('2026-05-15T00:00:00.000Z'));
      expect(updateArgs.data.status).toBe('DRAFT');
    });

    it('devrait conserver la date existante si aucune date fournie', async () => {
      const existingDate = new Date('2026-01-15T00:00:00.000Z');
      const existingPost = makePrismaPost({ publishedAt: existingDate });

      mockFindUnique.mockResolvedValueOnce(existingPost);
      mockUpdate.mockResolvedValueOnce(makePrismaPost({ publishedAt: existingDate, tags: [] }));

      await updateBlogPost('test-article', {
        title: 'Nouveau titre',
      });

      const updateArgs = mockUpdate.mock.calls[0]![0] as {
        data: { publishedAt: Date };
      };
      expect(updateArgs.data.publishedAt).toEqual(existingDate);
    });

    it("devrait retourner null si le post n'existe pas", async () => {
      mockFindUnique.mockResolvedValueOnce(null);

      const result = await updateBlogPost('inexistant', {
        date: '2026-03-04',
      });

      expect(result).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('createBlogPost', () => {
    it('devrait définir publishedAt même pour un brouillon', async () => {
      // slugExists check
      mockFindUnique.mockResolvedValueOnce(null);

      const createdPost = makePrismaPost({
        status: 'DRAFT',
        publishedAt: new Date('2026-06-01T00:00:00.000Z'),
        tags: [],
      });
      mockCreate.mockResolvedValueOnce(createdPost);

      const result = await createBlogPost({
        slug: 'nouveau-brouillon',
        title: 'Brouillon',
        content: 'Contenu du brouillon',
        author: 'David Duquenne',
        category: 'Comprendre',
        date: '2026-06-01',
        published: false,
      });

      expect(result.date).toBe('2026-06-01');

      const createArgs = mockCreate.mock.calls[0]![0] as {
        data: { publishedAt: Date; status: string };
      };
      // publishedAt doit être la date choisie, pas null
      expect(createArgs.data.publishedAt).toEqual(new Date('2026-06-01T00:00:00.000Z'));
      expect(createArgs.data.status).toBe('DRAFT');
    });

    it('devrait définir publishedAt pour un article publié', async () => {
      mockFindUnique.mockResolvedValueOnce(null);

      const createdPost = makePrismaPost({
        status: 'PUBLISHED',
        publishedAt: new Date('2026-03-04T00:00:00.000Z'),
        tags: [],
      });
      mockCreate.mockResolvedValueOnce(createdPost);

      const result = await createBlogPost({
        slug: 'article-publie',
        title: 'Article publié',
        content: "Contenu de l'article",
        author: 'David Duquenne',
        category: 'Comprendre',
        date: '2026-03-04',
        published: true,
      });

      expect(result.date).toBe('2026-03-04');
      expect(result.published).toBe(true);
    });
  });

  describe('getBlogPostBySlug — formatage de la date', () => {
    it('devrait retourner la date de publishedAt quand elle existe', async () => {
      const post = makePrismaPost({
        publishedAt: new Date('2026-03-04T00:00:00.000Z'),
      });
      mockFindUnique.mockResolvedValueOnce(post);

      const result = await getBlogPostBySlug('test-article', true);

      expect(result).not.toBeNull();
      expect(result!.date).toBe('2026-03-04');
    });

    it('devrait retourner createdAt en fallback quand publishedAt est null', async () => {
      const post = makePrismaPost({
        publishedAt: null,
        createdAt: new Date('2025-12-01T00:00:00.000Z'),
      });
      mockFindUnique.mockResolvedValueOnce(post);

      const result = await getBlogPostBySlug('test-article', true);

      expect(result).not.toBeNull();
      expect(result!.date).toBe('2025-12-01');
    });
  });
});
