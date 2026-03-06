'use client';

/**
 * @module useTagManagement
 * @description Hook de gestion des tags du formulaire blog
 */

import { useState, useCallback } from 'react';

import type { FormData } from './useFormData';

/**
 * Hook de gestion des tags
 *
 * @param formData - Données du formulaire contenant les tags
 * @param updateFormData - Fonction de mise à jour partielle
 */
export function useTagManagement(
  formData: FormData,
  updateFormData: (update: Partial<FormData>) => void
) {
  const [tagInput, setTagInput] = useState('');

  /**
   * Ajoute un tag non-dupliqué
   */
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      updateFormData({ tags: [...formData.tags, tag] });
      setTagInput('');
    }
  }, [tagInput, formData.tags, updateFormData]);

  /**
   * Supprime un tag par index
   */
  const handleRemoveTag = useCallback(
    (index: number) => {
      updateFormData({
        tags: formData.tags.filter((_, i) => i !== index),
      });
    },
    [formData.tags, updateFormData]
  );

  return {
    tagInput,
    setTagInput,
    handleAddTag,
    handleRemoveTag,
  };
}
