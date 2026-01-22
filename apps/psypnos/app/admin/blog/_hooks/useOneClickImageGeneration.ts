/**
 * @module useOneClickImageGeneration
 * @description Simplified hook for one-click image generation workflow
 *
 * This hook combines prompt generation and image generation into a single action,
 * providing a much simpler user experience compared to the multi-step approach.
 */

import { useState, useCallback } from "react";
import { useToast } from "../../../../components/ui/toast";

/**
 * Parse une réponse fetch en JSON de manière sécurisée
 * Gère le cas où le serveur retourne du HTML (erreur 529 overloaded)
 */
async function safeParseJson(response: Response): Promise<{ data?: any; error?: string }> {
  const contentType = response.headers.get("content-type") || "";

  // Si ce n'est pas du JSON, retourner une erreur appropriée
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    // Détecter les pages d'erreur HTML
    if (text.includes("<html") || text.includes("<!DOCTYPE")) {
      return { error: "L'API IA est temporairement surchargée. Veuillez réessayer dans quelques minutes." };
    }
    return { error: text || "Réponse invalide du serveur" };
  }

  try {
    const data = await response.json();
    return { data };
  } catch {
    return { error: "Erreur lors du parsing de la réponse" };
  }
}

interface FormData {
  title: string;
  content: string;
  slug?: string;
  category: string;
  tags: string[];
  seoIntent?: string;
  persona?: string;
  tones?: string[];
  imagePrompt?: string;
  image?: string;
}

interface UseOneClickImageGenerationReturn {
  /** État de génération combiné (prompt + images) */
  isGenerating: boolean;
  /** État de génération du prompt IA (phase 1) */
  isGeneratingPrompt: boolean;
  /** État de génération des images DALL-E (phase 2) */
  isGeneratingImages: boolean;
  /** État de régénération du prompt */
  isRegeneratingPrompt: boolean;
  /** Liste des URLs des propositions d'images générées */
  imageProposals: string[];
  /** Lance la génération complète (prompt + images) */
  generateImage: () => Promise<void>;
  /** Génère une image à partir des données d'article fournies */
  generateImageFromArticleData: (articleData: FormData) => Promise<void>;
  /** Sélectionne et confirme une proposition d'image */
  selectProposal: (url: string) => Promise<void>;
  /** Régénère de nouvelles images avec le même prompt */
  regenerateImages: () => void;
  /** Régénère le prompt IA avec les dernières directives */
  regeneratePrompt: () => Promise<void>;
}

/**
 * Simplified hook for one-click image generation
 *
 * Combines prompt generation + image generation into a single action
 */
export function useOneClickImageGeneration(
  formData: FormData,
  updateFormData: (update: Partial<FormData>) => void
): UseOneClickImageGenerationReturn {
  const { addToast } = useToast();
  // États séparés pour chaque phase de génération
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState(false);
  const [imageProposals, setImageProposals] = useState<string[]>([]);

  // État combiné pour faciliter l'utilisation
  const isGenerating = isGeneratingPrompt || isGeneratingImages;

  /**
   * Extrait un message d'erreur explicite à partir de la réponse ou de l'erreur
   */
  const getExplicitErrorMessage = (
    response: Response | null,
    data: any,
    parseError: string | undefined,
    defaultMessage: string
  ): string => {
    // Erreur d'authentification
    if (response?.status === 401) {
      return "Session expirée. Veuillez vous reconnecter pour générer des images.";
    }
    if (response?.status === 403) {
      return "Permissions insuffisantes. Seuls les administrateurs peuvent générer des images.";
    }
    // Erreur de surcharge API
    if (response?.status === 503 || parseError?.includes("surchargée")) {
      return "L'API IA est temporairement surchargée. Veuillez réessayer dans quelques minutes.";
    }
    // Erreur de configuration
    if (data?.error?.includes("non configurée") || data?.message?.includes("non configuré")) {
      return "Le service de génération d'images n'est pas configuré. Contactez l'administrateur.";
    }
    // Erreur générique
    return parseError || data?.error || data?.message || defaultMessage;
  };

  /**
   * One-click image generation:
   * 1. Generate prompt if not present
   * 2. Generate 3 images
   * 3. Return proposals for selection
   */
  const generateImage = useCallback(async () => {
    // Validate required fields
    if (!formData.title?.trim() || !formData.content?.trim()) {
      addToast({
        title: "Remplissez d'abord le titre et le contenu",
        variant: "error",
      });
      return;
    }

    if (!formData.slug?.trim()) {
      addToast({
        title: "Générez d'abord un slug pour l'article",
        variant: "error",
      });
      return;
    }

    setImageProposals([]);

    try {
      let imagePrompt = formData.imagePrompt;

      // Step 1: Generate prompt if not present
      if (!imagePrompt?.trim()) {
        setIsGeneratingPrompt(true);
        addToast({
          title: "Analyse du contenu...",
          description: "L'IA analyse votre article pour créer un prompt d'image",
          variant: "info",
        });

        const promptResponse = await fetch("/api/blog/generate-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            tags: formData.tags,
            seoIntent: formData.seoIntent,
            persona: formData.persona,
            tones: formData.tones,
          }),
        });

        const { data: promptData, error: parseError } = await safeParseJson(promptResponse);

        if (!promptResponse.ok || parseError) {
          const errorMessage = getExplicitErrorMessage(
            promptResponse,
            promptData,
            parseError,
            "Erreur lors de la génération du prompt"
          );
          throw new Error(errorMessage);
        }

        if (!promptData?.success || !promptData.imagePrompt) {
          throw new Error("Impossible de générer un prompt d'image. Veuillez réessayer.");
        }

        imagePrompt = promptData.imagePrompt;
        updateFormData({ imagePrompt });
        setIsGeneratingPrompt(false);
      }

      // Step 2: Generate images
      setIsGeneratingImages(true);
      addToast({
        title: "Génération des images...",
        description: "DALL-E crée 3 propositions (30-60 secondes)",
        variant: "info",
      });

      const imageResponse = await fetch("/api/blog/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagePrompt,
          slug: formData.slug,
        }),
      });

      const { data: imageData, error: imageParseError } = await safeParseJson(imageResponse);

      if (!imageResponse.ok || imageParseError) {
        const errorMessage = getExplicitErrorMessage(
          imageResponse,
          imageData,
          imageParseError,
          "Erreur lors de la génération des images"
        );
        throw new Error(errorMessage);
      }

      if (!imageData?.success || !imageData.proposals || imageData.proposals.length === 0) {
        throw new Error("Aucune image n'a pu être générée. L'API DALL-E a peut-être rencontré un problème.");
      }

      // Extract URLs from proposals
      const proposalUrls = imageData.proposals.map((p: any) => p.tempPath);
      setImageProposals(proposalUrls);

      addToast({
        title: "Images générées !",
        description: "Sélectionnez votre préférée",
        variant: "success",
      });
    } catch (error) {
      console.error("Error in one-click image generation:", error);
      addToast({
        title: error instanceof Error ? error.message : "Échec de la génération",
        variant: "error",
      });
    } finally {
      setIsGeneratingPrompt(false);
      setIsGeneratingImages(false);
    }
  }, [formData, updateFormData, addToast]);

  /**
   * Generate image from provided article data
   * Used for automatic image generation after article creation
   *
   * @param articleData - The article data to use for image generation
   */
  const generateImageFromArticleData = useCallback(async (articleData: FormData) => {
    // Validate required fields
    if (!articleData.title?.trim() || !articleData.content?.trim()) {
      addToast({
        title: "Impossible de générer l'image: titre ou contenu manquant",
        variant: "error",
      });
      return;
    }

    if (!articleData.slug?.trim()) {
      addToast({
        title: "Impossible de générer l'image: slug manquant",
        variant: "error",
      });
      return;
    }

    setImageProposals([]);

    try {
      let imagePrompt = articleData.imagePrompt;

      // Step 1: Generate prompt if not present
      if (!imagePrompt?.trim()) {
        setIsGeneratingPrompt(true);
        addToast({
          title: "Analyse du contenu pour génération automatique...",
          description: "L'IA analyse votre article pour créer un prompt d'image",
          variant: "info",
        });

        const promptResponse = await fetch("/api/blog/generate-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: articleData.title,
            content: articleData.content,
            category: articleData.category,
            tags: articleData.tags,
            seoIntent: articleData.seoIntent,
            persona: articleData.persona,
            tones: articleData.tones,
          }),
        });

        const { data: promptData, error: parseError } = await safeParseJson(promptResponse);

        if (!promptResponse.ok || parseError) {
          const errorMessage = getExplicitErrorMessage(
            promptResponse,
            promptData,
            parseError,
            "Erreur lors de la génération du prompt"
          );
          throw new Error(errorMessage);
        }

        if (!promptData?.success || !promptData.imagePrompt) {
          throw new Error("Impossible de générer un prompt d'image. Veuillez réessayer.");
        }

        imagePrompt = promptData.imagePrompt;
        updateFormData({ imagePrompt });
        setIsGeneratingPrompt(false);
      }

      // Step 2: Generate images
      setIsGeneratingImages(true);
      addToast({
        title: "Génération automatique des images...",
        description: "DALL-E crée 3 propositions (30-60 secondes)",
        variant: "info",
      });

      const imageResponse = await fetch("/api/blog/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagePrompt,
          slug: articleData.slug,
        }),
      });

      const { data: imageData, error: imageParseError } = await safeParseJson(imageResponse);

      if (!imageResponse.ok || imageParseError) {
        const errorMessage = getExplicitErrorMessage(
          imageResponse,
          imageData,
          imageParseError,
          "Erreur lors de la génération des images"
        );
        throw new Error(errorMessage);
      }

      if (!imageData?.success || !imageData.proposals || imageData.proposals.length === 0) {
        throw new Error("Aucune image n'a pu être générée. L'API DALL-E a peut-être rencontré un problème.");
      }

      // Extract URLs from proposals
      const proposalUrls = imageData.proposals.map((p: any) => p.tempPath);
      setImageProposals(proposalUrls);

      addToast({
        title: "Images générées automatiquement !",
        description: "Sélectionnez votre préférée dans l'onglet Média",
        variant: "success",
      });
    } catch (error) {
      console.error("Error in automatic image generation:", error);
      addToast({
        title: error instanceof Error ? error.message : "Échec de la génération automatique",
        variant: "error",
      });
    } finally {
      setIsGeneratingPrompt(false);
      setIsGeneratingImages(false);
    }
  }, [updateFormData, addToast]);

  /**
   * Select and confirm an image proposal
   * Ne supprime pas les propositions pour permettre de changer d'avis jusqu'à l'enregistrement
   */
  const selectProposal = useCallback(async (url: string) => {
    try {
      // Find the proposal ID from URL
      const proposalId = url.split("/").pop()?.replace(".webp", "") || "";

      const response = await fetch("/api/blog/confirm-image-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedProposalId: proposalId,
          tempPath: url,
          slug: formData.slug,
        }),
      });

      const { data, error: selectParseError } = await safeParseJson(response);

      if (!response.ok || selectParseError) {
        throw new Error(selectParseError || data?.message || "Erreur lors de la sauvegarde");
      }

      if (!data?.success || !data.finalPath) {
        throw new Error("Impossible de sauvegarder l'image");
      }

      updateFormData({ image: data.finalPath });
      // Ne pas effacer les propositions pour permettre de changer de choix
      // L'utilisateur peut re-sélectionner une autre image jusqu'à l'enregistrement final

      addToast({
        title: "Image sélectionnée !",
        description: "Vous pouvez changer d'avis jusqu'à l'enregistrement",
        variant: "success",
      });
    } catch (error) {
      console.error("Error selecting proposal:", error);
      addToast({
        title: error instanceof Error ? error.message : "Échec de la sélection",
        variant: "error",
      });
    }
  }, [formData.slug, updateFormData, addToast]);

  /**
   * Regenerate images with the same prompt
   */
  const regenerateImages = useCallback(() => {
    setImageProposals([]);
    generateImage();
  }, [generateImage]);

  /**
   * Regenerate the AI prompt based on current article content
   * Uses the latest AI directives implemented in the project
   * Forces regeneration even if a prompt already exists
   */
  const regeneratePrompt = useCallback(async () => {
    // Validate required fields
    if (!formData.title?.trim() || !formData.content?.trim()) {
      addToast({
        title: "Remplissez d'abord le titre et le contenu",
        variant: "error",
      });
      return;
    }

    setIsRegeneratingPrompt(true);

    try {
      addToast({
        title: "Régénération du prompt IA...",
        description: "Application des nouvelles directives",
        variant: "info",
      });

      const promptResponse = await fetch("/api/blog/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags: formData.tags,
          seoIntent: formData.seoIntent,
          persona: formData.persona,
          tones: formData.tones,
        }),
      });

      const { data: promptData, error: regenParseError } = await safeParseJson(promptResponse);

      if (!promptResponse.ok || regenParseError) {
        throw new Error(regenParseError || promptData?.error || "Erreur lors de la régénération du prompt");
      }

      if (!promptData?.success || !promptData.imagePrompt) {
        throw new Error("Impossible de régénérer le prompt d'image");
      }

      updateFormData({ imagePrompt: promptData.imagePrompt });

      const validationInfo = promptData.validation?.isValid
        ? "Prompt validé avec succès"
        : `Attention: ${promptData.validation?.missingElements?.length || 0} éléments à vérifier`;

      addToast({
        title: "Prompt régénéré !",
        description: validationInfo,
        variant: "success",
      });
    } catch (error) {
      console.error("Error regenerating prompt:", error);
      addToast({
        title: error instanceof Error ? error.message : "Échec de la régénération",
        variant: "error",
      });
    } finally {
      setIsRegeneratingPrompt(false);
    }
  }, [formData, updateFormData, addToast]);

  return {
    isGenerating,
    isGeneratingPrompt,
    isGeneratingImages,
    isRegeneratingPrompt,
    imageProposals,
    generateImage,
    generateImageFromArticleData,
    selectProposal,
    regenerateImages,
    regeneratePrompt,
  };
}
