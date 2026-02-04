/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Utilitaires blog côté client
 * Ce fichier n'importe pas de modules Node.js et peut être utilisé côté client
 */

import type { BlogPostSummary, BlogPost } from './blog';

/**
 * Résout l'URL d'image pour un article (client-side utility)
 * À utiliser côté client pour déterminer quelle image afficher
 *
 * Priorité:
 * 1. Utilise l'URL définie dans post.image si elle existe
 * 2. Sinon, utilise l'URL par défaut `/images/blog/{slug}.webp`
 */
export function resolvePostImage(post: BlogPostSummary | BlogPost): string | null {
  // Si une image est définie dans le metadata, on l'utilise
  if (post.image) {
    return post.image;
  }

  // Sinon, on retourne le chemin par défaut (le client devra vérifier l'existence)
  return `/images/blog/${post.slug}.webp`;
}

/**
 * Vérifie si une image existe pour un slug donné
 * Utile pour le formulaire d'édition d'article
 *
 * Logique:
 * 1. Si imageUrl est fournie et valide, l'utilise
 * 2. Sinon, retourne le chemin par défaut /images/blog/{slug}.webp
 *    (le client HTML/CSS gérera la non-existence)
 * 3. Retourne l'URL de l'image à utiliser, jamais null
 *
 * NOTE: On ne fait pas de vérification fetch car:
 * - fetch HEAD peut échouer silencieusement ou causer des erreurs CORS
 * - L'image HTML gère gracieusement les images manquantes (onError)
 * - C'est plus performant et moins problématique
 */
export function checkBlogImageExists(slug: string, imageUrl?: string): string | null {
  // Si une URL d'image est explicitement fournie, l'utiliser
  if (imageUrl?.trim()) {
    return imageUrl;
  }

  // Sinon, retourner le chemin par défaut
  // Le client HTML verra soit l'image, soit un message d'erreur (onError)
  return `/images/blog/${slug}.webp`;
}
