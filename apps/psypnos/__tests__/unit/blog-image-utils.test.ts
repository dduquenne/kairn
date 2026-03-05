/**
 * Tests unitaires pour les utilitaires d'URL d'image du blog (BlogImage.tsx).
 *
 * Vérifie que :
 * - getBlogImageUrl gère les URLs Supabase directement
 * - getBlogImageUrl route les chemins locaux via /api/blog/image
 * - getCleanImagePath extrait correctement les chemins propres
 */

import { describe, it, expect } from 'vitest';

import { getBlogImageUrl, getCleanImagePath } from '../../app/admin/blog/_components/BlogImage';

describe('getBlogImageUrl', () => {
  it('retourne une chaîne vide si imagePath est undefined', () => {
    expect(getBlogImageUrl(undefined)).toBe('');
  });

  it('retourne une chaîne vide si imagePath est vide', () => {
    expect(getBlogImageUrl('')).toBe('');
  });

  it('retourne directement une URL Supabase https', () => {
    const supabaseUrl = 'https://abc.supabase.co/storage/v1/object/public/blog-images/slug.webp';
    const result = getBlogImageUrl(supabaseUrl, false);

    expect(result).toBe(supabaseUrl);
    expect(result).not.toContain('/api/blog/image');
  });

  it('ajoute un cache-buster aux URLs Supabase', () => {
    const supabaseUrl = 'https://abc.supabase.co/storage/v1/object/public/blog-images/slug.webp';
    const result = getBlogImageUrl(supabaseUrl, true);

    expect(result).toContain(supabaseUrl);
    expect(result).toMatch(/\?t=\d+$/);
  });

  it("route les chemins locaux /images/blog/ via l'API", () => {
    const result = getBlogImageUrl('/images/blog/slug.webp', false);

    expect(result).toBe('/api/blog/image?path=slug.webp');
  });

  it("route les chemins locaux sans slash initial via l'API", () => {
    const result = getBlogImageUrl('images/blog/slug.webp', false);

    expect(result).toBe('/api/blog/image?path=slug.webp');
  });

  it('gère les chemins avec des sous-dossiers (temp/)', () => {
    const result = getBlogImageUrl('/images/blog/temp/file.png', false);

    expect(result).toBe('/api/blog/image?path=temp%2Ffile.png');
  });

  it('nettoie les paramètres de requête existants', () => {
    const result = getBlogImageUrl('/images/blog/slug.webp?t=123', false);

    expect(result).toBe('/api/blog/image?path=slug.webp');
  });
});

describe('getCleanImagePath', () => {
  it('retourne une chaîne vide si imagePath est undefined', () => {
    expect(getCleanImagePath(undefined)).toBe('');
  });

  it('retourne les URLs Supabase telles quelles', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/public/blog-images/slug.webp';
    expect(getCleanImagePath(url)).toBe(url);
  });

  it('retire les paramètres de requête des URLs Supabase', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/public/blog-images/slug.webp?t=123';
    expect(getCleanImagePath(url)).toBe(
      'https://abc.supabase.co/storage/v1/object/public/blog-images/slug.webp'
    );
  });

  it('préfixe les chemins relatifs avec /images/blog/', () => {
    expect(getCleanImagePath('slug.webp')).toBe('/images/blog/slug.webp');
  });

  it('conserve les chemins absolus /images/blog/', () => {
    expect(getCleanImagePath('/images/blog/slug.webp')).toBe('/images/blog/slug.webp');
  });

  it('extrait le chemin depuis une URL API', () => {
    expect(getCleanImagePath('/api/blog/image?path=slug.webp')).toBe('/images/blog/slug.webp');
  });
});
