import { useCallback } from "react";

import { FormData } from "./useFormData";

/**
 * Custom hook for generating JSON-LD structured data for blog posts
 *
 * Generates Schema.org Article structured data based on the current form data.
 * This helps with SEO by providing search engines with structured information
 * about the blog post.
 *
 * @param formData - Current form data to generate JSON-LD from
 * @returns Object containing the getDefaultJsonLd function
 *
 * @example
 * ```tsx
 * const { getDefaultJsonLd } = useJsonLdGeneration(formData);
 *
 * // Generate JSON-LD when saving the post
 * const jsonLd = getDefaultJsonLd();
 * ```
 */
export function useJsonLdGeneration(formData: FormData) {
  /**
   * Generates default JSON-LD structured data for the blog post
   * Following Schema.org Article format
   *
   * @returns JSON-LD object with article metadata
   */
  const getDefaultJsonLd = useCallback(() => {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: formData.title,
      description: formData.description,
      datePublished: formData.date,
      author: {
        "@type": "Person",
        name: formData.author,
      },
      publisher: {
        "@type": "Organization",
        name: "Appréciez Votre Vie",
        logo: {
          "@type": "ImageObject",
          url: "https://appreciezvotrevie.fr/favicon.svg",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://appreciezvotrevie.fr/blog/${formData.slug}`,
      },
      keywords: [formData.category, ...formData.tags].join(", "),
    };
  }, [formData]);

  return {
    getDefaultJsonLd,
  };
}
