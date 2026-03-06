'use client';

/**
 * @module useFormValidation
 * @description Hook de validation du formulaire blog
 */

import { useState, useCallback } from 'react';

import type { FormData } from './useFormData';

/**
 * Hook de validation du formulaire blog
 *
 * @param formData - Données du formulaire à valider
 */
export function useFormValidation(formData: FormData) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Valide tous les champs du formulaire
   * @returns true si le formulaire est valide
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est obligatoire';
    }

    if (!formData.slug?.trim()) {
      newErrors.slug = 'Le slug est obligatoire';
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug =
        "Le slug doit contenir uniquement des lettres minuscules, des chiffres et des traits d'union";
    }

    if (!formData.author.trim()) {
      newErrors.author = "L'auteur est obligatoire";
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La catégorie est obligatoire';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Le contenu est obligatoire';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    }

    if (!formData.date) {
      newErrors.date = 'La date de publication est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Efface une erreur spécifique
   */
  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    setErrors,
    validateForm,
    clearError,
    isValid: Object.keys(errors).length === 0,
  };
}
