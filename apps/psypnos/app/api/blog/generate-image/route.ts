/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { uploadImage, BUCKETS } from "@/lib/supabase/storage";

import { withAdminAuth } from "../../auth/middleware";

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
 * Images are stored in Supabase Storage (temp folder) to work in serverless environment
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

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Upload to Supabase Storage (temp folder)
        // Note: DALL-E returns PNG images by default
        const fileName = `temp/${slug}-proposal-${index + 1}-${timestamp}.png`;
        const result = await uploadImage(
          BUCKETS.BLOG_IMAGES,
          fileName,
          imageBuffer,
          "image/png"
        );

        if (!result.success) {
          throw new Error(`Upload failed: ${result.error}`);
        }

        const sizeKB = (imageBuffer.length / 1024).toFixed(0);

        return {
          id: `${index + 1}`,
          tempPath: result.url,
          size: `${sizeKB} KB`,
          dimensions: "1792x1024", // DALL-E 3 fixed size
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
