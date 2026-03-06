'use client';

/**
 * @module useJsonLdGeneration
 * @description Hook de génération JSON-LD structuré pour le SEO
 *
 * Paramétrisé via BlogAdminConfig pour le publisher (nom, URL).
 */

import { useCallback } from 'react';

import { useBlogAdminConfig } from '../../components/blog/context';

import type { FormData } from './useFormData';

/**
 * Hook de génération JSON-LD
 *
 * @param formData - Données du formulaire
 */
export function useJsonLdGeneration(formData: FormData) {
  const { publisherName, publisherUrl } = useBlogAdminConfig();

  /**
   * Génère les données JSON-LD Schema.org Article
   */
  const getDefaultJsonLd = useCallback(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: formData.title,
      description: formData.description,
      datePublished: formData.date,
      author: {
        '@type': 'Person',
        name: formData.author,
      },
      publisher: {
        '@type': 'Organization',
        name: publisherName,
        logo: {
          '@type': 'ImageObject',
          url: `${publisherUrl}favicon.svg`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${publisherUrl}blog/${formData.slug}`,
      },
      keywords: [formData.category, ...formData.tags].join(', '),
    };
  }, [formData, publisherName, publisherUrl]);

  return {
    getDefaultJsonLd,
  };
}
