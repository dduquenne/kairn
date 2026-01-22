import { useState, useCallback } from "react";
import { FormData } from "./useFormData";

/**
 * Custom hook for handling form validation logic
 *
 * Validates required fields and enforces format rules (e.g., slug format).
 * Manages validation errors state and provides a validate function to check
 * if the form is valid.
 *
 * @param formData - The current form data to validate
 * @returns Object containing validation state and methods
 *
 * @example
 * ```tsx
 * const { isValid, errors, validateForm, clearError } = useFormValidation(formData);
 *
 * // In your submit handler
 * if (!validateForm()) {
 *   // Show error toast
 *   return;
 * }
 *
 * // Clear a specific error
 * clearError('title');
 * ```
 */
export function useFormValidation(formData: FormData) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validates all form fields and updates the errors state
   * @returns true if form is valid (no errors), false otherwise
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est obligatoire";
    }

    if (!formData.slug?.trim()) {
      newErrors.slug = "Le slug est obligatoire";
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = "Le slug doit contenir uniquement des lettres minuscules, des chiffres et des traits d'union";
    }

    if (!formData.author.trim()) {
      newErrors.author = "L'auteur est obligatoire";
    }

    if (!formData.category.trim()) {
      newErrors.category = "La catégorie est obligatoire";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Le contenu est obligatoire";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est obligatoire";
    }

    if (!formData.date) {
      newErrors.date = "La date de publication est obligatoire";
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    return isValid;
  }, [formData]);

  /**
   * Clears a specific error field
   * @param field - The field name to clear the error for
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
