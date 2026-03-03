/**
 * Tests for FacebookPublisher
 *
 * Covers URL resolution, publication type selection,
 * and fallback behavior when image URLs are invalid.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { FacebookPublisher } from './facebook';

// ===========================================
// Mock global fetch
// ===========================================

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================
// Helpers
// ===========================================

/** Build a successful Facebook Graph API response */
function facebookOkResponse(postId: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ id: postId, post_id: postId }),
  };
}

/** Build a default PublishPostInput */
function buildInput(overrides: Record<string, unknown> = {}) {
  return {
    content: 'Test post content',
    mediaUrls: [] as string[],
    hashtags: [],
    linkUrl: null as string | null,
    accessToken: 'test-access-token',
    accountMetadata: { pageId: '123456789' } as Record<string, unknown>,
    ...overrides,
  };
}

// ===========================================
// Tests
// ===========================================

describe('FacebookPublisher', () => {
  describe('resolveImageUrl (via publish behavior)', () => {
    it('should publish as text when mediaUrls is empty', async () => {
      const publisher = new FacebookPublisher('https://example.com');
      mockFetch.mockResolvedValueOnce(facebookOkResponse('post_1'));

      const result = await publisher.publish(buildInput({ mediaUrls: [] }));

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledOnce();

      // Should call /feed endpoint (text post), not /photos
      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('/feed');
      expect(calledUrl).not.toContain('/photos');
    });

    it('should publish as photo when mediaUrl is a valid absolute URL', async () => {
      const publisher = new FacebookPublisher('https://example.com');
      const imageUrl = 'https://storage.supabase.co/images/test.webp';
      mockFetch.mockResolvedValueOnce(facebookOkResponse('photo_1'));

      const result = await publisher.publish(buildInput({ mediaUrls: [imageUrl] }));

      expect(result.success).toBe(true);

      // Should call /photos endpoint
      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('/photos');

      // Should pass the image URL as-is
      const body = JSON.parse(mockFetch.mock.calls[0]![1]?.body as string);
      expect(body.url).toBe(imageUrl);
    });

    it('should resolve relative path with baseUrl and publish as photo', async () => {
      const publisher = new FacebookPublisher('https://psypnos.fr');
      mockFetch.mockResolvedValueOnce(facebookOkResponse('photo_2'));

      const result = await publisher.publish(
        buildInput({ mediaUrls: ['/images/seminars/test.webp'] })
      );

      expect(result.success).toBe(true);

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('/photos');

      const body = JSON.parse(mockFetch.mock.calls[0]![1]?.body as string);
      expect(body.url).toBe('https://psypnos.fr/images/seminars/test.webp');
    });

    it('should fall back to text post when relative path has no baseUrl', async () => {
      const publisher = new FacebookPublisher('');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockFetch.mockResolvedValueOnce(facebookOkResponse('text_1'));

      const result = await publisher.publish(
        buildInput({ mediaUrls: ['/images/seminars/test.webp'] })
      );

      expect(result.success).toBe(true);

      // Should fall back to /feed (text post) since the image URL is invalid
      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('/feed');
      expect(calledUrl).not.toContain('/photos');

      // Should log a warning
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[FacebookPublisher] Invalid image URL')
      );

      warnSpy.mockRestore();
    });

    it('should fall back to text post when mediaUrl is an invalid string without baseUrl', async () => {
      const publisher = new FacebookPublisher('');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockFetch.mockResolvedValueOnce(facebookOkResponse('text_2'));

      const result = await publisher.publish(buildInput({ mediaUrls: ['not-a-url'] }));

      expect(result.success).toBe(true);

      // 'not-a-url' without a baseUrl cannot form a valid absolute URL
      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('/feed');

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should fall back to link post when image URL is invalid but linkUrl is set', async () => {
      const publisher = new FacebookPublisher('');
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockFetch.mockResolvedValueOnce(facebookOkResponse('link_1'));

      const result = await publisher.publish(
        buildInput({
          mediaUrls: ['/images/invalid-path.webp'],
          linkUrl: 'https://psypnos.fr/blog/article',
        })
      );

      expect(result.success).toBe(true);

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('/feed');

      // Should include the link in the body
      const body = JSON.parse(mockFetch.mock.calls[0]![1]?.body as string);
      expect(body.link).toContain('psypnos.fr/blog/article');
    });

    it('should handle undefined mediaUrls[0] gracefully', async () => {
      const publisher = new FacebookPublisher('https://example.com');
      mockFetch.mockResolvedValueOnce(facebookOkResponse('text_3'));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input = buildInput({ mediaUrls: [undefined] as any });
      const result = await publisher.publish(input);

      expect(result.success).toBe(true);

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('/feed');
    });
  });

  describe('publish', () => {
    it('should return error when pageId is missing', async () => {
      const publisher = new FacebookPublisher('https://example.com');

      const result = await publisher.publish(buildInput({ accountMetadata: {} }));

      expect(result.success).toBe(false);
      expect(result.error).toContain('Page ID missing');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should append hashtags to message', async () => {
      const publisher = new FacebookPublisher('https://example.com');
      mockFetch.mockResolvedValueOnce(facebookOkResponse('post_ht'));

      await publisher.publish(buildInput({ hashtags: ['wellness', 'meditation'] }));

      const body = JSON.parse(mockFetch.mock.calls[0]![1]?.body as string);
      expect(body.message).toContain('#wellness');
      expect(body.message).toContain('#meditation');
    });

    it('should handle Facebook API errors gracefully', async () => {
      const publisher = new FacebookPublisher('https://example.com');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: '(#100) url should represent a valid URL' },
        }),
      });

      const result = await publisher.publish(
        buildInput({ mediaUrls: ['https://example.com/image.jpg'] })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('url should represent a valid URL');
    });

    it('should handle network errors gracefully', async () => {
      const publisher = new FacebookPublisher('https://example.com');
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await publisher.publish(buildInput());

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });
  });

  describe('publishWithPhoto (link in caption)', () => {
    it('should add link URL to caption for photo posts', async () => {
      const publisher = new FacebookPublisher('https://psypnos.fr');
      mockFetch.mockResolvedValueOnce(facebookOkResponse('photo_link'));

      await publisher.publish(
        buildInput({
          mediaUrls: ['https://storage.supabase.co/images/test.webp'],
          linkUrl: 'https://psypnos.fr/blog/my-article',
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0]![1]?.body as string);
      expect(body.caption).toContain('psypnos.fr/blog/my-article');
      expect(body.url).toBe('https://storage.supabase.co/images/test.webp');
    });
  });

  describe('validateContent', () => {
    it('should accept valid content', () => {
      const publisher = new FacebookPublisher();
      const result = publisher.validateContent('Short post', []);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
