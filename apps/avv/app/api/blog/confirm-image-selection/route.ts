/**
 * API pour confirmer la sélection d'une image générée
 *
 * POST /api/blog/confirm-image-selection
 *
 * Copie l'image sélectionnée depuis le dossier temporaire vers sa
 * destination finale en utilisant le module de stockage (Supabase ou local).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { uploadImage, BUCKETS } from '@/lib/supabase/storage';

import { withAdminAuth } from '../../auth/middleware';

const confirmSelectionSchema = z.object({
  selectedProposalId: z.string(),
  tempPath: z.string(),
  slug: z.string().trim().min(1, 'Le slug est requis'),
});

/**
 * Confirme la sélection d'une image et la sauvegarde définitivement
 *
 * Télécharge l'image depuis l'emplacement temporaire (Supabase URL ou
 * chemin local) et la re-upload vers l'emplacement final via le module
 * de stockage unifié.
 */
export async function POST(request: NextRequest) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = confirmSelectionSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstError?.message ?? 'Données invalides.' },
        { status: 400 }
      );
    }

    const { tempPath, slug } = parsed.data;

    // Télécharger l'image depuis son emplacement temporaire
    // tempPath peut être une URL Supabase ou un chemin local
    let imageBuffer: Buffer;

    try {
      if (tempPath.startsWith('http://') || tempPath.startsWith('https://')) {
        // Image sur Supabase Storage — télécharger via HTTP
        const response = await fetch(tempPath);
        if (!response.ok) {
          throw new Error(`Impossible de télécharger l'image: ${response.status}`);
        }
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        // Image sur le filesystem local — lire le fichier
        const { promises: fs } = await import('fs');
        const { join } = await import('path');
        const publicDir = join(process.cwd(), 'public');
        const fullPath = join(publicDir, tempPath.replace(/^\//, ''));
        imageBuffer = await fs.readFile(fullPath);
      }
    } catch (error) {
      console.error("Erreur lors de la lecture de l'image temporaire:", error);
      return NextResponse.json(
        { message: "Impossible de lire l'image sélectionnée." },
        { status: 500 }
      );
    }

    // Upload vers l'emplacement final via le module de stockage unifié
    const finalFilename = `${slug}.webp`;
    const result = await uploadImage(BUCKETS.BLOG_IMAGES, finalFilename, imageBuffer, 'image/webp');

    if (!result.success) {
      console.error("Erreur lors de l'upload de l'image finale:", result.error);
      return NextResponse.json(
        { message: "Impossible de sauvegarder l'image sélectionnée." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      finalPath: result.url,
    });
  } catch (error) {
    console.error('Erreur lors de la confirmation de la sélection:', error);
    return NextResponse.json(
      {
        message: 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
