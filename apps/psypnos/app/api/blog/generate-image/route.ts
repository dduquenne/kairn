// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "../../auth/middleware";
import OpenAI from "openai";
import sharp from "sharp";
import { writeFile, mkdir, readdir, unlink } from "fs/promises";
import { join } from "path";
import { z } from "zod";

const generateImageSchema = z.object({
  imagePrompt: z.string().trim().min(1, "Le prompt image est requis"),
  slug: z.string().trim().min(1, "Le slug est requis"),
});

type ImageProposal = {
  id: string;
  tempPath: string;
  size: string;
  dimensions: string;
  timestamp: number;
};

/**
 * Génère 3 propositions d'images via DALL-E 3 pour un article de blog
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification admin
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = generateImageSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstError?.message ?? "Données invalides." },
        { status: 400 }
      );
    }

    const { imagePrompt, slug } = parsed.data;

    // Vérifier la clé API OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY n'est pas configurée");
      return NextResponse.json(
        { message: "Le service n'est pas configuré." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Créer le dossier temp s'il n'existe pas
    const tempDir = join(process.cwd(), "public", "images", "blog", "temp");
    await mkdir(tempDir, { recursive: true });

    // Nettoyer les anciennes propositions pour ce slug avant d'en générer de nouvelles
    try {
      const existingFiles = await readdir(tempDir);
      const slugPattern = new RegExp(`^${slug}-proposal-\\d+-\\d+\\.webp$`);
      const filesToDelete = existingFiles.filter((file) => slugPattern.test(file));

      await Promise.all(
        filesToDelete.map((file) =>
          unlink(join(tempDir, file)).catch((err) => {
            console.error(`Erreur lors de la suppression de ${file}:`, err);
          })
        )
      );
    } catch (error) {
      console.error("Erreur lors du nettoyage des anciennes propositions:", error);
      // Continuer malgré l'erreur de nettoyage
    }

    // Générer 3 images en parallèle
    const timestamp = Date.now();
    const imagePromises = Array.from({ length: 3 }, async (_, index) => {
      try {
        // Appel à DALL-E 3
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          size: "1792x1024",
          quality: "hd",
          n: 1,
        });

        if (!response.data || response.data.length === 0) {
          throw new Error("Aucune image retournée par DALL-E");
        }

        const imageUrl = response.data[0]?.url;
        if (!imageUrl) {
          throw new Error("Aucune URL d'image retournée par DALL-E");
        }

        // Télécharger l'image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error("Impossible de télécharger l'image générée");
        }

        const imageBuffer = await imageResponse.arrayBuffer();

        // Convertir en WebP avec Sharp
        const webpBuffer = await sharp(Buffer.from(imageBuffer))
          .webp({ quality: 90 })
          .toBuffer();

        // Sauvegarder temporairement
        const fileName = `${slug}-proposal-${index + 1}-${timestamp}.webp`;
        const filePath = join(tempDir, fileName);
        await writeFile(filePath, webpBuffer);

        // Récupérer les métadonnées
        const metadata = await sharp(webpBuffer).metadata();
        const sizeKB = (webpBuffer.length / 1024).toFixed(0);

        return {
          id: `${index + 1}`,
          tempPath: `/images/blog/temp/${fileName}`,
          size: `${sizeKB} KB`,
          dimensions: `${metadata.width}x${metadata.height}`,
          timestamp,
        };
      } catch (error) {
        console.error(`Erreur lors de la génération de l'image ${index + 1}:`, error);
        return null;
      }
    });

    const results = await Promise.all(imagePromises);

    // Filtrer les résultats réussis
    const proposals: ImageProposal[] = results.filter(
      (r): r is ImageProposal => r !== null
    );

    if (proposals.length === 0) {
      return NextResponse.json(
        { message: "Aucune image n'a pu être générée. Veuillez réessayer." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      proposals,
      slug,
    });
  } catch (error) {
    console.error("Erreur lors de la génération des images:", error);
    return NextResponse.json(
      {
        message: "Une erreur est survenue lors de la génération. Veuillez réessayer.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
