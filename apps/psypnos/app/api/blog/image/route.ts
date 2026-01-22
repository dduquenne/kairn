// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";

/**
 * API pour servir les images du blog dynamiquement
 *
 * Résout le problème du mode standalone de Next.js où les fichiers
 * créés dynamiquement dans /public ne sont pas accessibles.
 *
 * Usage:
 * - /api/blog/image?path=slug.webp          → /public/images/blog/slug.webp
 * - /api/blog/image?path=temp/file.webp     → /public/images/blog/temp/file.webp
 *
 * Headers de cache:
 * - Pas de cache pour permettre les mises à jour immédiates
 * - ETag pour optimiser les requêtes conditionnelles
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imagePath = searchParams.get("path");

    if (!imagePath) {
      return NextResponse.json(
        { error: "Le paramètre 'path' est requis" },
        { status: 400 }
      );
    }

    // Validation de sécurité: empêcher la traversée de répertoire
    const normalizedPath = imagePath.replace(/\\/g, "/");
    if (normalizedPath.includes("..") || normalizedPath.startsWith("/")) {
      return NextResponse.json(
        { error: "Chemin invalide" },
        { status: 400 }
      );
    }

    // Construire le chemin absolu vers l'image
    const publicDir = join(process.cwd(), "public", "images", "blog");
    const fullPath = join(publicDir, normalizedPath);

    // Vérifier que le fichier existe et obtenir ses métadonnées
    let fileStats;
    try {
      fileStats = await stat(fullPath);
    } catch {
      return NextResponse.json(
        { error: "Image non trouvée" },
        { status: 404 }
      );
    }

    // Lire le fichier
    const fileBuffer = await readFile(fullPath);

    // Déterminer le type MIME
    const extension = normalizedPath.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      webp: "image/webp",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      svg: "image/svg+xml",
    };
    const contentType = mimeTypes[extension || ""] || "application/octet-stream";

    // Générer un ETag basé sur la taille et la date de modification
    const etag = `"${fileStats.size}-${fileStats.mtime.getTime()}"`;

    // Vérifier si le client a une version en cache valide
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // Retourner l'image avec les headers appropriés
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStats.size.toString(),
        "Cache-Control": "no-cache, must-revalidate",
        "ETag": etag,
        // Permettre la mise en cache conditionnelle mais forcer la revalidation
        "Last-Modified": fileStats.mtime.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la lecture de l'image:", error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture de l'image" },
      { status: 500 }
    );
  }
}
