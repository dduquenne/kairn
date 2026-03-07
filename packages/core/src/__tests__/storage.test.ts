import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createLocalStorageProvider,
  createStorageService,
  createSupabaseStorageProvider,
  StorageService,
  BLUR_DATA_URL,
  BLUR_DATA_URL_GOLD,
  IMAGE_DIMENSIONS,
  ASPECT_RATIOS,
  getPlaceholderProps,
  getImageProps,
} from '../storage';
import type { StorageProvider, SupabaseStorageClient } from '../storage';

// Mock fs
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
    access: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from('test')),
  },
}));

describe('Storage Module', () => {
  describe('createLocalStorageProvider', () => {
    const config = {
      localPaths: { 'blog-images': 'public/images/blog' },
      publicUrlPaths: { 'blog-images': '/images/blog' },
    };

    it('should upload a file locally', async () => {
      const provider = createLocalStorageProvider(config);
      const result = await provider.upload(
        'blog-images',
        'test.webp',
        Buffer.from('test'),
        'image/webp'
      );

      expect(result.success).toBe(true);
      expect(result.url).toBe('/images/blog/test.webp');
    });

    it('should return error for unknown bucket', async () => {
      const provider = createLocalStorageProvider(config);
      const result = await provider.upload('unknown-bucket', 'test.webp', Buffer.from('test'));

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown bucket');
    });

    it('should generate correct URL', () => {
      const provider = createLocalStorageProvider(config);
      expect(provider.getUrl('blog-images', 'test.webp')).toBe('/images/blog/test.webp');
    });

    it('should report as configured', () => {
      const provider = createLocalStorageProvider(config);
      expect(provider.isConfigured()).toBe(true);
    });

    it('should delete a file successfully', async () => {
      const provider = createLocalStorageProvider(config);
      const result = await provider.delete('blog-images', 'test.webp');
      expect(result.success).toBe(true);
    });

    it('should check file existence', async () => {
      const provider = createLocalStorageProvider(config);
      const exists = await provider.exists('blog-images', 'test.webp');
      expect(exists).toBe(true);
    });
  });

  describe('createSupabaseStorageProvider', () => {
    let mockClient: SupabaseStorageClient;

    beforeEach(() => {
      mockClient = {
        storage: {
          from: vi.fn().mockReturnValue({
            upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
            remove: vi.fn().mockResolvedValue({ error: null }),
            getPublicUrl: vi.fn().mockReturnValue({
              data: { publicUrl: 'https://supabase.co/storage/blog-images/test.webp' },
            }),
            list: vi.fn().mockResolvedValue({
              data: [{ name: 'test.webp' }],
              error: null,
            }),
          }),
        },
      };
    });

    it('should upload via Supabase', async () => {
      const provider = createSupabaseStorageProvider(mockClient);
      const result = await provider.upload(
        'blog-images',
        'test.webp',
        Buffer.from('test'),
        'image/webp'
      );

      expect(result.success).toBe(true);
      expect(result.url).toContain('supabase.co');
    });

    it('should handle upload errors', async () => {
      mockClient.storage.from = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Bucket not found' },
        }),
        getPublicUrl: vi.fn(),
      });

      const provider = createSupabaseStorageProvider(mockClient);
      const result = await provider.upload('blog-images', 'test.webp', Buffer.from('test'));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bucket not found');
    });

    it('should delete via Supabase', async () => {
      const provider = createSupabaseStorageProvider(mockClient);
      const result = await provider.delete('blog-images', 'test.webp');
      expect(result.success).toBe(true);
    });

    it('should check existence', async () => {
      const provider = createSupabaseStorageProvider(mockClient);
      const exists = await provider.exists('blog-images', 'test.webp');
      expect(exists).toBe(true);
    });
  });

  describe('StorageService', () => {
    let mockPrimary: StorageProvider;
    let mockFallback: StorageProvider;

    beforeEach(() => {
      mockPrimary = {
        upload: vi.fn().mockResolvedValue({ success: true, url: 'https://cloud/img.webp' }),
        delete: vi.fn().mockResolvedValue({ success: true }),
        getUrl: vi.fn().mockReturnValue('https://cloud/img.webp'),
        exists: vi.fn().mockResolvedValue(true),
        isConfigured: vi.fn().mockReturnValue(true),
      };

      mockFallback = {
        upload: vi.fn().mockResolvedValue({ success: true, url: '/local/img.webp' }),
        delete: vi.fn().mockResolvedValue({ success: true }),
        getUrl: vi.fn().mockReturnValue('/local/img.webp'),
        exists: vi.fn().mockResolvedValue(false),
        isConfigured: vi.fn().mockReturnValue(true),
      };
    });

    it('should use primary when configured', async () => {
      const service = new StorageService({ provider: mockPrimary, fallback: mockFallback });
      const result = await service.upload('bucket', 'file', Buffer.from('test'));

      expect(result.url).toBe('https://cloud/img.webp');
      expect(mockPrimary.upload).toHaveBeenCalled();
      expect(mockFallback.upload).not.toHaveBeenCalled();
    });

    it('should fallback when primary not configured', async () => {
      (mockPrimary.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const service = new StorageService({ provider: mockPrimary, fallback: mockFallback });
      const result = await service.upload('bucket', 'file', Buffer.from('test'));

      expect(result.url).toBe('/local/img.webp');
      expect(mockFallback.upload).toHaveBeenCalled();
    });

    it('should report cloud storage status', () => {
      const service = new StorageService({ provider: mockPrimary, fallback: mockFallback });
      expect(service.isCloudStorageConfigured()).toBe(true);
    });

    it('should use fallback when no provider given', async () => {
      const service = createStorageService({ provider: null, fallback: mockFallback });
      const result = await service.upload('bucket', 'file', Buffer.from('test'));
      expect(result.url).toBe('/local/img.webp');
    });
  });

  describe('Image Utilities', () => {
    it('should export blur data URLs', () => {
      expect(BLUR_DATA_URL).toContain('data:image/svg+xml;base64,');
      expect(BLUR_DATA_URL_GOLD).toContain('data:image/svg+xml;base64,');
    });

    it('should have standard image dimensions', () => {
      expect(IMAGE_DIMENSIONS.blogCard.width).toBe(800);
      expect(IMAGE_DIMENSIONS.blogCard.height).toBe(450);
      expect(IMAGE_DIMENSIONS.hero.width).toBe(1920);
    });

    it('should have aspect ratios', () => {
      expect(ASPECT_RATIOS.square).toBe(1);
      expect(ASPECT_RATIOS.landscape).toBeCloseTo(16 / 9);
    });

    it('should return placeholder props', () => {
      const props = getPlaceholderProps();
      expect(props.placeholder).toBe('blur');
      expect(props.blurDataURL).toBe(BLUR_DATA_URL);

      const goldProps = getPlaceholderProps('gold');
      expect(goldProps.blurDataURL).toBe(BLUR_DATA_URL_GOLD);
    });

    it('should return image props with dimensions', () => {
      const props = getImageProps('blogCard');
      expect(props.width).toBe(800);
      expect(props.height).toBe(450);
      expect(props.placeholder).toBe('blur');
    });
  });
});
