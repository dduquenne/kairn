'use client';

import { Loader2, ImageOff, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Convertit un chemin d'image en URL affichable
 *
 * - URLs complètes (Supabase) : retournées directement
 * - Chemins locaux (/images/blog/...) : routés via /api/blog/image pour
 *   résoudre le problème du mode standalone de Next.js
 *
 * @param imagePath - Chemin ou URL de l'image
 * @param bustCache - Ajouter un timestamp pour forcer le rechargement
 * @returns URL affichable pour l'image
 */
export function getBlogImageUrl(imagePath: string | undefined, bustCache = true): string {
  if (!imagePath) return '';

  // Nettoyer le chemin des paramètres existants
  const cleanPath = imagePath.split('?')[0] ?? imagePath;

  // URLs complètes (Supabase ou autre CDN) : utiliser directement
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    if (bustCache) {
      const separator = cleanPath.includes('?') ? '&' : '?';
      return `${cleanPath}${separator}t=${Date.now()}`;
    }
    return cleanPath;
  }

  // Chemins locaux : router via l'API
  let relativePath = cleanPath;
  if (cleanPath.startsWith('/images/blog/')) {
    relativePath = cleanPath.replace('/images/blog/', '');
  } else if (cleanPath.startsWith('images/blog/')) {
    relativePath = cleanPath.replace('images/blog/', '');
  }

  const apiUrl = `/api/blog/image?path=${encodeURIComponent(relativePath)}`;

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
  if (!imagePath) return '';

  // Si c'est une URL API, extraire le chemin AVANT de supprimer les query params
  if (imagePath.includes('/api/blog/image')) {
    const url = new URL(imagePath, 'http://localhost');
    const path = url.searchParams.get('path');
    return path ? `/images/blog/${path}` : '';
  }

  // Retirer les paramètres de requête
  const cleanPath = imagePath.split('?')[0] ?? imagePath;

  // URLs Supabase : retourner telles quelles (ce sont les URLs de stockage)
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // Si c'est déjà un chemin relatif au dossier blog, le garder
  if (!cleanPath.startsWith('/')) {
    return `/images/blog/${cleanPath}`;
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

type LoadingState = 'loading' | 'loaded' | 'error';

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
  className = '',
  containerClassName = '',
  showRetryButton = true,
  onLoad,
  onError,
  reloadKey,
}: BlogImageProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Générer l'URL de l'API pour l'image
  const imageUrl = getBlogImageUrl(src, true);

  // Clé unique pour forcer le rechargement quand src ou reloadKey change
  const uniqueKey = `${imageUrl}-${reloadKey || ''}-${retryCount}`;

  // Reset l'état quand l'image change
  useEffect(() => {
    if (src) {
      setLoadingState('loading');
      setRetryCount(0);
    } else {
      setLoadingState('error');
    }
  }, [src, reloadKey]);

  const handleLoad = useCallback(() => {
    setLoadingState('loaded');
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setLoadingState('error');
    onError?.();
  }, [onError]);

  const handleRetry = useCallback(() => {
    setLoadingState('loading');
    setRetryCount(prev => prev + 1);
  }, []);

  // Si pas d'image source, afficher directement le placeholder
  if (!src) {
    return (
      <div className={`bg-night/40 flex items-center justify-center ${containerClassName}`}>
        <div className="text-ivory/40 flex flex-col items-center gap-2">
          <ImageOff className="h-8 w-8" />
          <span className="text-sm">Aucune image</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${containerClassName}`}>
      {/* Spinner de chargement */}
      {loadingState === 'loading' && (
        <div className="bg-night/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
          <Loader2 className="text-gold h-8 w-8 animate-spin" />
        </div>
      )}

      {/* État d'erreur */}
      {loadingState === 'error' && (
        <div className="bg-night/60 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
          <ImageOff className="h-8 w-8 text-red-400" />
          <span className="text-ivory/60 text-sm">Impossible de charger l&apos;image</span>
          {showRetryButton && (
            <button
              type="button"
              onClick={handleRetry}
              className="bg-gold/20 text-gold hover:bg-gold/30 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition"
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
        className={`${className} ${loadingState === 'loading' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
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
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');

  const imageUrl = getBlogImageUrl(src, true);

  useEffect(() => {
    setLoadingState('loading');
  }, [src]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition ${
        isSelected ? 'border-gold ring-gold/30 ring-2' : 'border-gold/20 hover:border-gold/50'
      }`}
    >
      {/* Spinner de chargement */}
      {loadingState === 'loading' && (
        <div className="bg-night/60 absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 className="text-gold h-6 w-6 animate-spin" />
        </div>
      )}

      {/* État d'erreur */}
      {loadingState === 'error' && (
        <div className="bg-night/60 absolute inset-0 z-10 flex flex-col items-center justify-center">
          <ImageOff className="h-6 w-6 text-red-400" />
          <span className="text-ivory/50 mt-1 text-xs">Erreur</span>
        </div>
      )}

      {/* Image */}
      <img
        src={imageUrl}
        alt={alt}
        className={`h-full w-full object-cover transition group-hover:scale-105 ${
          loadingState === 'loading' ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setLoadingState('loaded')}
        onError={() => setLoadingState('error')}
        loading="eager"
        decoding="sync"
      />

      {/* Overlay de sélection */}
      {isSelected && loadingState === 'loaded' && (
        <div className="bg-gold/20 absolute inset-0 flex items-center justify-center">
          <div className="bg-gold rounded-full p-2">
            <svg
              className="text-night h-5 w-5"
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
      <div className="from-night/80 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent p-3">
        <p className="text-ivory text-sm font-medium">Option {index + 1}</p>
      </div>
    </button>
  );
}
