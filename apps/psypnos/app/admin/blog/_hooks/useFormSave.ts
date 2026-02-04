/**
 * @module useFormSave
 * @description Custom hook for handling blog post form save operations with validation and API communication
 *
 * This hook manages the complete save workflow for blog posts:
 * - Form validation before submission
 * - Data cleaning (removing empty FAQ entries)
 * - JSON-LD structured data auto-generation
 * - API communication (POST for create, PUT for update)
 * - Error handling with user-friendly messages
 * - Navigation after successful save
 *
 * **API Endpoints:**
 * - POST /api/blog/posts - Create new post
 * - PUT /api/blog/posts/[slug] - Update existing post
 *
 * @see {@link /app/admin/blog/_components/BlogPostForm.tsx} - Main consumer of this hook
 * @see {@link /app/api/blog/posts/route.ts} - POST endpoint for creating posts
 * @see {@link /app/api/blog/posts/[slug]/route.ts} - PUT endpoint for updating posts
 *
 * @example
 * ```tsx
 * const { handleSave, isSaving } = useFormSave({
 *   formData,
 *   isEditing,
 *   post,
 *   validateForm,
 *   getDefaultJsonLd,
 * });
 *
 * // In your component
 * <button onClick={handleSave} disabled={isSaving}>
 *   {isSaving ? 'Saving...' : 'Save'}
 * </button>
 * ```
 */

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import type { FAQItem } from "@/lib/blog";
import { useToast } from "@/lib/toast-context";

/**
 * Nettoie le chemin d'une image en supprimant les paramètres de cache-busting
 * Le chemin stocké doit être propre (sans timestamp) pour permettre
 * un cache-busting dynamique lors de l'affichage
 *
 * @param imagePath - Chemin de l'image (peut inclure ?t=timestamp)
 * @returns Chemin propre sans paramètres de requête
 */
function cleanImagePath(imagePath: string | undefined): string | undefined {
  if (!imagePath) return imagePath;
  // Supprimer les paramètres de requête (ex: ?t=123456789)
  return imagePath.split("?")[0];
}

/**
 * Form data structure for blog post
 *
 * @property {string} [slug] - URL-friendly identifier
 * @property {string} title - Article title
 * @property {string} description - Short description
 * @property {string} content - Main content in Markdown
 * @property {string} author - Article author
 * @property {string} category - Article category
 * @property {string[]} tags - Array of tags
 * @property {string} [image] - Image path
 * @property {boolean} published - Publication status
 * @property {string} date - Publication date (ISO format)
 * @property {FAQItem[]} faq - FAQ items array
 * @property {Record<string, any>} [jsonLd] - JSON-LD structured data
 * @property {string} [imagePrompt] - AI image prompt
 * @property {string} [seoIntent] - SEO intent description
 * @property {string} [persona] - Target persona
 * @property {string[]} [tones] - Writing tones
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
 * Custom hook for handling blog post form save/submit logic
 *
 * Manages the save operation for both creating new posts and updating existing ones.
 * Handles validation, API calls, error handling, and navigation.
 *
 * **Save Workflow:**
 * 1. Validates form data using provided validateForm function
 * 2. Cleans FAQ array by removing empty entries
 * 3. Auto-generates JSON-LD structured data for SEO
 * 4. Determines API endpoint based on isEditing flag
 * 5. Sends POST (create) or PUT (update) request
 * 6. Handles slug changes by including oldSlug in payload
 * 7. Shows success/error toast notifications
 * 8. Navigates back to blog list on success
 *
 * **Error Handling:**
 * - Validation errors: Shows error toast, keeps user on form
 * - API errors: Shows specific error message from API response
 * - Network errors: Shows generic error message
 *
 * @param {Object} options - Configuration options
 * @param {FormData} options.formData - Current form data to save
 * @param {boolean} options.isEditing - Whether we're editing an existing post (true) or creating new (false)
 * @param {Object} [options.post] - The existing post object (only when editing)
 * @param {string} options.post.slug - Original post slug (used to detect slug changes)
 * @param {Function} options.validateForm - Validation function that returns true if form is valid
 * @param {Function} options.getDefaultJsonLd - Function to generate JSON-LD structured data
 * @returns {Object} Save operation interface
 * @returns {Function} handleSave - Async function to trigger save operation
 * @returns {boolean} isSaving - Loading state during save operation
 *
 * @example
 * ```tsx
 * const { handleSave, isSaving } = useFormSave({
 *   formData,
 *   isEditing,
 *   post,
 *   validateForm,
 *   getDefaultJsonLd,
 * });
 *
 * // In your component
 * <button onClick={handleSave} disabled={isSaving}>
 *   {isSaving ? 'Saving...' : 'Save'}
 * </button>
 * ```
 */
export function useFormSave({
  formData,
  isEditing,
  post,
  validateForm,
  getDefaultJsonLd,
  jobId,
}: {
  formData: FormData;
  isEditing: boolean;
  post?: { slug: string };
  validateForm: () => boolean;
  getDefaultJsonLd: () => Record<string, any>;
  jobId?: string;
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handle form save/submit operation
   *
   * Performs the following steps:
   * 1. Validates form data using provided validator
   * 2. Cleans FAQ entries (removes empty questions/answers)
   * 3. Auto-generates JSON-LD structured data for SEO
   * 4. Sends POST (create) or PUT (update) request to API
   * 5. Handles success/error responses with toast notifications
   * 6. Navigates back to blog list on success
   *
   * **Slug Change Handling:**
   * When editing and slug changes, includes oldSlug in payload
   * to allow the API to rename the markdown file appropriately.
   *
   * **FAQ Cleaning:**
   * Removes FAQ items with empty questions or answers to avoid
   * saving incomplete data that would fail rendering.
   *
   * @async
   * @throws {Error} When API request fails or returns error response
   */
  const handleSave = useCallback(async () => {
    // Step 1: Validate form before proceeding with save
    if (!validateForm()) {
      addToast({
        title: "Veuillez corriger les erreurs ci-dessous",
        variant: "error",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Step 2: Determine API endpoint and HTTP method based on operation
      const url = isEditing
        ? `/api/blog/posts/${post?.slug}` // PUT to specific post slug
        : "/api/blog/posts"; // POST to collection endpoint
      const method = isEditing ? "PUT" : "POST";

      // Step 3: Clean FAQ entries - remove items with empty questions or answers
      // This prevents saving incomplete FAQ data that would fail to render
      const cleanedFaq = formData.faq.filter(
        (faq) => faq.question.trim() && faq.answer.trim()
      );

      // Step 4: Auto-generate JSON-LD structured data for SEO
      // This creates proper schema.org markup for search engines
      const generatedJsonLd = getDefaultJsonLd();

      // Step 5: Build payload with all form data
      // IMPORTANT: Nettoyer le chemin de l'image pour supprimer les timestamps
      // Cela garantit que le chemin stocké est propre et que le cache-busting
      // sera ajouté dynamiquement lors de l'affichage
      const payload: any = {
        ...formData,
        image: cleanImagePath(formData.image),
        jsonLd: generatedJsonLd,
        // Only include FAQ if there are valid entries
        faq: cleanedFaq.length > 0 ? cleanedFaq : undefined,
        // Include jobId when creating from a generation job (prevents duplicate creation)
        ...(jobId && !isEditing ? { jobId } : {}),
      };

      // Step 6: Include old slug if we're editing and the slug has changed
      // This allows the API to rename the markdown file in the file system
      // from {oldSlug}.md to {newSlug}.md
      if (isEditing && post?.slug !== formData.slug) {
        payload.oldSlug = post?.slug;
      }

      // Step 7: Send request to API
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Step 8: Check response status and handle errors
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error ||
          `Échec lors de la ${isEditing ? "modification" : "création"} de l'article`
        );
      }

      // Step 9: Show success message to user
      addToast({
        title: isEditing
          ? "Article modifié avec succès"
          : "Article créé avec succès",
        variant: "success",
      });

      // Step 10: Navigate back to blog list
      // This happens after successful save to show the updated list
      router.push("/admin/blog");

    } catch (error) {
      // Handle any errors during the save process
      console.error("Error saving post:", error);
      addToast({
        title: error instanceof Error
          ? error.message
          : "Échec de l'enregistrement de l'article",
        variant: "error",
      });
    } finally {
      // Always reset loading state, whether success or failure
      setIsSaving(false);
    }
  }, [
    formData,
    isEditing,
    post,
    validateForm,
    addToast,
    router,
    getDefaultJsonLd,
    jobId,
  ]);

  return {
    handleSave,
    isSaving,
  };
}
