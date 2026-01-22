"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, ImageOff, RefreshCw } from "lucide-react";

/**
 * Convertit un chemin d'image en URL API pour le servir dynamiquement
 *
 * Cela résout le problème du mode standalone de Next.js où les fichiers
 * créés dynamiquement dans /public ne sont pas accessibles directement.
 *
 * @param imagePath - Chemin de l'image (ex: /images/blog/slug.webp ou /images/blog/temp/file.webp)
 * @param bustCache - Ajouter un timestamp pour forcer le rechargement
 * @returns URL de l'API pour servir l'image
 */
export function getBlogImageUrl(imagePath: string | undefined, bustCache = true): string {
  if (!imagePath) return "";

  // Nettoyer le chemin des paramètres existants
  const cleanPath = imagePath.split("?")[0] ?? imagePath;

  // Extraire le chemin relatif après /images/blog/
  let relativePath = cleanPath;
  if (cleanPath.startsWith("/images/blog/")) {
    relativePath = cleanPath.replace("/images/blog/", "");
  } else if (cleanPath.startsWith("images/blog/")) {
    relativePath = cleanPath.replace("images/blog/", "");
  }

  // Construire l'URL de l'API
  const apiUrl = `/api/blog/image?path=${encodeURIComponent(relativePath)}`;

  // Ajouter un timestamp pour le cache-busting si demandé
  if (bustCache) {
    return `${apiUrl}&t=${Date.now()}`;
  }

  return apiUrl;
}

/**
 * Extrait le chemin relatif d'une URL d'image du blog
 * Utilisé pour stocker le chemin dans la base de données sans le timestamp
 */
export function getCleanImagePath(imagePath: string | undefined): string {
  if (!imagePath) return "";

  // Retirer les paramètres de requête
  const cleanPath = imagePath.split("?")[0] ?? imagePath;

  // Si c'est déjà un chemin relatif au dossier blog, le garder
  if (!cleanPath.startsWith("/") && !cleanPath.startsWith("http")) {
    return `/images/blog/${cleanPath}`;
  }

  // Si c'est une URL API, extraire le chemin
  if (cleanPath.includes("/api/blog/image")) {
    const url = new URL(cleanPath, "http://localhost");
    const path = url.searchParams.get("path");
    return path ? `/images/blog/${path}` : "";
  }

  // Sinon retourner tel quel (devrait être /images/blog/...)
  return cleanPath;
}

interface BlogImageProps {
  /**
   * Chemin de l'image (ex: /images/blog/slug.webp)
   */
  src: string | undefined;
  /**
   * Texte alternatif pour l'accessibilité
   */
  alt: string;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
  /**
   * Classes CSS pour le conteneur
   */
  containerClassName?: string;
  /**
   * Afficher le bouton de rechargement en cas d'erreur
   */
  showRetryButton?: boolean;
  /**
   * Callback appelé quand l'image est chargée avec succès
   */
  onLoad?: () => void;
  /**
   * Callback appelé en cas d'erreur de chargement
   */
  onError?: () => void;
  /**
   * Clé unique pour forcer le rechargement (change quand l'image change)
   */
  reloadKey?: string | number;
}

type LoadingState = "loading" | "loaded" | "error";

/**
 * Composant d'image robuste pour le blog avec:
 * - État de chargement avec spinner
 * - Gestion d'erreur avec placeholder et bouton de retry
 * - Cache-busting automatique via l'API /api/blog/image
 * - Compatible avec le mode standalone de Next.js
 */
export function BlogImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  showRetryButton = true,
  onLoad,
  onError,
  reloadKey,
}: BlogImageProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Générer l'URL de l'API pour l'image
  const imageUrl = getBlogImageUrl(src, true);

  // Clé unique pour forcer le rechargement quand src ou reloadKey change
  const uniqueKey = `${imageUrl}-${reloadKey || ""}-${retryCount}`;

  // Reset l'état quand l'image change
  useEffect(() => {
    if (src) {
      setLoadingState("loading");
      setRetryCount(0);
    } else {
      setLoadingState("error");
    }
  }, [src, reloadKey]);

  const handleLoad = useCallback(() => {
    setLoadingState("loaded");
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setLoadingState("error");
    onError?.();
  }, [onError]);

  const handleRetry = useCallback(() => {
    setLoadingState("loading");
    setRetryCount((prev) => prev + 1);
  }, []);

  // Si pas d'image source, afficher directement le placeholder
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-night/40 ${containerClassName}`}
      >
        <div className="flex flex-col items-center gap-2 text-ivory/40">
          <ImageOff className="h-8 w-8" />
          <span className="text-sm">Aucune image</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${containerClassName}`}>
      {/* Spinner de chargement */}
      {loadingState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-night/60 backdrop-blur-sm z-10">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      )}

      {/* État d'erreur */}
      {loadingState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-night/60 backdrop-blur-sm z-10 gap-3">
          <ImageOff className="h-8 w-8 text-red-400" />
          <span className="text-sm text-ivory/60">Impossible de charger l&apos;image</span>
          {showRetryButton && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-2 rounded-lg bg-gold/20 px-3 py-1.5 text-sm font-medium text-gold transition hover:bg-gold/30"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </button>
          )}
        </div>
      )}

      {/* Image */}
      <img
        ref={imgRef}
        key={uniqueKey}
        src={imageUrl}
        alt={alt}
        className={`${className} ${loadingState === "loading" ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        // Désactiver le lazy loading pour les images du formulaire
        loading="eager"
        // Désactiver le décodage asynchrone pour éviter les delays
        decoding="sync"
      />
    </div>
  );
}

/**
 * Composant pour les propositions d'images générées par l'IA
 * Version simplifiée avec overlay de sélection
 */
interface BlogImageProposalProps {
  src: string;
  alt: string;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

export function BlogImageProposal({
  src,
  alt,
  isSelected,
  onClick,
  index,
}: BlogImageProposalProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");

  const imageUrl = getBlogImageUrl(src, true);

  useEffect(() => {
    setLoadingState("loading");
  }, [src]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition ${
        isSelected
          ? "border-gold ring-2 ring-gold/30"
          : "border-gold/20 hover:border-gold/50"
      }`}
    >
      {/* Spinner de chargement */}
      {loadingState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-night/60 z-10">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      )}

      {/* État d'erreur */}
      {loadingState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-night/60 z-10">
          <ImageOff className="h-6 w-6 text-red-400" />
          <span className="text-xs text-ivory/50 mt-1">Erreur</span>
        </div>
      )}

      {/* Image */}
      <img
        src={imageUrl}
        alt={alt}
        className={`h-full w-full object-cover transition group-hover:scale-105 ${
          loadingState === "loading" ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setLoadingState("loaded")}
        onError={() => setLoadingState("error")}
        loading="eager"
        decoding="sync"
      />

      {/* Overlay de sélection */}
      {isSelected && loadingState === "loaded" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gold/20">
          <div className="rounded-full bg-gold p-2">
            <svg
              className="h-5 w-5 text-night"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Label en bas */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-night/80 to-transparent p-3">
        <p className="text-sm font-medium text-ivory">Option {index + 1}</p>
      </div>
    </button>
  );
}
