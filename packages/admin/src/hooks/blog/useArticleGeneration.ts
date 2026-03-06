'use client';

/**
 * @module useArticleGeneration
 * @description Hook de gestion de la génération d'articles IA
 *
 * Paramétrisé via BlogAdminConfig pour le slug (categorySlugMap)
 * et le toast.
 */

import { generateSlugFromTitleAndCategory } from '@kairn/blog';
import type { FAQItem } from '@kairn/blog';
import { useCallback, useState } from 'react';

import { useBlogAdminConfig } from '../../components/blog/context';

/**
 * Données d'article généré par l'IA
 */
export type GeneratedArticleData = {
  title: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
  faq: FAQItem[];
  imagePrompt?: string;
  seoIntent?: string;
  persona?: string;
  tones?: string[];
};

/**
 * Données du formulaire pour la génération d'image
 */
interface ImageGenerationFormData {
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
 * Hook de gestion de la génération d'articles IA
 *
 * @param updateFormData - Callback de mise à jour du formulaire
 * @param currentImage - Image actuelle
 * @param onAutoGenerateImage - Callback optionnel pour auto-générer l'image
 */
export function useArticleGeneration(
  updateFormData: (update: Record<string, unknown>) => void,
  currentImage?: string,
  onAutoGenerateImage?: (articleData: ImageGenerationFormData) => Promise<void>
) {
  const { categorySlugMap, toast } = useBlogAdminConfig();

  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);

  /**
   * Traite les données d'article généré par l'IA
   */
  const handleGenerateArticleData = useCallback(
    async (article: GeneratedArticleData) => {
      const baseSlug = generateSlugFromTitleAndCategory(
        article.title,
        article.category,
        categorySlugMap
      );

      let finalSlug = baseSlug;
      try {
        const checkResponse = await fetch(
          `/api/blog/posts/check-slug?slug=${encodeURIComponent(baseSlug)}`
        );
        if (checkResponse.ok) {
          const { exists, suggestedSlug } = await checkResponse.json();
          if (exists) {
            finalSlug = suggestedSlug;
            toast.addToast({
              title: 'Slug modifié',
              description: `Un article avec le slug "${baseSlug}" existe déjà. Nouveau slug : "${finalSlug}"`,
              variant: 'info',
            });
          }
        }
      } catch (slugCheckError) {
        console.warn('Erreur vérification slug, utilisation du slug généré:', slugCheckError);
      }

      const faqWithIds = article.faq.map((item, index) => ({
        ...item,
        id: item.id || `faq-${Date.now()}-${index}`,
      }));

      const shouldAutoGenerateImage = !currentImage && article.imagePrompt;

      updateFormData({
        title: article.title,
        slug: finalSlug,
        description: article.description,
        category: article.category,
        content: article.content,
        tags: article.tags,
        faq: faqWithIds,
        image: currentImage || '',
        imagePrompt: article.imagePrompt || '',
        seoIntent: article.seoIntent || '',
        persona: article.persona || '',
        tones: article.tones || [],
      });

      setIsGeneratorModalOpen(false);

      toast.addToast({
        title: 'Article généré avec succès',
        description: '',
        variant: 'success',
      });

      if (shouldAutoGenerateImage && onAutoGenerateImage) {
        const imageGenerationData: ImageGenerationFormData = {
          title: article.title,
          content: article.content,
          slug: finalSlug,
          category: article.category,
          tags: article.tags,
          seoIntent: article.seoIntent,
          persona: article.persona,
          tones: article.tones,
          imagePrompt: article.imagePrompt,
        };

        setTimeout(() => {
          toast.addToast({
            title: "Génération automatique de l'image...",
            description: "L'article n'a pas d'image, génération en cours",
            variant: 'info',
          });
          onAutoGenerateImage(imageGenerationData);
        }, 100);
      }
    },
    [updateFormData, currentImage, toast, onAutoGenerateImage, categorySlugMap]
  );

  return {
    isGeneratorModalOpen,
    setIsGeneratorModalOpen,
    handleGenerateArticleData,
  };
}
