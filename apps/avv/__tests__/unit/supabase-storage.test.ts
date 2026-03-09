/**
 * Tests unitaires pour le module de stockage Supabase.
 *
 * Vérifie que :
 * - uploadImage utilise le nom de fichier tel quel (pas de normalisation .webp)
 * - Le fallback local fonctionne quand Supabase n'est pas configuré
 * - deleteImage, getImageUrl et imageExists fonctionnent correctement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks hoistés ──────────────────────────────────────────────

const {
  mockUpload,
  mockGetPublicUrl,
  mockRemove,
  mockList,
  mockIsConfigured,
  mockSupabase,
  mockMkdir,
  mockWriteFile,
  mockUnlink,
  mockAccess,
} = vi.hoisted(() => ({
  mockUpload: vi.fn(),
  mockGetPublicUrl: vi.fn(),
  mockRemove: vi.fn(),
  mockList: vi.fn(),
  mockIsConfigured: vi.fn(),
  mockSupabase: {
    storage: {
      from: vi.fn(),
    },
  },
  mockMkdir: vi.fn(),
  mockWriteFile: vi.fn(),
  mockUnlink: vi.fn(),
  mockAccess: vi.fn(),
}));

// ─── Mocks — déclarés AVANT les imports ─────────────────────────

vi.mock('../../lib/supabase/client', () => ({
  supabase: mockSupabase,
  isSupabaseStorageConfigured: mockIsConfigured,
}));

vi.mock('fs', () => ({
  promises: {
    mkdir: mockMkdir,
    writeFile: mockWriteFile,
    unlink: mockUnlink,
    access: mockAccess,
  },
}));

// ─── Import du module sous test ─────────────────────────────────

import {
  uploadImage,
  deleteImage,
  getImageUrl,
  imageExists,
  BUCKETS,
} from '../../lib/supabase/storage';

// ─── Tests ──────────────────────────────────────────────────────

describe('supabase/storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Configuration par défaut : Supabase activé
    mockIsConfigured.mockReturnValue(true);

    mockSupabase.storage.from.mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
      remove: mockRemove,
      list: mockList,
    });
  });

  // ── uploadImage ──────────────────────────────────────────────

  describe('uploadImage', () => {
    it('conserve le nom de fichier tel quel (pas de normalisation .webp)', async () => {
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: {
          publicUrl: 'https://supabase.co/storage/v1/object/public/blog-images/temp/slug-1.png',
        },
      });

      const result = await uploadImage(
        BUCKETS.BLOG_IMAGES,
        'temp/slug-1.png',
        Buffer.from('fake-png'),
        'image/png'
      );

      expect(result.success).toBe(true);
      expect(mockUpload).toHaveBeenCalledWith('temp/slug-1.png', expect.any(Buffer), {
        contentType: 'image/png',
        upsert: true,
      });
      // Vérifie que le nom n'a PAS été modifié en .png.webp
      expect(mockGetPublicUrl).toHaveBeenCalledWith('temp/slug-1.png');
    });

    it('conserve les fichiers .jpg sans ajouter .webp', async () => {
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://supabase.co/storage/v1/object/public/blog-images/article.jpg' },
      });

      const result = await uploadImage(
        BUCKETS.BLOG_IMAGES,
        'article.jpg',
        Buffer.from('fake-jpg'),
        'image/jpeg'
      );

      expect(result.success).toBe(true);
      expect(mockUpload).toHaveBeenCalledWith('article.jpg', expect.any(Buffer), {
        contentType: 'image/jpeg',
        upsert: true,
      });
    });

    it('retourne une erreur si Supabase upload échoue', async () => {
      mockUpload.mockResolvedValue({ error: { message: 'Bucket not found' } });

      const result = await uploadImage(
        BUCKETS.BLOG_IMAGES,
        'test.webp',
        Buffer.from('data'),
        'image/webp'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bucket not found');
    });

    it("utilise le fallback local quand Supabase n'est pas configuré", async () => {
      mockIsConfigured.mockReturnValue(false);
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const result = await uploadImage(
        BUCKETS.BLOG_IMAGES,
        'slug.webp',
        Buffer.from('data'),
        'image/webp'
      );

      expect(result.success).toBe(true);
      expect(result.url).toBe('/images/blog/slug.webp');
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });

  // ── deleteImage ──────────────────────────────────────────────

  describe('deleteImage', () => {
    it('supprime le fichier avec le nom exact fourni', async () => {
      mockRemove.mockResolvedValue({ error: null });

      const result = await deleteImage(BUCKETS.BLOG_IMAGES, 'article.png');

      expect(result.success).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith(['article.png']);
    });
  });

  // ── getImageUrl ──────────────────────────────────────────────

  describe('getImageUrl', () => {
    it("retourne l'URL Supabase avec le nom de fichier exact", () => {
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://supabase.co/storage/v1/object/public/blog-images/slug.webp' },
      });

      const url = getImageUrl(BUCKETS.BLOG_IMAGES, 'slug.webp');

      expect(url).toBe('https://supabase.co/storage/v1/object/public/blog-images/slug.webp');
      expect(mockGetPublicUrl).toHaveBeenCalledWith('slug.webp');
    });

    it("retourne un chemin local quand Supabase n'est pas configuré", () => {
      mockIsConfigured.mockReturnValue(false);

      const url = getImageUrl(BUCKETS.BLOG_IMAGES, 'slug.webp');

      expect(url).toBe('/images/blog/slug.webp');
    });
  });

  // ── imageExists ──────────────────────────────────────────────

  describe('imageExists', () => {
    it("vérifie l'existence avec le nom de fichier exact", async () => {
      mockList.mockResolvedValue({
        data: [{ name: 'slug.png' }],
        error: null,
      });

      const exists = await imageExists(BUCKETS.BLOG_IMAGES, 'slug.png');

      expect(exists).toBe(true);
    });

    it("retourne false si le fichier n'existe pas", async () => {
      mockList.mockResolvedValue({
        data: [{ name: 'other.png' }],
        error: null,
      });

      const exists = await imageExists(BUCKETS.BLOG_IMAGES, 'slug.png');

      expect(exists).toBe(false);
    });
  });
});
