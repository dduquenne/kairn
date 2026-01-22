// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "../../auth/middleware";
import { copyFile } from "fs/promises";
import { join, basename } from "path";
import { z } from "zod";

const confirmSelectionSchema = z.object({
  selectedProposalId: z.string(),
  tempPath: z.string(),
  slug: z.string().trim().min(1, "Le slug est requis"),
});

/**
 * Confirme la sélection d'une image et la sauvegarde définitivement
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification admin
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = confirmSelectionSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstError?.message ?? "Données invalides." },
        { status: 400 }
      );
    }

    const { tempPath, slug } = parsed.data;

    // Chemins des dossiers
    const publicDir = join(process.cwd(), "public");
    const tempDir = join(publicDir, "images", "blog", "temp");
    const blogImagesDir = join(publicDir, "images", "blog");

    // Extraire le nom du fichier depuis tempPath
    const tempFileName = basename(tempPath);
    const sourcePath = join(tempDir, tempFileName);
    const destinationPath = join(blogImagesDir, `${slug}.webp`);

    try {
      // Copier le fichier sélectionné vers le dossier final
      await copyFile(sourcePath, destinationPath);
    } catch (error) {
      console.error("Erreur lors de la copie du fichier:", error);
      return NextResponse.json(
        { message: "Impossible de sauvegarder l'image sélectionnée." },
        { status: 500 }
      );
    }

    // NOTE: On ne supprime PAS les fichiers temporaires ici pour permettre
    // à l'utilisateur de changer d'avis jusqu'à l'enregistrement final.
    // Les fichiers temporaires seront nettoyés lors de la prochaine génération.

    // Retourner le chemin propre - le cache-busting est géré par le composant BlogImage
    return NextResponse.json({
      success: true,
      finalPath: `/images/blog/${slug}.webp`,
    });
  } catch (error) {
    console.error("Erreur lors de la confirmation de la sélection:", error);
    return NextResponse.json(
      {
        message: "Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
