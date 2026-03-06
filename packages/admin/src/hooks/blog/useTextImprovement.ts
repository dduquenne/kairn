'use client';

/**
 * @module useTextImprovement
 * @description Hook de gestion de l'amélioration de texte
 */

import { useCallback, useState } from 'react';

import { useBlogAdminConfig } from '../../components/blog/context';

import type { FormData } from './useFormData';

/**
 * Hook de gestion de l'amélioration de texte
 *
 * @param formData - Données du formulaire
 * @param updateFormData - Fonction de mise à jour
 */
export function useTextImprovement(
  formData: FormData,
  updateFormData: (update: Partial<FormData>) => void
) {
  const { toast } = useBlogAdminConfig();

  const [isImproverOpen, setIsImproverOpen] = useState(false);
  const [isTextImproverOpen, setIsTextImproverOpen] = useState(false);
  const [selectedTextToImprove, setSelectedTextToImprove] = useState('');

  /**
   * Améliore le contenu entier de l'article
   */
  const handleImproveContent = useCallback(
    (improvedContent: string) => {
      updateFormData({ content: improvedContent });
      toast.addToast({
        title: 'Article amélioré avec succès',
        description: '',
        variant: 'success',
      });
    },
    [updateFormData, toast]
  );

  /**
   * Ouvre le modal d'amélioration pour le texte sélectionné
   */
  const handleImproveSelection = useCallback((selectedText: string) => {
    setSelectedTextToImprove(selectedText);
    setIsTextImproverOpen(true);
  }, []);

  /**
   * Remplace le texte sélectionné par la version améliorée
   */
  const handleImproveSelectedText = useCallback(
    (improvedText: string) => {
      const newContent = formData.content.replace(selectedTextToImprove, improvedText);
      updateFormData({ content: newContent });

      toast.addToast({
        title: 'Texte amélioré avec succès',
        description: '',
        variant: 'success',
      });

      setSelectedTextToImprove('');
    },
    [formData.content, selectedTextToImprove, updateFormData, toast]
  );

  return {
    isImproverOpen,
    setIsImproverOpen,
    isTextImproverOpen,
    setIsTextImproverOpen,
    selectedTextToImprove,
    setSelectedTextToImprove,
    handleImproveContent,
    handleImproveSelection,
    handleImproveSelectedText,
  };
}
