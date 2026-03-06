'use client';

/**
 * @module useOneClickImageGeneration
 * @description Hook simplifié de génération d'images en un clic
 */

import { useState, useCallback } from 'react';

import { useBlogAdminConfig } from '../../components/blog/context';

/**
 * Parse JSON de manière sécurisée
 */
async function safeParseJson(
  response: Response
): Promise<{ data?: Record<string, unknown>; error?: string }> {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (text.includes('<html') || text.includes('<!DOCTYPE')) {
      return {
        error: "L'API IA est temporairement surchargée. Veuillez réessayer dans quelques minutes.",
      };
    }
    return { error: text || 'Réponse invalide du serveur' };
  }

  try {
    const data = await response.json();
    return { data };
  } catch {
    return { error: 'Erreur lors du parsing de la réponse' };
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

/**
 * Hook simplifié de génération d'images en un clic
 *
 * @param formData - Données du formulaire
 * @param updateFormData - Fonction de mise à jour
 */
export function useOneClickImageGeneration(
  formData: FormData,
  updateFormData: (update: Partial<FormData>) => void
) {
  const { toast } = useBlogAdminConfig();
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState(false);
  const [imageProposals, setImageProposals] = useState<string[]>([]);

  const isGenerating = isGeneratingPrompt || isGeneratingImages;

  /**
   * Extrait un message d'erreur explicite
   */
  const getExplicitErrorMessage = (
    response: Response | null,
    data: Record<string, unknown> | undefined,
    parseError: string | undefined,
    defaultMessage: string
  ): string => {
    if (response?.status === 401) {
      return 'Session expirée. Veuillez vous reconnecter pour générer des images.';
    }
    if (response?.status === 403) {
      return 'Permissions insuffisantes. Seuls les administrateurs peuvent générer des images.';
    }
    if (response?.status === 503 || parseError?.includes('surchargée')) {
      return "L'API IA est temporairement surchargée. Veuillez réessayer dans quelques minutes.";
    }
    const errorStr = String(data?.error || '');
    const messageStr = String(data?.message || '');
    if (errorStr.includes('non configurée') || messageStr.includes('non configuré')) {
      return "Le service de génération d'images n'est pas configuré. Contactez l'administrateur.";
    }
    return parseError || errorStr || messageStr || defaultMessage;
  };

  /**
   * Génération complète en un clic (prompt + images)
   */
  const generateImage = useCallback(async () => {
    if (!formData.title?.trim() || !formData.content?.trim()) {
      toast.addToast({
        title: "Remplissez d'abord le titre et le contenu",
        description: '',
        variant: 'error',
      });
      return;
    }

    if (!formData.slug?.trim()) {
      toast.addToast({
        title: "Générez d'abord un slug pour l'article",
        description: '',
        variant: 'error',
      });
      return;
    }

    setImageProposals([]);

    try {
      let imagePrompt = formData.imagePrompt;

      if (!imagePrompt?.trim()) {
        setIsGeneratingPrompt(true);
        toast.addToast({
          title: 'Analyse du contenu...',
          description: "L'IA analyse votre article pour créer un prompt d'image",
          variant: 'info',
        });

        const promptResponse = await fetch('/api/blog/generate-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          throw new Error(
            getExplicitErrorMessage(
              promptResponse,
              promptData,
              parseError,
              'Erreur lors de la génération du prompt'
            )
          );
        }

        if (!promptData?.success || !promptData.imagePrompt) {
          throw new Error("Impossible de générer un prompt d'image. Veuillez réessayer.");
        }

        imagePrompt = promptData.imagePrompt as string;
        updateFormData({ imagePrompt });
        setIsGeneratingPrompt(false);
      }

      setIsGeneratingImages(true);
      toast.addToast({
        title: 'Génération des images...',
        description: 'DALL-E crée 3 propositions (30-60 secondes)',
        variant: 'info',
      });

      const imageResponse = await fetch('/api/blog/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagePrompt,
          slug: formData.slug,
        }),
      });

      const { data: imageData, error: imageParseError } = await safeParseJson(imageResponse);

      if (!imageResponse.ok || imageParseError) {
        throw new Error(
          getExplicitErrorMessage(
            imageResponse,
            imageData,
            imageParseError,
            'Erreur lors de la génération des images'
          )
        );
      }

      if (
        !imageData?.success ||
        !imageData.proposals ||
        !(imageData.proposals as unknown[]).length
      ) {
        throw new Error(
          "Aucune image n'a pu être générée. L'API DALL-E a peut-être rencontré un problème."
        );
      }

      const proposals = imageData.proposals as Array<{
        tempPath: string;
      }>;
      const proposalUrls = proposals.map(p => p.tempPath);
      setImageProposals(proposalUrls);

      toast.addToast({
        title: 'Images générées !',
        description: 'Sélectionnez votre préférée',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error in one-click image generation:', error);
      toast.addToast({
        title: error instanceof Error ? error.message : 'Échec de la génération',
        description: '',
        variant: 'error',
      });
    } finally {
      setIsGeneratingPrompt(false);
      setIsGeneratingImages(false);
    }
  }, [formData, updateFormData, toast]);

  /**
   * Génère une image à partir des données d'article fournies
   */
  const generateImageFromArticleData = useCallback(
    async (articleData: FormData) => {
      if (!articleData.title?.trim() || !articleData.content?.trim()) {
        toast.addToast({
          title: "Impossible de générer l'image: titre ou contenu manquant",
          description: '',
          variant: 'error',
        });
        return;
      }

      if (!articleData.slug?.trim()) {
        toast.addToast({
          title: "Impossible de générer l'image: slug manquant",
          description: '',
          variant: 'error',
        });
        return;
      }

      setImageProposals([]);

      try {
        let imagePrompt = articleData.imagePrompt;

        if (!imagePrompt?.trim()) {
          setIsGeneratingPrompt(true);
          toast.addToast({
            title: 'Analyse du contenu pour génération automatique...',
            description: "L'IA analyse votre article pour créer un prompt d'image",
            variant: 'info',
          });

          const promptResponse = await fetch('/api/blog/generate-prompt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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
            throw new Error(
              getExplicitErrorMessage(
                promptResponse,
                promptData,
                parseError,
                'Erreur lors de la génération du prompt'
              )
            );
          }

          if (!promptData?.success || !promptData.imagePrompt) {
            throw new Error("Impossible de générer un prompt d'image. Veuillez réessayer.");
          }

          imagePrompt = promptData.imagePrompt as string;
          updateFormData({ imagePrompt });
          setIsGeneratingPrompt(false);
        }

        setIsGeneratingImages(true);
        toast.addToast({
          title: 'Génération automatique des images...',
          description: 'DALL-E crée 3 propositions (30-60 secondes)',
          variant: 'info',
        });

        const imageResponse = await fetch('/api/blog/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imagePrompt,
            slug: articleData.slug,
          }),
        });

        const { data: imageData, error: imageParseError } = await safeParseJson(imageResponse);

        if (!imageResponse.ok || imageParseError) {
          throw new Error(
            getExplicitErrorMessage(
              imageResponse,
              imageData,
              imageParseError,
              'Erreur lors de la génération des images'
            )
          );
        }

        if (
          !imageData?.success ||
          !imageData.proposals ||
          !(imageData.proposals as unknown[]).length
        ) {
          throw new Error(
            "Aucune image n'a pu être générée. L'API DALL-E a peut-être rencontré un problème."
          );
        }

        const proposals = imageData.proposals as Array<{
          tempPath: string;
        }>;
        const proposalUrls = proposals.map(p => p.tempPath);
        setImageProposals(proposalUrls);

        toast.addToast({
          title: 'Images générées automatiquement !',
          description: "Sélectionnez votre préférée dans l'onglet Média",
          variant: 'success',
        });
      } catch (error) {
        console.error('Error in automatic image generation:', error);
        toast.addToast({
          title: error instanceof Error ? error.message : 'Échec de la génération automatique',
          description: '',
          variant: 'error',
        });
      } finally {
        setIsGeneratingPrompt(false);
        setIsGeneratingImages(false);
      }
    },
    [updateFormData, toast]
  );

  /**
   * Sélectionne et confirme une proposition d'image
   */
  const selectProposal = useCallback(
    async (url: string) => {
      try {
        const proposalId = url.split('/').pop()?.replace('.webp', '') || '';

        const response = await fetch('/api/blog/confirm-image-selection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selectedProposalId: proposalId,
            tempPath: url,
            slug: formData.slug,
          }),
        });

        const { data, error: selectParseError } = await safeParseJson(response);

        if (!response.ok || selectParseError) {
          throw new Error(
            selectParseError || String(data?.message || '') || 'Erreur lors de la sauvegarde'
          );
        }

        if (!data?.success || !data.finalPath) {
          throw new Error("Impossible de sauvegarder l'image");
        }

        updateFormData({
          image: data.finalPath as string,
        });

        toast.addToast({
          title: 'Image sélectionnée !',
          description: "Vous pouvez changer d'avis jusqu'à l'enregistrement",
          variant: 'success',
        });
      } catch (error) {
        console.error('Error selecting proposal:', error);
        toast.addToast({
          title: error instanceof Error ? error.message : 'Échec de la sélection',
          description: '',
          variant: 'error',
        });
      }
    },
    [formData.slug, updateFormData, toast]
  );

  /**
   * Régénère les images avec le même prompt
   */
  const regenerateImages = useCallback(() => {
    setImageProposals([]);
    generateImage();
  }, [generateImage]);

  /**
   * Régénère le prompt IA
   */
  const regeneratePrompt = useCallback(async () => {
    if (!formData.title?.trim() || !formData.content?.trim()) {
      toast.addToast({
        title: "Remplissez d'abord le titre et le contenu",
        description: '',
        variant: 'error',
      });
      return;
    }

    setIsRegeneratingPrompt(true);

    try {
      toast.addToast({
        title: 'Régénération du prompt IA...',
        description: 'Application des nouvelles directives',
        variant: 'info',
      });

      const promptResponse = await fetch('/api/blog/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(
          regenParseError ||
            String(promptData?.error || '') ||
            'Erreur lors de la régénération du prompt'
        );
      }

      if (!promptData?.success || !promptData.imagePrompt) {
        throw new Error("Impossible de régénérer le prompt d'image");
      }

      updateFormData({
        imagePrompt: promptData.imagePrompt as string,
      });

      toast.addToast({
        title: 'Prompt régénéré !',
        description: 'Prompt validé avec succès',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error regenerating prompt:', error);
      toast.addToast({
        title: error instanceof Error ? error.message : 'Échec de la régénération',
        description: '',
        variant: 'error',
      });
    } finally {
      setIsRegeneratingPrompt(false);
    }
  }, [formData, updateFormData, toast]);

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
