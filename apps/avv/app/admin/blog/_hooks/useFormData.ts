/**
 * @module useFormData
 * @description Custom hook for managing blog post form data state with initialization from existing posts
 *
 * This hook centralizes form state management for the blog post editor, handling:
 * - Initial form state with default values
 * - Loading existing post data when editing
 * - Providing helpers for partial and full state updates
 *
 * @see {@link /app/admin/blog/_components/BlogPostForm.tsx} - Main consumer of this hook
 * @see {@link /lib/blog.ts} - BlogPost type definition
 *
 * @example
 * ```tsx
 * // Creating a new post
 * const { formData, updateFormData } = useFormData();
 *
 * // Editing an existing post
 * const { formData, setFormData, updateFormData } = useFormData(existingPost);
 *
 * // Partial update (preferred for single field changes)
 * updateFormData({ title: "New Title" });
 *
 * // Full replacement (use when resetting entire form)
 * setFormData(defaultFormData);
 * ```
 */

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from "react";

import { BlogPost, FAQItem } from "@/lib/blog";

/**
 * Nettoie l'URL de l'image en retirant les paramètres de cache-busting
 * Le cache-busting est maintenant géré par le composant BlogImage via l'API /api/blog/image
 */
function cleanImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return imageUrl;
  // Retirer les paramètres de requête pour stocker un chemin propre
  return imageUrl.split("?")[0];
}

/**
 * Type representing the form data structure for creating or editing a blog post
 *
 * @property {string} [slug] - URL-friendly identifier (auto-generated from title + category)
 * @property {string} title - Article title (required)
 * @property {string} description - Short description for SEO and previews (required)
 * @property {string} content - Main article content in Markdown format (required)
 * @property {string} author - Article author name (required)
 * @property {string} category - Article category: "Comprendre", "Traverser", "Découvrir", or "Cheminer" (required)
 * @property {string[]} tags - Array of tags for categorization and search
 * @property {string} [image] - Path to article image (e.g., /images/blog/slug.webp)
 * @property {boolean} published - Publication status
 * @property {string} date - Publication date in ISO format (YYYY-MM-DD)
 * @property {FAQItem[]} faq - Array of frequently asked questions
 * @property {Record<string, any>} [jsonLd] - JSON-LD structured data for SEO
 * @property {string} [imagePrompt] - AI prompt used for image generation
 * @property {string} [seoIntent] - SEO search intent description
 * @property {string} [persona] - Target audience persona description
 * @property {string[]} [tones] - Preferred writing tones for the article
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
  jsonLd?: Record<string, any>;
  imagePrompt?: string;
  seoIntent?: string;
  persona?: string;
  tones?: string[];
};

/**
 * Default values for a new blog post form
 *
 * These defaults are used when creating a new post (not editing).
 * The author and category have sensible defaults to speed up content creation.
 *
 * @constant
 */
export const defaultFormData: FormData = {
  slug: "",
  title: "",
  description: "",
  content: "",
  author: "Nathalie Duquenne",
  category: "Comprendre",
  tags: [],
  image: "",
  published: true,
  featured: false,
  date: new Date().toISOString().split("T")[0] ?? "",
  faq: [],
  jsonLd: undefined,
  imagePrompt: "",
  seoIntent: "",
  persona: "",
  tones: [],
};

/**
 * Custom hook for managing blog post form data state
 *
 * Handles initialization of form data from an existing post (for editing)
 * or uses default values (for creating new posts).
 *
 * **State Management Pattern:**
 * - Uses React.useState for form data storage
 * - Provides two update methods: partial (updateFormData) and full (setFormData)
 * - Automatically syncs with post prop changes via useEffect
 *
 * @param {BlogPost} [post] - Optional existing blog post to load into the form
 * @returns {Object} Form data management interface
 * @returns {FormData} formData - Current form data state
 * @returns {Function} setFormData - Direct state setter for full replacement
 * @returns {Function} updateFormData - Partial update helper (preferred for single field changes)
 *
 * @example
 * ```tsx
 * // Creating a new post
 * const { formData, updateFormData } = useFormData();
 *
 * // Editing an existing post
 * const { formData, setFormData, updateFormData } = useFormData(existingPost);
 *
 * // Partial update - more efficient for single field changes
 * updateFormData({ title: "New Title" });
 *
 * // Full replacement - use for resetting or loading generated content
 * setFormData(newCompleteFormData);
 * ```
 */
export function useFormData(post?: BlogPost) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  /**
   * Helper function for partial updates to form data
   *
   * This is the preferred method for updating individual fields as it:
   * - Merges updates with existing state
   * - Preserves unchanged fields
   * - Memoized with useCallback to prevent unnecessary re-renders
   *
   * @param {Partial<FormData>} update - Fields to update
   */
  const updateFormData = useCallback((update: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...update }));
  }, []);

  /**
   * Load existing post data into form when post prop changes
   *
   * This effect runs when:
   * - Component mounts with a post (editing mode)
   * - Post prop changes (switching between posts)
   *
   * It maps all post fields to form data, providing defaults for optional fields
   * to ensure the form always has valid values.
   *
   * NOTE: Le cache-busting est maintenant géré par le composant BlogImage
   * via l'API /api/blog/image. On stocke des chemins propres sans paramètres.
   */
  useEffect(() => {
    if (post) {
      setFormData({
        slug: post.slug,
        title: post.title,
        description: post.description,
        content: post.content,
        author: post.author,
        category: post.category,
        tags: post.tags,
        // Stocker un chemin propre - le cache-busting est géré par BlogImage
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
    }
  }, [post]);

  return {
    formData,
    setFormData,
    updateFormData,
  };
}
