/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

import { NextRequest, NextResponse } from 'next/server';

/**
 * API pour servir les images du blog dynamiquement
 *
 * Résout le problème du mode standalone de Next.js où les fichiers
 * créés dynamiquement dans /public ne sont pas accessibles.
 *
 * Essaie d'abord le filesystem local, puis Supabase Storage en fallback.
 *
 * Usage:
 * - /api/blog/image?path=slug.webp          → local ou Supabase
 * - /api/blog/image?path=temp/file.webp     → local ou Supabase
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imagePath = searchParams.get('path');

    if (!imagePath) {
      return NextResponse.json({ error: "Le paramètre 'path' est requis" }, { status: 400 });
    }

    // Validation de sécurité: empêcher la traversée de répertoire
    const normalizedPath = imagePath.replace(/\\/g, '/');
    if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
      return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 });
    }

    // Construire le chemin absolu vers l'image
    const publicDir = join(process.cwd(), 'public', 'images', 'blog');
    const fullPath = join(publicDir, normalizedPath);

    // Essayer le filesystem local d'abord
    try {
      const fileStats = await stat(fullPath);
      const fileBuffer = await readFile(fullPath);

      // Déterminer le type MIME
      const extension = normalizedPath.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        webp: 'image/webp',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        svg: 'image/svg+xml',
      };
      const contentType = mimeTypes[extension || ''] || 'application/octet-stream';

      // Générer un ETag basé sur la taille et la date de modification
      const etag = `"${fileStats.size}-${fileStats.mtime.getTime()}"`;

      // Vérifier si le client a une version en cache valide
      const ifNoneMatch = request.headers.get('if-none-match');
      if (ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304 });
      }

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileStats.size.toString(),
          'Cache-Control': 'no-cache, must-revalidate',
          ETag: etag,
          'Last-Modified': fileStats.mtime.toUTCString(),
        },
      });
    } catch {
      // Fichier non trouvé localement — tenter Supabase
    }

    // Fallback Supabase : import dynamique pour éviter l'erreur au build SSG
    const { isSupabaseStorageConfigured } = await import('@/lib/supabase/client');
    if (isSupabaseStorageConfigured()) {
      const { getImageUrl, BUCKETS } = await import('@/lib/supabase/storage');
      const supabaseUrl = getImageUrl(BUCKETS.BLOG_IMAGES, normalizedPath);
      return NextResponse.redirect(supabaseUrl, { status: 302 });
    }

    return NextResponse.json({ error: 'Image non trouvée' }, { status: 404 });
  } catch (error) {
    console.error("Erreur lors de la lecture de l'image:", error);
    return NextResponse.json({ error: "Erreur lors de la lecture de l'image" }, { status: 500 });
  }
}
