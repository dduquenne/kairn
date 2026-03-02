/**
 * Tests unitaires pour les publishers de réseaux sociaux.
 *
 * Vérifie le comportement de chaque publisher (Facebook, Instagram,
 * LinkedIn, Threads) avec des mocks de fetch pour simuler les
 * réponses des APIs de chaque plateforme.
 */

import {
  FacebookPublisher,
  InstagramPublisher,
  LinkedInPublisher,
  ThreadsPublisher,
  getPublisher,
} from '@kairn/social/posting';
import type { PublishPostInput } from '@kairn/social/posting';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock global fetch ───────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── Helpers ─────────────────────────────────────────────────────

/** Crée une réponse fetch mockée */
function mockResponse(data: unknown, status = 200, headers?: Record<string, string>) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Map(Object.entries(headers || {})),
  };
}

/** Input de base pour les tests */
function baseInput(overrides: Partial<PublishPostInput> = {}): PublishPostInput {
  return {
    content: 'Test post content',
    mediaUrls: [],
    hashtags: ['test', 'social'],
    linkUrl: null,
    accessToken: 'test-access-token',
    accountMetadata: null,
    ...overrides,
  };
}

// ─── Test 1 : getPublisher factory ───────────────────────────────

describe('getPublisher — factory', () => {
  it('devrait retourner un FacebookPublisher pour FACEBOOK', () => {
    const publisher = getPublisher('FACEBOOK');
    expect(publisher.platform).toBe('FACEBOOK');
    expect(publisher).toBeInstanceOf(FacebookPublisher);
  });

  it('devrait retourner un InstagramPublisher pour INSTAGRAM', () => {
    const publisher = getPublisher('INSTAGRAM');
    expect(publisher.platform).toBe('INSTAGRAM');
    expect(publisher).toBeInstanceOf(InstagramPublisher);
  });

  it('devrait retourner un LinkedInPublisher pour LINKEDIN', () => {
    const publisher = getPublisher('LINKEDIN');
    expect(publisher.platform).toBe('LINKEDIN');
    expect(publisher).toBeInstanceOf(LinkedInPublisher);
  });

  it('devrait retourner un ThreadsPublisher pour THREADS', () => {
    const publisher = getPublisher('THREADS');
    expect(publisher.platform).toBe('THREADS');
    expect(publisher).toBeInstanceOf(ThreadsPublisher);
  });

  it('devrait lever une erreur pour une plateforme inconnue', () => {
    expect(() => getPublisher('UNKNOWN' as never)).toThrow('Unsupported platform');
  });
});

// ─── Test 2 : FacebookPublisher ──────────────────────────────────

describe('FacebookPublisher', () => {
  const publisher = new FacebookPublisher('https://example.com');

  it('devrait échouer sans pageId dans les metadata', async () => {
    const result = await publisher.publish(baseInput());
    expect(result.success).toBe(false);
    expect(result.error).toContain('Page ID missing');
  });

  it('devrait publier un post texte avec succès', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: '123_456' }));

    const result = await publisher.publish(
      baseInput({
        accountMetadata: { pageId: 'page123' },
      })
    );

    expect(result.success).toBe(true);
    expect(result.externalPostId).toBe('123_456');
    expect(result.platformUrl).toContain('facebook.com');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Vérifier l'URL d'appel
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('graph.facebook.com');
    expect(callUrl).toContain('page123/feed');
  });

  it('devrait publier un post avec lien', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: '123_789' }));

    const result = await publisher.publish(
      baseInput({
        linkUrl: 'https://example.com/blog/article',
        accountMetadata: { pageId: 'page123' },
      })
    );

    expect(result.success).toBe(true);
    expect(result.externalPostId).toBe('123_789');

    // Vérifier que le lien est inclus avec UTM
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.link).toContain('utm_source=facebook');
  });

  it('devrait publier un post avec photo', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'photo_001', post_id: 'post_001' }));

    const result = await publisher.publish(
      baseInput({
        mediaUrls: ['https://example.com/image.jpg'],
        accountMetadata: { pageId: 'page123' },
      })
    );

    expect(result.success).toBe(true);
    expect(result.externalPostId).toBe('photo_001');

    // Vérifier que l'URL de la photo est envoyée
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('page123/photos');
  });

  it('devrait gérer une erreur API Facebook', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: { message: 'Invalid access token' } }, 401)
    );

    const result = await publisher.publish(
      baseInput({
        accountMetadata: { pageId: 'page123' },
      })
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid access token');
  });

  it('devrait gérer une erreur réseau', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNRESET'));

    const result = await publisher.publish(
      baseInput({
        accountMetadata: { pageId: 'page123' },
      })
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('ECONNRESET');
  });

  it('devrait inclure les hashtags dans le message', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: '123_456' }));

    await publisher.publish(
      baseInput({
        hashtags: ['yoga', 'bienetre'],
        accountMetadata: { pageId: 'page123' },
      })
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.message).toContain('#yoga');
    expect(body.message).toContain('#bienetre');
  });
});

// ─── Test 3 : InstagramPublisher ─────────────────────────────────

describe('InstagramPublisher', () => {
  const publisher = new InstagramPublisher('https://example.com');

  it('devrait échouer sans igUserId dans les metadata', async () => {
    const result = await publisher.publish(
      baseInput({ mediaUrls: ['https://example.com/img.jpg'] })
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('Instagram user ID missing');
  });

  it('devrait échouer sans image (Instagram exige au moins une image)', async () => {
    const result = await publisher.publish(
      baseInput({
        mediaUrls: [],
        accountMetadata: { igUserId: 'ig123' },
      })
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('requires at least one image');
  });

  it('devrait publier en 2 étapes : container + publish', async () => {
    // Étape 1 : création du container
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'container_001' }));
    // Étape 2 : vérification du traitement (FINISHED)
    mockFetch.mockResolvedValueOnce(mockResponse({ status_code: 'FINISHED' }));
    // Étape 3 : publication du container
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'media_001' }));
    // Étape 4 : récupération du permalink
    mockFetch.mockResolvedValueOnce(mockResponse({ permalink: 'https://instagram.com/p/abc123' }));

    const result = await publisher.publish(
      baseInput({
        mediaUrls: ['https://example.com/image.jpg'],
        accountMetadata: { igUserId: 'ig123' },
      })
    );

    expect(result.success).toBe(true);
    expect(result.externalPostId).toBe('media_001');
    expect(result.platformUrl).toBe('https://instagram.com/p/abc123');
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('devrait gérer un échec de création de container', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { message: 'Invalid image' } }, 400));

    const result = await publisher.publish(
      baseInput({
        mediaUrls: ['https://example.com/bad.jpg'],
        accountMetadata: { igUserId: 'ig123' },
      })
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to create media container');
  });

  it('devrait gérer un timeout de traitement media', async () => {
    // Container créé
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'container_001' }));
    // Polling : toujours IN_PROGRESS (10 tentatives)
    for (let i = 0; i < 10; i++) {
      mockFetch.mockResolvedValueOnce(mockResponse({ status_code: 'IN_PROGRESS' }));
    }

    const result = await publisher.publish(
      baseInput({
        mediaUrls: ['https://example.com/image.jpg'],
        accountMetadata: { igUserId: 'ig123' },
      })
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Timeout');
  }, 30000);
});

// ─── Test 4 : LinkedInPublisher ──────────────────────────────────

describe('LinkedInPublisher', () => {
  const publisher = new LinkedInPublisher();

  it('devrait échouer sans personId ni organizationId', async () => {
    const result = await publisher.publish(baseInput());
    expect(result.success).toBe(false);
    expect(result.error).toContain('Person ID or Organization ID missing');
  });

  it('devrait publier un post texte avec personId', async () => {
    const mockHeaders = new Map([['x-restli-id', 'urn:li:share:123']]);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({}),
      headers: { get: (key: string) => mockHeaders.get(key) || null },
    });

    const result = await publisher.publish(
      baseInput({
        accountMetadata: { personId: 'person123' },
      })
    );

    expect(result.success).toBe(true);
    expect(result.externalPostId).toBe('urn:li:share:123');
    expect(result.platformUrl).toContain('linkedin.com/feed/update');

    // Vérifier le body envoyé
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.author).toBe('urn:li:person:person123');
    expect(body.lifecycleState).toBe('PUBLISHED');
  });

  it('devrait publier un post avec lien (article share)', async () => {
    const mockHeaders = new Map([['x-restli-id', 'urn:li:share:456']]);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({}),
      headers: {
        get: (key: string) => mockHeaders.get(key) || null,
        has: () => false,
      },
    });

    const result = await publisher.publish(
      baseInput({
        linkUrl: 'https://example.com/blog/article',
        accountMetadata: { organizationId: 'org123' },
      })
    );

    expect(result.success).toBe(true);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.author).toBe('urn:li:organization:org123');
    expect(body.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory).toBe(
      'ARTICLE'
    );
  });

  it('devrait gérer une erreur API LinkedIn', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ message: 'Forbidden' }),
      headers: {
        get: () => 'application/json',
        has: () => false,
      },
    });

    const result = await publisher.publish(
      baseInput({
        accountMetadata: { personId: 'person123' },
      })
    );

    expect(result.success).toBe(false);
  });
});

// ─── Test 5 : ThreadsPublisher ───────────────────────────────────

describe('ThreadsPublisher', () => {
  const publisher = new ThreadsPublisher('https://example.com');

  it('devrait échouer sans threadsUserId dans les metadata', async () => {
    const result = await publisher.publish(baseInput());
    expect(result.success).toBe(false);
    expect(result.error).toContain('Threads user ID missing');
  });

  it('devrait publier un post texte en 2 étapes', async () => {
    // Étape 1 : création du container
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'thread_container_001' }));
    // Étape 2 : vérification (FINISHED)
    mockFetch.mockResolvedValueOnce(mockResponse({ status: 'FINISHED' }));
    // Étape 3 : publication
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'thread_post_001' }));
    // Étape 4 : permalink
    mockFetch.mockResolvedValueOnce(
      mockResponse({ permalink: 'https://threads.net/@user/post/abc' })
    );

    const result = await publisher.publish(
      baseInput({
        accountMetadata: { threadsUserId: 'threads123' },
      })
    );

    expect(result.success).toBe(true);
    expect(result.externalPostId).toBe('thread_post_001');
    expect(result.platformUrl).toBe('https://threads.net/@user/post/abc');

    // Vérifier que le container est créé avec media_type TEXT
    const containerBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(containerBody.media_type).toBe('TEXT');
    expect(containerBody.text).toContain('Test post content');
  });

  it('devrait publier un post avec image', async () => {
    // Container
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'thread_container_002' }));
    // Processing
    mockFetch.mockResolvedValueOnce(mockResponse({ status: 'FINISHED' }));
    // Publish
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'thread_post_002' }));
    // Permalink
    mockFetch.mockResolvedValueOnce(
      mockResponse({ permalink: 'https://threads.net/@user/post/def' })
    );

    const result = await publisher.publish(
      baseInput({
        mediaUrls: ['https://example.com/photo.jpg'],
        accountMetadata: { threadsUserId: 'threads123' },
      })
    );

    expect(result.success).toBe(true);

    const containerBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(containerBody.media_type).toBe('IMAGE');
    expect(containerBody.image_url).toBe('https://example.com/photo.jpg');
  });

  it('devrait gérer une erreur de création de container Threads', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: { message: 'Rate limit exceeded' } }, 429)
    );

    const result = await publisher.publish(
      baseInput({
        accountMetadata: { threadsUserId: 'threads123' },
      })
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Rate limit exceeded');
  });
});

// ─── Test 6 : Validation de contenu ──────────────────────────────

describe('Validation de contenu — limites par plateforme', () => {
  it('Facebook : contenu de 63 206+ caractères devrait échouer', () => {
    const publisher = new FacebookPublisher();
    const longContent = 'a'.repeat(63_207);
    const result = publisher.validateContent(longContent, []);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('Instagram : 31+ hashtags devrait provoquer une erreur', () => {
    const publisher = new InstagramPublisher();
    const hashtags = Array.from({ length: 31 }, (_, i) => `tag${i}`);
    const result = publisher.validateContent('Test', hashtags);
    expect(result.valid).toBe(false);
  });

  it('Threads : contenu de 501+ caractères devrait échouer', () => {
    const publisher = new ThreadsPublisher();
    const longContent = 'a'.repeat(501);
    const result = publisher.validateContent(longContent, []);
    expect(result.valid).toBe(false);
  });

  it('LinkedIn : contenu court devrait être valide', () => {
    const publisher = new LinkedInPublisher();
    const result = publisher.validateContent('Article intéressant !', ['linkedin']);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
