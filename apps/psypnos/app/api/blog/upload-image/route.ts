// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "../../auth/middleware";
import { z } from "zod";
import { uploadImage, BUCKETS } from "@/lib/supabase/storage";

const uploadImageSchema = z.object({
  slug: z.string().trim().min(1, "Le slug est requis"),
  fileData: z.string().min(1, "Les données du fichier sont requises"),
  fileName: z.string().min(1, "Le nom du fichier est requis"),
});

/**
 * Detect image type from buffer magic bytes
 */
function detectImageType(buffer: Buffer): { type: string; extension: string; mimeType: string } | null {
  const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPNG =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  const isWebP =
    buffer.length > 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (isJPEG) return { type: 'jpeg', extension: 'jpg', mimeType: 'image/jpeg' };
  if (isPNG) return { type: 'png', extension: 'png', mimeType: 'image/png' };
  if (isWebP) return { type: 'webp', extension: 'webp', mimeType: 'image/webp' };
  return null;
}

/**
 * Upload a custom image for a blog post
 * Image is uploaded in its original format to reduce serverless function size
 * (avoiding sharp dependency which adds ~30MB of native binaries)
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = uploadImageSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstError?.message ?? "Données invalides." },
        { status: 400 }
      );
    }

    const { slug, fileData } = parsed.data;

    // Validate slug (alphanumeric with hyphens, no leading/trailing hyphens)
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && !/^[a-z0-9]$/.test(slug)) {
      return NextResponse.json(
        { message: "Le slug n'est pas valide" },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = fileData.split(",")[1] || fileData;
    const buffer = Buffer.from(base64Data, "base64");

    // Detect image type
    const imageInfo = detectImageType(buffer);
    if (!imageInfo) {
      return NextResponse.json(
        { message: "Format non supporté. Utilisez JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage in original format
    // Note: For WebP conversion, use Supabase image transformation on the client side
    // by appending ?format=webp to the URL
    const result = await uploadImage(
      BUCKETS.BLOG_IMAGES,
      `${slug}.${imageInfo.extension}`,
      buffer,
      imageInfo.mimeType
    );

    if (!result.success) {
      console.error("Upload error:", result.error);
      return NextResponse.json(
        { message: "Impossible de sauvegarder l'image." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      finalPath: result.url,
      message: "Image téléchargée et sauvegardée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du téléchargement de l'image:", error);
    return NextResponse.json(
      {
        message:
          "Une erreur est survenue lors du téléchargement. Veuillez réessayer.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
