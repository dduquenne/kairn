'use client';

/**
 * @module useFormData
 * @description Hook de gestion du state du formulaire blog
 */

import type { FAQItem } from '@kairn/blog';
import { useState, useCallback } from 'react';

/**
 * Nettoie l'URL de l'image en retirant les paramètres de cache-busting
 */
function cleanImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return imageUrl;
  return imageUrl.split('?')[0];
}

/**
 * Type du formulaire de création/édition d'article blog
 */
export type FormData = {
  slug?: string;
  title: string;
  description: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  published: boolean;
  featured: boolean;
  date: string;
  faq: FAQItem[];
  jsonLd?: Record<string, unknown>;
  imagePrompt?: string;
  seoIntent?: string;
  persona?: string;
  tones?: string[];
};

/**
 * Crée les valeurs par défaut du formulaire
 *
 * @param defaultAuthor - Auteur par défaut (depuis la config site)
 * @param defaultCategory - Catégorie par défaut (depuis la config site)
 */
export function createDefaultFormData(defaultAuthor: string, defaultCategory: string): FormData {
  return {
    slug: '',
    title: '',
    description: '',
    content: '',
    author: defaultAuthor,
    category: defaultCategory,
    tags: [],
    image: '',
    published: true,
    featured: false,
    date: new Date().toISOString().split('T')[0] ?? '',
    faq: [],
    jsonLd: undefined,
    imagePrompt: '',
    seoIntent: '',
    persona: '',
    tones: [],
  };
}

/**
 * Interface minimale du post existant pour l'initialisation
 */
interface BlogPostLike {
  slug: string;
  title: string;
  description: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  published: boolean;
  featured?: boolean;
  date: string;
  faq?: FAQItem[];
  jsonLd?: Record<string, unknown>;
  imagePrompt?: string;
  seoIntent?: string;
  persona?: string;
  tones?: string[];
}

/**
 * Hook de gestion du state du formulaire blog
 *
 * @param defaultAuthor - Auteur par défaut
 * @param defaultCategory - Catégorie par défaut
 */
export function useFormData(defaultAuthor: string, defaultCategory: string) {
  const [formData, setFormData] = useState<FormData>(
    createDefaultFormData(defaultAuthor, defaultCategory)
  );

  /**
   * Mise à jour partielle du formulaire
   */
  const updateFormData = useCallback((update: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...update }));
  }, []);

  /**
   * Initialise le formulaire depuis un post existant
   */
  const initFromPost = useCallback((post: BlogPostLike) => {
    setFormData({
      slug: post.slug,
      title: post.title,
      description: post.description,
      content: post.content,
      author: post.author,
      category: post.category,
      tags: post.tags,
      image: cleanImageUrl(post.image),
      published: post.published,
      featured: post.featured ?? false,
      date: post.date,
      faq: post.faq || [],
      jsonLd: post.jsonLd,
      imagePrompt: post.imagePrompt,
      seoIntent: post.seoIntent,
      persona: post.persona,
      tones: post.tones || [],
    });
  }, []);

  return {
    formData,
    setFormData,
    updateFormData,
    initFromPost,
  };
}
