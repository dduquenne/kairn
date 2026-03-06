'use client';

import { useCallback, useState } from 'react';

/** Erreur de soumission de formulaire */
export interface FormSubmissionError {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/** Options de soumission de formulaire */
export interface FormSubmissionOptions {
  /** Callback en cas de succès */
  onSuccess?: () => void;
  /** Callback en cas d'erreur */
  onError?: (error: FormSubmissionError) => void;
  /** Nombre maximum de tentatives (défaut: 2) */
  maxRetries?: number;
}

/** Retour du hook useFormSubmission */
export interface UseFormSubmissionReturn {
  isSubmitting: boolean;
  error: FormSubmissionError | null;
  submit: <T extends Record<string, unknown>>(data: T) => Promise<FormSubmissionError | null>;
  clearError: () => void;
}

/**
 * Hook pour gérer la soumission de formulaires avec retry logic
 *
 * @param endpoint - URL de l'endpoint API
 * @param options - Options de soumission
 * @returns État et fonctions de soumission
 */
export function useFormSubmission(
  endpoint: string,
  options?: FormSubmissionOptions
): UseFormSubmissionReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<FormSubmissionError | null>(null);

  const submit = useCallback(
    async <T extends Record<string, unknown>>(data: T): Promise<FormSubmissionError | null> => {
      setIsSubmitting(true);
      setError(null);

      let lastError: FormSubmissionError | null = null;
      const maxRetries = options?.maxRetries ?? 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            const apiError: FormSubmissionError = {
              code: body.code ?? 'UNKNOWN_ERROR',
              message: body.message ?? "Une erreur s'est produite",
              statusCode: response.status,
              details: body.details,
            };

            if (response.status >= 500 && attempt < maxRetries) {
              lastError = apiError;
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
              continue;
            }

            setError(apiError);
            options?.onError?.(apiError);
            setIsSubmitting(false);
            return apiError;
          }

          setIsSubmitting(false);
          options?.onSuccess?.();
          return null;
        } catch {
          const networkError: FormSubmissionError = {
            code: 'NETWORK_ERROR',
            message: 'Erreur réseau. Veuillez vérifier votre connexion.',
          };

          if (attempt < maxRetries) {
            lastError = networkError;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }

          setError(networkError);
          options?.onError?.(networkError);
          setIsSubmitting(false);
          return networkError;
        }
      }

      if (lastError) {
        setError(lastError);
        options?.onError?.(lastError);
        setIsSubmitting(false);
        return lastError;
      }

      return null;
    },
    [endpoint, options]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSubmitting,
    error,
    submit,
    clearError,
  };
}
